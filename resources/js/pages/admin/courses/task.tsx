import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronDown, Download, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { CourseRow, LessonRow, Paginated, TaskRow } from '@/components/course-types';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { toast } from 'sonner';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import { destroy as tasksDestroy } from '@/routes/admin/courses/tasks';
import { reorder as tasksReorder } from '@/routes/admin/courses/tasks';
import { store as tasksStore } from '@/routes/admin/courses/tasks';

type Props = {
    tasks: Paginated<TaskRow>;
    lessons: Paginated<LessonRow>;
    courseOptions: Pick<CourseRow, 'id' | 'title'>[];
    selectedCourseId: number;
    selectedLessonId: number;
};

function formatTaskCode(order: number): string {
    return `TSK-${String(order).padStart(4, '0')}`;
}

type QuizImportQuestion = {
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: number;
    explanation: string;
};

const QUIZ_IMPORT_TEMPLATE_HEADER = 'question,option_a,option_b,option_c,option_d,correct_option,explanation';
const QUIZ_IMPORT_TEMPLATE_ROW = 'What does CIA stand for?,Confidentiality,Integrity,Availability,All of the above,3,Core information security triad.';

function downloadQuizTemplate(kind: 'csv' | 'xlsx' | 'xls'): void {
    const delimiter = kind === 'xls' ? '\t' : ',';
    const extension = kind;
    const fileName = `quiz-template.${extension}`;
    const content = `${QUIZ_IMPORT_TEMPLATE_HEADER.replaceAll(',', delimiter)}\n${QUIZ_IMPORT_TEMPLATE_ROW.replaceAll(',', delimiter)}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function normalizeDelimiter(text: string): ',' | ';' | '\t' {
    const firstLine = text.split(/\r?\n/).find((line) => line.trim() !== '') ?? '';
    if (firstLine.includes('\t')) {
        return '\t';
    }

    if (firstLine.includes(';')) {
        return ';';
    }

    return ',';
}

function parseQuizImportText(text: string): QuizImportQuestion[] {
    const delimiter = normalizeDelimiter(text);
    const rows = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line !== '');

    if (rows.length < 2) {
        return [];
    }

    const header = rows[0].split(delimiter).map((column) => column.trim().toLowerCase());
    const requiredColumns = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option'];
    const missingColumn = requiredColumns.find((column) => !header.includes(column));

    if (missingColumn) {
        throw new Error('Template header tidak sesuai. Gunakan template download.');
    }

    const getIndex = (column: string) => header.indexOf(column);

    return rows.slice(1).map((row) => {
        const columns = row.split(delimiter).map((column) => column.trim());
        const rawCorrectOption = Number(columns[getIndex('correct_option')] ?? 0);
        const normalizedCorrectOption = Number.isNaN(rawCorrectOption)
            ? 0
            : (rawCorrectOption > 0 ? rawCorrectOption - 1 : rawCorrectOption);

        return {
            question: columns[getIndex('question')] ?? '',
            optionA: columns[getIndex('option_a')] ?? '',
            optionB: columns[getIndex('option_b')] ?? '',
            optionC: columns[getIndex('option_c')] ?? '',
            optionD: columns[getIndex('option_d')] ?? '',
            correctOption: Math.min(Math.max(normalizedCorrectOption, 0), 3),
            explanation: columns[getIndex('explanation')] ?? '',
        };
    }).filter((row) => row.question !== '');
}

export default function AdminCoursesTask({
    tasks,
    lessons,
    courseOptions,
    selectedCourseId,
    selectedLessonId,
}: Props) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [filterValue, setFilterValue] = useState('');
    const [rows, setRows] = useState<TaskRow[]>(tasks.data);
    const [dragHandleActiveRowId, setDragHandleActiveRowId] = useState<string | null>(null);
    const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
    const [isSavingTask, setIsSavingTask] = useState(false);
    const [quizImportFileName, setQuizImportFileName] = useState('');
    const [quizQuestions, setQuizQuestions] = useState<QuizImportQuestion[]>([]);
    const [taskForm, setTaskForm] = useState({
        lesson_id: selectedLessonId || 0,
        title: '',
        description: '',
        type: 'video' as 'video' | 'read' | 'quiz',
        video_url: '',
        document: null as File | null,
    });

    useEffect(() => {
        setRows(tasks.data);
    }, [tasks.data]);

    useEffect(() => {
        if (selectedLessonId > 0) {
            setTaskForm((current) => ({ ...current, lesson_id: selectedLessonId }));
        }
    }, [selectedLessonId]);

    const taskTitleHasError = Boolean(errors.title);
    const taskDescriptionHasError = Boolean(errors.description);
    const taskLessonHasError = Boolean(errors.lesson_id);
    const taskTypeHasError = Boolean(errors.type);
    const taskVideoUrlHasError = Boolean(errors.video_url);
    const taskDocumentHasError = Boolean(errors.document);
    const taskQuizQuestionsHasError = Boolean(errors.quiz_questions);

    const resetTaskForm = () => {
        setTaskForm({
            lesson_id: selectedLessonId || lessonOptions[0]?.id || 0,
            title: '',
            description: '',
            type: 'video',
            video_url: '',
            document: null,
        });
        setQuizImportFileName('');
        setQuizQuestions([]);
    };

    const filteredTasks = useMemo(() => {
        const keyword = filterValue.trim().toLowerCase();

        if (keyword === '') {
            return rows;
        }

        return rows.filter((task) => {
            return task.title.toLowerCase().includes(keyword)
                || task.type.toLowerCase().includes(keyword)
                || task.lesson_title.toLowerCase().includes(keyword);
        });
    }, [filterValue, rows]);

    const reorderRows = (sourceRowId: string, targetRowId: string) => {
        if (sourceRowId === targetRowId) {
            return;
        }

        setRows((currentRows) => {
            const sourceIndex = currentRows.findIndex((row) => String(row.id) === sourceRowId);
            const targetIndex = currentRows.findIndex((row) => String(row.id) === targetRowId);

            if (sourceIndex < 0 || targetIndex < 0) {
                return currentRows;
            }

            const nextRows = [...currentRows];
            const [movedRow] = nextRows.splice(sourceIndex, 1);
            nextRows.splice(targetIndex, 0, movedRow);

            const reorderableRows = nextRows.filter((row) => !(row.is_legacy ?? row.id <= 0));

            if (reorderableRows.length === nextRows.length) {
                const startSortOrder = Math.max((tasks.from ?? 1), 1);
                router.post(tasksReorder.url(), {
                    items: nextRows.map((row, index) => ({
                        id: row.id,
                        sort_order: startSortOrder + index,
                    })),
                }, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            }

            return nextRows;
        });
    };

    const lessonOptions = useMemo(
        () => lessons.data.filter((lesson) => lesson.course_id === selectedCourseId),
        [lessons.data, selectedCourseId],
    );

    const lessonComboboxOptions = useMemo(
        () => lessons.data.map((lesson) => ({ value: String(lesson.id), label: lesson.title })),
        [lessons.data],
    );

    const courseComboboxOptions = useMemo(
        () => courseOptions.map((course) => ({ value: String(course.id), label: course.title })),
        [courseOptions],
    );

    const lessonCourseMap = useMemo(
        () => Object.fromEntries(lessons.data.map((lesson) => [lesson.id, lesson.course_id])),
        [lessons.data],
    );

    const columns = useMemo<ColumnDef<TaskRow>[]>(() => [
        {
            id: 'drag',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <button
                        type="button"
                        data-row-drag-handle="true"
                        aria-label={`Drag row ${formatTaskCode(row.index + 1)}`}
                        onMouseDown={() => setDragHandleActiveRowId(String(row.original.id))}
                        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
                        style={{ cursor: 'grab' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                            <circle cx="3" cy="3" r="1" />
                            <circle cx="7" cy="3" r="1" />
                            <circle cx="11" cy="3" r="1" />
                            <circle cx="3" cy="7" r="1" />
                            <circle cx="7" cy="7" r="1" />
                            <circle cx="11" cy="7" r="1" />
                        </svg>
                    </button>
                </div>
            ),
        },
        {
            accessorKey: 'title',
            header: 'Task',
            cell: ({ row }) => <p className="text-left font-medium">{row.original.title}</p>,
        },
        {
            accessorKey: 'type',
            header: 'Type',
            cell: ({ row }) => <span className="uppercase">{row.original.type}</span>,
        },
        {
            accessorKey: 'lesson_title',
            header: 'Topic',
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                if (row.original.is_legacy ?? row.original.id <= 0) {
                    return (
                        <div className="text-center text-sm text-muted-foreground">
                            Legacy
                        </div>
                    );
                }

                return (
                    <div className="flex justify-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" size="icon">
                                    <MoreHorizontal />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => {
                                        router.delete(tasksDestroy.url({ task: row.original.id }), {
                                            preserveScroll: true,
                                        });
                                    }}
                                >
                                    <Trash2 data-icon="inline-start" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ], []);

    const handlePageChange = (nextPage: number): void => {
        router.get(
            adminCoursesIndex.url({
                query: {
                    section: 'task',
                    course_id: selectedCourseId,
                    lesson_id: selectedLessonId || lessonOptions[0]?.id,
                    page: nextPage,
                    per_page: tasks.per_page,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePageSizeChange = (nextPageSize: number): void => {
        router.get(
            adminCoursesIndex.url({
                query: {
                    section: 'task',
                    course_id: selectedCourseId,
                    lesson_id: selectedLessonId || lessonOptions[0]?.id,
                    page: 1,
                    per_page: nextPageSize,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <div className="flex flex-col gap-6 px-4 py-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-0">
                    <TypographyH1>Course Task Management</TypographyH1>
                    <TypographyMuted className="text-sm/6">
                        Manage all tasks under each topic with a dedicated table workflow.
                    </TypographyMuted>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <Select
                        value={String(selectedCourseId)}
                        onValueChange={(value) => {
                            const nextCourseId = Number(value);
                            const firstLesson = lessons.data.find((lesson) => lesson.course_id === nextCourseId);

                            router.get(
                                adminCoursesIndex.url({ query: { section: 'task', course_id: nextCourseId, lesson_id: firstLesson?.id, page: 1, per_page: tasks.per_page } }),
                                {},
                                { preserveState: true, preserveScroll: true },
                            );
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-56">
                            <SelectValue placeholder="Select title" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {courseOptions.map((course) => (
                                    <SelectItem key={course.id} value={String(course.id)}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Select
                        value={String(selectedLessonId || lessonOptions[0]?.id || '')}
                        onValueChange={(value) => {
                            router.get(
                                adminCoursesIndex.url({ query: { section: 'task', course_id: selectedCourseId, lesson_id: Number(value), page: 1, per_page: tasks.per_page } }),
                                {},
                                { preserveState: true, preserveScroll: true },
                            );
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-64">
                            <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {lessonOptions.map((lesson) => (
                                    <SelectItem key={lesson.id} value={String(lesson.id)}>
                                        {lesson.title}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <div className="w-full sm:w-80">
                        <Input
                            id="task-search"
                            placeholder="Search Task..."
                            value={filterValue}
                            onChange={(event) => setFilterValue(event.target.value)}
                        />
                    </div>

                    <Dialog
                        open={createTaskDialogOpen}
                        onOpenChange={(open) => {
                            setCreateTaskDialogOpen(open);

                            if (!open && !isSavingTask) {
                                resetTaskForm();
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button type="button" onClick={() => setCreateTaskDialogOpen(true)}>
                                <Plus data-icon="inline-start" />
                                Create Task
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-sm *:data-[slot=dialog-close]:top-6 *:data-[slot=dialog-close]:right-6">
                            <form
                                className="flex flex-col gap-5"
                                encType="multipart/form-data"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const payload = new FormData();
                                    payload.append('lesson_id', String(taskForm.lesson_id));
                                    payload.append('title', taskForm.title);
                                    payload.append('description', taskForm.description);
                                    payload.append('type', taskForm.type);
                                    payload.append('minutes', '10');

                                    if (taskForm.type === 'video') {
                                        payload.append('video_url', taskForm.video_url);
                                    }

                                    if (taskForm.type === 'read' && taskForm.document) {
                                        payload.append('document', taskForm.document);
                                    }

                                    if (taskForm.type === 'quiz') {
                                        if (quizQuestions.length === 0) {
                                            toast.error('Import quiz question terlebih dahulu.');
                                            return;
                                        }

                                        quizQuestions.forEach((question, index) => {
                                            payload.append(`quiz_questions[${index}][question]`, question.question);
                                            payload.append(`quiz_questions[${index}][options][0]`, question.optionA);
                                            payload.append(`quiz_questions[${index}][options][1]`, question.optionB);
                                            payload.append(`quiz_questions[${index}][options][2]`, question.optionC);
                                            payload.append(`quiz_questions[${index}][options][3]`, question.optionD);
                                            payload.append(`quiz_questions[${index}][correct_option]`, String(question.correctOption));
                                            payload.append(`quiz_questions[${index}][explanation]`, question.explanation);
                                        });
                                    }

                                    router.post(tasksStore.url(), payload, {
                                        forceFormData: true,
                                        preserveScroll: true,
                                        preserveState: true,
                                        onStart: () => setIsSavingTask(true),
                                        onSuccess: () => {
                                            toast.success('Task created successfully.');
                                            resetTaskForm();
                                            setCreateTaskDialogOpen(false);
                                        },
                                        onFinish: () => setIsSavingTask(false),
                                    });
                                }}
                            >
                                <DialogHeader className="pr-10">
                                    <DialogTitle>Create task</DialogTitle>
                                    <DialogDescription>
                                        Add a new task under the selected topic.
                                    </DialogDescription>
                                </DialogHeader>

                                <FieldGroup className="gap-3">
                                    <Field className="gap-2" data-invalid={taskLessonHasError || undefined}>
                                        <FieldLabel htmlFor="task-lesson">
                                            Topic <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <Select
                                            value={String(taskForm.lesson_id)}
                                            onValueChange={(value) => {
                                                setTaskForm((current) => ({ ...current, lesson_id: Number(value) }));
                                            }}
                                        >
                                            <SelectTrigger id="task-lesson" aria-invalid={taskLessonHasError}>
                                                <SelectValue placeholder="Select topic" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {lessonOptions.map((lesson) => (
                                                        <SelectItem key={lesson.id} value={String(lesson.id)}>
                                                            {lesson.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {taskLessonHasError && (
                                            <FieldDescription className="text-destructive">{errors.lesson_id}</FieldDescription>
                                        )}
                                    </Field>

                                    <Field className="gap-2" data-invalid={taskTitleHasError || undefined}>
                                        <FieldLabel htmlFor="task-title">
                                            Title <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <Input
                                            id="task-title"
                                            name="title"
                                            placeholder="Enter task title"
                                            value={taskForm.title}
                                            onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                                            aria-invalid={taskTitleHasError}
                                            required
                                        />
                                        {taskTitleHasError && (
                                            <FieldDescription className="text-destructive">{errors.title}</FieldDescription>
                                        )}
                                    </Field>

                                    <Field className="gap-2" data-invalid={taskDescriptionHasError || undefined}>
                                        <FieldLabel htmlFor="task-description">
                                            Description <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <Textarea
                                            id="task-description"
                                            name="description"
                                            placeholder="Enter task description"
                                            value={taskForm.description}
                                            onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
                                            aria-invalid={taskDescriptionHasError}
                                            rows={3}
                                            required
                                        />
                                        {taskDescriptionHasError && (
                                            <FieldDescription className="text-destructive">{errors.description}</FieldDescription>
                                        )}
                                    </Field>

                                    <Field className="gap-2" data-invalid={taskTypeHasError || undefined}>
                                        <FieldLabel htmlFor="task-type">
                                            Type <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <Select
                                            value={taskForm.type}
                                            onValueChange={(value) => {
                                                setTaskForm((current) => ({
                                                    ...current,
                                                    type: value as 'video' | 'read' | 'quiz',
                                                    video_url: value === 'video' ? current.video_url : '',
                                                    document: value === 'read' ? current.document : null,
                                                }));
                                            }}
                                        >
                                            <SelectTrigger id="task-type" aria-invalid={taskTypeHasError}>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value="video">Video</SelectItem>
                                                    <SelectItem value="read">Read</SelectItem>
                                                    <SelectItem value="quiz">Quiz</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {taskTypeHasError && (
                                            <FieldDescription className="text-destructive">{errors.type}</FieldDescription>
                                        )}
                                    </Field>
                                    {taskForm.type === 'video' && (
                                        <Field className="gap-2" data-invalid={taskVideoUrlHasError || undefined}>
                                            <FieldLabel htmlFor="task-video-url">
                                                Video URL <span className="text-destructive">*</span>
                                            </FieldLabel>
                                            <Input
                                                id="task-video-url"
                                                name="video_url"
                                                type="url"
                                                placeholder="https://..."
                                                value={taskForm.video_url}
                                                onChange={(event) => setTaskForm((current) => ({ ...current, video_url: event.target.value }))}
                                                aria-invalid={taskVideoUrlHasError}
                                                required
                                            />
                                            {taskVideoUrlHasError && (
                                                <FieldDescription className="text-destructive">{errors.video_url}</FieldDescription>
                                            )}
                                        </Field>
                                    )}

                                    {taskForm.type === 'read' && (
                                        <Field className="gap-2" data-invalid={taskDocumentHasError || undefined}>
                                            <FieldLabel htmlFor="task-document">
                                                Document <span className="text-destructive">*</span>
                                            </FieldLabel>
                                            <Input
                                                id="task-document"
                                                name="document"
                                                type="file"
                                                accept=".pdf,.doc,.docx,.txt"
                                                aria-invalid={taskDocumentHasError}
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0] ?? null;
                                                    setTaskForm((current) => ({ ...current, document: file }));
                                                }}
                                                required
                                            />
                                            {taskDocumentHasError && (
                                                <FieldDescription className="text-destructive">{errors.document}</FieldDescription>
                                            )}
                                        </Field>
                                    )}

                                    {taskForm.type === 'quiz' && (
                                        <>
                                            <Field className="gap-2" data-invalid={taskQuizQuestionsHasError || undefined}>
                                                <FieldLabel htmlFor="task-quiz-import">
                                                    Import Questions <span className="text-destructive">*</span>
                                                </FieldLabel>
                                                <Input
                                                    id="task-quiz-import"
                                                    type="file"
                                                    accept=".csv,.xlsx,.xls"
                                                    aria-invalid={taskQuizQuestionsHasError}
                                                    onChange={async (event) => {
                                                        const selectedFile = event.target.files?.[0] ?? null;

                                                        if (!selectedFile) {
                                                            setQuizImportFileName('');
                                                            setQuizQuestions([]);
                                                            return;
                                                        }

                                                        try {
                                                            const text = await selectedFile.text();
                                                            const parsedRows = parseQuizImportText(text);

                                                            if (parsedRows.length === 0) {
                                                                toast.error('Tidak ada data question yang dapat diimport.');
                                                                return;
                                                            }

                                                            setQuizQuestions(parsedRows);
                                                            setQuizImportFileName(selectedFile.name);
                                                            toast.success(`${parsedRows.length} question berhasil diimport.`);
                                                        } catch {
                                                            toast.error('Gagal membaca file. Gunakan template CSV/Excel dari tombol template.');
                                                        }
                                                    }}
                                                    required
                                                />
                                                {taskQuizQuestionsHasError && (
                                                    <FieldDescription className="text-destructive">{errors.quiz_questions}</FieldDescription>
                                                )}
                                                <FieldDescription>
                                                    Import melalui CSV, Excel baru (.xlsx), atau Excel lama (.xls).
                                                </FieldDescription>
                                                {quizImportFileName !== '' && (
                                                    <FieldDescription>
                                                        File: {quizImportFileName} ({quizQuestions.length} questions)
                                                    </FieldDescription>
                                                )}
                                            </Field>

                                            <Field className="gap-2">
                                                <FieldLabel>Template</FieldLabel>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button type="button" variant="outline" className="w-full justify-center">
                                                            <Download data-icon="inline-start" />
                                                            Download template
                                                            <ChevronDown data-icon="inline-end" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
                                                        <DropdownMenuItem onClick={() => downloadQuizTemplate('csv')}>
                                                            CSV Template
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => downloadQuizTemplate('xlsx')}>
                                                            Excel Baru (.xlsx)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => downloadQuizTemplate('xls')}>
                                                            Excel Lama (.xls)
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </Field>
                                        </>
                                    )}
                                </FieldGroup>

                                <DialogFooter className="pt-1">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" disabled={isSavingTask}>Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isSavingTask}>
                                        {isSavingTask && <Spinner data-icon="inline-start" />}
                                        Save changes
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <section className="grid gap-4">
                <div className="flex flex-col gap-4">
                    {filteredTasks.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Search />
                                </EmptyMedia>
                                <EmptyTitle>No task found</EmptyTitle>
                                <EmptyDescription>
                                    Select another topic or search with another keyword.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredTasks}
                            centered
                            showFilterInput={false}
                            showColumnToggle={false}
                            showPageInfo={false}
                            enableDefaultIdSort={false}
                            getRowDataId={(row) => String(row.id)}
                            dragHandleActiveRowId={dragHandleActiveRowId}
                            onRowDrop={(sourceRowId, targetRowId) => {
                                reorderRows(sourceRowId, targetRowId);
                            }}
                            onRowDragEnd={() => {
                                setDragHandleActiveRowId(null);
                            }}
                            page={tasks.current_page}
                            pageCount={tasks.last_page}
                            pageSize={tasks.per_page}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                            footerInfo={`Showing ${tasks.from ?? 0} - ${tasks.to ?? 0} of ${tasks.total} Tasks`}
                        />
                    )}
                </div>
            </section>
        </div>
    );
}
