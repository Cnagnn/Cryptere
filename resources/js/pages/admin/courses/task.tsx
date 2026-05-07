import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Archive,
    ArrowRightLeft,
    BadgeCheck,
    BookOpen,
    Check,
    ChevronsUpDown,
    CircleDashed,
    CircleHelp,
    Download,
    Eye,
    MoreHorizontal,
    Pencil,
    Play,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
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
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import { destroy as tasksDestroy } from '@/routes/admin/courses/tasks';
import { reorder as tasksReorder } from '@/routes/admin/courses/tasks';
import { store as tasksStore } from '@/routes/admin/courses/tasks';
import { update as tasksUpdate } from '@/routes/admin/courses/tasks';
import type { Paginated } from '@/types';
import type { CourseRow, LessonRow, TaskRow } from '@/types/course-management';

type ContentStatus = 'draft' | 'published' | 'archived';

function StatusBadge({ status, className }: { status: ContentStatus; className?: string }) {
    const config = {
        draft: {
            icon: CircleDashed,
            label: 'Draf',
            variant: 'outline' as const,
            iconClass: 'text-amber-500',
        },
        published: {
            icon: BadgeCheck,
            label: 'Diterbitkan',
            variant: 'outline' as const,
            iconClass: 'text-emerald-500',
        },
        archived: {
            icon: Archive,
            label: 'Diarsipkan',
            variant: 'destructive' as const,
            iconClass: 'text-red-500',
        },
    };

    const { icon: Icon, label, variant, iconClass } = config[status];

    return (
        <Badge variant={variant} className={className}>
            <Icon className={iconClass} />
            {label}
        </Badge>
    );
}

type LessonOption = { id: number; course_id: number; title: string };

type Props = {
    tasks: Paginated<TaskRow>;
    lessons: Paginated<LessonRow>;
    allLessons: LessonOption[];
    courseOptions: Pick<CourseRow, 'id' | 'title'>[];
    selectedCourseId: number;
    selectedLessonId: number;
};

function formatTaskCode(order: number): string {
    return `TSK-${String(order).padStart(4, '0')}`;
}

type QuizQuestion = {
    question: string;
    options: [string, string, string, string];
    correct_option: number;
    explanation: string;
};

const QUIZ_IMPORT_TEMPLATE_HEADER =
    'question,option_a,option_b,option_c,option_d,correct_option,explanation';
const QUIZ_IMPORT_TEMPLATE_ROW =
    'What does CIA stand for?,Confidentiality,Integrity,Availability,All of the above,3,Core information security triad.';

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
    const firstLine =
        text.split(/\r?\n/).find((line) => line.trim() !== '') ?? '';

    if (firstLine.includes('\t')) {
        return '\t';
    }

    if (firstLine.includes(';')) {
        return ';';
    }

    return ',';
}

function parseQuizImportText(text: string): QuizQuestion[] {
    const delimiter = normalizeDelimiter(text);
    const rows = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line !== '');

    if (rows.length < 2) {
        return [];
    }

    const header = rows[0]
        .split(delimiter)
        .map((column) => column.trim().toLowerCase());
    const requiredColumns = [
        'question',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_option',
    ];
    const missingColumn = requiredColumns.find(
        (column) => !header.includes(column),
    );

    if (missingColumn) {
        throw new Error(
            'Template header tidak sesuai. Gunakan template download.',
        );
    }

    const getIndex = (column: string) => header.indexOf(column);

    return rows
        .slice(1)
        .map((row) => {
            const columns = row.split(delimiter).map((column) => column.trim());
            const rawCorrectOption = Number(
                columns[getIndex('correct_option')] ?? 0,
            );
            const normalizedCorrectOption = Number.isNaN(rawCorrectOption)
                ? 0
                : rawCorrectOption > 0
                  ? rawCorrectOption - 1
                  : rawCorrectOption;

            return {
                question: columns[getIndex('question')] ?? '',
                options: [
                    columns[getIndex('option_a')] ?? '',
                    columns[getIndex('option_b')] ?? '',
                    columns[getIndex('option_c')] ?? '',
                    columns[getIndex('option_d')] ?? '',
                ] as [string, string, string, string],
                correct_option: Math.min(
                    Math.max(normalizedCorrectOption, 0),
                    3,
                ),
                explanation: columns[getIndex('explanation')] ?? '',
            };
        })
        .filter((row) => row.question !== '');
}

