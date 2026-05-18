import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Archive,
    ArrowRightLeft,
    BadgeCheck,
    Check,
    ChevronsUpDown,
    CircleDashed,
    Download,
    History,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/page-header';
import {
    VersionHistoryDialog,
    type VersionHistoryItem,
} from '@/components/admin/version-history-dialog';
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
import {
    destroy as destroyAssessment,
    reorder as reorderAssessments,
    store as storeAssessment,
    update as updateAssessment,
} from '@/routes/admin/assessments';
import { store as storeAssessmentQuestion } from '@/routes/admin/assessments/questions';
import { store as storeQuestionBank } from '@/routes/admin/question-bank';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import type {
    AdminAssessment,
    AdminAssessmentQuestion,
    BloomLevel,
    GradingType,
    QuestionBank,
} from '@/types';

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type LessonOption = { id: number; course_id: number; title: string };

type Props = {
    assessments: Paginated<AdminAssessment>;
    questions: AdminAssessmentQuestion[];
    selectedAssessmentId: number;
    courseOptions: { id: number; title: string }[];
    selectedCourseId: number;
    courseFilterSelected: boolean;
    allLessons: LessonOption[];
    topics: { id: number; name: string }[];
    questionBank: Paginated<QuestionBank>;
    versionHistories: Record<number, VersionHistoryItem[]>;
    filters: {
        search: string;
        bloom_level: BloomLevel | null;
    };
};

