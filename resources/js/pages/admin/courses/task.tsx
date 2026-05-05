import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    BookOpen,
    Check,
    ChevronsUpDown,
    ChevronDown,
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
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type {
    CourseRow,
    LessonRow,
    Paginated,
    TaskRow,
} from '@/components/course-types';
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

type QuizImportQuestion = {
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: number;
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

function parseQuizImportText(text: string): QuizImportQuestion[] {
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
                optionA: columns[getIndex('option_a')] ?? '',
                optionB: columns[getIndex('option_b')] ?? '',
                optionC: columns[getIndex('option_c')] ?? '',
                optionD: columns[getIndex('option_d')] ?? '',
                correctOption: Math.min(
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
    const [rows, setRows] = useState<TaskRow[]>(tasks.data);
    const [dragHandleActiveRowId, setDragHandleActiveRowId] = useState<
        string | null
    >(null);
    const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
    const [isSavingTask, setIsSavingTask] = useState(false);
    const isEditMode = editingTask !== null;
    const [topicComboboxOpen, setTopicComboboxOpen] = useState(false);
    const [quizImportFileName, setQuizImportFileName] = useState('');
    const [quizQuestions, setQuizQuestions] = useState<QuizImportQuestion[]>(
        [],
    );
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
            setTaskForm((current) => ({
                ...current,
                lesson_id: selectedLessonId,
            }));
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
        setEditingTask(null);
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

    const openEditTaskDialog = (task: TaskRow) => {
        setEditingTask(task);
        setTaskForm({
            lesson_id: task.lesson_id,
            title: task.title,
            description: task.description,
            type: task.type as 'video' | 'read' | 'quiz',
            video_url: task.video_url ?? '',
            document: null,
        });
        setQuizImportFileName('');
        setQuizQuestions(
            (task.quiz_questions ?? []).map((q) => ({
                question: q.question,
                optionA: q.options[0] ?? '',
                optionB: q.options[1] ?? '',
                optionC: q.options[2] ?? '',
                optionD: q.options[3] ?? '',
                correctOption: q.correct_option,
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

    const lessonOptions = useMemo(
        () =>
            lessons.data.filter(
                (lesson) => lesson.course_id === selectedCourseId,
            ),
        [lessons.data, selectedCourseId],
    );

    // Group all lessons by course for the combobox
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

    const lessonComboboxOptions = useMemo(
        () =>
            lessons.data.map((lesson) => ({
                value: String(lesson.id),
                label: lesson.title,
            })),
        [lessons.data],
    );

    const courseComboboxOptions = useMemo(
        () =>
            courseOptions.map((course) => ({
                value: String(course.id),
                label: course.title,
            })),
        [courseOptions],
    );

    const lessonCourseMap = useMemo(
        () =>
            Object.fromEntries(
                lessons.data.map((lesson) => [lesson.id, lesson.course_id]),
            ),
        [lessons.data],
    );

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

                        <DialogContent className="*:data-[slot=dialog-close]:top-6 *:data-[slot=dialog-close]:right-6 sm:max-w-sm">
                            <form
                                className="flex flex-col gap-5"
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
                                                'Import quiz question terlebih dahulu.',
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
                                                    question.optionA,
                                                );
                                                payload.append(
                                                    `quiz_questions[${index}][options][1]`,
                                                    question.optionB,
                                                );
                                                payload.append(
                                                    `quiz_questions[${index}][options][2]`,
                                                    question.optionC,
                                                );
                                                payload.append(
                                                    `quiz_questions[${index}][options][3]`,
                                                    question.optionD,
                                                );
                                                payload.append(
                                                    `quiz_questions[${index}][correct_option]`,
                                                    String(
                                                        question.correctOption,
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
                                <DialogHeader className="pr-10">
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

                                <FieldGroup className="gap-3">
                                    <Field
                                        className="gap-2"
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
                                            <Field className="gap-3">
                                                <div className="flex items-center justify-between">
                                                    <FieldLabel htmlFor="task-quiz-import">
                                                        Impor Pertanyaan{' '}
                                                        {!isEditMode && (
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        )}
                                                    </FieldLabel>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Template
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    downloadQuizTemplate(
                                                                        'csv',
                                                                    )
                                                                }
                                                            >
                                                                Format CSV
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    downloadQuizTemplate(
                                                                        'xlsx',
                                                                    )
                                                                }
                                                            >
                                                                Excel (.xlsx)
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    downloadQuizTemplate(
                                                                        'xls',
                                                                    )
                                                                }
                                                            >
                                                                Excel Lama
                                                                (.xls)
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <Input
                                                    id="task-quiz-import"
                                                    type="file"
                                                    accept=".csv,.xlsx,.xls"
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
                                                    required={
                                                        !isEditMode ||
                                                        quizQuestions.length ===
                                                            0
                                                    }
                                                />

                                                <FieldDescription>
                                                    Unggah file CSV atau Excel
                                                    (.csv, .xlsx, .xls)
                                                </FieldDescription>

                                                {quizImportFileName && (
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

                                <DialogFooter className="pt-1">
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
