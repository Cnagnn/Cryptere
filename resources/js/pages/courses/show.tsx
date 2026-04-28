import { Head, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Brain,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Lock,
    Maximize2,
    Minimize2,
    Trophy,
    Video,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DiscussionPanel } from '@/components/discussion-panel';
import { QuizPanel } from '@/components/course-quiz-panel';
import { LessonContent } from '@/components/lesson-content';
import type { QuizSubmission } from '@/components/course-quiz-panel';
import { VideoPlayer } from '@/components/course-video-player';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';

import AppLayout from '@/layouts/app-layout';
import {
    enroll as enrollCourse,
    index as coursesIndex,
    show as showCourse,
} from '@/routes/courses';
import { complete as completeLesson } from '@/routes/courses/lessons';
import type { Auth } from '@/types/auth';

const taskTypeIcon: Record<TaskType, React.ComponentType> = {
    video: Video,
    read: BookOpen,
    quiz: Brain,
};

type TaskType = 'video' | 'read' | 'quiz';

type LessonQuizQuestion = {
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
};

type LessonTask = {
    id: number;
    type: TaskType;
    title: string;
    minutes: number;
    description: string;
    videoUrl: string | null;
    videoProcessingStatus: string | null;
    pdfUrl: string | null;
    pdfName: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    quizQuestions: LessonQuizQuestion[];
    submission?: QuizSubmission | null;
};

type LessonData = {
    id: number;
    title: string;
    summary: string;
    tasks: LessonTask[];
};

type ServerTaskQuestion = {
    question: string;
    options: [string, string, string, string];
    explanation: string | null;
};

type ServerTask = {
    taskId: number | null;
    type: TaskType;
    title: string;
    minutes: number;
    videoUrl: string | null;
    videoProcessingStatus: string | null;
    documentName: string | null;
    conversionStatus: string | null;
    pdfUrl: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    questions: ServerTaskQuestion[];
    questionCount: number;
    submission: QuizSubmission | null;
};

type ServerLesson = {
    id: number;
    slug: string;
    title: string;
    position: number;
    content: string;
    tasks: ServerTask[];
    isCompleted: boolean;
    isUnlocked: boolean;
};

type ServerCourse = {
    id: number;
    slug: string;
    title: string;
    summary: string;
    estimatedMinutes: number;
    enrollmentCount: number;
};

type EnrollmentData = {
    progressPercentage: number;
    completedAt: string | null;
} | null;

type Props = {
    course: ServerCourse;
    lessons: ServerLesson[];
    enrollment: EnrollmentData;
};

function defaultTaskDescription(type: TaskType): string {
    if (type === 'video') {
        return 'Watch the video until the end to complete this task.';
    }

    if (type === 'read') {
        return 'Read through the material and note the key takeaways.';
    }

    return 'Complete the quiz to test your understanding before moving on.';
}

function normalizeTaskTitle(title: string): string {
    return title.replace(/^(video|quiz|read)\s*:\s*/i, '').trim();
}

function mapServerLessonsToLessonData(
    serverLessons: ServerLesson[],
): LessonData[] {
    return serverLessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        summary: lesson.content?.trim() || 'No summary available yet.',
        tasks: lesson.tasks.map((task, index) => {
            const mappedTaskId = task.taskId ?? lesson.id * 1000 + index + 1;
            const displayTaskTitle = normalizeTaskTitle(task.title);

            return {
                id: mappedTaskId,
                type: task.type,
                title: displayTaskTitle,
                minutes: Math.max(1, task.minutes || 1),
                description: defaultTaskDescription(task.type),
                videoUrl: task.videoUrl,
                videoProcessingStatus: task.videoProcessingStatus ?? null,
                pdfUrl: task.pdfUrl,
                pdfName: task.documentName,
                isPublished: task.isPublished,
                publishedAt: task.publishedAt,
                quizQuestions: task.questions.map((question) => ({
                    question: question.question,
                    options: question.options,
                    // Real answers are intentionally not exposed by backend payload.
                    correctIndex: -1,
                    explanation:
                        question.explanation ??
                        'Answer explanation is available after backend quiz submission.',
                })),
                submission: task.submission ?? null,
            };
        }),
    }));
}