export default function AdminCoursesTask({
    tasks,
    lessons,
    allLessons,
    courseOptions,
    selectedCourseId,
    selectedLessonId,
}: Props) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [filterValue, setFilterValue] = useState('');
    const [rows, setRows] = useState<TaskRow[]>(() => tasks.data);
    const [dragHandleActiveRowId, setDragHandleActiveRowId] = useState<
        string | null
    >(null);
    const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
    const [isSavingTask, setIsSavingTask] = useState(false);
    const isEditMode = editingTask !== null;
    const [topicComboboxOpen, setTopicComboboxOpen] = useState(false);
    const [quizImportFileName, setQuizImportFileName] = useState('');
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

    // Question editor state
    const [questionEditorOpen, setQuestionEditorOpen] = useState(false);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
    const [questionForm, setQuestionForm] = useState<QuizQuestion>({
        question: '',
        options: ['', '', '', ''],
        correct_option: 0,
        explanation: '',
    });

    const lessonOptions = lessons.data.filter(
        (lesson) => lesson.course_id === selectedCourseId,
    );

    const [taskForm, setTaskForm] = useState({
        lesson_id: selectedLessonId || lessonOptions[0]?.id || 0,
        title: '',
        description: '',
        type: 'video' as 'video' | 'read' | 'quiz',
        video_url: '',
        estimated_minutes: '',
        prerequisite_task_id: '',
        status: 'draft' as 'draft' | 'published' | 'archived',
        document: null as File | null,
    });

    const taskTitleHasError = Boolean(errors.title);
    const taskDescriptionHasError = Boolean(errors.description);
    const taskLessonHasError = Boolean(errors.lesson_id);
    const taskTypeHasError = Boolean(errors.type);
    const taskVideoUrlHasError = Boolean(errors.video_url);
    const taskDocumentHasError = Boolean(errors.document);
    const taskQuizQuestionsHasError = Boolean(errors.quiz_questions);

    const resetTaskForm = () => {
        setEditingTask(null);
        setTaskForm({
            lesson_id: selectedLessonId || lessonOptions[0]?.id || 0,
            title: '',
            description: '',
            type: 'video',
            video_url: '',
            estimated_minutes: '',
            prerequisite_task_id: '',
            status: 'draft',
            document: null,
        });
        setQuizImportFileName('');
        setQuizQuestions([]);
    };

    const openEditTaskDialog = (task: TaskRow) => {
        setEditingTask(task);
        setTaskForm({
            lesson_id: task.lesson_id,
            title: task.title,
            description: task.description,
            type: task.type as 'video' | 'read' | 'quiz',
            video_url: task.video_url ?? '',
            estimated_minutes:
                task.estimated_minutes != null
                    ? String(task.estimated_minutes)
                    : '',
            prerequisite_task_id:
                task.prerequisite_task_id != null
                    ? String(task.prerequisite_task_id)
                    : '',
            status: task.status || 'draft',
            document: null,
        });
        setQuizImportFileName('');
        setQuizQuestions(
            (task.quiz_questions ?? []).map((q) => ({
                question: q.question,
                options: q.options as [string, string, string, string],
                correct_option: q.correct_option,
                explanation: q.explanation,
            })),
        );
        setCreateTaskDialogOpen(true);
    };

    const filteredTasks = useMemo(() => {
        const keyword = filterValue.trim().toLowerCase();

        if (keyword === '') {
            return rows;
        }

        return rows.filter((task) => {
            return (
                task.title.toLowerCase().includes(keyword) ||
                task.type.toLowerCase().includes(keyword) ||
                task.lesson_title.toLowerCase().includes(keyword)
            );
        });
    }, [filterValue, rows]);

    // Question editor handlers
    const openQuestionEditor = (index?: number) => {
        if (index !== undefined) {
            setEditingQuestionIndex(index);
            setQuestionForm(quizQuestions[index]);
        } else {
            setEditingQuestionIndex(null);
            setQuestionForm({
                question: '',
                options: ['', '', '', ''],
                correct_option: 0,
                explanation: '',
            });
        }

        setQuestionEditorOpen(true);
    };

    const saveQuestion = () => {
        if (!questionForm.question.trim()) {
            toast.error('Pertanyaan tidak boleh kosong.');

            return;
        }

        if (questionForm.options.some(opt => !opt.trim())) {
            toast.error('Semua opsi harus diisi.');

            return;
        }

        if (editingQuestionIndex !== null) {
            // Edit existing
            setQuizQuestions(prev => {
                const updated = [...prev];
                updated[editingQuestionIndex] = questionForm;

                return updated;
            });
            toast.success('Pertanyaan berhasil diperbarui.');
        } else {
            // Add new
            setQuizQuestions(prev => [...prev, questionForm]);
            toast.success('Pertanyaan berhasil ditambahkan.');
        }

        setQuestionEditorOpen(false);
    };

    const deleteQuestion = (index: number) => {
        if (!confirm('Hapus pertanyaan ini?')) {
            return;
        }

        setQuizQuestions(prev => prev.filter((_, i) => i !== index));
        toast.success('Pertanyaan berhasil dihapus.');
    };

    const reorderRows = (sourceRowId: string, targetRowId: string) => {
        if (sourceRowId === targetRowId) {
            return;
        }

        setRows((currentRows) => {
            const sourceIndex = currentRows.findIndex(
                (row) => String(row.id) === sourceRowId,
            );
            const targetIndex = currentRows.findIndex(
                (row) => String(row.id) === targetRowId,
            );

            if (sourceIndex < 0 || targetIndex < 0) {
                return currentRows;
            }

            const nextRows = [...currentRows];
            const [movedRow] = nextRows.splice(sourceIndex, 1);
            nextRows.splice(targetIndex, 0, movedRow);

            const reorderableRows = nextRows.filter(
                (row) => !(row.is_legacy ?? row.id <= 0),
            );

            if (reorderableRows.length === nextRows.length) {
                const startSortOrder = Math.max(tasks.from ?? 1, 1);
                router.post(
                    tasksReorder.url(),
                    {
                        items: nextRows.map((row, index) => ({
                            id: row.id,
                            sort_order: startSortOrder + index,
                        })),
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    },
                );
            }

            return nextRows;
        });
    };

    const groupedLessons = useMemo(() => {
        const groups: Record<
            number,
            { course: string; lessons: LessonOption[] }
        > = {};

        allLessons.forEach((lesson) => {
            if (!groups[lesson.course_id]) {
                const course = courseOptions.find(
                    (c) => c.id === lesson.course_id,
                );
                groups[lesson.course_id] = {
                    course: course?.title || 'Unknown Course',
                    lessons: [],
                };
            }

            groups[lesson.course_id].lessons.push(lesson);
        });

        return groups;
    }, [allLessons, courseOptions]);

    const updateTaskStatus = (task: TaskRow, status: 'draft' | 'published') => {
        const payload = new FormData();
        payload.append('_method', 'PATCH');
        payload.append('title', task.title);
        payload.append('description', task.description);
        payload.append('type', task.type);
        payload.append('status', status);

        if (task.type === 'video' && task.video_url) {
            payload.append('video_url', task.video_url);
        }

        if (task.estimated_minutes != null) {
            payload.append('estimated_minutes', String(task.estimated_minutes));
        }

        if (task.prerequisite_task_id != null) {
            payload.append(
                'prerequisite_task_id',
                String(task.prerequisite_task_id),
            );
        }

        if (task.type === 'quiz') {
            (task.quiz_questions ?? []).forEach((question, index) => {
                payload.append(
                    `quiz_questions[${index}][question]`,
                    question.question,
                );
                question.options.forEach((option, optionIndex) => {
                    payload.append(
                        `quiz_questions[${index}][options][${optionIndex}]`,
                        option,
                    );
                });
                payload.append(
                    `quiz_questions[${index}][correct_option]`,
                    String(question.correct_option),
                );
                payload.append(
                    `quiz_questions[${index}][explanation]`,
                    question.explanation,
                );
            });
        }

        router.post(tasksUpdate.url({ task: task.id }), payload, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () =>
                toast.success(
                    status === 'published'
                        ? 'Tugas diterbitkan.'
                        : 'Tugas diubah menjadi draf.',
                ),
            onError: (formErrors) => {
                const messages = Object.values(formErrors).flat().join(', ');
                toast.error(messages || 'Gagal mengubah status tugas.');
            },
        });
    };

    const columns = useMemo<ColumnDef<TaskRow>[]>(
        () => [
            {
                id: 'drag',
                header: '',
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <button
                            type="button"
                            data-row-drag-handle="true"
                            aria-label={`Drag row ${formatTaskCode(row.index + 1)}`}
                            onMouseDown={() =>
                                setDragHandleActiveRowId(
                                    String(row.original.id),
                                )
                            }
                            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
                            style={{ cursor: 'grab' }}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="currentColor"
                                aria-hidden="true"
                            >
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
                header: 'Tugas',
                cell: ({ row }) => (
                    <p className="text-left font-medium">
                        {row.original.title}
                    </p>
                ),
            },
            {
                accessorKey: 'type',
                header: 'Tipe',
                cell: ({ row }) => {
                    const type = row.original.type;
                    const config: Record<
                        string,
                        {
                            icon: React.ReactNode;
                            label: string;
                            className: string;
                        }
                    > = {
                        video: {
                            icon: <Play className="text-red-500" />,
                            label: 'Video',
                            className: '',
                        },
                        read: {
                            icon: <BookOpen className="text-emerald-500" />,
                            label: 'Dokumen',
                            className: '',
                        },
                        quiz: {
                            icon: <CircleHelp className="text-amber-500" />,
                            label: 'Kuis',
                            className: '',
                        },
                    };
                    const c = config[type] ?? {
                        icon: null,
                        label: type,
                        className: '',
                    };

                    return (
                        <div className="flex justify-center">
                            <Badge variant="outline" className={c.className}>
                                {c.icon}
                                {c.label}
                            </Badge>
                        </div>
                    );
                },
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const status =
                        row.original.status ||
                        (row.original.is_published ? 'published' : 'draft');

                    return (
                        <div className="flex justify-center">
                            <StatusBadge status={status} />
                        </div>
                    );
                },
            },
            {
                accessorKey: 'version',
                header: 'Versi',
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.original.version
                            ? `v${row.original.version}`
                            : '—'}
                    </div>
                ),
            },
            {
                accessorKey: 'estimated_minutes',
                header: 'Estimasi (menit)',
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.original.estimated_minutes ??
                            row.original.minutes ??
                            '—'}
                    </div>
                ),
            },
            {
                accessorKey: 'created_at',
                header: 'Dibuat Pada',
                cell: ({ row }) => {
                    const date = row.original.created_at
                        ? new Date(row.original.created_at)
                        : null;

                    if (!date) {
                        return '—';
                    }

                    const d = String(date.getDate()).padStart(2, '0');
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const y = date.getFullYear();
                    const h = String(date.getHours()).padStart(2, '0');
                    const min = String(date.getMinutes()).padStart(2, '0');

                    return `${d}/${m}/${y}, ${h}:${min}`;
                },
            },
            {
                accessorKey: 'updated_at',
                header: 'Diperbarui Pada',
                cell: ({ row }) => {
                    const date = row.original.updated_at
                        ? new Date(row.original.updated_at)
                        : null;

                    if (!date) {
                        return '—';
                    }

                    const d = String(date.getDate()).padStart(2, '0');
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const y = date.getFullYear();
                    const h = String(date.getHours()).padStart(2, '0');
                    const min = String(date.getMinutes()).padStart(2, '0');

                    return `${d}/${m}/${y}, ${h}:${min}`;
                },
            },
            {
                id: 'actions',
                header: '',
                cell: ({ row }) => {
                    if (row.original.is_legacy ?? row.original.id <= 0) {
                        return (
                            <div className="text-center text-sm text-muted-foreground">
                                Lama
                            </div>
                        );
                    }

                    return (
                        <div className="flex justify-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                    >
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <ArrowRightLeft data-icon="inline-start" />
                                            Status
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuItem
                                                disabled={
                                                    (row.original.status ||
                                                        'draft') === 'published'
                                                }
                                                onClick={() =>
                                                    updateTaskStatus(
                                                        row.original,
                                                        'published',
                                                    )
                                                }
                                            >
                                                <BadgeCheck data-icon="inline-start" />
                                                Diterbitkan
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                disabled={
                                                    (row.original.status ||
                                                        'draft') === 'draft'
                                                }
                                                onClick={() =>
                                                    updateTaskStatus(
                                                        row.original,
                                                        'draft',
                                                    )
                                                }
                                            >
                                                <CircleDashed data-icon="inline-start" />
                                                Draf
                                            </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            openEditTaskDialog(row.original)
                                        }
                                    >
                                        <Pencil data-icon="inline-start" />
                                        Ubah
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            router.delete(
                                                tasksDestroy.url({
                                                    task: row.original.id,
                                                }),
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        toast.success(
                                                            'Task deleted successfully.',
                                                        ),
                                                    onError: (formErrors) => {
                                                        const messages =
                                                            Object.values(
                                                                formErrors,
                                                            )
                                                                .flat()
                                                                .join(', ');
                                                        toast.error(
                                                            messages ||
                                                                'Gagal menghapus tugas.',
                                                        );
                                                    },
                                                },
                                            );
                                        }}
                                    >
                                        <Trash2 data-icon="inline-start" />
                                        Hapus
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() =>
                                            router.get(
                                                `/courses/${row.original.course_slug}`,
                                            )
                                        }
                                    >
                                        <Eye data-icon="inline-start" />
                                        Lihat Tugas
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
            },
        ],
        [],
    );

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
        <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-0">
                    <TypographyH1>Manajemen Tugas</TypographyH1>
                    <TypographyMuted className="text-sm/6">
                        Kelola tugas di bawah setiap topik.
                    </TypographyMuted>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between sm:w-72"
                            >
                                <span className="truncate">
                                    {(() => {
                                        if (
                                            selectedLessonId === 0 &&
                                            selectedCourseId === 0
                                        ) {
                                            return 'Pilih Topik...';
                                        }

                                        const lesson = allLessons.find(
                                            (l) => l.id === selectedLessonId,
                                        );

                                        if (lesson) {
                                            return lesson.title;
                                        }

                                        return 'Pilih Topik...';
                                    })()}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Cari kursus atau topik..." />
                                <CommandList className="max-h-none overflow-y-hidden">
                                    <CommandEmpty>
                                        Tidak ada hasil ditemukan.
                                    </CommandEmpty>
                                    <ScrollArea className="h-64">
                                        {courseOptions.map((course) => {
                                            const courseLessons =
                                                allLessons.filter(
                                                    (l) =>
                                                        l.course_id ===
                                                        course.id,
                                                );

                                            if (courseLessons.length === 0) {
                                                return null;
                                            }

                                            return (
                                                <CommandGroup
                                                    key={course.id}
                                                    heading={course.title}
                                                >
                                                    {courseLessons.map(
                                                        (lesson) => (
                                                            <CommandItem
                                                                key={lesson.id}
                                                                value={`${course.title} ${lesson.title}`}
                                                                onSelect={() => {
                                                                    const isSelected =
                                                                        selectedLessonId ===
                                                                            lesson.id &&
                                                                        selectedCourseId ===
                                                                            course.id;

                                                                    // Don't navigate if already selected
                                                                    if (
                                                                        isSelected
                                                                    ) {
                                                                        return;
                                                                    }

                                                                    router.get(
                                                                        adminCoursesIndex.url(
                                                                            {
                                                                                query: {
                                                                                    section:
                                                                                        'task',
                                                                                    course_id:
                                                                                        course.id,
                                                                                    lesson_id:
                                                                                        lesson.id,
                                                                                    page: 1,
                                                                                    per_page:
                                                                                        tasks.per_page,
                                                                                },
                                                                            },
                                                                        ),
                                                                        {},
                                                                        {
                                                                            preserveState: true,
                                                                            preserveScroll: true,
                                                                        },
                                                                    );
                                                                }}
                                                            >
                                                                {lesson.title}
                                                                <Check
                                                                    className={`ml-auto h-4 w-4 ${selectedLessonId === lesson.id && selectedCourseId === course.id ? 'opacity-100' : 'opacity-0'}`}
                                                                />
                                                            </CommandItem>
                                                        ),
                                                    )}
                                                </CommandGroup>
                                            );
                                        })}
                                    </ScrollArea>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>

                    <div className="w-full sm:w-80">
                        <Input
                            id="task-search"
                            placeholder="Cari Tugas..."
                            value={filterValue}
                            onChange={(event) =>
                                setFilterValue(event.target.value)
                            }
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
                            <Button
                                type="button"
                                onClick={() => {
                                    resetTaskForm();
                                    setCreateTaskDialogOpen(true);
                                }}
                            >
                                <Plus data-icon="inline-start" />
                                Buat
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-sm">
                            <form
                                encType="multipart/form-data"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const payload = new FormData();
                                    payload.append(
                                        'lesson_id',
                                        String(taskForm.lesson_id),
                                    );
                                    payload.append('title', taskForm.title);
                                    payload.append(
                                        'description',
                                        taskForm.description,
                                    );
                                    payload.append('type', taskForm.type);

                                    if (taskForm.estimated_minutes) {
                                        payload.append(
                                            'estimated_minutes',
                                            taskForm.estimated_minutes,
                                        );
                                    }

                                    if (taskForm.prerequisite_task_id) {
                                        payload.append(
                                            'prerequisite_task_id',
                                            taskForm.prerequisite_task_id,
                                        );
                                    }

                                    payload.append('status', taskForm.status);

                                    if (taskForm.type === 'video') {
                                        payload.append(
                                            'video_url',
                                            taskForm.video_url,
                                        );
                                    }

                                    if (
                                        taskForm.type === 'read' &&
                                        taskForm.document
                                    ) {
                                        payload.append(
                                            'document',
                                            taskForm.document,
                                        );
                                    }

                                    if (taskForm.type === 'quiz') {
                                        if (quizQuestions.length === 0) {
                                            toast.error(
                                                'Tambahkan minimal 1 pertanyaan.',
                                            );

                                            return;
                                        }

                                        quizQuestions.forEach(
                                            (question, index) => {
                                                payload.append(
                                                    `quiz_questions[${index}][question]`,
                                                    question.question,
                                                );
                                                payload.append(
                                                    `quiz_questions[${index}][options][0]`,
                                                    question.options[0],
                                                );
                                                payload.append(
                                                    `quiz_questions[${index}][options][1]`,
                                                    question.options[1],
                                                );
                                                payload.append(
                                                    `quiz_questions[${index}][options][2]`,
                                                    question.options[2],
                                                );
                                                payload.append(
                                                    `quiz_questions[${index}][options][3]`,
                                                    question.options[3],
                                                );
                                                payload.append(
                                                    `quiz_questions[${index}][correct_option]`,
                                                    String(
                                                        question.correct_option,
                                                    ),
                                                );
                                                payload.append(
                                                    `quiz_questions[${index}][explanation]`,
                                                    question.explanation,
                                                );
                                            },
                                        );
                                    }

                                    const requestUrl = isEditMode
                                        ? tasksUpdate.url({
                                              task: editingTask.id,
                                          })
                                        : tasksStore.url();

                                    if (isEditMode) {
                                        payload.append('_method', 'PATCH');
                                    }

                                    router.post(requestUrl, payload, {
                                        forceFormData: true,
                                        preserveScroll: true,
                                        preserveState: true,
                                        onStart: () => setIsSavingTask(true),
                                        onSuccess: () => {
                                            toast.success(
                                                isEditMode
                                                    ? 'Tugas berhasil diperbarui.'
                                                    : 'Tugas berhasil dibuat.',
                                            );
                                            resetTaskForm();
                                            setCreateTaskDialogOpen(false);
                                        },
                                        onError: (formErrors) => {
                                            const messages = Object.values(
                                                formErrors,
                                            )
                                                .flat()
                                                .join(', ');
                                            toast.error(
                                                messages ||
                                                    'Gagal menyimpan tugas.',
                                            );
                                        },
                                        onFinish: () => setIsSavingTask(false),
                                    });
                                }}
                            >
                                <DialogHeader>
                                    <DialogTitle>
                                        {isEditMode
                                            ? 'Ubah tugas'
                                            : 'Buat tugas'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {isEditMode
                                            ? 'Perbarui detail dan konten tugas.'
                                            : 'Tambahkan tugas baru di bawah topik yang dipilih.'}
                                    </DialogDescription>
                                </DialogHeader>

                                <FieldGroup>
                                    <Field
                                        data-invalid={
                                            taskLessonHasError || undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="task-lesson">
                                            Topik{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Popover
                                            open={topicComboboxOpen}
                                            onOpenChange={setTopicComboboxOpen}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    id="task-lesson"
                                                    variant="outline"
                                                    role="combobox"
                                                    className="w-full justify-between"
                                                    aria-invalid={
                                                        taskLessonHasError
                                                    }
                                                >
                                                    <span className="truncate">
                                                        {(() => {
                                                            const lesson =
                                                                lessonOptions.find(
                                                                    (l) =>
                                                                        l.id ===
                                                                        taskForm.lesson_id,
                                                                );

                                                            if (lesson) {
                                                                return lesson.title;
                                                            }

                                                            return 'Pilih Topik...';
                                                        })()}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="p-0"
                                                align="start"
                                                style={{
                                                    width: 'var(--radix-popover-trigger-width)',
                                                }}
                                            >
                                                <Command>
                                                    <CommandInput placeholder="Cari kursus atau topik..." />
                                                    <CommandList
                                                        style={{
                                                            maxHeight: '16rem',
                                                            overflowY: 'auto',
                                                        }}
                                                    >
                                                        <CommandEmpty>
                                                            Tidak ada hasil
                                                            ditemukan.
                                                        </CommandEmpty>
                                                        {Object.entries(
                                                            groupedLessons,
                                                        ).map(
                                                            ([
                                                                courseId,
                                                                {
                                                                    course,
                                                                    lessons,
                                                                },
                                                            ]) => (
                                                                <CommandGroup
                                                                    key={
                                                                        courseId
                                                                    }
                                                                    heading={
                                                                        course
                                                                    }
                                                                >
                                                                    {lessons.map(
                                                                        (
                                                                            lesson,
                                                                        ) => (
                                                                            <CommandItem
                                                                                key={
                                                                                    lesson.id
                                                                                }
                                                                                value={`${course} ${lesson.title}`}
                                                                                onSelect={() => {
                                                                                    setTaskForm(
                                                                                        (
                                                                                            current,
                                                                                        ) => ({
                                                                                            ...current,
                                                                                            lesson_id:
                                                                                                lesson.id,
                                                                                        }),
                                                                                    );
                                                                                    setTopicComboboxOpen(
                                                                                        false,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                {
                                                                                    lesson.title
                                                                                }
                                                                                <Check
                                                                                    className={`ml-auto h-4 w-4 ${
                                                                                        taskForm.lesson_id ===
                                                                                        lesson.id
                                                                                            ? 'opacity-100'
                                                                                            : 'opacity-0'
                                                                                    }`}
                                                                                />
                                                                            </CommandItem>
                                                                        ),
                                                                    )}
                                                                </CommandGroup>
                                                            ),
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        {taskLessonHasError && (
                                            <FieldDescription className="text-destructive">
                                                {errors.lesson_id}
                                            </FieldDescription>
                                        )}
                                    </Field>

                                    <Field
                                        className="gap-2"
                                        data-invalid={
                                            taskTitleHasError || undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="task-title">
                                            Judul{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Input
                                            id="task-title"
                                            name="title"
                                            placeholder="Masukkan judul tugas"
                                            value={taskForm.title}
                                            onChange={(event) =>
                                                setTaskForm((current) => ({
                                                    ...current,
                                                    title: event.target.value,
                                                }))
                                            }
                                            aria-invalid={taskTitleHasError}
                                            required
                                        />
                                        {taskTitleHasError && (
                                            <FieldDescription className="text-destructive">
                                                {errors.title}
                                            </FieldDescription>
                                        )}
                                    </Field>

                                    <Field
                                        className="gap-2"
                                        data-invalid={
                                            taskDescriptionHasError || undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="task-description">
                                            Deskripsi{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Textarea
                                            id="task-description"
                                            name="description"
                                            placeholder="Masukkan deskripsi tugas"
                                            value={taskForm.description}
                                            onChange={(event) =>
                                                setTaskForm((current) => ({
                                                    ...current,
                                                    description:
                                                        event.target.value,
                                                }))
                                            }
                                            aria-invalid={
                                                taskDescriptionHasError
                                            }
                                            rows={3}
                                            required
                                        />
                                        {taskDescriptionHasError && (
                                            <FieldDescription className="text-destructive">
                                                {errors.description}
                                            </FieldDescription>
                                        )}
                                    </Field>

                                    <Field
                                        className="gap-2"
                                        data-invalid={
                                            taskTypeHasError || undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="task-type">
                                            Tipe{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Select
                                            value={taskForm.type}
                                            onValueChange={(value) => {
                                                setTaskForm((current) => ({
                                                    ...current,
                                                    type: value as
                                                        | 'video'
                                                        | 'read'
                                                        | 'quiz',
                                                    video_url:
                                                        value === 'video'
                                                            ? current.video_url
                                                            : '',
                                                    document:
                                                        value === 'read'
                                                            ? current.document
                                                            : null,
                                                }));
                                            }}
                                        >
                                            <SelectTrigger
                                                id="task-type"
                                                aria-invalid={taskTypeHasError}
                                            >
                                                <SelectValue placeholder="Pilih tipe" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value="video">
                                                        Video
                                                    </SelectItem>
                                                    <SelectItem value="read">
                                                        Dokumen
                                                    </SelectItem>
                                                    <SelectItem value="quiz">
                                                        Kuis
                                                    </SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {taskTypeHasError && (
                                            <FieldDescription className="text-destructive">
                                                {errors.type}
                                            </FieldDescription>
                                        )}
                                    </Field>

                                    {taskForm.type === 'video' && (
                                        <Field
                                            className="gap-2"
                                            data-invalid={
                                                taskVideoUrlHasError ||
                                                undefined
                                            }
                                        >
                                            <FieldLabel htmlFor="task-video-url">
                                                URL Video{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Input
                                                id="task-video-url"
                                                name="video_url"
                                                type="url"
                                                placeholder="https://..."
                                                value={taskForm.video_url}
                                                onChange={(event) =>
                                                    setTaskForm((current) => ({
                                                        ...current,
                                                        video_url:
                                                            event.target.value,
                                                    }))
                                                }
                                                aria-invalid={
                                                    taskVideoUrlHasError
                                                }
                                                required
                                            />
                                            {taskVideoUrlHasError && (
                                                <FieldDescription className="text-destructive">
                                                    {errors.video_url}
                                                </FieldDescription>
                                            )}
                                        </Field>
                                    )}

                                    {taskForm.type === 'read' && (
                                        <Field
                                            className="gap-2"
                                            data-invalid={
                                                taskDocumentHasError ||
                                                undefined
                                            }
                                        >
                                            <FieldLabel htmlFor="task-document">
                                                Dokumen{' '}
                                                {!isEditMode && (
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                )}
                                            </FieldLabel>
                                            {isEditMode &&
                                                editingTask.document_name && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Saat ini:{' '}
                                                        {
                                                            editingTask.document_name
                                                        }
                                                    </p>
                                                )}
                                            <Input
                                                id="task-document"
                                                name="document"
                                                type="file"
                                                accept=".pdf,.doc,.docx,.txt"
                                                aria-invalid={
                                                    taskDocumentHasError
                                                }
                                                onChange={(event) => {
                                                    const file =
                                                        event.target
                                                            .files?.[0] ?? null;
                                                    setTaskForm((current) => ({
                                                        ...current,
                                                        document: file,
                                                    }));
                                                }}
                                                required={!isEditMode}
                                            />
                                            {taskDocumentHasError && (
                                                <FieldDescription className="text-destructive">
                                                    {errors.document}
                                                </FieldDescription>
                                            )}
                                        </Field>
                                    )}

                                    {taskForm.type === 'quiz' && (
                                        <>
                                            <Field>
                                                <FieldLabel htmlFor="task-quiz-import">
                                                    Impor Pertanyaan{' '}
                                                    {!isEditMode && quizQuestions.length === 0 && (
                                                        <span className="text-destructive">
                                                            *
                                                        </span>
                                                    )}
                                                </FieldLabel>

                                                <div className="flex gap-2">
                                                    <Input
                                                        id="task-quiz-import"
                                                        type="file"
                                                        accept=".csv,.xlsx,.xls"
                                                        className="flex-1"
                                                        aria-invalid={
                                                            taskQuizQuestionsHasError
                                                        }
                                                        onChange={async (event) => {
                                                        const selectedFile =
                                                            event.target
                                                                .files?.[0] ??
                                                            null;

                                                        if (!selectedFile) {
                                                            setQuizImportFileName(
                                                                '',
                                                            );
                                                            setQuizQuestions(
                                                                [],
                                                            );

                                                            return;
                                                        }

                                                        try {
                                                            const text =
                                                                await selectedFile.text();
                                                            const parsedRows =
                                                                parseQuizImportText(
                                                                    text,
                                                                );

                                                            if (
                                                                parsedRows.length ===
                                                                0
                                                            ) {
                                                                toast.error(
                                                                    'Tidak ada pertanyaan ditemukan dalam file.',
                                                                );

                                                                return;
                                                            }

                                                            setQuizQuestions(
                                                                parsedRows,
                                                            );
                                                            setQuizImportFileName(
                                                                selectedFile.name,
                                                            );
                                                            toast.success(
                                                                `Berhasil mengimpor ${parsedRows.length} pertanyaan.`,
                                                            );
                                                        } catch {
                                                            toast.error(
                                                                'Gagal membaca file. Silakan gunakan format template.',
                                                            );
                                                        }
                                                    }}
                                                />
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="icon"
                                                            className="shrink-0"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                downloadQuizTemplate('csv')
                                                            }
                                                        >
                                                            Format CSV
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                downloadQuizTemplate('xlsx')
                                                            }
                                                        >
                                                            Excel (.xlsx)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                downloadQuizTemplate('xls')
                                                            }
                                                        >
                                                            Excel Lama (.xls)
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                                <FieldDescription>
                                                    Unggah CSV/Excel atau klik tombol di bawah untuk tambah manual
                                                </FieldDescription>

                                                {quizImportFileName && (
                                                    <>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Check className="h-4 w-4 text-green-600" />
                                                            <span>
                                                                {quizImportFileName}{' '}
                                                                (
                                                                {
                                                                    quizQuestions.length
                                                                }{' '}
                                                                pertanyaan
                                                                {quizQuestions.length !==
                                                                1
                                                                    ? ''
                                                                    : ''}
                                                                )
                                                            </span>
                                                        </div>

                                                        {/* Quiz Preview */}
                                                        {quizQuestions.length > 0 && (
                                                            <>
                                                                <Accordion type="single" collapsible className="mt-3">
                                                                    <AccordionItem value="preview" className="border rounded-lg px-3">
                                                                        <AccordionTrigger className="text-sm hover:no-underline">
                                                                            <span className="flex items-center gap-2">
                                                                                <Eye className="h-4 w-4" />
                                                                                Preview Pertanyaan ({quizQuestions.length})
                                                                            </span>
                                                                        </AccordionTrigger>
                                                                        <AccordionContent>
                                                                            <div className="space-y-3 pt-2 max-h-96 overflow-y-auto">
                                                                                {quizQuestions.map((q, i) => (
                                                                                    <div key={i} className="rounded-lg border bg-muted/30 p-3 text-sm">
                                                                                        <div className="flex items-start justify-between gap-2 mb-2">
                                                                                            <p className="font-medium flex-1">
                                                                                                {i + 1}. {q.question}
                                                                                            </p>
                                                                                            <div className="flex gap-1 shrink-0">
                                                                                                <Button
                                                                                                    type="button"
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    className="h-7 w-7 p-0"
                                                                                                    onClick={() => openQuestionEditor(i)}
                                                                                                >
                                                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                                                </Button>
                                                                                                <Button
                                                                                                    type="button"
                                                                                                    variant="ghost"
                                                                                                    size="sm"
                                                                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                                                                    onClick={() => deleteQuestion(i)}
                                                                                                >
                                                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                                                </Button>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="space-y-1 pl-4">
                                                                                            {q.options.map((opt, j) => (
                                                                                                <div
                                                                                                    key={j}
                                                                                                    className={
                                                                                                        j === q.correct_option
                                                                                                            ? 'text-emerald-600 font-medium'
                                                                                                            : 'text-muted-foreground'
                                                                                                    }
                                                                                                >
                                                                                                    {j === q.correct_option && '✓ '}
                                                                                                    {opt}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                        {q.explanation && (
                                                                                            <p className="text-xs text-muted-foreground mt-2 pl-4">
                                                                                                💡 {q.explanation}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </AccordionContent>
                                                                    </AccordionItem>
                                                                </Accordion>

                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full mt-2"
                                                                    onClick={() => openQuestionEditor()}
                                                                >
                                                                    <Plus className="h-4 w-4 mr-2" />
                                                                    Tambah Pertanyaan
                                                                </Button>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                {isEditMode &&
                                                    quizQuestions.length > 0 &&
                                                    !quizImportFileName && (
                                                        <FieldDescription>
                                                            {
                                                                quizQuestions.length
                                                            }{' '}
                                                            pertanyaan dimuat.
                                                            Unggah file baru
                                                            untuk mengganti.
                                                        </FieldDescription>
                                                    )}

                                                {taskQuizQuestionsHasError && (
                                                    <FieldDescription className="text-destructive">
                                                        {errors.quiz_questions}
                                                    </FieldDescription>
                                                )}
                                            </Field>
                                        </>
                                    )}
                                </FieldGroup>

                                <DialogFooter className="mt-6">
                                    <DialogClose asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isSavingTask}
                                        >
                                            Batal
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        disabled={isSavingTask}
                                    >
                                        {isSavingTask && (
                                            <Spinner data-icon="inline-start" />
                                        )}
                                        Simpan perubahan
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Question Editor Dialog */}
                    <Dialog open={questionEditorOpen} onOpenChange={setQuestionEditorOpen}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingQuestionIndex !== null ? 'Edit Pertanyaan' : 'Tambah Pertanyaan'}
                                </DialogTitle>
                                <DialogDescription>
                                    Isi pertanyaan, 4 opsi jawaban, dan pilih jawaban yang benar.
                                </DialogDescription>
                            </DialogHeader>

                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="q-question">
                                        Pertanyaan <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <Textarea
                                        id="q-question"
                                        value={questionForm.question}
                                        onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                                        placeholder="Masukkan pertanyaan"
                                        rows={3}
                                    />
                                </Field>

                                <Field>
                                    <FieldLabel>
                                        Opsi Jawaban <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <div className="space-y-2">
                                        {questionForm.options.map((opt, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <Input
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOptions = [...questionForm.options] as [string, string, string, string];
                                                        newOptions[idx] = e.target.value;
                                                        setQuestionForm(prev => ({ ...prev, options: newOptions }));
                                                    }}
                                                    placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                                                />
                                                <Button
                                                    type="button"
                                                    variant={questionForm.correct_option === idx ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="shrink-0"
                                                    onClick={() => setQuestionForm(prev => ({ ...prev, correct_option: idx }))}
                                                >
                                                    {questionForm.correct_option === idx ? <Check className="h-4 w-4" /> : 'Benar'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <FieldDescription>
                                        Klik tombol "Benar" untuk menandai jawaban yang benar
                                    </FieldDescription>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="q-explanation">Penjelasan</FieldLabel>
                                    <Textarea
                                        id="q-explanation"
                                        value={questionForm.explanation}
                                        onChange={(e) => setQuestionForm(prev => ({ ...prev, explanation: e.target.value }))}
                                        placeholder="Penjelasan jawaban (opsional)"
                                        rows={2}
                                    />
                                </Field>
                            </FieldGroup>

                            <DialogFooter className="mt-6">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Batal</Button>
                                </DialogClose>
                                <Button type="button" onClick={saveQuestion}>
                                    {editingQuestionIndex !== null ? 'Perbarui' : 'Tambah'}
                                </Button>
                            </DialogFooter>
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
                                <EmptyTitle>
                                    Tidak ada tugas ditemukan
                                </EmptyTitle>
                                <EmptyDescription>
                                    Pilih topik lain atau cari dengan kata kunci
                                    lain.
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
                            footerInfo={`Menampilkan ${tasks.from ?? 0} - ${tasks.to ?? 0} dari ${tasks.total} Tugas`}
                        />
                    )}
                </div>
            </section>
        </div>
    );
}
