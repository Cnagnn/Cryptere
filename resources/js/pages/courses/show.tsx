import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    destroyLesson,
    destroyTask,
    updateLesson,
} from '@/actions/App/Http/Controllers/Admin/CourseManagementController';
import { QuizPanel } from '@/components/course-quiz-panel';
import { TaskFormSheet } from '@/components/course-task-form-sheet';
import type { ComboboxOption, TaskRow } from '@/components/course-types';
import { VideoPlayer } from '@/components/course-video-player';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Progress } from '@/components/ui/progress';

import AppLayout from '@/layouts/app-layout';
import {
    enroll as enrollCourse,
    index as coursesIndex,
    show as showCourse,
} from '@/routes/courses';
import {
    complete as completeLesson,
    store as storeLesson,
} from '@/routes/courses/lessons';
import { publish as publishTask } from '@/routes/courses/lessons/tasks';
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

type MockRole = 'learner' | 'admin';

type TopicItem = {
    id: number;
    topic: string;
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

function mapServerLessonsToMockLessons(
    serverLessons: ServerLesson[],
): MockLesson[] {
    return serverLessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        summary: lesson.content?.trim() || 'No summary available yet.',
        tasks: lesson.tasks.map((task, index) => {
            const mappedTaskId = task.taskId ?? lesson.id * 1000 + index + 1;

            return {
                id: mappedTaskId,
                type: task.type,
                title: task.title,
                minutes: Math.max(1, task.minutes || 1),
                description: defaultTaskDescription(task.type, task.title),
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

function mapLessonsToTopics(lessons: MockLesson[]): TopicItem[] {
    return lessons.map((lesson) => ({
        id: lesson.id,
        topic: lesson.title,
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
    const role: MockRole = isAdmin ? 'admin' : 'learner';
    const [isEnrolled, setIsEnrolled] = useState(enrollment !== null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isCompletingLesson, setIsCompletingLesson] = useState(false);
    const [isPublishingTask, setIsPublishingTask] = useState(false);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
    const [deletingTask, setDeletingTask] = useState<TaskRow | null>(null);
    const [editingTopic, setEditingTopic] = useState<MockLesson | null>(null);
    const [isUpdatingTopic, setIsUpdatingTopic] = useState(false);
    const [topicEditTitle, setTopicEditTitle] = useState('');
    const [deletingTopic, setDeletingTopic] = useState<MockLesson | null>(null);
    const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
    const [topicTitle, setTopicTitle] = useState('');
    const [isCreatingTopic, setIsCreatingTopic] = useState(false);
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
    const topics = useMemo(() => mapLessonsToTopics(lessons), [lessons]);
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

    const lessonOptions = useMemo<ComboboxOption[]>(() => {
        return lessons.map((lesson) => ({
            value: String(lesson.id),
            label: lesson.title,
        }));
    }, [lessons]);

    const mapTaskToRow = (
        lesson: MockLesson,
        task: MockTask,
        index: number,
    ): TaskRow => {
        return {
            id: task.id,
            task_index: index,
            lesson_id: lesson.id,
            lesson_title: lesson.title,
            course_slug: serverCourse.slug,
            type: task.type,
            title: task.title,
            minutes: task.minutes,
            video_url: task.videoUrl,
            quiz_questions: task.quizQuestions.map((question) => ({
                question: question.question,
                options: question.options,
                correct_option:
                    question.correctIndex >= 0 ? question.correctIndex : 0,
                explanation: question.explanation,
            })),
        };
    };

    const unlockedLessonIds = useMemo(() => {
        const unlockedMap = new Map<number, boolean>();

        lessons.forEach((lesson, index) => {
            if (role === 'admin') {
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
    }, [completedLessonIds, isEnrolled, lessons, role]);

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

    useEffect(() => {
        if (role !== 'admin') {
            return;
        }

        const handleCreateTopic = () => {
            setIsCreateTopicOpen(true);
        };

        window.addEventListener('course-topic:create', handleCreateTopic);

        return () => {
            window.removeEventListener('course-topic:create', handleCreateTopic);
        };
    }, [role]);

    return (
        <>
            <Head title={`${course.title} - Course Detail`} />

            <div className="flex flex-col gap-6 px-4 py-6">
                {notice ? (
                    <Alert>
                        <AlertDescription>{notice}</AlertDescription>
                    </Alert>
                ) : null}

                <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:h-fit">
                        <Card className="gap-0">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    {course.title}
                                </CardTitle>
                                <CardDescription>
                                    {course.summary}
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

                                {role === 'learner' && !isEnrolled ? (
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

                                <div>
                                    <div className="flex flex-col gap-4">
                                        {topics.length === 0 ? (
                                            <Empty className="px-3 py-6">
                                                <EmptyHeader>
                                                    <EmptyTitle>
                                                        No topics yet
                                                    </EmptyTitle>
                                                    <EmptyDescription>
                                                        Click Create Topic in
                                                        the header.
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
                                                {topics.map((topic) => (
                                                    <AccordionItem
                                                        key={topic.id}
                                                        value={String(topic.id)}
                                                    >
                                                        <AccordionTrigger
                                                            onClick={() => {
                                                                const matchedLesson =
                                                                    lessons.find(
                                                                        (
                                                                            lesson,
                                                                        ) =>
                                                                            lesson.id ===
                                                                            topic.id,
                                                                    );

                                                                if (
                                                                    !matchedLesson
                                                                ) {
                                                                    return;
                                                                }

                                                                setSelectedLessonId(
                                                                    matchedLesson.id,
                                                                );
                                                                setSelectedTaskId(
                                                                    matchedLesson
                                                                        .tasks[0]
                                                                        ?.id ??
                                                                        null,
                                                                );
                                                            }}
                                                        >
                                                            <div className="flex w-full items-center justify-between gap-2 pr-2">
                                                                <span className="truncate">
                                                                    {topic.topic}
                                                                </span>

                                                                {role ===
                                                                'admin' ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            type="button"
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="size-7"
                                                                            onClick={(
                                                                                event,
                                                                            ) => {
                                                                                event.preventDefault();
                                                                                event.stopPropagation();
                                                                                const lesson =
                                                                                    lessons.find(
                                                                                        (
                                                                                            currentLesson,
                                                                                        ) =>
                                                                                            currentLesson.id ===
                                                                                            topic.id,
                                                                                    );

                                                                                if (
                                                                                    !lesson
                                                                                ) {
                                                                                    return;
                                                                                }

                                                                                setEditingTopic(
                                                                                    lesson,
                                                                                );
                                                                                setTopicEditTitle(
                                                                                    lesson.title,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Pencil className="size-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="size-7 text-destructive hover:text-destructive"
                                                                            onClick={(
                                                                                event,
                                                                            ) => {
                                                                                event.preventDefault();
                                                                                event.stopPropagation();
                                                                                const lesson =
                                                                                    lessons.find(
                                                                                        (
                                                                                            currentLesson,
                                                                                        ) =>
                                                                                            currentLesson.id ===
                                                                                            topic.id,
                                                                                    );

                                                                                if (
                                                                                    !lesson
                                                                                ) {
                                                                                    return;
                                                                                }

                                                                                setDeletingTopic(
                                                                                    lesson,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Trash2 className="size-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </AccordionTrigger>
                                                        <AccordionContent className="flex flex-col gap-3">
                                                            {role === 'admin' ? (
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="justify-start gap-2"
                                                                    onClick={() => {
                                                                        setSelectedLessonId(
                                                                            topic.id,
                                                                        );
                                                                        setIsCreateTaskOpen(
                                                                            true,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Plus className="size-3.5" />
                                                                    <span>
                                                                        Create
                                                                        Task
                                                                    </span>
                                                                </Button>
                                                            ) : null}

                                                            {lessons.find(
                                                                (lesson) =>
                                                                    lesson.id ===
                                                                    topic.id,
                                                            )?.tasks.length ? (
                                                                <div className="flex flex-col gap-2">
                                                                    {lessons
                                                                        .find(
                                                                            (
                                                                                lesson,
                                                                            ) =>
                                                                                lesson.id ===
                                                                                topic.id,
                                                                        )
                                                                        ?.tasks.map(
                                                                            (
                                                                                task,
                                                                                taskIndex,
                                                                            ) => (
                                                                                <div
                                                                                    key={`${topic.id}-${task.id}`}
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
                                                                                        size="sm"
                                                                                        className="flex-1 justify-start gap-2"
                                                                                        onClick={() => {
                                                                                            setSelectedLessonId(
                                                                                                topic.id,
                                                                                            );
                                                                                            setSelectedTaskId(
                                                                                                task.id,
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <Badge
                                                                                            variant="outline"
                                                                                            className="size-5 rounded-full p-0 text-[11px] leading-none"
                                                                                        >
                                                                                            {taskIndex +
                                                                                                1}
                                                                                        </Badge>
                                                                                        <span className="truncate">
                                                                                            {
                                                                                                task.title
                                                                                            }
                                                                                        </span>
                                                                                    </Button>

                                                                                    {role ===
                                                                                    'admin' ? (
                                                                                        <>
                                                                                            <Button
                                                                                                type="button"
                                                                                                size="icon"
                                                                                                variant="ghost"
                                                                                                className="size-7"
                                                                                                onClick={() => {
                                                                                                    const lesson =
                                                                                                        lessons.find(
                                                                                                            (
                                                                                                                currentLesson,
                                                                                                            ) =>
                                                                                                                currentLesson.id ===
                                                                                                                topic.id,
                                                                                                        );

                                                                                                    if (
                                                                                                        !lesson
                                                                                                    ) {
                                                                                                        return;
                                                                                                    }

                                                                                                    setEditingTask(
                                                                                                        mapTaskToRow(
                                                                                                            lesson,
                                                                                                            task,
                                                                                                            taskIndex,
                                                                                                        ),
                                                                                                    );
                                                                                                }}
                                                                                            >
                                                                                                <Pencil className="size-3.5" />
                                                                                            </Button>
                                                                                            <Button
                                                                                                type="button"
                                                                                                size="icon"
                                                                                                variant="ghost"
                                                                                                className="size-7 text-destructive hover:text-destructive"
                                                                                                onClick={() => {
                                                                                                    const lesson =
                                                                                                        lessons.find(
                                                                                                            (
                                                                                                                currentLesson,
                                                                                                            ) =>
                                                                                                                currentLesson.id ===
                                                                                                                topic.id,
                                                                                                        );

                                                                                                    if (
                                                                                                        !lesson
                                                                                                    ) {
                                                                                                        return;
                                                                                                    }

                                                                                                    setDeletingTask(
                                                                                                        mapTaskToRow(
                                                                                                            lesson,
                                                                                                            task,
                                                                                                            taskIndex,
                                                                                                        ),
                                                                                                    );
                                                                                                }}
                                                                                            >
                                                                                                <Trash2 className="size-3.5" />
                                                                                            </Button>
                                                                                        </>
                                                                                    ) : null}
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-muted-foreground">
                                                                    No tasks
                                                                    available
                                                                    yet.
                                                                </p>
                                                            )}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                ))}
                                            </Accordion>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Card className="gap-0">
                            {selectedLesson ? (
                                <CardHeader className="mt-4 pb-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <CardTitle className="text-xl tracking-tight">
                                            {role === 'admin' &&
                                            selectedTask &&
                                            !selectedTask.isPublished
                                                ? `${selectedTask.title} (Preview)`
                                                : selectedLesson.title}
                                        </CardTitle>

                                        {role === 'admin' &&
                                        selectedTask &&
                                        !selectedTask.isPublished ? (
                                            <Button
                                                type="button"
                                                disabled={isPublishingTask}
                                                onClick={() => {
                                                    setIsPublishingTask(true);

                                                    router.post(
                                                        publishTask({
                                                            course: serverCourse.slug,
                                                            lesson: selectedLesson.id,
                                                            task: selectedTask.id,
                                                        }),
                                                        {},
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                setNotice(
                                                                    `Task "${selectedTask.title}" published.`,
                                                                );
                                                            },
                                                            onFinish: () => {
                                                                setIsPublishingTask(
                                                                    false,
                                                                );
                                                            },
                                                        },
                                                    );
                                                }}
                                            >
                                                {isPublishingTask
                                                    ? 'Publishing...'
                                                    : 'Publish Task'}
                                            </Button>
                                        ) : null}
                                    </div>
                                </CardHeader>
                            ) : null}

                            <CardContent className="flex flex-col gap-4">
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
                                ) : role === 'learner' &&
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
                                                Create one from the topic panel.
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

                                {role === 'learner' &&
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

                                {role === 'learner' &&
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

            {role === 'admin' ? (
                <Dialog
                    open={isCreateTopicOpen}
                    onOpenChange={(open) => {
                        setIsCreateTopicOpen(open);

                        if (!open) {
                            setTopicTitle('');
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Topic</DialogTitle>
                            <DialogDescription>
                                Create a new lesson topic for this course.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-2">
                            <Label htmlFor="topic-title">Title</Label>
                            <Input
                                id="topic-title"
                                value={topicTitle}
                                onChange={(event) =>
                                    setTopicTitle(event.target.value)
                                }
                                placeholder="Enter topic title"
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsCreateTopicOpen(false);
                                    setTopicTitle('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                disabled={
                                    isCreatingTopic ||
                                    topicTitle.trim().length === 0
                                }
                                onClick={() => {
                                    setIsCreatingTopic(true);

                                    router.post(
                                        storeLesson({
                                            course: serverCourse.slug,
                                        }),
                                        {
                                            title: topicTitle.trim(),
                                        },
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setNotice(
                                                    'Topic created successfully.',
                                                );
                                                setIsCreateTopicOpen(false);
                                                setTopicTitle('');
                                            },
                                            onFinish: () => {
                                                setIsCreatingTopic(false);
                                            },
                                        },
                                    );
                                }}
                            >
                                {isCreatingTopic
                                    ? 'Creating...'
                                    : 'Create Topic'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : null}

            {role === 'admin' ? (
                <TaskFormSheet
                    mode="create"
                    open={isCreateTaskOpen}
                    onOpenChange={setIsCreateTaskOpen}
                    lessonOptions={lessonOptions}
                    selectedLessonId={selectedLesson?.id ?? 0}
                />
            ) : null}

            {role === 'admin' ? (
                <TaskFormSheet
                    mode="edit"
                    open={editingTask !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingTask(null);
                        }
                    }}
                    lessonOptions={lessonOptions}
                    selectedLessonId={selectedLesson?.id ?? 0}
                    task={editingTask}
                />
            ) : null}

            {role === 'admin' ? (
                <Dialog
                    open={editingTopic !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingTopic(null);
                            setTopicEditTitle('');
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Topic</DialogTitle>
                            <DialogDescription>
                                Update topic title for this course.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-topic-title">Title</Label>
                            <Input
                                id="edit-topic-title"
                                value={topicEditTitle}
                                onChange={(event) =>
                                    setTopicEditTitle(event.target.value)
                                }
                                placeholder="Enter topic title"
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setEditingTopic(null);
                                    setTopicEditTitle('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                disabled={
                                    isUpdatingTopic ||
                                    !editingTopic ||
                                    topicEditTitle.trim().length === 0
                                }
                                onClick={() => {
                                    if (!editingTopic) {
                                        return;
                                    }

                                    setIsUpdatingTopic(true);

                                    router.patch(
                                        updateLesson.url({
                                            lesson: editingTopic.id,
                                        }),
                                        {
                                            title: topicEditTitle.trim(),
                                            xp_reward: 50,
                                        },
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setNotice(
                                                    `Topic "${editingTopic.title}" updated.`,
                                                );
                                                setEditingTopic(null);
                                                setTopicEditTitle('');
                                            },
                                            onFinish: () => {
                                                setIsUpdatingTopic(false);
                                            },
                                        },
                                    );
                                }}
                            >
                                {isUpdatingTopic
                                    ? 'Updating...'
                                    : 'Update Topic'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : null}

            {role === 'admin' ? (
                <AlertDialog
                    open={deletingTopic !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeletingTopic(null);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete topic?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => {
                                    if (!deletingTopic) {
                                        return;
                                    }

                                    router.delete(
                                        destroyLesson.url({
                                            lesson: deletingTopic.id,
                                        }),
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setNotice(
                                                    `Topic "${deletingTopic.title}" deleted.`,
                                                );
                                                setDeletingTopic(null);
                                            },
                                        },
                                    );
                                }}
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : null}

            {role === 'admin' ? (
                <AlertDialog
                    open={deletingTask !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeletingTask(null);
                        }
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete task?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => {
                                    if (!deletingTask) {
                                        return;
                                    }

                                    router.delete(
                                        destroyTask.url({
                                            task: deletingTask.id,
                                        }),
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => {
                                                setNotice(
                                                    `Task "${deletingTask.title}" deleted.`,
                                                );
                                                setDeletingTask(null);
                                            },
                                        },
                                    );
                                }}
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : null}
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
