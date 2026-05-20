import { Link, router } from '@inertiajs/react';
import {
    BadgeCheck,
    BookOpen,
    CheckCircle2,
    CircleDashed,
    ClipboardCheck,
    FileQuestion,
    History,
    Layers3,
    ListTree,
    Plus,
    Route,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { index as adminCoursesIndex } from '@/routes/admin/courses';

type BuilderCourseOption = {
    id: number;
    slug: string;
    title: string;
    summary: string | null;
    status: 'draft' | 'published' | 'archived';
    version: number;
    lessons_count: number;
    tasks_count: number;
    assessments_count: number;
};

type BuilderTask = {
    id: number;
    title: string;
    type: string;
    status: 'draft' | 'published' | 'archived';
    version: number;
    estimated_minutes: number | null;
    sort_order: number;
};

type BuilderLesson = {
    id: number;
    title: string;
    description: string;
    position: number;
    status: 'draft' | 'published' | 'archived';
    version: number;
    topic_name: string | null;
    tasks_count: number;
    tasks: BuilderTask[];
};

type BuilderQuestion = {
    id: number;
    question_text: string;
    question_type: string;
    bloom_level: string;
    points: number;
    source_badge: 'From Bank' | 'Local';
};

type BuilderAssessment = {
    id: number;
    title: string;
    description: string | null;
    bloom_level: string;
    grading_type: string;
    status: 'draft' | 'published' | 'archived';
    version: number;
    questions_count: number;
    questions: BuilderQuestion[];
};

type BuilderPayload = {
    courseOptions: BuilderCourseOption[];
    activeCourse:
        | (BuilderCourseOption & {
              cover: string | null;
          })
        | null;
    outline: {
        lessons: BuilderLesson[];
        assessments: BuilderAssessment[];
    };
    readiness: {
        has_course: boolean;
        has_topics: boolean;
        has_tasks: boolean;
        has_assessments: boolean;
        has_questions: boolean;
    };
} | null;

type SelectedItem =
    | { type: 'course'; id: number }
    | { type: 'lesson'; id: number }
    | { type: 'task'; id: number }
    | { type: 'assessment'; id: number };

type SelectedDetail = {
    kind: string;
    title: string;
    description: string | null | undefined;
    status: 'draft' | 'published' | 'archived';
    version: number;
    primaryHref: string;
    primaryLabel: string;
    questions?: BuilderQuestion[];
    questionsCount?: number;
};

type Props = {
    builder: BuilderPayload;
};

const statusLabel: Record<string, string> = {
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
};

function statusVariant(status: string): 'default' | 'outline' | 'secondary' {
    if (status === 'published') {
        return 'default';
    }

    if (status === 'archived') {
        return 'secondary';
    }

    return 'outline';
}

function managementHref(query: Record<string, number | string | undefined>) {
    return adminCoursesIndex.url({ query });
}

export default function AdminCoursesBuilder({ builder }: Props) {
    const [selected, setSelected] = useState<SelectedItem | null>(() => {
        if (!builder?.activeCourse) {
            return null;
        }

        return { type: 'course', id: builder.activeCourse.id };
    });

    const selectedDetail = useMemo<SelectedDetail | null>(() => {
        if (!builder?.activeCourse || !selected) {
            return null;
        }

        if (selected.type === 'course') {
            return {
                kind: 'Course',
                title: builder.activeCourse.title,
                description: builder.activeCourse.summary,
                status: builder.activeCourse.status,
                version: builder.activeCourse.version,
                primaryHref: managementHref({
                    section: 'catalog',
                    course_id: builder.activeCourse.id,
                }),
                primaryLabel: 'Manage Course',
            };
        }

        if (selected.type === 'lesson') {
            const lesson = builder.outline.lessons.find(
                (item) => item.id === selected.id,
            );

            if (!lesson) {
                return null;
            }

            return {
                kind: 'Topic',
                title: lesson.title,
                description: lesson.description,
                status: lesson.status,
                version: lesson.version,
                primaryHref: managementHref({
                    section: 'lesson',
                    course_id: builder.activeCourse.id,
                }),
                primaryLabel: 'Manage Topic',
            };
        }

        if (selected.type === 'task') {
            const task = builder.outline.lessons
                .flatMap((lesson) => lesson.tasks)
                .find((item) => item.id === selected.id);

            if (!task) {
                return null;
            }

            return {
                kind: 'Task',
                title: task.title,
                description: `${task.type} task`,
                status: task.status,
                version: task.version,
                primaryHref: managementHref({
                    section: 'task',
                    course_id: builder.activeCourse.id,
                }),
                primaryLabel: 'Manage Task',
            };
        }

        const assessment = builder.outline.assessments.find(
            (item) => item.id === selected.id,
        );

        if (!assessment) {
            return null;
        }

        return {
            kind: 'Assessment',
            title: assessment.title,
            description: assessment.description,
            status: assessment.status,
            version: assessment.version,
            questions: assessment.questions,
            questionsCount: assessment.questions_count,
            primaryHref: managementHref({
                section: 'assessment',
                course_id: builder.activeCourse.id,
                assessment_id: assessment.id,
            }),
            primaryLabel: 'Manage Assessment',
        };
    }, [builder, selected]);

    const readinessItems = builder
        ? [
              ['Course', builder.readiness.has_course],
              ['Topic', builder.readiness.has_topics],
              ['Task', builder.readiness.has_tasks],
              ['Assessment', builder.readiness.has_assessments],
              ['Question', builder.readiness.has_questions],
          ]
        : [];

    if (!builder?.activeCourse) {
        return (
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex min-w-0 flex-col gap-1">
        <TypographyH1>Course Builder</TypographyH1>
        <TypographyMuted>Build courses from the main outline.</TypographyMuted>
    </div>
    <div className="flex shrink-0 items-center justify-end gap-2">
        <Button asChild>
                        <Link href={managementHref({ section: 'catalog' })}>
                            <Plus data-icon="inline-start" />
                            Add Course
                        </Link>
                    </Button>
    </div>
</header>       );
    }

    const activeCourse = builder.activeCourse;

    return (
        <div className="grid gap-5">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex min-w-0 flex-col gap-1">
        <TypographyH1>Course Builder</TypographyH1>
        <TypographyMuted>One outline to build courses, topics, tasks, assessments, questions, and history.</TypographyMuted>
    </div>
    <div className="flex shrink-0 items-center justify-end gap-2">
        <>
                        <Button asChild>
                            <Link href={managementHref({ section: 'catalog' })}>
                                <Plus data-icon="inline-start" />
                                Add Course
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={managementHref({ section: 'catalog' })}>
                                Table View
                            </Link>
                        </Button>
                    </>
    </div>
</header>            <section className="grid gap-3 rounded-lg border bg-card p-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-lg font-semibold">
                                {activeCourse.title}
                            </h2>
                            <Badge variant={statusVariant(activeCourse.status)}>
                                {statusLabel[activeCourse.status]}
                            </Badge>
                            <Badge variant="outline">
                                v{activeCourse.version}
                            </Badge>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {activeCourse.summary ||
                                'Belum ada ringkasan course.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {builder.courseOptions.map((course) => (
                            <Button
                                key={course.id}
                                size="sm"
                                variant={
                                    course.id === activeCourse.id
                                        ? 'default'
                                        : 'outline'
                                }
                                onClick={() =>
                                    router.get(
                                        managementHref({
                                            builder: 1,
                                            course_id: course.id,
                                        }),
                                    )
                                }
                            >
                                {course.title}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-5">
                    {readinessItems.map(([label, complete]) => (
                        <div
                            key={String(label)}
                            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                        >
                            {complete ? (
                                <CheckCircle2 className="size-4 text-primary" />
                            ) : (
                                <CircleDashed className="size-4 text-muted-foreground" />
                            )}
                            <span>{label}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
                <div className="rounded-lg border bg-card">
                    <div className="border-b p-4">
                        <div className="flex items-center gap-2 font-semibold">
                            <ListTree className="size-4" />
                            Outline
                        </div>
                    </div>
                    <div className="grid gap-1 p-2">
                        <button
                            type="button"
                            onClick={() =>
                                setSelected({
                                    type: 'course',
                                    id: activeCourse.id,
                                })
                            }
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                            <BookOpen className="size-4" />
                            <span className="min-w-0 flex-1 truncate">
                                {activeCourse.title}
                            </span>
                        </button>

                        {builder.outline.lessons.map((lesson) => (
                            <div key={lesson.id} className="grid gap-1">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelected({
                                            type: 'lesson',
                                            id: lesson.id,
                                        })
                                    }
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                                >
                                    <Layers3 className="size-4" />
                                    <span className="min-w-0 flex-1 truncate">
                                        {lesson.title}
                                    </span>
                                    <Badge variant="outline">
                                        {lesson.tasks_count}
                                    </Badge>
                                </button>

                                {lesson.tasks.map((task) => (
                                    <button
                                        key={task.id}
                                        type="button"
                                        onClick={() =>
                                            setSelected({
                                                type: 'task',
                                                id: task.id,
                                            })
                                        }
                                        className="ml-6 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <Route className="size-4" />
                                        <span className="min-w-0 flex-1 truncate">
                                            {task.title}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ))}

                        {builder.outline.assessments.map((assessment) => (
                            <button
                                key={assessment.id}
                                type="button"
                                onClick={() =>
                                    setSelected({
                                        type: 'assessment',
                                        id: assessment.id,
                                    })
                                }
                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                            >
                                <ClipboardCheck className="size-4" />
                                <span className="min-w-0 flex-1 truncate">
                                    {assessment.title}
                                </span>
                                <Badge variant="outline">
                                    {assessment.questions_count}
                                </Badge>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-4">
                    {selectedDetail ? (
                        <div className="grid gap-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="secondary">
                                            {selectedDetail.kind}
                                        </Badge>
                                        <Badge
                                            variant={statusVariant(
                                                selectedDetail.status,
                                            )}
                                        >
                                            {statusLabel[selectedDetail.status]}
                                        </Badge>
                                        <Badge variant="outline">
                                            v{selectedDetail.version}
                                        </Badge>
                                    </div>
                                    <h3 className="mt-3 text-xl font-semibold">
                                        {selectedDetail.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {selectedDetail.description ||
                                            'Belum ada deskripsi.'}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button asChild>
                                        <Link href={selectedDetail.primaryHref}>
                                            {selectedDetail.primaryLabel}
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href={selectedDetail.primaryHref}>
                                            <History data-icon="inline-start" />
                                            History
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            {selectedDetail.kind === 'Assessment' ? (
                                <div className="grid gap-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="font-medium">
                                            Question Builder
                                        </div>
                                        <Button size="sm" asChild>
                                            <Link
                                                href={
                                                    selectedDetail.primaryHref
                                                }
                                            >
                                                <FileQuestion data-icon="inline-start" />
                                                Manage Questions
                                            </Link>
                                        </Button>
                                    </div>

                                    {selectedDetail.questions &&
                                    selectedDetail.questions.length > 0 ? (
                                        <div className="grid gap-2">
                                            {selectedDetail.questions.map(
                                                (question) => (
                                                    <div
                                                        key={question.id}
                                                        className="rounded-md border p-3"
                                                    >
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <Badge variant="outline">
                                                                {
                                                                    question.source_badge
                                                                }
                                                            </Badge>
                                                            <Badge variant="outline">
                                                                {
                                                                    question.bloom_level
                                                                }
                                                            </Badge>
                                                            <Badge variant="outline">
                                                                {
                                                                    question.question_type
                                                                }
                                                            </Badge>
                                                        </div>
                                                        <p className="mt-2 text-sm">
                                                            {
                                                                question.question_text
                                                            }
                                                        </p>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                                            This assessment has no questions yet.
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            <div className="grid gap-2 rounded-md border p-3">
                                <div className="flex items-center gap-2 font-medium">
                                    <BadgeCheck className="size-4" />
                                    Next best action
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Use the left outline to select items.
                                    Use the manage button to enter the full editor
                                    without losing course context.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                            Select an item from the outline to start managing.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
