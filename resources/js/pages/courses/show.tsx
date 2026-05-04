import { Head, router, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Brain,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Clock,
    Lock,
    Trophy,
    Video,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CourseAssessmentPanel } from '@/components/course-assessment-panel';
import type { AssessmentFullData } from '@/components/course-assessment-panel';
import type { QuizSubmission } from '@/components/course-quiz-panel';
import { TaskViewer } from '@/components/task/task-viewer';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
    reading: BookOpen,
    quiz: Brain,
};

type TaskType = 'video' | 'read' | 'reading' | 'quiz';

type LessonQuizQuestion = {
    id: number;
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
};

type LessonTask = {
    id: number;
    type: TaskType;
    title: string;
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
    id: number;
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
    assessment: AssessmentFullData | null;
};

function defaultTaskDescription(type: TaskType): string {
    if (type === 'video') {
        return 'Tonton video hingga selesai untuk menyelesaikan tugas ini.';
    }

    if (type === 'read' || type === 'reading') {
        return 'Baca materi dan catat poin-poin penting.';
    }

    return 'Selesaikan kuis untuk menguji pemahaman Anda sebelum melanjutkan.';
}

function normalizeTaskTitle(title: string): string {
    return title.replace(/^(video|quiz|read|reading)\s*:\s*/i, '').trim();
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
            // Normalize 'reading' → 'read' for consistency
            const normalizedType: TaskType =
                task.type === 'reading' ? 'read' : task.type;

            // Debug: Log quiz questions to verify IDs
            if (task.questions && task.questions.length > 0) {
                console.log(
                    'Quiz questions for task',
                    mappedTaskId,
                    ':',
                    task.questions,
                );
            }

            return {
                id: mappedTaskId,
                type: normalizedType,
                title: displayTaskTitle,
                description: defaultTaskDescription(normalizedType),
                videoUrl: task.videoUrl,
                videoProcessingStatus: task.videoProcessingStatus ?? null,
                pdfUrl: task.pdfUrl,
                pdfName: task.documentName,
                isPublished: task.isPublished,
                publishedAt: task.publishedAt,
                quizQuestions: task.questions.map((question) => ({
                    id: question.id,
                    question: question.question,
                    options: question.options,
                    // Real answers are intentionally not exposed by backend payload.
                    correctIndex: -1,
                    explanation:
                        question.explanation ??
                        'Penjelasan jawaban tersedia setelah pengiriman kuis backend.',
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
    assessment,
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
    const [showAssessment, setShowAssessment] = useState(
        () =>
            assessment?.activeSubmission !== null &&
            assessment?.activeSubmission !== undefined,
    );

    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>(
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

    // Handler for task completion from TaskViewer
    const handleTaskComplete = () => {
        // Refresh page data to get updated progress
        router.reload({
            preserveScroll: true,
            onSuccess: () => {
                // Update completed lessons state for real-time UI update
                if (
                    selectedLesson &&
                    !completedLessonIds.includes(selectedLesson.id)
                ) {
                    setCompletedLessonIds((prev) => [
                        ...prev,
                        selectedLesson.id,
                    ]);
                }
            },
        });
    };

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

    const allLessonsCompleted =
        lessons.length > 0 && completedCount === lessons.length;
    const isCourseCompleted =
        allLessonsCompleted && (!assessment || assessment.passed);

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

                <section className="flex flex-col gap-3">
                    <div className="flex flex-col gap-0">
                        <TypographyH1>{course.title}</TypographyH1>
                        <TypographyMuted className="text-sm/6">
                            {course.summary}
                        </TypographyMuted>
                    </div>
                </section>

                <section className="grid gap-3 lg:grid-cols-[3fr_7fr]">
                    <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:h-fit lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
                        <Card>
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-base">
                                    Topik Kursus
                                </CardTitle>
                                <CardDescription className="text-sm">
                                    Pilih pelajaran untuk membuka tugasnya.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Penyelesaian
                                        </span>
                                        <span className="font-medium tabular-nums">
                                            {progressPercentage}%
                                        </span>
                                    </div>
                                    <Progress
                                        value={progressPercentage}
                                        className="h-1.5"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {completedCount} dari {lessons.length}{' '}
                                        pelajaran
                                    </p>
                                </div>

                                {!isAdmin && !isEnrolled ? (
                                    <Button
                                        type="button"
                                        className="w-full gap-2 shadow-sm"
                                        size="lg"
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
                                                            'Anda sekarang terdaftar di kursus ini!',
                                                        );
                                                    },
                                                    onFinish: () => {
                                                        setIsEnrolling(false);
                                                    },
                                                },
                                            );
                                        }}
                                    >
                                        <BookOpen className="h-4 w-4" />
                                        {isEnrolling
                                            ? 'Mendaftar…'
                                            : 'Daftar di Kursus'}
                                    </Button>
                                ) : null}

                                {lessons.length === 0 ? (
                                    <Empty className="px-3 py-6">
                                        <EmptyHeader>
                                            <EmptyTitle>
                                                Belum Ada Topik
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                Topik dan tugas belum tersedia
                                                untuk kursus ini.
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
                                                    disabled={isLocked}
                                                    className={
                                                        isLocked
                                                            ? 'opacity-50'
                                                            : ''
                                                    }
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
                                                        <div className="flex items-center gap-3">
                                                            <span
                                                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                                                    isCompleted
                                                                        ? 'bg-foreground text-background'
                                                                        : 'bg-muted text-muted-foreground'
                                                                }`}
                                                            >
                                                                {isCompleted ? (
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                ) : (
                                                                    lessonIndex +
                                                                    1
                                                                )}
                                                            </span>
                                                            <div className="flex flex-col gap-0.5 text-left">
                                                                <span className="text-sm font-medium">
                                                                    {
                                                                        lesson.title
                                                                    }
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {
                                                                        lesson
                                                                            .tasks
                                                                            .length
                                                                    }{' '}
                                                                    tugas
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        {lesson.tasks.length >
                                                        0 ? (
                                                            <div className="flex flex-col gap-1.5">
                                                                {lesson.tasks.map(
                                                                    (task) => {
                                                                        const TaskIcon =
                                                                            taskTypeIcon[
                                                                                task
                                                                                    .type
                                                                            ];
                                                                        const isTaskCompleted =
                                                                            isCompleted;
                                                                        const isTaskActive =
                                                                            selectedTaskId ===
                                                                            task.id;

                                                                        return (
                                                                            <button
                                                                                key={`${lesson.id}-${task.id}`}
                                                                                type="button"
                                                                                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                                                                    isTaskActive
                                                                                        ? 'bg-secondary font-medium'
                                                                                        : 'hover:bg-accent'
                                                                                }`}
                                                                                onClick={() => {
                                                                                    setSelectedLessonId(
                                                                                        lesson.id,
                                                                                    );
                                                                                    setSelectedTaskId(
                                                                                        task.id,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <TaskIcon className="h-4 w-4 shrink-0" />
                                                                                <span className="flex-1 truncate">
                                                                                    {
                                                                                        task.title
                                                                                    }
                                                                                </span>
                                                                            </button>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground">
                                                                Belum ada tugas
                                                                tersedia.
                                                            </p>
                                                        )}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            );
                                        })}

                                        {/* Assessment as last accordion item */}
                                        {assessment && (
                                            <AccordionItem
                                                value="assessment"
                                                disabled={assessment.isLocked}
                                                className={
                                                    assessment.isLocked
                                                        ? 'opacity-50'
                                                        : ''
                                                }
                                            >
                                                <AccordionTrigger>
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                                                assessment.passed
                                                                    ? 'bg-emerald-500 text-white'
                                                                    : 'bg-primary/10 text-primary'
                                                            }`}
                                                        >
                                                            {assessment.passed ? (
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            ) : (
                                                                <ClipboardCheck className="h-4 w-4" />
                                                            )}
                                                        </span>
                                                        <div className="flex flex-col gap-0.5 text-left">
                                                            <span className="text-sm font-medium">
                                                                Penilaian Akhir
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {
                                                                    assessment.questionsCount
                                                                }{' '}
                                                                pertanyaan
                                                            </span>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="flex flex-col gap-3">
                                                        <p className="text-xs text-muted-foreground">
                                                            {assessment.description ??
                                                                'Selesaikan penilaian ini untuk menyelesaikan kursus.'}
                                                        </p>

                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-muted-foreground">
                                                                    Pertanyaan
                                                                </span>
                                                                <span className="font-semibold">
                                                                    {
                                                                        assessment.questionsCount
                                                                    }
                                                                </span>
                                                            </div>
                                                            {assessment.timeLimitMinutes && (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="text-muted-foreground">
                                                                        Durasi
                                                                    </span>
                                                                    <span className="font-semibold">
                                                                        {
                                                                            assessment.timeLimitMinutes
                                                                        }{' '}
                                                                        min
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-muted-foreground">
                                                                    Nilai Lulus
                                                                </span>
                                                                <span className="font-semibold">
                                                                    {
                                                                        assessment.passingScore
                                                                    }
                                                                    %
                                                                </span>
                                                            </div>
                                                            {assessment.maxAttempts && (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="text-muted-foreground">
                                                                        Percobaan
                                                                    </span>
                                                                    <span className="font-semibold">
                                                                        {
                                                                            assessment.attemptCount
                                                                        }
                                                                        /
                                                                        {
                                                                            assessment.maxAttempts
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {assessment.bestScore !==
                                                            null && (
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-muted-foreground">
                                                                        Skor
                                                                        Terbaik
                                                                    </span>
                                                                    <span
                                                                        className={`font-bold tabular-nums ${
                                                                            assessment.passed
                                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                                : 'text-amber-600 dark:text-amber-400'
                                                                        }`}
                                                                    >
                                                                        {Math.round(
                                                                            assessment.bestScore,
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </div>
                                                                <Progress
                                                                    value={
                                                                        assessment.bestScore
                                                                    }
                                                                    className="h-1.5"
                                                                />
                                                            </div>
                                                        )}

                                                        {assessment.isLocked ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled
                                                                className="w-full gap-2"
                                                            >
                                                                <Lock className="h-4 w-4" />
                                                                Selesaikan Semua
                                                                Pelajaran
                                                            </Button>
                                                        ) : assessment.passed ? (
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 dark:bg-emerald-950/30">
                                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                                                        Penilaian
                                                                        Lulus!
                                                                    </span>
                                                                </div>
                                                                {assessment.latestResults && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="w-full"
                                                                        onClick={() => {
                                                                            setShowAssessment(
                                                                                true,
                                                                            );
                                                                            setSelectedLessonId(
                                                                                null,
                                                                            );
                                                                            setSelectedTaskId(
                                                                                null,
                                                                            );
                                                                        }}
                                                                    >
                                                                        Lihat
                                                                        Hasil
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="w-full gap-2"
                                                                disabled={
                                                                    !assessment.canAttempt
                                                                }
                                                                onClick={() => {
                                                                    setShowAssessment(
                                                                        true,
                                                                    );
                                                                    setSelectedLessonId(
                                                                        null,
                                                                    );
                                                                    setSelectedTaskId(
                                                                        null,
                                                                    );
                                                                }}
                                                            >
                                                                <ClipboardCheck className="h-4 w-4" />
                                                                {assessment.attemptCount >
                                                                0
                                                                    ? 'Coba Lagi'
                                                                    : 'Mulai Penilaian'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        )}
                                    </Accordion>
                                )}
                            </CardContent>
                        </Card>

                        {isCourseCompleted ? (
                            <div className="flex items-center gap-4 rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-amber-50/30 p-4 shadow-sm dark:from-emerald-950/20 dark:to-amber-950/10">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 shadow-inner dark:from-emerald-900/40 dark:to-amber-900/40">
                                    <Trophy className="h-6 w-6 text-amber-500" />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                                        Kursus Selesai! 🎉
                                    </p>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        Anda telah menyelesaikan semua pelajaran
                                        dan lulus penilaian.
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-6">
                        {showAssessment && assessment ? (
                            <CourseAssessmentPanel
                                assessment={assessment}
                                onBack={() => setShowAssessment(false)}
                            />
                        ) : (
                            <div className="flex flex-col gap-6">
                                {!selectedLesson || !selectedTask ? (
                                    <Empty className="px-2 py-6">
                                        <EmptyHeader>
                                            <EmptyTitle>
                                                Tidak Ada Topik Dipilih
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                Pilih topik dari panel kiri
                                                untuk menampilkan konten
                                                pelajaran.
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
                                                Pelajaran Terkunci
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                Selesaikan pelajaran sebelumnya
                                                terlebih dahulu.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : !selectedTask ? (
                                    <Empty className="px-4 py-10">
                                        <EmptyHeader>
                                            <EmptyTitle>
                                                Belum Ada Tugas
                                            </EmptyTitle>
                                            <EmptyDescription>
                                                Tidak ada tugas yang saat ini
                                                ditugaskan untuk topik ini.
                                            </EmptyDescription>
                                        </EmptyHeader>
                                    </Empty>
                                ) : (
                                    <TaskViewer
                                        courseSlug={serverCourse.slug}
                                        lessonId={selectedLesson.id}
                                        task={{
                                            id: selectedTask.id,
                                            type: selectedTask.type,
                                            title: selectedTask.title,
                                            description:
                                                selectedTask.description,
                                            videoUrl: selectedTask.videoUrl,
                                            videoProcessingStatus:
                                                selectedTask.videoProcessingStatus,
                                            pdfUrl: selectedTask.pdfUrl,
                                            content:
                                                serverLessons.find(
                                                    (l) =>
                                                        l.id ===
                                                        selectedLesson.id,
                                                )?.content ?? null,
                                            quizQuestions:
                                                selectedTask.quizQuestions.map(
                                                    (q) => ({
                                                        id: q.id,
                                                        question: q.question,
                                                        options: q.options,
                                                        explanation:
                                                            q.explanation,
                                                    }),
                                                ),
                                            submission: selectedTask.submission,
                                        }}
                                        onComplete={handleTaskComplete}
                                    />
                                )}

                                {/* Task navigation bar */}
                                {selectedTask ? (
                                    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={!navContext.prevTask}
                                            onClick={handlePreviousTask}
                                            className="gap-2"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            <span className="text-xs">
                                                Sebelumnya
                                            </span>
                                        </Button>
                                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                                            {selectedLesson && selectedTask
                                                ? `${selectedLesson.tasks.findIndex((t) => t.id === selectedTask.id) + 1}/${selectedLesson.tasks.length}`
                                                : ''}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={!navContext.nextTask}
                                            onClick={handleNextTask}
                                            className="gap-2"
                                        >
                                            <span className="text-xs">
                                                Berikutnya
                                            </span>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
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
                    title: 'Kursus',
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