const BLOOM_BADGE_COLORS: Record<BloomLevel, string> = {
    C1: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    C2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    C3: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    C4: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    C5: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    C6: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

type ContentStatus = 'draft' | 'published' | 'archived';

function StatusBadge({
    status,
    className,
}: {
    status: ContentStatus;
    className?: string;
}) {
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

type QuizQuestion = {
    question: string;
    options: [string, string, string, string];
    correct_option: number;
    explanation: string;
};

const QUIZ_IMPORT_TEMPLATE_HEADER =
    'question,option_a,option_b,option_c,option_d,correct_option,explanation';

// Bloom Level specific templates with instructions and examples
const BLOOM_LEVEL_TEMPLATES: Record<
    BloomLevel,
    { instruction: string; example: string }
> = {
    C1: {
        instruction:
            'C1 - Remember: Test recall of facts, terms, basic concepts, and answers. Use keywords: define, list, name, identify, recall, recognize, state.',
        example:
            'What does CIA stand for in information security?,Confidentiality Integrity Availability,Central Intelligence Agency,Computer Internet Access,Cryptographic Information Algorithm,1,CIA triad is the foundation of information security consisting of Confidentiality Integrity and Availability.',
    },
    C2: {
        instruction:
            'C2 - Understand: Test comprehension and interpretation of information. Use keywords: explain, describe, summarize, interpret, classify, compare.',
        example:
            'What is the main purpose of encryption in data security?,To compress data,To protect data confidentiality,To speed up transmission,To backup data,2,Encryption transforms data into unreadable format to protect confidentiality during storage and transmission.',
    },
    C3: {
        instruction:
            'C3 - Apply: Test ability to use information in new situations. Use keywords: apply, demonstrate, solve, use, implement, execute.',
        example:
            'Which encryption algorithm should you use for securing a web application login?,MD5,SHA-1,AES-256,Base64,3,AES-256 is a strong symmetric encryption standard suitable for securing sensitive data like login credentials.',
    },
    C4: {
        instruction:
            'C4 - Analyze: Test ability to break down information and understand relationships. Use keywords: analyze, compare, contrast, examine, differentiate.',
        example:
            'What is the key difference between symmetric and asymmetric encryption?,Speed of encryption,Number of keys used,Algorithm complexity,Data size limit,2,Symmetric uses one shared key while asymmetric uses a public-private key pair for encryption and decryption.',
    },
    C5: {
        instruction:
            'C5 - Evaluate: Test ability to make judgments based on criteria. Use keywords: evaluate, assess, justify, critique, recommend, prioritize.',
        example:
            'Which security measure should be prioritized first for a new web application?,HTTPS/TLS encryption,Input validation,Regular backups,User training,1,HTTPS/TLS should be prioritized first to encrypt all data in transit and establish trust with users.',
    },
    C6: {
        instruction:
            'C6 - Create: Test ability to create new solutions or products. Use keywords: design, develop, create, formulate, construct, propose.',
        example:
            'Design a secure authentication system. Which combination provides the best security?,Password only,Password + Email verification,Password + 2FA + Biometric,Security questions only,3,Multi-factor authentication combining password 2FA and biometric provides layered security against various attack vectors.',
    },
};

function downloadQuizTemplate(
    kind: 'csv' | 'xlsx' | 'xls',
    bloomLevel: BloomLevel,
): void {
    const fileName = `assessment-quiz-${bloomLevel.toLowerCase()}-template.csv`;

    const template = BLOOM_LEVEL_TEMPLATES[bloomLevel];
    const instructionRow = `# ${template.instruction}`;
    const headerRow = QUIZ_IMPORT_TEMPLATE_HEADER;
    const exampleRow = template.example;

    const content = `${instructionRow}\n${headerRow}\n${exampleRow}\n`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
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
            'Template header does not match. Please use the downloaded template.',
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

export default function AdminCoursesAssessment({
    assessments,
    questions,
    selectedAssessmentId,
    courseOptions,
    selectedCourseId,
    courseFilterSelected,
    questionBank,
    versionHistories,
}: Props) {
    const [filterValue, setFilterValue] = useState('');
    const [rows, setRows] = useState<AdminAssessment[]>(assessments.data);
    const [prevData, setPrevData] = useState(assessments.data);

    if (prevData !== assessments.data) {
        setPrevData(assessments.data);
        setRows(assessments.data);
    }

    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [dragHandleActiveRowId, setDragHandleActiveRowId] = useState<
        string | null
    >(null);
    const [deletingAssessment, setDeletingAssessment] =
        useState<AdminAssessment | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingAssessment, setEditingAssessment] =
        useState<AdminAssessment | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = editingAssessment !== null;

    // Combobox states
    const [courseComboboxOpen, setCourseComboboxOpen] = useState(false);

    // Quiz import states
    const [quizImportFileName, setQuizImportFileName] = useState('');
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

    // Question editor state
    const [questionEditorOpen, setQuestionEditorOpen] = useState(false);
    const [questionBankOpen, setQuestionBankOpen] = useState(false);
    const [manualQuestionOpen, setManualQuestionOpen] = useState(false);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<
        number | null
    >(null);
    const [questionForm, setQuestionForm] = useState<QuizQuestion>({
        question: '',
        options: ['', '', '', ''],
        correct_option: 0,
        explanation: '',
    });

    const [assessmentForm, setAssessmentForm] = useState({
        title: '',
        description: '',
        course_id: selectedCourseId || 0,
        bloom_level: 'C1' as BloomLevel,
        grading_type: 'auto' as GradingType,
        passing_score: '70',
        max_attempts: '3',
        time_limit_minutes: '',
    });

    const selectedAssessment = rows.find(
        (assessment) => assessment.id === selectedAssessmentId,
    );

    const resetFormState = () => {
        setEditingAssessment(null);
        setAssessmentForm({
            title: '',
            description: '',
            course_id: selectedCourseId || 0,
            bloom_level: 'C1',
            grading_type: 'auto',
            passing_score: '70',
            max_attempts: '3',
            time_limit_minutes: '',
        });
        setQuizImportFileName('');
        setQuizQuestions([]);
    };

    const openCreateDialog = () => {
        resetFormState();
        setCreateDialogOpen(true);
    };

    const openEditDialog = (assessment: AdminAssessment) => {
        setEditingAssessment(assessment);
        setAssessmentForm({
            title: assessment.title,
            description: assessment.description ?? '',
            course_id: assessment.course_id || 0,
            bloom_level: assessment.bloom_level,
            grading_type: assessment.grading_type,
            passing_score: assessment.passing_score.toString(),
            max_attempts: assessment.max_attempts.toString(),
            time_limit_minutes: assessment.time_limit_minutes?.toString() ?? '',
        });
        setCreateDialogOpen(true);
    };

    const sectionUrl = (query: Record<string, unknown>) =>
        adminCoursesIndex.url({ query: { section: 'assessment', ...query } });

    const filteredAssessments = useMemo(() => {
        const keyword = filterValue.trim().toLowerCase();

        if (keyword === '') {
            return rows;
        }

        return rows.filter(
            (a) =>
                a.title.toLowerCase().includes(keyword) ||
                a.bloom_level.toLowerCase().includes(keyword),
        );
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

        if (questionForm.options.some((opt) => !opt.trim())) {
            toast.error('Semua opsi harus diisi.');

            return;
        }

        if (editingQuestionIndex !== null) {
            setQuizQuestions((prev) => {
                const updated = [...prev];
                updated[editingQuestionIndex] = questionForm;

                return updated;
            });
            toast.success('Pertanyaan berhasil diperbarui.');
        } else {
            setQuizQuestions((prev) => [...prev, questionForm]);
            toast.success('Pertanyaan berhasil ditambahkan.');
        }

        setQuestionEditorOpen(false);
    };

    const deleteQuestion = (index: number) => {
        if (!confirm('Hapus pertanyaan ini?')) {
            return;
        }

        setQuizQuestions((prev) => prev.filter((_, i) => i !== index));
        toast.success('Pertanyaan berhasil dihapus.');
    };

    const attachBankQuestion = (question: QuestionBank) => {
        if (!selectedAssessmentId) {
            toast.error('Pilih assessment terlebih dahulu.');

            return;
        }

        router.post(
            storeAssessmentQuestion.url({ assessment: selectedAssessmentId }),
            {
                question_bank_id: question.id,
                bloom_level: question.bloom_level,
                question_type: question.question_type,
                question_text: question.question_text,
                options: question.options,
                correct_answer: question.correct_answer,
                explanation: question.explanation,
                rubric: question.rubric,
                points: question.points,
                grading_type: ['essay', 'case_study', 'design'].includes(
                    question.question_type,
                )
                    ? 'manual'
                    : 'auto',
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Soal dari Question Bank ditambahkan.');
                    setQuestionBankOpen(false);
                },
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(messages || 'Gagal menambahkan soal.');
                },
            },
        );
    };

    const saveManualQuestionToAssessment = () => {
        if (!selectedAssessmentId) {
            toast.error('Pilih assessment terlebih dahulu.');

            return;
        }

        if (!questionForm.question.trim()) {
            toast.error('Pertanyaan tidak boleh kosong.');

            return;
        }

        if (questionForm.options.some((option) => !option.trim())) {
            toast.error('Semua opsi harus diisi.');

            return;
        }

        router.post(
            storeAssessmentQuestion.url({ assessment: selectedAssessmentId }),
            {
                bloom_level: selectedAssessment?.bloom_level ?? 'C1',
                question_type: 'mcq',
                question_text: questionForm.question,
                options: questionForm.options,
                correct_answer:
                    questionForm.options[questionForm.correct_option],
                explanation: questionForm.explanation,
                points: 10,
                grading_type: 'auto',
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Soal manual ditambahkan.');
                    setManualQuestionOpen(false);
                    setQuestionForm({
                        question: '',
                        options: ['', '', '', ''],
                        correct_option: 0,
                        explanation: '',
                    });
                },
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(messages || 'Gagal menambahkan soal manual.');
                },
            },
        );
    };

    const saveAssessmentQuestionToBank = (
        question: AdminAssessmentQuestion,
    ) => {
        router.post(
            storeQuestionBank.url(),
            {
                title: question.question_text.slice(0, 120),
                category: selectedAssessment?.course_title ?? null,
                bloom_level: question.bloom_level,
                question_type: question.question_type,
                question_text: question.question_text,
                options: question.options,
                correct_answer: question.correct_answer,
                explanation: question.explanation,
                rubric: question.rubric,
                points: question.points,
                is_active: true,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () =>
                    toast.success('Soal disimpan ke Question Bank.'),
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(
                        messages || 'Gagal menyimpan ke Question Bank.',
                    );
                },
            },
        );
    };

    const reorderRows = (sourceRowId: string, targetRowId: string) => {
        if (sourceRowId === targetRowId) {
            return;
        }

        setRows((currentRows) => {
            const sourceIndex = currentRows.findIndex(
                (r) => String(r.id) === sourceRowId,
            );
            const targetIndex = currentRows.findIndex(
                (r) => String(r.id) === targetRowId,
            );

            if (sourceIndex < 0 || targetIndex < 0) {
                return currentRows;
            }

            const nextRows = [...currentRows];
            const [movedRow] = nextRows.splice(sourceIndex, 1);
            nextRows.splice(targetIndex, 0, movedRow);

            const startSortOrder = Math.max(assessments.from ?? 1, 1);
            router.post(
                reorderAssessments.url(),
                {
                    items: nextRows.map((row, index) => ({
                        id: row.id,
                        sort_order: startSortOrder + index,
                    })),
                },
                { preserveState: true, preserveScroll: true, replace: true },
            );

            return nextRows;
        });
    };

    const handleDelete = () => {
        if (!deletingAssessment) {
            return;
        }

        router.delete(
            destroyAssessment.url({ assessment: deletingAssessment.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDeletingAssessment(null);
                    toast.success('Assessment deleted successfully.');
                },
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(messages || 'Failed to delete assessment.');
                },
            },
        );
    };

    const updateAssessmentStatus = (
        assessment: AdminAssessment,
        status: 'draft' | 'published',
    ) => {
        router.patch(
            updateAssessment.url({ assessment: assessment.id }),
            {
                title: assessment.title,
                description: assessment.description,
                course_id: assessment.course_id,
                topic_id: assessment.topic_id,
                bloom_level: assessment.bloom_level,
                grading_type: assessment.grading_type,
                passing_score: assessment.passing_score,
                max_attempts: assessment.max_attempts,
                time_limit_minutes: assessment.time_limit_minutes,
                status,
            },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        status === 'published'
                            ? 'Assessment diterbitkan.'
                            : 'Assessment diubah menjadi draf.',
                    ),
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(
                        messages || 'Gagal mengubah status assessment.',
                    );
                },
            },
        );
    };

    const columns = useMemo<ColumnDef<AdminAssessment>[]>(
        () => [
            {
                id: 'drag',
                header: '',
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <button
                            type="button"
                            data-row-drag-handle="true"
                            aria-label={`Drag row ${row.original.title}`}
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
                header: 'Assessment',
                cell: ({ row }) => (
                    <p className="text-left font-medium">
                        {row.original.title}
                    </p>
                ),
            },
            {
                accessorKey: 'bloom_level',
                header: 'Bloom Level',
                cell: ({ row }) => {
                    const level = row.original.bloom_level;

                    return (
                        <div className="flex justify-center">
                            <Badge className={BLOOM_BADGE_COLORS[level]}>
                                {level}
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
                header: 'Version',
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.original.version
                            ? `v${row.original.version}`
                            : '—'}
                    </div>
                ),
            },
            {
                accessorKey: 'published_by_name',
                header: 'Published By',
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.original.published_by_name || '—'}
                    </div>
                ),
            },
            {
                accessorKey: 'created_at',
                header: 'Created At',
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
                header: 'Updated At',
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
                cell: ({ row }) => (
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
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <ArrowRightLeft data-icon="inline-start" />
                                        Status
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem
                                            disabled={
                                                (row.original.status ||
                                                    (row.original.is_published
                                                        ? 'published'
                                                        : 'draft')) ===
                                                'published'
                                            }
                                            onClick={() =>
                                                updateAssessmentStatus(
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
                                                    (row.original.is_published
                                                        ? 'published'
                                                        : 'draft')) === 'draft'
                                            }
                                            onClick={() =>
                                                updateAssessmentStatus(
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
                                    onClick={() => openEditDialog(row.original)}
                                >
                                    <Pencil data-icon="inline-start" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        router.get(
                                            sectionUrl({
                                                course_id:
                                                    row.original.course_id ??
                                                    undefined,
                                                assessment_id: row.original.id,
                                                page: assessments.current_page,
                                                per_page: assessments.per_page,
                                            }),
                                            {},
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                            },
                                        )
                                    }
                                >
                                    <Search data-icon="inline-start" />
                                    Kelola Soal
                                </DropdownMenuItem>
                                <VersionHistoryDialog
                                    itemTitle={row.original.title}
                                    versions={
                                        versionHistories[row.original.id] ?? []
                                    }
                                    trigger={
                                        <DropdownMenuItem
                                            onSelect={(event) =>
                                                event.preventDefault()
                                            }
                                        >
                                            <History data-icon="inline-start" />
                                            History
                                        </DropdownMenuItem>
                                    }
                                />
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                        setDeletingAssessment(row.original)
                                    }
                                >
                                    <Trash2 data-icon="inline-start" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            },
        ],
        [],
    );

    const handlePageChange = (nextPage: number): void => {
        router.get(
            sectionUrl({
                course_id: selectedCourseId || undefined,
                page: nextPage,
                per_page: assessments.per_page,
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePageSizeChange = (nextPageSize: number): void => {
        router.get(
            sectionUrl({
                course_id: selectedCourseId || undefined,
                page: 1,
                per_page: nextPageSize,
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <>
            <div className="flex flex-col gap-6 px-4 pt-3 pb-4">
                <PageHeader
                    title="Penilaian"
                    description="Kelola penilaian untuk setiap kursus."
                    actions={
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
                                                if (!courseFilterSelected) {
                                                    return 'Pilih Kursus...';
                                                }

                                                if (selectedCourseId === 0) {
                                                    return 'Semua Kursus';
                                                }

                                                const course =
                                                    courseOptions.find(
                                                        (c) =>
                                                            c.id ===
                                                            selectedCourseId,
                                                    );

                                                if (course) {
                                                    return course.title;
                                                }

                                                return 'Pilih Kursus...';
                                            })()}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-72 p-0"
                                    align="start"
                                >
                                    <Command>
                                        <CommandInput placeholder="Cari kursus..." />
                                        <CommandList
                                            style={{
                                                maxHeight: '16rem',
                                                overflowY: 'auto',
                                            }}
                                        >
                                            <CommandEmpty>
                                                Tidak ada hasil ditemukan.
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {courseOptions.map((course) => (
                                                    <CommandItem
                                                        key={course.id}
                                                        value={course.title}
                                                        onSelect={() => {
                                                            router.get(
                                                                sectionUrl({
                                                                    course_id:
                                                                        course.id,
                                                                    page: 1,
                                                                    per_page:
                                                                        assessments.per_page,
                                                                }),
                                                                {},
                                                                {
                                                                    preserveState: true,
                                                                    preserveScroll: true,
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        {course.title}
                                                        <Check
                                                            className={`ml-auto h-4 w-4 ${
                                                                selectedCourseId ===
                                                                course.id
                                                                    ? 'opacity-100'
                                                                    : 'opacity-0'
                                                            }`}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            <div className="w-full sm:w-80">
                                <Input
                                    id="assessment-search"
                                    placeholder="Cari Penilaian..."
                                    value={filterValue}
                                    onChange={(event) =>
                                        setFilterValue(event.target.value)
                                    }
                                />
                            </div>

                            <Dialog
                                open={createDialogOpen}
                                onOpenChange={(open) => {
                                    setCreateDialogOpen(open);

                                    if (!open && !isSaving) {
                                        resetFormState();
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        type="button"
                                        onClick={openCreateDialog}
                                    >
                                        <Plus data-icon="inline-start" />
                                        Buat
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-sm">
                                    <form
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            const payload = {
                                                title: assessmentForm.title,
                                                description:
                                                    assessmentForm.description,
                                                course_id:
                                                    assessmentForm.course_id > 0
                                                        ? assessmentForm.course_id
                                                        : null,
                                                topic_id: null,
                                                bloom_level:
                                                    assessmentForm.bloom_level,
                                                grading_type:
                                                    assessmentForm.grading_type,
                                                passing_score: Number(
                                                    assessmentForm.passing_score,
                                                ),
                                                max_attempts: Number(
                                                    assessmentForm.max_attempts,
                                                ),
                                                time_limit_minutes:
                                                    assessmentForm.time_limit_minutes
                                                        ? Number(
                                                              assessmentForm.time_limit_minutes,
                                                          )
                                                        : null,
                                                quiz_questions:
                                                    quizQuestions.length > 0
                                                        ? quizQuestions
                                                        : undefined,
                                            };

                                            const requestUrl = isEditMode
                                                ? updateAssessment.url({
                                                      assessment:
                                                          editingAssessment.id,
                                                  })
                                                : storeAssessment.url();

                                            const method = isEditMode
                                                ? 'patch'
                                                : 'post';

                                            router[method](
                                                requestUrl,
                                                payload,
                                                {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                    onStart: () =>
                                                        setIsSaving(true),
                                                    onSuccess: () => {
                                                        toast.success(
                                                            isEditMode
                                                                ? 'Assessment updated successfully.'
                                                                : 'Assessment created successfully.',
                                                        );
                                                        resetFormState();
                                                        setCreateDialogOpen(
                                                            false,
                                                        );
                                                    },
                                                    onError: (formErrors) => {
                                                        const messages =
                                                            Object.values(
                                                                formErrors,
                                                            )
                                                                .flat()
                                                                .join(', ');
                                                        toast.error(
                                                            messages ||
                                                                'Failed to save assessment.',
                                                        );
                                                    },
                                                    onFinish: () =>
                                                        setIsSaving(false),
                                                },
                                            );
                                        }}
                                    >
                                        <DialogHeader>
                                            <DialogTitle>
                                                {isEditMode
                                                    ? 'Edit penilaian'
                                                    : 'Buat penilaian'}
                                            </DialogTitle>
                                            <DialogDescription>
                                                {isEditMode
                                                    ? 'Perbarui detail penilaian.'
                                                    : 'Tambahkan penilaian Taksonomi Bloom baru.'}
                                            </DialogDescription>
                                        </DialogHeader>

                                        <FieldGroup>
                                            <Field>
                                                <FieldLabel htmlFor="assessment-course">
                                                    Kursus{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <Popover
                                                    open={courseComboboxOpen}
                                                    onOpenChange={
                                                        setCourseComboboxOpen
                                                    }
                                                >
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            id="assessment-course"
                                                            variant="outline"
                                                            role="combobox"
                                                            className="w-full justify-between"
                                                        >
                                                            <span className="truncate">
                                                                {(() => {
                                                                    const course =
                                                                        courseOptions.find(
                                                                            (
                                                                                c,
                                                                            ) =>
                                                                                c.id ===
                                                                                assessmentForm.course_id,
                                                                        );

                                                                    if (
                                                                        course
                                                                    ) {
                                                                        return course.title;
                                                                    }

                                                                    return 'Pilih kursus...';
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
                                                            <CommandInput placeholder="Cari kursus..." />
                                                            <CommandList
                                                                style={{
                                                                    maxHeight:
                                                                        '16rem',
                                                                    overflowY:
                                                                        'auto',
                                                                }}
                                                            >
                                                                <CommandEmpty>
                                                                    No results
                                                                    found.
                                                                </CommandEmpty>
                                                                <CommandGroup>
                                                                    {courseOptions.map(
                                                                        (
                                                                            course,
                                                                        ) => (
                                                                            <CommandItem
                                                                                key={
                                                                                    course.id
                                                                                }
                                                                                value={
                                                                                    course.title
                                                                                }
                                                                                onSelect={() => {
                                                                                    setAssessmentForm(
                                                                                        (
                                                                                            current,
                                                                                        ) => ({
                                                                                            ...current,
                                                                                            course_id:
                                                                                                course.id,
                                                                                        }),
                                                                                    );
                                                                                    setCourseComboboxOpen(
                                                                                        false,
                                                                                    );
                                                                                }}
                                                                            >
                                                                                {
                                                                                    course.title
                                                                                }
                                                                                <Check
                                                                                    className={`ml-auto h-4 w-4 ${
                                                                                        assessmentForm.course_id ===
                                                                                        course.id
                                                                                            ? 'opacity-100'
                                                                                            : 'opacity-0'
                                                                                    }`}
                                                                                />
                                                                            </CommandItem>
                                                                        ),
                                                                    )}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </Field>

                                            <Field
                                                className="gap-2"
                                                data-invalid={
                                                    !!errors.title || undefined
                                                }
                                            >
                                                <FieldLabel htmlFor="assessment-title">
                                                    Judul{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <Input
                                                    id="assessment-title"
                                                    name="title"
                                                    placeholder="e.g., AES — Recall & Recognition"
                                                    value={assessmentForm.title}
                                                    onChange={(e) =>
                                                        setAssessmentForm(
                                                            (c) => ({
                                                                ...c,
                                                                title: e.target
                                                                    .value,
                                                            }),
                                                        )
                                                    }
                                                    aria-invalid={
                                                        !!errors.title
                                                    }
                                                    required
                                                />
                                                {errors.title && (
                                                    <FieldDescription className="text-destructive">
                                                        {errors.title}
                                                    </FieldDescription>
                                                )}
                                            </Field>

                                            <Field
                                                className="gap-2"
                                                data-invalid={
                                                    !!errors.description ||
                                                    undefined
                                                }
                                            >
                                                <FieldLabel htmlFor="assessment-description">
                                                    Deskripsi
                                                </FieldLabel>
                                                <Textarea
                                                    id="assessment-description"
                                                    name="description"
                                                    placeholder="Masukkan deskripsi penilaian"
                                                    value={
                                                        assessmentForm.description
                                                    }
                                                    onChange={(e) =>
                                                        setAssessmentForm(
                                                            (c) => ({
                                                                ...c,
                                                                description:
                                                                    e.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    rows={3}
                                                />
                                                {errors.description && (
                                                    <FieldDescription className="text-destructive">
                                                        {errors.description}
                                                    </FieldDescription>
                                                )}
                                            </Field>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Field>
                                                    <FieldLabel>
                                                        Tingkat Bloom{' '}
                                                        <span className="text-destructive">
                                                            *
                                                        </span>
                                                    </FieldLabel>
                                                    <Select
                                                        value={
                                                            assessmentForm.bloom_level
                                                        }
                                                        onValueChange={(v) =>
                                                            setAssessmentForm(
                                                                (c) => ({
                                                                    ...c,
                                                                    bloom_level:
                                                                        v as BloomLevel,
                                                                }),
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value="C1">
                                                                    C1 —
                                                                    Remember
                                                                </SelectItem>
                                                                <SelectItem value="C2">
                                                                    C2 —
                                                                    Understand
                                                                </SelectItem>
                                                                <SelectItem value="C3">
                                                                    C3 — Apply
                                                                </SelectItem>
                                                                <SelectItem value="C4">
                                                                    C4 — Analyze
                                                                </SelectItem>
                                                                <SelectItem value="C5">
                                                                    C5 —
                                                                    Evaluate
                                                                </SelectItem>
                                                                <SelectItem value="C6">
                                                                    C6 — Create
                                                                </SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </Field>

                                                <Field>
                                                    <FieldLabel>
                                                        Tipe Penilaian{' '}
                                                        <span className="text-destructive">
                                                            *
                                                        </span>
                                                    </FieldLabel>
                                                    <Select
                                                        value={
                                                            assessmentForm.grading_type
                                                        }
                                                        onValueChange={(v) =>
                                                            setAssessmentForm(
                                                                (c) => ({
                                                                    ...c,
                                                                    grading_type:
                                                                        v as GradingType,
                                                                }),
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value="auto">
                                                                    Auto
                                                                </SelectItem>
                                                                <SelectItem value="manual">
                                                                    Manual
                                                                </SelectItem>
                                                                <SelectItem value="mixed">
                                                                    Mixed
                                                                </SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </Field>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3">
                                                <Field>
                                                    <FieldLabel>
                                                        Nilai Lulus (%)
                                                    </FieldLabel>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={100}
                                                        value={
                                                            assessmentForm.passing_score
                                                        }
                                                        onChange={(e) =>
                                                            setAssessmentForm(
                                                                (c) => ({
                                                                    ...c,
                                                                    passing_score:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field>
                                                    <FieldLabel>
                                                        Maks Percobaan
                                                    </FieldLabel>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={10}
                                                        value={
                                                            assessmentForm.max_attempts
                                                        }
                                                        onChange={(e) =>
                                                            setAssessmentForm(
                                                                (c) => ({
                                                                    ...c,
                                                                    max_attempts:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field>
                                                    <FieldLabel>
                                                        Waktu (menit)
                                                    </FieldLabel>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={480}
                                                        value={
                                                            assessmentForm.time_limit_minutes
                                                        }
                                                        onChange={(e) =>
                                                            setAssessmentForm(
                                                                (c) => ({
                                                                    ...c,
                                                                    time_limit_minutes:
                                                                        e.target
                                                                            .value,
                                                                }),
                                                            )
                                                        }
                                                        placeholder="∞"
                                                    />
                                                </Field>
                                            </div>

                                            <Field>
                                                <FieldLabel htmlFor="assessment-quiz-import">
                                                    Impor Soal{' '}
                                                    {!isEditMode &&
                                                        quizQuestions.length ===
                                                            0 && (
                                                            <span className="text-destructive">
                                                                *
                                                            </span>
                                                        )}
                                                </FieldLabel>

                                                <div className="flex gap-2">
                                                    <Input
                                                        id="assessment-quiz-import"
                                                        type="file"
                                                        accept=".csv"
                                                        className="flex-1"
                                                        onChange={async (
                                                            event,
                                                        ) => {
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
                                                                        'Tidak ada soal ditemukan di file.',
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
                                                                    `Berhasil mengimpor ${parsedRows.length} soal.`,
                                                                );
                                                            } catch {
                                                                toast.error(
                                                                    'Gagal membaca file. Silakan gunakan format template.',
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        className="shrink-0"
                                                        onClick={() =>
                                                            downloadQuizTemplate(
                                                                'csv',
                                                                assessmentForm.bloom_level,
                                                            )
                                                        }
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <FieldDescription>
                                                    Unggah CSV atau klik tombol
                                                    di bawah untuk tambah manual
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
                                                            soal
                                                            {quizQuestions.length !==
                                                            1
                                                                ? 's'
                                                                : ''}
                                                            )
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Quiz Preview */}
                                                {quizQuestions.length > 0 && (
                                                    <>
                                                        <div className="mt-3 max-h-96 space-y-2 overflow-y-auto rounded-lg border p-3">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <span className="text-sm font-medium">
                                                                    Preview
                                                                    Pertanyaan (
                                                                    {
                                                                        quizQuestions.length
                                                                    }
                                                                    )
                                                                </span>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {quizQuestions.map(
                                                                    (q, i) => (
                                                                        <div
                                                                            key={
                                                                                i
                                                                            }
                                                                            className="rounded-lg border bg-muted/30 p-3 text-sm"
                                                                        >
                                                                            <div className="mb-2 flex items-start justify-between gap-2">
                                                                                <p className="flex-1 font-medium">
                                                                                    {i +
                                                                                        1}

                                                                                    .{' '}
                                                                                    {
                                                                                        q.question
                                                                                    }
                                                                                </p>
                                                                                <div className="flex shrink-0 gap-1">
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-7 w-7 p-0"
                                                                                        onClick={() =>
                                                                                            openQuestionEditor(
                                                                                                i,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                                                        onClick={() =>
                                                                                            deleteQuestion(
                                                                                                i,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-1 pl-4">
                                                                                {q.options.map(
                                                                                    (
                                                                                        opt,
                                                                                        j,
                                                                                    ) => (
                                                                                        <div
                                                                                            key={
                                                                                                j
                                                                                            }
                                                                                            className={
                                                                                                j ===
                                                                                                q.correct_option
                                                                                                    ? 'font-medium text-emerald-600'
                                                                                                    : 'text-muted-foreground'
                                                                                            }
                                                                                        >
                                                                                            {j ===
                                                                                                q.correct_option &&
                                                                                                '✓ '}
                                                                                            {
                                                                                                opt
                                                                                            }
                                                                                        </div>
                                                                                    ),
                                                                                )}
                                                                            </div>
                                                                            {q.explanation && (
                                                                                <p className="mt-2 pl-4 text-xs text-muted-foreground">
                                                                                    💡{' '}
                                                                                    {
                                                                                        q.explanation
                                                                                    }
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={() =>
                                                                openQuestionEditor()
                                                            }
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Tambah Pertanyaan
                                                        </Button>
                                                    </>
                                                )}
                                            </Field>
                                        </FieldGroup>

                                        <DialogFooter className="mt-6">
                                            <DialogClose asChild>
                                                <Button
                                                    variant="outline"
                                                    type="button"
                                                    disabled={isSaving}
                                                >
                                                    Batal
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="submit"
                                                disabled={isSaving}
                                            >
                                                {isSaving && (
                                                    <Spinner data-icon="inline-start" />
                                                )}
                                                {isEditMode
                                                    ? 'Simpan perubahan'
                                                    : 'Buat penilaian'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            {/* Question Editor Dialog */}
                            <Dialog
                                open={questionEditorOpen}
                                onOpenChange={setQuestionEditorOpen}
                            >
                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {editingQuestionIndex !== null
                                                ? 'Edit Pertanyaan'
                                                : 'Tambah Pertanyaan'}
                                        </DialogTitle>
                                        <DialogDescription>
                                            Isi pertanyaan, 4 opsi jawaban, dan
                                            pilih jawaban yang benar.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <FieldGroup>
                                        <Field>
                                            <FieldLabel htmlFor="q-question">
                                                Pertanyaan{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Textarea
                                                id="q-question"
                                                value={questionForm.question}
                                                onChange={(e) =>
                                                    setQuestionForm((prev) => ({
                                                        ...prev,
                                                        question:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="Masukkan pertanyaan"
                                                rows={3}
                                            />
                                        </Field>

                                        <Field>
                                            <FieldLabel>
                                                Opsi Jawaban{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <div className="space-y-2">
                                                {questionForm.options.map(
                                                    (opt, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Input
                                                                value={opt}
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const newOptions =
                                                                        [
                                                                            ...questionForm.options,
                                                                        ] as [
                                                                            string,
                                                                            string,
                                                                            string,
                                                                            string,
                                                                        ];
                                                                    newOptions[
                                                                        idx
                                                                    ] =
                                                                        e.target.value;
                                                                    setQuestionForm(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            options:
                                                                                newOptions,
                                                                        }),
                                                                    );
                                                                }}
                                                                placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant={
                                                                    questionForm.correct_option ===
                                                                    idx
                                                                        ? 'default'
                                                                        : 'outline'
                                                                }
                                                                size="sm"
                                                                className="shrink-0"
                                                                onClick={() =>
                                                                    setQuestionForm(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            correct_option:
                                                                                idx,
                                                                        }),
                                                                    )
                                                                }
                                                            >
                                                                {questionForm.correct_option ===
                                                                idx ? (
                                                                    <Check className="h-4 w-4" />
                                                                ) : (
                                                                    'Benar'
                                                                )}
                                                            </Button>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                            <FieldDescription>
                                                Klik tombol "Benar" untuk
                                                menandai jawaban yang benar
                                            </FieldDescription>
                                        </Field>

                                        <Field>
                                            <FieldLabel htmlFor="q-explanation">
                                                Penjelasan
                                            </FieldLabel>
                                            <Textarea
                                                id="q-explanation"
                                                value={questionForm.explanation}
                                                onChange={(e) =>
                                                    setQuestionForm((prev) => ({
                                                        ...prev,
                                                        explanation:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="Penjelasan jawaban (opsional)"
                                                rows={2}
                                            />
                                        </Field>
                                    </FieldGroup>

                                    <DialogFooter className="mt-6">
                                        <DialogClose asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                            >
                                                Batal
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            type="button"
                                            onClick={saveQuestion}
                                        >
                                            {editingQuestionIndex !== null
                                                ? 'Perbarui'
                                                : 'Tambah'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    }
                />

                {/* Table */}
                <section className="grid gap-4">
                    <div className="flex flex-col gap-4">
                        {selectedCourseId === 0 && filterValue.trim() === '' ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <Search />
                                    </EmptyMedia>
                                    <EmptyTitle>
                                        Tidak ada penilaian ditemukan
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        Pilih kursus lain atau cari dengan kata
                                        kunci lain.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : filteredAssessments.length === 0 ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <Search />
                                    </EmptyMedia>
                                    <EmptyTitle>
                                        Tidak ada penilaian ditemukan
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        Coba kursus atau kata kunci lain.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredAssessments}
                                centered
                                showFilterInput={false}
                                showColumnToggle={false}
                                showPageInfo={false}
                                enableDefaultIdSort={false}
                                getRowDataId={(row) => String(row.id)}
                                dragHandleActiveRowId={dragHandleActiveRowId}
                                onRowDrop={reorderRows}
                                onRowDragEnd={() =>
                                    setDragHandleActiveRowId(null)
                                }
                                page={assessments.current_page}
                                pageCount={assessments.last_page}
                                pageSize={assessments.per_page}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                                footerInfo={`Showing ${assessments.from ?? 0} - ${assessments.to ?? 0} of ${assessments.total} Assessments`}
                            />
                        )}
                    </div>
                </section>

                <section className="grid gap-4">
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold">
                                    Question Builder
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {selectedAssessment
                                        ? `Kelola soal untuk ${selectedAssessment.title}.`
                                        : 'Pilih Kelola Soal pada salah satu assessment untuk membuka daftar soal.'}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Dialog
                                    open={manualQuestionOpen}
                                    onOpenChange={(open) => {
                                        setManualQuestionOpen(open);

                                        if (open) {
                                            setQuestionForm({
                                                question: '',
                                                options: ['', '', '', ''],
                                                correct_option: 0,
                                                explanation: '',
                                            });
                                        }
                                    }}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            type="button"
                                            disabled={!selectedAssessmentId}
                                        >
                                            <Plus data-icon="inline-start" />
                                            Add Manual Question
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>
                                                Add Manual Question
                                            </DialogTitle>
                                            <DialogDescription>
                                                Buat soal lokal yang hanya
                                                melekat pada assessment ini.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <FieldGroup>
                                            <Field>
                                                <FieldLabel htmlFor="manual-question-text">
                                                    Pertanyaan{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <Textarea
                                                    id="manual-question-text"
                                                    value={
                                                        questionForm.question
                                                    }
                                                    onChange={(e) =>
                                                        setQuestionForm(
                                                            (prev) => ({
                                                                ...prev,
                                                                question:
                                                                    e.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    placeholder="Masukkan pertanyaan"
                                                    rows={3}
                                                />
                                            </Field>

                                            <Field>
                                                <FieldLabel>
                                                    Opsi Jawaban{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <div className="space-y-2">
                                                    {questionForm.options.map(
                                                        (option, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Input
                                                                    value={
                                                                        option
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const nextOptions =
                                                                            [
                                                                                ...questionForm.options,
                                                                            ] as [
                                                                                string,
                                                                                string,
                                                                                string,
                                                                                string,
                                                                            ];
                                                                        nextOptions[
                                                                            index
                                                                        ] =
                                                                            e.target.value;
                                                                        setQuestionForm(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                options:
                                                                                    nextOptions,
                                                                            }),
                                                                        );
                                                                    }}
                                                                    placeholder={`Opsi ${String.fromCharCode(65 + index)}`}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant={
                                                                        questionForm.correct_option ===
                                                                        index
                                                                            ? 'default'
                                                                            : 'outline'
                                                                    }
                                                                    size="sm"
                                                                    className="shrink-0"
                                                                    onClick={() =>
                                                                        setQuestionForm(
                                                                            (
                                                                                prev,
                                                                            ) => ({
                                                                                ...prev,
                                                                                correct_option:
                                                                                    index,
                                                                            }),
                                                                        )
                                                                    }
                                                                >
                                                                    {questionForm.correct_option ===
                                                                    index ? (
                                                                        <Check className="h-4 w-4" />
                                                                    ) : (
                                                                        'Benar'
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </Field>

                                            <Field>
                                                <FieldLabel htmlFor="manual-question-explanation">
                                                    Penjelasan
                                                </FieldLabel>
                                                <Textarea
                                                    id="manual-question-explanation"
                                                    value={
                                                        questionForm.explanation
                                                    }
                                                    onChange={(e) =>
                                                        setQuestionForm(
                                                            (prev) => ({
                                                                ...prev,
                                                                explanation:
                                                                    e.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    placeholder="Penjelasan jawaban (opsional)"
                                                    rows={2}
                                                />
                                            </Field>
                                        </FieldGroup>

                                        <DialogFooter className="mt-6">
                                            <DialogClose asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                >
                                                    Batal
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="button"
                                                onClick={
                                                    saveManualQuestionToAssessment
                                                }
                                            >
                                                Simpan Soal
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <Dialog
                                    open={questionBankOpen}
                                    onOpenChange={setQuestionBankOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={!selectedAssessmentId}
                                        >
                                            <Search data-icon="inline-start" />
                                            Pick From Bank
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-3xl">
                                        <DialogHeader>
                                            <DialogTitle>
                                                Question Bank
                                            </DialogTitle>
                                            <DialogDescription>
                                                Cari soal reusable dan tambahkan
                                                ke assessment terpilih sebagai
                                                snapshot.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="max-h-[30rem] space-y-3 overflow-y-auto pr-1">
                                            {questionBank.data.length === 0 ? (
                                                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                                    Belum ada soal aktif di
                                                    Question Bank.
                                                </div>
                                            ) : (
                                                questionBank.data.map(
                                                    (question) => (
                                                        <div
                                                            key={question.id}
                                                            className="rounded-lg border p-4"
                                                        >
                                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                                <div className="space-y-2">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <Badge variant="secondary">
                                                                            From
                                                                            Bank
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
                                                                    <p className="font-medium">
                                                                        {
                                                                            question.title
                                                                        }
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {
                                                                            question.question_text
                                                                        }
                                                                    </p>
                                                                    {question.category ? (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Category:{' '}
                                                                            {
                                                                                question.category
                                                                            }
                                                                        </p>
                                                                    ) : null}
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        attachBankQuestion(
                                                                            question,
                                                                        )
                                                                    }
                                                                >
                                                                    <Plus data-icon="inline-start" />
                                                                    Tambahkan
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ),
                                                )
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {selectedAssessmentId ? (
                            <div className="mt-4 grid gap-3">
                                {questions.length === 0 ? (
                                    <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                                        Assessment ini belum memiliki soal.
                                    </div>
                                ) : (
                                    questions.map((question, index) => (
                                        <div
                                            key={question.id}
                                            className="rounded-lg border p-4"
                                        >
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge
                                                            variant={
                                                                question.question_bank_id
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {question.question_bank_id
                                                                ? 'From Bank'
                                                                : 'Local'}
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
                                                    <p className="font-medium">
                                                        {index + 1}.{' '}
                                                        {question.question_text}
                                                    </p>
                                                    {question.explanation ? (
                                                        <p className="text-sm text-muted-foreground">
                                                            {
                                                                question.explanation
                                                            }
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                                    {!question.question_bank_id ? (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                saveAssessmentQuestionToBank(
                                                                    question,
                                                                )
                                                            }
                                                        >
                                                            <Plus data-icon="inline-start" />
                                                            Save to Bank
                                                        </Button>
                                                    ) : null}
                                                    <Badge variant="outline">
                                                        {question.points} pts
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : null}
                    </div>
                </section>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deletingAssessment}
                onOpenChange={() => setDeletingAssessment(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;
                            {deletingAssessment?.title}&quot;? This will also
                            delete all questions and submissions. This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
