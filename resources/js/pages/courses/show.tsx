import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { QuizPanel } from '@/components/course-quiz-panel';
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
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';

import { Progress } from '@/components/ui/progress';

import AppLayout from '@/layouts/app-layout';
import {
    enroll as enrollCourse,
    index as coursesIndex,
    show as showCourse,
} from '@/routes/courses';
import {
    complete as completeLesson,
} from '@/routes/courses/lessons';
import type { Auth } from '@/types/auth';

type TaskType = 'video' | 'read' | 'quiz';

type MockQuizQuestion = {
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
};

type MockTask = {
    id: number;
    type: TaskType;
    title: string;
    minutes: number;
    description: string;
    videoUrl: string | null;
    pdfUrl: string | null;
    pdfName: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    quizQuestions: MockQuizQuestion[];
};

type MockLesson = {
    id: number;
    title: string;
    summary: string;
    tasks: MockTask[];
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
    documentName: string | null;
    conversionStatus: string | null;
    pdfUrl: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    questions: ServerTaskQuestion[];
    questionCount: number;
};

type ServerLesson = {
    id: number;
    slug: string;
    title: string;
    position: number;
    content: string;
    tasks: ServerTask[];
    xpReward: number;
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

function defaultTaskDescription(type: TaskType, title: string): string {
    if (type === 'video') {
        return `Watch ${title} and note the implementation checkpoints.`;
    }

    if (type === 'read') {
        return `Read ${title} and map key takeaways into your own notes.`;
    }

    return `Complete ${title} to validate your understanding before moving forward.`;
}

function normalizeTaskTitle(title: string): string {
    return title.replace(/^(video|quiz|read)\s*:\s*/i, '').trim();
}

function mapServerLessonsToMockLessons(
    serverLessons: ServerLesson[],
): MockLesson[] {
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
                description: defaultTaskDescription(task.type, displayTaskTitle),
                videoUrl: task.videoUrl,
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
        () => mapServerLessonsToMockLessons(serverLessons),
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
    const [isCompletingLesson, setIsCompletingLesson] = useState(false);
    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>(
        serverLessons
            .filter((lesson) => lesson.isCompleted)
            .map((lesson) => lesson.id),
    );
    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
        mappedInitialLessons[0]?.id ?? null,
    );
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(
        mappedInitialLessons[0]?.tasks[0]?.id ?? null,
    );

    const [notice, setNotice] = useState<string | null>(null);

    const [expandedTopicValue, setExpandedTopicValue] = useState<
        string | undefined
    >(mappedInitialLessons[0] ? String(mappedInitialLessons[0].id) : undefined);

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
                                                Topics and tasks are not available for this course yet.
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
                                        {lessons.map((lesson) => (
                                            <AccordionItem
                                                key={lesson.id}
                                                value={String(lesson.id)}
                                            >
                                                <AccordionTrigger
                                                    onClick={() => {
                                                        setSelectedLessonId(lesson.id);
                                                        setSelectedTaskId(
                                                            lesson.tasks[0]?.id ?? null,
                                                        );
                                                    }}
                                                >
                                                    <div className="flex w-full items-center justify-between gap-2 pr-2">
                                                        <span className="truncate">
                                                            {lesson.title}
                                                        </span>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="flex flex-col gap-3">
                                                    {lesson.tasks.length > 0 ? (
                                                        <div className="flex flex-col gap-2">
                                                            {lesson.tasks.map(
                                                                (task) => (
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
                                                                                setSelectedLessonId(lesson.id);
                                                                                setSelectedTaskId(task.id);
                                                                            }}
                                                                        >
                                                                            <span className="truncate">
                                                                                {task.title}
                                                                            </span>
                                                                        </Button>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">
                                                            No tasks available yet.
                                                        </p>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                )}
                            </CardContent>
                        </Card>
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
                                            <EmptyTitle>
                                                No task yet
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                No task is currently assigned to this topic.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : selectedTask.type === 'video' ? (
                                    selectedTask.videoUrl ? (
                                        <VideoPlayer
                                            key={selectedTask.id}
                                            url={selectedTask.videoUrl}
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
                                        <div className="overflow-hidden rounded-xl border bg-background">
                                            <iframe
                                                title={`Document viewer for ${selectedTask.title}`}
                                                src={selectedTask.pdfUrl}
                                                className="h-140 w-full"
                                            />
                                        </div>
                                    ) : (
                                        <Empty className="px-4 py-10">
                                            <EmptyHeader>
                                                <EmptyTitle>
                                                    PDF URL missing
                                                </EmptyTitle>
                                                <EmptyDescription>
                                                    This task has no configured
                                                    PDF URL.
                                                </EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    )
                                ) : (
                                    <QuizPanel
                                        key={`${selectedTask.id}-${selectedTask.quizQuestions.length}`}
                                        task={selectedTask}
                                        courseSlug={serverCourse.slug}
                                        lessonId={selectedLesson?.id ?? 0}
                                    />
                                )}

                                {!isAdmin &&
                                selectedLesson &&
                                isEnrolled &&
                                (unlockedLessonIds.get(selectedLesson.id) ??
                                    false) &&
                                !completedLessonIds.includes(
                                    selectedLesson.id,
                                ) ? (
                                    <Button
                                        type="button"
                                        className="w-full"
                                        disabled={isCompletingLesson}
                                        onClick={() => {
                                            if (!selectedLesson) {
                                                return;
                                            }

                                            setIsCompletingLesson(true);

                                            router.post(
                                                completeLesson({
                                                    course: serverCourse.slug,
                                                    lesson: selectedLesson.id,
                                                }),
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        setCompletedLessonIds(
                                                            (previous) =>
                                                                previous.includes(
                                                                    selectedLesson.id,
                                                                )
                                                                    ? previous
                                                                    : [
                                                                          ...previous,
                                                                          selectedLesson.id,
                                                                      ],
                                                        );
                                                        setNotice(
                                                            `Lesson "${selectedLesson.title}" marked complete!`,
                                                        );
                                                    },
                                                    onFinish: () => {
                                                        setIsCompletingLesson(
                                                            false,
                                                        );
                                                    },
                                                },
                                            );
                                        }}
                                    >
                                        <CheckCircle2 className="mr-2 size-4" />
                                        {isCompletingLesson
                                            ? 'Completing…'
                                            : 'Mark Lesson Complete'}
                                    </Button>
                                ) : null}

                                {!isAdmin &&
                                selectedLesson &&
                                completedLessonIds.includes(
                                    selectedLesson.id,
                                ) ? (
                                    <Alert>
                                        <CheckCircle2 className="size-4" />
                                        <AlertDescription>
                                            Lesson completed
                                        </AlertDescription>
                                    </Alert>
                                ) : null}
                            </CardContent>
                        </Card>
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