export default function CourseShow({
    course: serverCourse,
    lessons: serverLessons,
    enrollment,
}: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAdmin = auth.user.is_admin || auth.user.role === 'admin';

    const mappedInitialLessons = useMemo(
        () => mapServerLessonsToLessonData(serverLessons),
        [serverLessons],
    );
    const mappedInitialCourse = useMemo(
        () => ({
            title: serverCourse.title,
            summary: serverCourse.summary,
            estimatedMinutes: serverCourse.estimatedMinutes,
            level: 'General',
        }),
        [serverCourse],
    );

    const course = mappedInitialCourse;
    const lessons = mappedInitialLessons;
    const [isEnrolled, setIsEnrolled] = useState(enrollment !== null);
    const [isEnrolling, setIsEnrolling] = useState(false);

    const [completedLessonIds] = useState<number[]>(
        serverLessons
            .filter((lesson) => lesson.isCompleted)
            .map((lesson) => lesson.id),
    );
    // Restore selected lesson/task from URL hash on initial load
    const initialFromHash = useMemo(() => {
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);
        const lessonId = params.get('lesson');
        const taskId = params.get('task');

        return {
            lessonId: lessonId ? Number(lessonId) : null,
            taskId: taskId ? Number(taskId) : null,
        };
    }, []);

    const getInitialLessonId = () => {
        if (initialFromHash.lessonId !== null) {
            const exists = mappedInitialLessons.some(
                (l) => l.id === initialFromHash.lessonId,
            );

            if (exists) {
                return initialFromHash.lessonId;
            }
        }

        return mappedInitialLessons[0]?.id ?? null;
    };

    const getInitialTaskId = (lessonId: number | null) => {
        if (lessonId !== null && initialFromHash.taskId !== null) {
            const lesson = mappedInitialLessons.find((l) => l.id === lessonId);
            const exists = lesson?.tasks.some(
                (t) => t.id === initialFromHash.taskId,
            );

            if (exists) {
                return initialFromHash.taskId;
            }
        }

        const lesson = mappedInitialLessons.find((l) => l.id === lessonId);

        return lesson?.tasks[0]?.id ?? null;
    };

    const initLessonId = getInitialLessonId();

    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
        initLessonId,
    );
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
        getInitialTaskId(initLessonId),
    );

    const [notice, setNotice] = useState<string | null>(null);

    const [expandedTopicValue, setExpandedTopicValue] = useState<
        string | undefined
    >(initLessonId ? String(initLessonId) : undefined);

    // Sync URL hash when selected lesson/task changes
    useEffect(() => {
        const params = new URLSearchParams();

        if (selectedLessonId !== null) {
            params.set('lesson', String(selectedLessonId));
        }

        if (selectedTaskId !== null) {
            params.set('task', String(selectedTaskId));
        }

        const hash = params.toString();
        window.history.replaceState(null, '', `#${hash}`);
    }, [selectedLessonId, selectedTaskId]);

    const resolvedSelectedLessonId = useMemo(() => {
        if (lessons.length === 0) {
            return null;
        }

        if (
            selectedLessonId !== null &&
            lessons.some((lesson) => lesson.id === selectedLessonId)
        ) {
            return selectedLessonId;
        }

        return lessons[0].id;
    }, [lessons, selectedLessonId]);

    const selectedLesson = useMemo(
        () =>
            lessons.find((lesson) => lesson.id === resolvedSelectedLessonId) ??
            null,
        [lessons, resolvedSelectedLessonId],
    );

    const resolvedSelectedTaskId = useMemo(() => {
        if (!selectedLesson || selectedLesson.tasks.length === 0) {
            return null;
        }

        if (
            selectedTaskId !== null &&
            selectedLesson.tasks.some((task) => task.id === selectedTaskId)
        ) {
            return selectedTaskId;
        }

        return selectedLesson.tasks[0].id;
    }, [selectedLesson, selectedTaskId]);

    const selectedTask = useMemo(
        () =>
            selectedLesson?.tasks.find(
                (task) => task.id === resolvedSelectedTaskId,
            ) ?? null,
        [resolvedSelectedTaskId, selectedLesson],
    );

    const unlockedLessonIds = useMemo(() => {
        const unlockedMap = new Map<number, boolean>();

        lessons.forEach((lesson, index) => {
            if (isAdmin) {
                unlockedMap.set(lesson.id, true);

                return;
            }

            if (index === 0) {
                unlockedMap.set(lesson.id, true);

                return;
            }

            if (!isEnrolled) {
                unlockedMap.set(lesson.id, false);

                return;
            }

            const previousLesson = lessons[index - 1];
            unlockedMap.set(
                lesson.id,
                previousLesson
                    ? completedLessonIds.includes(previousLesson.id)
                    : true,
            );
        });

        return unlockedMap;
    }, [completedLessonIds, isAdmin, isEnrolled, lessons]);

    const completedCount = useMemo(
        () =>
            lessons.filter((lesson) => completedLessonIds.includes(lesson.id))
                .length,
        [completedLessonIds, lessons],
    );

    const progressPercentage =
        lessons.length > 0
            ? Math.round((completedCount / lessons.length) * 100)
            : 0;

    const [isPdfExpanded, setIsPdfExpanded] = useState(false);

    const handleNextTask = () => {
        if (!selectedLesson) {
            return;
        }

        const currentTaskIndex = selectedLesson.tasks.findIndex(
            (t) => t.id === resolvedSelectedTaskId,
        );

        // Try next task in the same lesson
        if (currentTaskIndex < selectedLesson.tasks.length - 1) {
            setSelectedTaskId(selectedLesson.tasks[currentTaskIndex + 1].id);

            return;
        }

        // Try first task of the next lesson
        const currentLessonIndex = lessons.findIndex(
            (l) => l.id === selectedLesson.id,
        );

        if (currentLessonIndex < lessons.length - 1) {
            const nextLesson = lessons[currentLessonIndex + 1];
            setSelectedLessonId(nextLesson.id);
            setSelectedTaskId(nextLesson.tasks[0]?.id ?? null);
            setExpandedTopicValue(String(nextLesson.id));
        }
    };

    const handlePreviousTask = () => {
        if (!selectedLesson) {
            return;
        }

        const currentTaskIndex = selectedLesson.tasks.findIndex(
            (t) => t.id === resolvedSelectedTaskId,
        );

        // Try previous task in the same lesson
        if (currentTaskIndex > 0) {
            setSelectedTaskId(selectedLesson.tasks[currentTaskIndex - 1].id);

            return;
        }

        // Try last task of the previous lesson
        const currentLessonIndex = lessons.findIndex(
            (l) => l.id === selectedLesson.id,
        );

        if (currentLessonIndex > 0) {
            const prevLesson = lessons[currentLessonIndex - 1];
            setSelectedLessonId(prevLesson.id);
            setSelectedTaskId(
                prevLesson.tasks[prevLesson.tasks.length - 1]?.id ?? null,
            );
            setExpandedTopicValue(String(prevLesson.id));
        }
    };

    const handleVideoEnded = () => {
        if (!selectedLesson || !isEnrolled || isAdmin) {
            return;
        }

        if (completedLessonIds.includes(selectedLesson.id)) {
            return;
        }

        router.post(
            completeLesson({
                course: serverCourse.slug,
                lesson: selectedLesson.id,
            }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Video completed! Lesson marked as done.');
                },
            },
        );
    };

    // Navigation context for Previous/Next buttons
    const navContext = useMemo(() => {
        if (!selectedLesson || !selectedTask) {
            return { prevTask: null, nextTask: null };
        }

        const currentTaskIndex = selectedLesson.tasks.findIndex(
            (t) => t.id === resolvedSelectedTaskId,
        );
        const currentLessonIndex = lessons.findIndex(
            (l) => l.id === selectedLesson.id,
        );

        let prevTask: { title: string; lessonTitle: string } | null = null;
        let nextTask: { title: string; lessonTitle: string } | null = null;

        if (currentTaskIndex > 0) {
            prevTask = {
                title: selectedLesson.tasks[currentTaskIndex - 1].title,
                lessonTitle: selectedLesson.title,
            };
        } else if (currentLessonIndex > 0) {
            const prevLesson = lessons[currentLessonIndex - 1];
            const lastTask = prevLesson.tasks[prevLesson.tasks.length - 1];

            if (lastTask) {
                prevTask = {
                    title: lastTask.title,
                    lessonTitle: prevLesson.title,
                };
            }
        }

        if (currentTaskIndex < selectedLesson.tasks.length - 1) {
            nextTask = {
                title: selectedLesson.tasks[currentTaskIndex + 1].title,
                lessonTitle: selectedLesson.title,
            };
        } else if (currentLessonIndex < lessons.length - 1) {
            const nextLesson = lessons[currentLessonIndex + 1];
            const firstTask = nextLesson.tasks[0];

            if (firstTask) {
                nextTask = {
                    title: firstTask.title,
                    lessonTitle: nextLesson.title,
                };
            }
        }

        return { prevTask, nextTask };
    }, [selectedLesson, selectedTask, resolvedSelectedTaskId, lessons]);

    const isCourseCompleted =
        lessons.length > 0 && completedCount === lessons.length;

    useEffect(() => {
        if (!notice) {
            return;
        }

        const timer = window.setTimeout(() => {
            setNotice(null);
        }, 2600);

        return () => {
            window.clearTimeout(timer);
        };
    }, [notice]);

    return (
        <>
            <Head title={`${course.title} - Course Detail`} />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                {notice ? (
                    <Alert>
                        <AlertDescription>{notice}</AlertDescription>
                    </Alert>
                ) : null}

                <section className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-0">
                        <TypographyH1>{course.title}</TypographyH1>
                        <TypographyMuted className="max-w-3xl text-sm/6">
                            {course.summary}
                        </TypographyMuted>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:h-fit">
                        <Card>
                            <CardHeader>
                                <CardTitle>Course Topics</CardTitle>
                                <CardDescription>
                                    Select a lesson to open its tasks.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Completion</span>
                                        <span>{progressPercentage}%</span>
                                    </div>
                                    <Progress
                                        value={progressPercentage}
                                        className="h-2"
                                    />
                                </div>

                                {!isAdmin && !isEnrolled ? (
                                    <Button
                                        type="button"
                                        className="w-full"
                                        disabled={isEnrolling}
                                        onClick={() => {
                                            setIsEnrolling(true);

                                            router.post(
                                                enrollCourse({
                                                    course: serverCourse.slug,
                                                }),
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        setIsEnrolled(true);
                                                        setNotice(
                                                            'You are now enrolled in this course!',
                                                        );
                                                    },
                                                    onFinish: () => {
                                                        setIsEnrolling(false);
                                                    },
                                                },
                                            );
                                        }}
                                    >
                                        {isEnrolling
                                            ? 'Enrolling…'
                                            : 'Enroll in Course'}
                                    </Button>
                                ) : null}

                                {lessons.length === 0 ? (
                                    <Empty className="px-3 py-6">
                                        <EmptyHeader>
                                            <EmptyTitle>
                                                No topics yet
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                Topics and tasks are not
                                                available for this course yet.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : (
                                    <Accordion
                                        type="single"
                                        collapsible
                                        value={expandedTopicValue}
                                        onValueChange={(value) => {
                                            setExpandedTopicValue(
                                                value === ''
                                                    ? undefined
                                                    : value,
                                            );
                                        }}
                                        className="w-full"
                                    >
                                        {lessons.map((lesson, lessonIndex) => {
                                            const isLocked =
                                                !isAdmin &&
                                                !(
                                                    unlockedLessonIds.get(
                                                        lesson.id,
                                                    ) ?? false
                                                );
                                            const isCompleted =
                                                completedLessonIds.includes(
                                                    lesson.id,
                                                );

                                            return (
                                                <AccordionItem
                                                    key={lesson.id}
                                                    value={String(lesson.id)}
                                                    className={
                                                        isLocked
                                                            ? 'opacity-50'
                                                            : undefined
                                                    }
                                                    disabled={isLocked}
                                                >
                                                    <AccordionTrigger
                                                        onClick={() => {
                                                            if (isLocked) {
                                                                return;
                                                            }

                                                            setSelectedLessonId(
                                                                lesson.id,
                                                            );
                                                            setSelectedTaskId(
                                                                lesson.tasks[0]
                                                                    ?.id ??
                                                                    null,
                                                            );
                                                        }}
                                                    >
                                                        <div className="flex w-full items-center justify-between gap-2 pr-2">
                                                            <span className="flex items-center gap-2 truncate">
                                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                                    {lessonIndex +
                                                                        1}
                                                                    .
                                                                </span>
                                                                {lesson.title}
                                                            </span>
                                                            {isLocked ? (
                                                                <Lock
                                                                    className="shrink-0 text-muted-foreground"
                                                                    data-icon
                                                                />
                                                            ) : isCompleted ? (
                                                                <CheckCircle2
                                                                    className="shrink-0 text-emerald-500"
                                                                    data-icon
                                                                />
                                                            ) : null}
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="flex flex-col gap-3">
                                                        {lesson.tasks.length >
                                                        0 ? (
                                                            <div className="flex flex-col gap-2">
                                                                {lesson.tasks.map(
                                                                    (task) => {
                                                                        const TaskIcon =
                                                                            taskTypeIcon[
                                                                                task
                                                                                    .type
                                                                            ];

                                                                        return (
                                                                            <div
                                                                                key={`${lesson.id}-${task.id}`}
                                                                                className="flex items-center gap-1"
                                                                            >
                                                                                <Button
                                                                                    type="button"
                                                                                    variant={
                                                                                        selectedTaskId ===
                                                                                        task.id
                                                                                            ? 'secondary'
                                                                                            : 'outline'
                                                                                    }
                                                                                    size="lg"
                                                                                    className="flex-1 justify-start gap-2"
                                                                                    onClick={() => {
                                                                                        setSelectedLessonId(
                                                                                            lesson.id,
                                                                                        );
                                                                                        setSelectedTaskId(
                                                                                            task.id,
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <TaskIcon data-icon="inline-start" />
                                                                                    <span className="truncate">
                                                                                        {
                                                                                            task.title
                                                                                        }
                                                                                    </span>
                                                                                    {isCompleted && (
                                                                                        <CheckCircle2
                                                                                            className="ml-auto shrink-0 text-emerald-500"
                                                                                            data-icon
                                                                                        />
                                                                                    )}
                                                                                </Button>
                                                                            </div>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground">
                                                                No tasks
                                                                available yet.
                                                            </p>
                                                        )}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            );
                                        })}
                                    </Accordion>
                                )}
                            </CardContent>
                        </Card>

                        {isCourseCompleted ? (
                            <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                                    <Trophy className="size-4 text-amber-500" />
                                </div>
                                <div className="flex flex-col gap-0">
                                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                        Course Completed! 🎉
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        You&apos;ve finished all lessons.
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-4">
                        <Card className="gap-0">
                            <CardContent className="flex flex-col gap-4">
                                {selectedTask ? (
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-base font-medium">
                                            {selectedTask.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {selectedTask.description}
                                        </p>
                                    </div>
                                ) : null}

                                {!selectedLesson ? (
                                    <Empty className="px-2 py-6">
                                        <EmptyHeader>
                                            <EmptyTitle>
                                                No topic selected
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                Select a topic from the left
                                                panel to reveal lesson content.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : !isAdmin &&
                                  !(
                                      unlockedLessonIds.get(
                                          selectedLesson.id,
                                      ) ?? false
                                  ) ? (
                                    <Empty className="px-4 py-10">
                                        <EmptyHeader>
                                            <EmptyTitle>
                                                Lesson is locked
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                Complete previous lessons first.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : !selectedTask ? (
                                    <Empty className="px-4 py-10">
                                        <EmptyHeader>
                                            <EmptyTitle>No task yet</EmptyTitle>
                                            <EmptyDescription>
                                                No task is currently assigned to
                                                this topic.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : selectedTask.type === 'video' ? (
                                    selectedTask.videoUrl || selectedTask.videoProcessingStatus === 'pending' || selectedTask.videoProcessingStatus === 'processing' || selectedTask.videoProcessingStatus === 'failed' ? (
                                        <VideoPlayer
                                            key={selectedTask.id}
                                            url={selectedTask.videoUrl ?? ''}
                                            processingStatus={selectedTask.videoProcessingStatus as 'pending' | 'processing' | 'ready' | 'converted' | 'failed' | null}
                                            onEnded={handleVideoEnded}
                                        />
                                    ) : (
                                        <Empty className="px-4 py-10">
                                            <EmptyHeader>
                                                <EmptyTitle>
                                                    Video URL missing
                                                </EmptyTitle>
                                                <EmptyDescription>
                                                    This task has no configured
                                                    video URL.
                                                </EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    )
                                ) : selectedTask.type === 'read' ? (
                                    selectedTask.pdfUrl ? (
                                        <div className="relative overflow-hidden rounded-xl border bg-background">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="absolute top-2 right-2 z-10"
                                                onClick={() =>
                                                    setIsPdfExpanded((v) => !v)
                                                }
                                            >
                                                {isPdfExpanded ? (
                                                    <Minimize2 data-icon />
                                                ) : (
                                                    <Maximize2 data-icon />
                                                )}
                                            </Button>
                                            <iframe
                                                title={`Document viewer for ${selectedTask.title}`}
                                                src={selectedTask.pdfUrl}
                                                className={
                                                    isPdfExpanded
                                                        ? 'h-[calc(100vh-8rem)] w-full'
                                                        : 'h-140 w-full'
                                                }
                                            />
                                        </div>
                                    ) : (() => {
                                        const serverLesson = serverLessons.find(
                                            (l) => l.id === selectedLesson?.id,
                                        );
                                        return serverLesson?.content?.trim() ? (
                                            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto rounded-xl border bg-background p-6">
                                                <LessonContent
                                                    content={serverLesson.content}
                                                />
                                            </div>
                                        ) : (
                                            <Empty className="px-4 py-10">
                                                <EmptyHeader>
                                                    <EmptyTitle>
                                                        No content available
                                                    </EmptyTitle>
                                                    <EmptyDescription>
                                                        This task has no
                                                        configured content yet.
                                                    </EmptyDescription>
                                                </EmptyHeader>
                                            </Empty>
                                        );
                                    })()
                                ) : (
                                    <QuizPanel
                                        key={`${selectedTask.id}-${selectedTask.quizQuestions.length}`}
                                        task={selectedTask}
                                        courseSlug={serverCourse.slug}
                                        lessonId={selectedLesson?.id ?? 0}
                                        submission={selectedTask.submission}
                                        onNextTask={handleNextTask}
                                    />
                                )}

                                {/* Task navigation bar */}
                                {selectedTask ? (
                                    <div className="flex items-center justify-between">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={!navContext.prevTask}
                                            onClick={handlePreviousTask}
                                            className="gap-1"
                                        >
                                            <ChevronLeft data-icon="inline-start" />
                                            <span className="hidden sm:inline">
                                                {navContext.prevTask?.title ??
                                                    'Previous'}
                                            </span>
                                            <span className="sm:hidden">
                                                Previous
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={!navContext.nextTask}
                                            onClick={handleNextTask}
                                            className="gap-1"
                                        >
                                            <span className="hidden sm:inline">
                                                {navContext.nextTask?.title ??
                                                    'Next'}
                                            </span>
                                            <span className="sm:hidden">
                                                Next
                                            </span>
                                            <ChevronRight data-icon="inline-end" />
                                        </Button>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>

                        {/* Discussion panel for current lesson */}
                        {selectedLessonId && isEnrolled && (
                            <DiscussionPanel
                                discussableType="lesson"
                                discussableId={selectedLessonId}
                            />
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

function CourseShowLayout({ children }: { children: React.ReactNode }) {
    const { course } = usePage<any>().props;

    return (
        <AppLayout
            breadcrumbs={[
                {
                    title: 'Courses',
                    href: coursesIndex(),
                },
                ...(course
                    ? [
                          {
                              title: course.title,
                              href: showCourse({ course: course.slug }),
                          },
                      ]
                    : []),
            ]}
        >
            {children}
        </AppLayout>
    );
}

CourseShow.layout = (page: React.ReactNode) => (
    <CourseShowLayout>{page}</CourseShowLayout>
);
