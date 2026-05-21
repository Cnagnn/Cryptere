import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Archive,
    ArrowRightLeft,
    BadgeCheck,
    BookOpen,
    Brain,
    Check,
    ChevronsUpDown,
    CircleDashed,
    ClipboardCheck,
    Cog,
    HelpCircle,
    History,
    Lightbulb,
    MoreHorizontal,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    SearchCheck,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import {
    destroy as destroyAssessment,
    reorder as reorderAssessments,
    store as storeAssessment,
    update as updateAssessment,
} from '@/routes/admin/assessments';
import {
    destroy as destroyAssessmentQuestion,
    reorder as reorderAssessmentQuestions,
    store as storeAssessmentQuestion,
    update as updateAssessmentQuestion,
} from '@/routes/admin/assessments/questions';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import type {
    AdminAssessment,
    AdminAssessmentQuestion,
    BloomLevel,
    GradingType,
    QuestionBank,
    QuestionType,
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

type VersionHistoryItem = {
    id: number;
    version_number: number;
    changed_fields: string[];
    change_summary: string | null;
    creator_name: string | null;
    created_at: string | null;
    restored_at: string | null;
};

function formatVersionDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

type Props = {
    assessments: Paginated<AdminAssessment>;
    allAssessments: { id: number; title: string; course_id: number; course_title: string }[];
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

const BLOOM_CONFIG: Record<BloomLevel, { label: string; icon: typeof BookOpen; iconClass: string }> = {
    C1: { label: 'C1-Remember', icon: BookOpen, iconClass: 'text-emerald-500' },
    C2: { label: 'C2-Understand', icon: Lightbulb, iconClass: 'text-blue-500' },
    C3: { label: 'C3-Apply', icon: Cog, iconClass: 'text-amber-500' },
    C4: { label: 'C4-Analyze', icon: SearchCheck, iconClass: 'text-purple-500' },
    C5: { label: 'C5-Evaluate', icon: Brain, iconClass: 'text-rose-500' },
    C6: { label: 'C6-Create', icon: Sparkles, iconClass: 'text-indigo-500' },
};

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
    { value: 'mcq', label: 'Pilihan Ganda (PG)' },
    { value: 'multiple_select', label: 'Pilihan Ganda Kompleks (PGK)' },
    { value: 'true_false', label: 'Benar / Salah (BS)' },
    { value: 'matching', label: 'Menjodohkan (Matching)' },
    { value: 'short_answer', label: 'Isian Singkat (Short Answer)' },
    { value: 'essay', label: 'Esai / Uraian (Essay)' },
];

// ── Question Type Fields (inlined) ───────────────────────────────────────────

function parseMultiSelectAnswer(value: string): string[] {
    if (!value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);

        return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === 'string')
            : [];
    } catch {
        return [];
    }
}


type MatchingPair = { left: string; right: string };

function parseMatchingPairs(
    options: string[],
    correctAnswer: string,
): MatchingPair[] {
    let map: Record<string, string> = {};

    if (correctAnswer) {
        try {
            const parsed = JSON.parse(correctAnswer);

            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                map = Object.fromEntries(
                    Object.entries(parsed).map(([key, value]) => [String(key), String(value ?? '')]),
                );
            }
        } catch {
            map = {};
        }
    }

    const fromOptions = (options ?? []).map((entry) => {
        const [left, right = ''] = String(entry ?? '').split('::');

        return { left, right };
    });

    const merged: MatchingPair[] = fromOptions.map((pair) => ({
        left: pair.left,
        right: pair.left && map[pair.left] !== undefined ? map[pair.left] : pair.right,
    }));

    while (merged.length < 4) {
        merged.push({ left: '', right: '' });
    }

    return merged;
}

function QuestionTypeFields({
    idPrefix,
    questionType,
    options,
    correctAnswer,
    minWords,
    maxWords,
    onOptionsChange,
    onCorrectAnswerChange,
    onMinWordsChange,
    onMaxWordsChange,
}: {
    idPrefix: string;
    questionType: QuestionType;
    options: string[];
    correctAnswer: string;
    minWords: string;
    maxWords: string;
    onOptionsChange: (options: string[]) => void;
    onCorrectAnswerChange: (value: string) => void;
    onMinWordsChange: (value: string) => void;
    onMaxWordsChange: (value: string) => void;
}) {
    if (questionType === 'mcq') {
        return (
            <Field>
                <FieldLabel>
                    Pilihan Jawaban <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldDescription>
                    Tandai pilihan yang benar dengan tombol di sebelah kanan.
                </FieldDescription>
                <div className="grid gap-2">
                    {options.map((option, index) => {
                        const isCorrect =
                            option.trim() !== '' && correctAnswer.trim() !== '' && correctAnswer === option;

                        return (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    id={`${idPrefix}-option-${index}`}
                                    value={option}
                                    placeholder={`Pilihan ${index + 1}`}
                                    onChange={(event) => {
                                        const next = [...options];
                                        const oldValue = next[index];
                                        next[index] = event.target.value;
                                        onOptionsChange(next);

                                        if (correctAnswer === oldValue && oldValue !== '') {
                                            onCorrectAnswerChange(event.target.value);
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant={isCorrect ? 'default' : 'outline'}
                                    size="icon"
                                    aria-label={isCorrect ? 'Jawaban benar' : 'Tandai sebagai benar'}
                                    aria-pressed={isCorrect}
                                    disabled={option.trim() === ''}
                                    onClick={() => onCorrectAnswerChange(isCorrect ? '' : option)}
                                    className={cn('shrink-0', isCorrect && 'bg-emerald-500 text-white hover:bg-emerald-600')}
                                >
                                    <Check />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </Field>
        );
    }

    if (questionType === 'multiple_select') {
        const selected = parseMultiSelectAnswer(correctAnswer);

        const toggleOption = (option: string) => {
            if (option.trim() === '') {
                return;
            }

            const next = selected.includes(option)
                ? selected.filter((value) => value !== option)
                : [...selected, option];
            onCorrectAnswerChange(JSON.stringify(next));
        };

        return (
            <Field>
                <FieldLabel>
                    Pilihan Jawaban <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldDescription>
                    Tandai semua pilihan yang benar dengan tombol di sebelah kanan.
                </FieldDescription>
                <div className="grid gap-2">
                    {options.map((option, index) => {
                        const isCorrect = option.trim() !== '' && selected.includes(option);

                        return (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    id={`${idPrefix}-option-${index}`}
                                    value={option}
                                    placeholder={`Pilihan ${index + 1}`}
                                    onChange={(event) => {
                                        const next = [...options];
                                        const oldValue = next[index];
                                        next[index] = event.target.value;
                                        onOptionsChange(next);

                                        if (oldValue !== '' && selected.includes(oldValue)) {
                                            const newSelected = selected.map((s) =>
                                                s === oldValue ? event.target.value : s,
                                            );
                                            onCorrectAnswerChange(JSON.stringify(newSelected));
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant={isCorrect ? 'default' : 'outline'}
                                    size="icon"
                                    aria-label={isCorrect ? 'Jawaban benar' : 'Tandai sebagai benar'}
                                    aria-pressed={isCorrect}
                                    disabled={option.trim() === ''}
                                    onClick={() => toggleOption(option)}
                                    className={cn('shrink-0', isCorrect && 'bg-emerald-500 text-white hover:bg-emerald-600')}
                                >
                                    <Check />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </Field>
        );
    }

    if (questionType === 'true_false') {
        const isTrue = correctAnswer === 'true';
        const isFalse = correctAnswer === 'false';

        return (
            <Field>
                <FieldLabel>
                    Jawaban Benar <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldDescription>Tandai jawaban yang benar.</FieldDescription>
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant={isTrue ? 'default' : 'outline'}
                        aria-pressed={isTrue}
                        onClick={() => onCorrectAnswerChange('true')}
                        className={cn(isTrue && 'bg-emerald-500 text-white hover:bg-emerald-600')}
                    >
                        <Check />
                        Benar
                    </Button>
                    <Button
                        type="button"
                        variant={isFalse ? 'default' : 'outline'}
                        aria-pressed={isFalse}
                        onClick={() => onCorrectAnswerChange('false')}
                        className={cn(isFalse && 'bg-rose-500 text-white hover:bg-rose-600')}
                    >
                        <X />
                        Salah
                    </Button>
                </div>
            </Field>
        );
    }

    if (questionType === 'matching') {
        const pairs = parseMatchingPairs(options, correctAnswer);

        const updatePair = (index: number, key: 'left' | 'right', value: string) => {
            const next = pairs.map((pair, i) => (i === index ? { ...pair, [key]: value } : pair));
            const nextOptions = next.map((pair) => `${pair.left}::${pair.right}`);
            const nextAnswer = next.reduce<Record<string, string>>((acc, pair) => {
                if (pair.left.trim() !== '') {
                    acc[pair.left] = pair.right;
                }

                return acc;
            }, {});
            onOptionsChange(nextOptions);
            onCorrectAnswerChange(JSON.stringify(nextAnswer));
        };

        return (
            <Field>
                <FieldLabel>
                    Pasangan <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldDescription>
                    Pasangkan premis (kiri) dengan target jawaban (kanan).
                </FieldDescription>
                <div className="grid gap-2">
                    {pairs.map((pair, index) => (
                        <div key={index} className="grid grid-cols-2 gap-2">
                            <Input
                                id={`${idPrefix}-pair-${index}-left`}
                                value={pair.left}
                                placeholder={`Premis ${index + 1}`}
                                onChange={(event) => updatePair(index, 'left', event.target.value)}
                            />
                            <Input
                                id={`${idPrefix}-pair-${index}-right`}
                                value={pair.right}
                                placeholder={`Target ${index + 1}`}
                                onChange={(event) => updatePair(index, 'right', event.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </Field>
        );
    }

    if (questionType === 'short_answer') {
        return (
            <Field>
                <FieldLabel htmlFor={`${idPrefix}-correct-answer`}>
                    Jawaban Benar <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                    id={`${idPrefix}-correct-answer`}
                    value={correctAnswer}
                    onChange={(event) => onCorrectAnswerChange(event.target.value)}
                    placeholder="Jawaban yang diharapkan"
                />
            </Field>
        );
    }

    // essay
    return (
        <div className="grid grid-cols-2 gap-3">
            <Field>
                <FieldLabel htmlFor={`${idPrefix}-min-words`}>Min. Kata</FieldLabel>
                <Input
                    id={`${idPrefix}-min-words`}
                    type="number"
                    min={1}
                    value={minWords}
                    onChange={(event) => onMinWordsChange(event.target.value)}
                    placeholder="Opsional"
                />
            </Field>
            <Field>
                <FieldLabel htmlFor={`${idPrefix}-max-words`}>Maks. Kata</FieldLabel>
                <Input
                    id={`${idPrefix}-max-words`}
                    type="number"
                    min={1}
                    value={maxWords}
                    onChange={(event) => onMaxWordsChange(event.target.value)}
                    placeholder="Opsional"
                />
            </Field>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

function defaultGradingTypeFor(): GradingType {
    return 'auto';
}

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
            label: 'Draft',
            variant: 'outline' as const,
            iconClass: 'text-amber-500',
        },
        published: {
            icon: BadgeCheck,
            label: 'Published',
            variant: 'outline' as const,
            iconClass: 'text-emerald-500',
        },
        archived: {
            icon: Archive,
            label: 'Archived',
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

export default function AdminCoursesAssessment({
    assessments,
    allAssessments,
    questions,
    selectedAssessmentId,
    courseOptions,
    selectedCourseId,
    courseFilterSelected,
    versionHistories,
}: Props) {
    const [filterValue] = useState('');
    const [rows, setRows] = useState<AdminAssessment[]>(assessments.data);
    const [prevData, setPrevData] = useState(assessments.data);
    const [questionRows, setQuestionRows] =
        useState<AdminAssessmentQuestion[]>(questions);
    const [prevQuestions, setPrevQuestions] = useState(questions);

    if (prevData !== assessments.data) {
        setPrevData(assessments.data);
        setRows(assessments.data);
    }

    if (prevQuestions !== questions) {
        setPrevQuestions(questions);
        setQuestionRows(questions);
    }

    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [dragHandleActiveRowId, setDragHandleActiveRowId] = useState<
        string | null
    >(null);
    const [questionDragHandleActiveRowId, setQuestionDragHandleActiveRowId] =
        useState<string | null>(null);
    const [deletingAssessment, setDeletingAssessment] =
        useState<AdminAssessment | null>(null);
    const [deletingAssessmentQuestion, setDeletingAssessmentQuestion] =
        useState<AdminAssessmentQuestion | null>(null);
    const [editingAssessmentQuestion, setEditingAssessmentQuestion] =
        useState<AdminAssessmentQuestion | null>(null);
    const [restoreTarget, setRestoreTarget] =
        useState<VersionHistoryItem | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createQuestionDialogOpen, setCreateQuestionDialogOpen] = useState(false);
    const [editingAssessment, setEditingAssessment] =
        useState<AdminAssessment | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const isEditMode = editingAssessment !== null;

    // Tab state
    const [activeTab, setActiveTab] = useState<'assessment' | 'question'>('assessment');
    const [isLoading, setIsLoading] = useState(false);
    const [cachedData, setCachedData] = useState({
        assessments: assessments,
        questions: questions,
    });

    // Combobox states
    const [courseComboboxOpen, setCourseComboboxOpen] = useState(false);

    const [assessmentQuestionForm, setAssessmentQuestionForm] = useState({
        question_text: '',
        explanation: '',
        points: '10',
        question_type: 'essay' as QuestionType,
        options: ['', '', '', ''] as string[],
        correct_answer: '',
        min_words: '',
        max_words: '',
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

    // Auto-switch to question tab when assessment is selected
    useEffect(() => {
        if (selectedAssessmentId > 0) {
            setActiveTab('question');
        } else {
            setActiveTab('assessment');
        }
    }, [selectedAssessmentId]);

    const sectionUrl = useCallback(
        (query: Record<string, unknown>) =>
            adminCoursesIndex.url({ query: { section: 'assessment', ...query } }),
        [],
    );

    // Instant tab switching with lazy loading
    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value as 'assessment' | 'question');
        window.history.replaceState(
            null,
            '',
            sectionUrl({
                course_id: selectedCourseId || undefined,
                page: value === 'assessment' ? assessments.current_page : 1,
                per_page: assessments.per_page,
            }),
        );

        const needsData =
            (value === 'assessment' &&
                (!cachedData.assessments ||
                    !cachedData.assessments.data ||
                    cachedData.assessments.data.length === 0)) ||
            (value === 'question' &&
                selectedAssessmentId > 0 &&
                (!cachedData.questions || cachedData.questions.length === 0));

        if (needsData) {
            setIsLoading(true);
            router.reload({
                only: ['assessments', 'questions'],
                onSuccess: (page: any) => {
                    setCachedData({
                        assessments: page.props.assessments || cachedData.assessments,
                        questions: page.props.questions || cachedData.questions,
                    });
                    setIsLoading(false);
                },
            });
        }
    }, [cachedData, selectedCourseId, selectedAssessmentId, assessments.current_page, assessments.per_page, sectionUrl]);

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

    const reorderQuestionRows = (sourceRowId: string, targetRowId: string) => {
        if (!selectedAssessmentId || sourceRowId === targetRowId) {
            return;
        }

        setQuestionRows((currentRows) => {
            const sourceIndex = currentRows.findIndex(
                (question) => String(question.id) === sourceRowId,
            );
            const targetIndex = currentRows.findIndex(
                (question) => String(question.id) === targetRowId,
            );

            if (sourceIndex < 0 || targetIndex < 0) {
                return currentRows;
            }

            const nextRows = [...currentRows];
            const [movedRow] = nextRows.splice(sourceIndex, 1);
            nextRows.splice(targetIndex, 0, movedRow);

            router.post(
                reorderAssessmentQuestions.url(selectedAssessmentId),
                {
                    items: nextRows.map((question, index) => ({
                        id: question.id,
                        sort_order: index + 1,
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

    const openEditAssessmentQuestionDialog = (
        question: AdminAssessmentQuestion,
    ): void => {
        setEditingAssessmentQuestion(question);

        const optionEditableTypes: QuestionType[] = [
            'mcq',
            'multiple_select',
            'matching',
        ];

        const initialOptions = optionEditableTypes.includes(
            question.question_type,
        )
            ? [
                  ...((question.options ?? []) as string[]),
                  '',
                  '',
                  '',
                  '',
              ].slice(0, Math.max(4, question.options?.length ?? 0))
            : ['', '', '', ''];

        setAssessmentQuestionForm({
            question_text: question.question_text,
            explanation: question.explanation ?? '',
            points: String(question.points),
            question_type: question.question_type,
            options: initialOptions,
            correct_answer: question.correct_answer ?? '',
            min_words:
                question.min_words !== null && question.min_words !== undefined
                    ? String(question.min_words)
                    : '',
            max_words:
                question.max_words !== null && question.max_words !== undefined
                    ? String(question.max_words)
                    : '',
        });
    };

    const buildQuestionTypePayload = (type: QuestionType) => {
        const trimmedOptions = assessmentQuestionForm.options
            .map((option) => option.trim())
            .filter((option) => option !== '');

        switch (type) {
            case 'mcq':
                return {
                    options: trimmedOptions,
                    correct_answer:
                        assessmentQuestionForm.correct_answer.trim() || null,
                    min_words: null,
                    max_words: null,
                };
            case 'multiple_select':
                return {
                    options: trimmedOptions,
                    correct_answer:
                        assessmentQuestionForm.correct_answer.trim() || null,
                    min_words: null,
                    max_words: null,
                };
            case 'true_false':
                return {
                    options: ['true', 'false'],
                    correct_answer:
                        assessmentQuestionForm.correct_answer.trim() || null,
                    min_words: null,
                    max_words: null,
                };
            case 'matching':
                return {
                    options: trimmedOptions,
                    correct_answer:
                        assessmentQuestionForm.correct_answer.trim() || null,
                    min_words: null,
                    max_words: null,
                };
            case 'short_answer':
                return {
                    options: null,
                    correct_answer:
                        assessmentQuestionForm.correct_answer.trim() || null,
                    min_words: null,
                    max_words: null,
                };
            case 'essay':
            default:
                return {
                    options: null,
                    correct_answer: null,
                    min_words: assessmentQuestionForm.min_words
                        ? Number(assessmentQuestionForm.min_words)
                        : null,
                    max_words: assessmentQuestionForm.max_words
                        ? Number(assessmentQuestionForm.max_words)
                        : null,
                };
        }
    };

    const validateQuestionTypePayload = (type: QuestionType): boolean => {
        const filledOptions = assessmentQuestionForm.options.filter(
            (option) => option.trim() !== '',
        );

        if (type === 'mcq') {
            if (filledOptions.length < 2) {
                toast.error('Sediakan minimal 2 pilihan untuk Pilihan Ganda.');

                return false;
            }

            if (
                assessmentQuestionForm.correct_answer.trim() !== '' &&
                !filledOptions.includes(
                    assessmentQuestionForm.correct_answer.trim(),
                )
            ) {
                toast.error('Jawaban benar harus salah satu dari pilihan.');

                return false;
            }
        }

        if (type === 'multiple_select') {
            if (filledOptions.length < 2) {
                toast.error(
                    'Sediakan minimal 2 pilihan untuk Pilihan Ganda Kompleks.',
                );

                return false;
            }

            const selected = parseMultiSelectAnswer(
                assessmentQuestionForm.correct_answer,
            );

            if (selected.length === 0) {
                toast.error('Pilih minimal satu jawaban benar.');

                return false;
            }

            const invalid = selected.filter(
                (option) => !filledOptions.includes(option),
            );

            if (invalid.length > 0) {
                toast.error('Jawaban benar harus berasal dari daftar pilihan.');

                return false;
            }
        }

        if (type === 'matching') {
            const pairs = parseMatchingPairs(
                assessmentQuestionForm.options,
                assessmentQuestionForm.correct_answer,
            ).filter(
                (pair) => pair.left.trim() !== '' || pair.right.trim() !== '',
            );

            if (pairs.length < 2) {
                toast.error('Sediakan minimal 2 pasangan untuk Menjodohkan.');

                return false;
            }

            const incomplete = pairs.some(
                (pair) =>
                    pair.left.trim() === '' || pair.right.trim() === '',
            );

            if (incomplete) {
                toast.error('Setiap pasangan harus diisi premis dan target.');

                return false;
            }
        }

        if (type === 'short_answer') {
            if (assessmentQuestionForm.correct_answer.trim() === '') {
                toast.error('Jawaban benar wajib diisi.');

                return false;
            }
        }

        if (type === 'true_false') {
            if (assessmentQuestionForm.correct_answer.trim() === '') {
                toast.error('Pilih jawaban benar atau salah.');

                return false;
            }
        }

        return true;
    };

    const saveAssessmentQuestionUpdate = (): void => {
        if (!selectedAssessmentId || !editingAssessmentQuestion) {
            return;
        }

        if (!assessmentQuestionForm.question_text.trim()) {
            toast.error('Question cannot be empty.');

            return;
        }

        const questionType = assessmentQuestionForm.question_type;

        if (!validateQuestionTypePayload(questionType)) {
            return;
        }

        const typePayload = buildQuestionTypePayload(questionType);

        router.patch(
            updateAssessmentQuestion.url({
                assessment: selectedAssessmentId,
                question: editingAssessmentQuestion.id,
            }),
            {
                bloom_level: editingAssessmentQuestion.bloom_level,
                question_type: questionType,
                question_text: assessmentQuestionForm.question_text,
                options: typePayload.options,
                correct_answer: typePayload.correct_answer,
                explanation: assessmentQuestionForm.explanation || null,
                rubric: editingAssessmentQuestion.rubric,
                points: 10,
                grading_type: editingAssessmentQuestion.grading_type,
                min_words: typePayload.min_words,
                max_words: typePayload.max_words,
                question_bank_id: editingAssessmentQuestion.question_bank_id,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Question updated.');
                    setEditingAssessmentQuestion(null);
                },
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(messages || 'Failed to update question.');
                },
            },
        );
    };

    const openCreateQuestionDialog = (): void => {
        setAssessmentQuestionForm({
            question_text: '',
            explanation: '',
            points: '10',
            question_type: 'essay',
            options: ['', '', '', ''],
            correct_answer: '',
            min_words: '',
            max_words: '',
        });
        setCreateQuestionDialogOpen(true);
    };

    const saveNewAssessmentQuestion = (): void => {
        if (!selectedAssessmentId) {
            toast.error('Select assessment first.');

            return;
        }

        if (!assessmentQuestionForm.question_text.trim()) {
            toast.error('Question cannot be empty.');

            return;
        }

        const questionType = assessmentQuestionForm.question_type;

        if (!validateQuestionTypePayload(questionType)) {
            return;
        }

        const typePayload = buildQuestionTypePayload(questionType);

        router.post(
            storeAssessmentQuestion.url({ assessment: selectedAssessmentId }),
            {
                question_text: assessmentQuestionForm.question_text,
                explanation: assessmentQuestionForm.explanation || null,
                points: 10,
                bloom_level: 'C1',
                question_type: questionType,
                grading_type: defaultGradingTypeFor(),
                options: typePayload.options,
                correct_answer: typePayload.correct_answer,
                min_words: typePayload.min_words,
                max_words: typePayload.max_words,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Question added successfully.');
                    setCreateQuestionDialogOpen(false);
                    setAssessmentQuestionForm({
                        question_text: '',
                        explanation: '',
                        points: '10',
                        question_type: 'essay',
                        options: ['', '', '', ''],
                        correct_answer: '',
                        min_words: '',
                        max_words: '',
                    });
                },
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(messages || 'Failed to add question.');
                },
            },
        );
    };

    const deleteAssessmentQuestion = (): void => {
        if (!selectedAssessmentId || !deletingAssessmentQuestion) {
            return;
        }

        router.delete(
            destroyAssessmentQuestion.url({
                assessment: selectedAssessmentId,
                question: deletingAssessmentQuestion.id,
            }),
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Question deleted.');
                    setDeletingAssessmentQuestion(null);
                },
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(messages || 'Failed to delete question.');
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
                            ? 'Assessment published.'
                            : 'Assessment changed to draft.',
                    ),
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(
                        messages || 'Failed to change assessment status.',
                    );
                },
            },
        );
    };

    const submitRestoreVersion = () => {
        if (!restoreTarget) {
            return;
        }

        router.post(
            `/admin/versions/${restoreTarget.id}/restore`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Version ${restoreTarget.version_number} restored.`,
                    );
                    setRestoreTarget(null);
                },
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(messages || 'Failed to restore version.');
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
                    const { label, icon: Icon, iconClass } = BLOOM_CONFIG[level];

                    return (
                        <div className="flex justify-center">
                            <Badge variant="outline">
                                <Icon className={iconClass} />
                                {label}
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
                                            Publish
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
                                            Draft
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
                                    Manage Questions
                                </DropdownMenuItem>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem
                                            onSelect={(event) =>
                                                event.preventDefault()
                                            }
                                        >
                                            <History data-icon="inline-start" />
                                            History
                                        </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                Version History
                                            </DialogTitle>
                                            <DialogDescription>
                                                {row.original.title}
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="max-h-96 space-y-3 overflow-y-auto">
                                            {(
                                                versionHistories[
                                                    row.original.id
                                                ] ?? []
                                            ).length === 0 ? (
                                                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                                    No version history for
                                                    this item yet.
                                                </div>
                                            ) : (
                                                (
                                                    versionHistories[
                                                        row.original.id
                                                    ] ?? []
                                                ).map((version) => (
                                                    <div
                                                        key={version.id}
                                                        className="rounded-lg border p-4"
                                                    >
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                            <div className="space-y-2">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <Badge variant="outline">
                                                                        v
                                                                        {
                                                                            version.version_number
                                                                        }
                                                                    </Badge>
                                                                    {version.restored_at ? (
                                                                        <Badge variant="secondary">
                                                                            Restored
                                                                        </Badge>
                                                                    ) : null}
                                                                </div>
                                                                <p className="text-sm font-medium">
                                                                    {version.change_summary ||
                                                                        'Content changes'}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {version.creator_name ||
                                                                        'System'}{' '}
                                                                    -{' '}
                                                                    {formatVersionDate(
                                                                        version.created_at,
                                                                    )}
                                                                </p>
                                                                {version
                                                                    .changed_fields
                                                                    .length >
                                                                0 ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {version.changed_fields.map(
                                                                            (
                                                                                field,
                                                                            ) => (
                                                                                <Badge
                                                                                    key={
                                                                                        field
                                                                                    }
                                                                                    variant="outline"
                                                                                >
                                                                                    {
                                                                                        field
                                                                                    }
                                                                                </Badge>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setRestoreTarget(
                                                                        version,
                                                                    )
                                                                }
                                                            >
                                                                <RotateCcw data-icon="inline-start" />
                                                                Restore
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <DialogFooter className="mt-2">
                                            <DialogClose asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                >
                                                    Close
                                                </Button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
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
        [assessments.current_page, assessments.per_page, versionHistories, sectionUrl],
    );

    const questionColumns: ColumnDef<AdminAssessmentQuestion>[] = [
        {
            id: 'reorder',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <button
                        type="button"
                        data-row-drag-handle="true"
                        aria-label={`Drag row ${row.original.question_text}`}
                        onMouseDown={() =>
                            setQuestionDragHandleActiveRowId(
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
            accessorKey: 'question_text',
            header: 'Questions',
            cell: ({ row }) => (
                <p
                    className="text-left font-medium"
                    title={row.original.question_text}
                >
                    {row.original.question_text}
                </p>
            ),
        },
        {
            accessorKey: 'bloom_level',
            header: 'Bloom Level',
            cell: ({ row }) => {
                const level = row.original.bloom_level;
                const { label, icon: Icon, iconClass } = BLOOM_CONFIG[level];

                return (
                    <div className="flex justify-center">
                        <Badge variant="outline">
                            <Icon className={iconClass} />
                            {label}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'question_type',
            header: 'Type',
            cell: ({ row }) => (
                <div className="text-center capitalize">
                    {row.original.question_type.replace(/_/g, ' ')}
                </div>
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
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
                                onClick={() =>
                                    openEditAssessmentQuestionDialog(
                                        row.original,
                                    )
                                }
                            >
                                <Pencil data-icon="inline-start" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                    setDeletingAssessmentQuestion(row.original)
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
    ];

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
            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
            >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <TypographyH1>Assessment</TypographyH1>
                            <TabsList>
                                <TabsTrigger
                                    value="assessment"
                                    onClick={() => {
                                        if (selectedAssessmentId > 0) {
                                            router.get(
                                                sectionUrl({
                                                    course_id: selectedCourseId || undefined,
                                                    page: assessments.current_page,
                                                    per_page: assessments.per_page,
                                                }),
                                                {},
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                },
                                            );
                                        }
                                    }}
                                >
                                    <ClipboardCheck className="size-4" />
                                    Assessment
                                </TabsTrigger>
                                <TabsTrigger value="question">
                                    <HelpCircle className="size-4" />
                                    Question
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between -mt-3">
                            <TypographyMuted className="text-base md:text-sm">
                                Manage assessments for each course.
                            </TypographyMuted>
                            <div className="flex shrink-0 items-center gap-2">
                            {activeTab === 'assessment' ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between sm:w-72"
                                    >
                                        <span className="truncate">
                                            {(() => {
                                                if (!courseFilterSelected || selectedCourseId === 0) {
                                                    return 'Select Course...';
                                                }

                                                const course =
                                                    courseOptions.find(
                                                        (c) =>
                                                            c.id ===
                                                            selectedCourseId,
                                                    );

                                                return course ? course.title : 'Select Course...';
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
                                        <CommandInput placeholder="Search course..." />
                                        <CommandList
                                            style={{
                                                maxHeight: '16rem',
                                                overflowY: 'auto',
                                            }}
                                        >
                                            <CommandEmpty>
                                                No results found.
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
                                                        <span className="flex-1 truncate">{course.title}</span>
                                                        <Check
                                                            className={`ml-auto h-4 w-4 shrink-0 ${
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
                            ) : (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between sm:w-72"
                                    >
                                        <span className="truncate">
                                            {selectedAssessmentId > 0
                                                ? (() => {
                                                    const assessment = allAssessments.find(a => a.id === selectedAssessmentId);

                                                    return assessment ? assessment.title : 'Select Assessment...';
                                                })()
                                                : 'Select Assessment...'}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-72 p-0"
                                    align="start"
                                >
                                    <Command>
                                        <CommandInput placeholder="Search course or assessment..." />
                                        <CommandList className="max-h-none overflow-y-hidden">
                                            <CommandEmpty>
                                                No results found.
                                            </CommandEmpty>
                                            <ScrollArea className="h-64">
                                            {courseOptions.map((course) => {
                                                const courseAssessments = allAssessments.filter(
                                                    (a) => a.course_id === course.id,
                                                );

                                                if (courseAssessments.length === 0) {
                                                    return null;
                                                }

                                                return (
                                                    <CommandGroup
                                                        key={course.id}
                                                        heading={course.title}
                                                    >
                                                        {courseAssessments.map((assessment) => (
                                                            <CommandItem
                                                                key={assessment.id}
                                                                value={`${course.title} ${assessment.title}`}
                                                                onSelect={() => {
                                                                    router.get(
                                                                        sectionUrl({
                                                                            assessment_id: assessment.id,
                                                                            page: 1,
                                                                        }),
                                                                        {},
                                                                        {
                                                                            preserveState: true,
                                                                            preserveScroll: true,
                                                                        },
                                                                    );
                                                                }}
                                                            >
                                                                <span className="flex-1 truncate">{assessment.title}</span>
                                                                <Check
                                                                    className={`ml-auto h-4 w-4 shrink-0 ${
                                                                        selectedAssessmentId === assessment.id
                                                                            ? 'opacity-100'
                                                                            : 'opacity-0'
                                                                    }`}
                                                                />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                );
                                            })}
                                            </ScrollArea>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            )}

                            {/* Create Button - Tab Aware */}
                            <Button
                                type="button"
                                onClick={activeTab === 'assessment' ? openCreateDialog : openCreateQuestionDialog}
                            >
                                <Plus data-icon="inline-start" />
                                Create
                            </Button>
                            </div>
                        </div>
                    </div>

                {/* TabsContent */}
                <TabsContent value="assessment">
                    <section className="grid gap-4">
                        <div className="flex flex-col gap-4">
                            {isLoading ? (
                                <Skeleton className="h-150 w-full rounded-lg" />
                            ) : filteredAssessments.length === 0 ? (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Search />
                                        </EmptyMedia>
                                        <EmptyTitle>
                                            No assessments found
                                        </EmptyTitle>
                                        <EmptyDescription>
                                            Try another course or different keywords.
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
                                    dragHandleActiveRowId={
                                        dragHandleActiveRowId
                                    }
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
                </TabsContent>

                <TabsContent value="question">
                    <section className="grid gap-4">
                        <div className="flex flex-col gap-4">
                            {isLoading ? (
                                <Skeleton className="h-150 w-full rounded-lg" />
                            ) : questionRows.length === 0 ? (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Search />
                                        </EmptyMedia>
                                        <EmptyTitle>
                                            No questions found
                                        </EmptyTitle>
                                        <EmptyDescription>
                                            Create a question from the Assessment tab.
                                        </EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            ) : (
                                <DataTable
                                    columns={questionColumns}
                                    data={questionRows}
                                    centered
                                    showFilterInput={false}
                                    showColumnToggle={false}
                                    showPageInfo={false}
                                    enableDefaultIdSort={false}
                                    getRowDataId={(row) => String(row.id)}
                                    dragHandleActiveRowId={
                                        questionDragHandleActiveRowId
                                    }
                                    onRowDrop={reorderQuestionRows}
                                    onRowDragEnd={() =>
                                        setQuestionDragHandleActiveRowId(null)
                                    }
                                    footerInfo={`Showing ${questionRows.length} of ${questionRows.length} Questions`}
                                />
                            )}
                        </div>
                    </section>
                </TabsContent>
            </div>
            </Tabs>

            {/* Create Assessment Dialog */}
            <Dialog
                open={createDialogOpen}
                onOpenChange={(open) => {
                    setCreateDialogOpen(open);

                    if (!open && !isSaving) {
                        resetFormState();
                    }
                }}
            >
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
                                    ? 'Edit Assessment'
                                    : 'Create New Assessment'}
                            </DialogTitle>
                            <DialogDescription>
                                {isEditMode
                                    ? 'Update Assessment Details.'
                                    : 'Add a new Bloom Taxonomy Assessment.'}
                            </DialogDescription>
                        </DialogHeader>

                        <FieldGroup className="mt-4">
                            <Field>
                                <FieldLabel htmlFor="assessment-course">
                                    Course{' '}
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

                                                    return 'Select course...';
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
                                            <CommandInput placeholder="Search course..." />
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
                                    Title{' '}
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
                                    Description
                                </FieldLabel>
                                <Textarea
                                    id="assessment-description"
                                    name="description"
                                    placeholder="Enter assessment description"
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

                            <Field>
                                <FieldLabel>
                                    Bloom Level{' '}
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

                            <div className="grid grid-cols-3 items-end gap-3">
                                <Field>
                                    <FieldLabel>
                                        Pass Score (%)
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
                                        Max Attempts
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
                                        Time (minutes)
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
                        </FieldGroup>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    type="button"
                                    disabled={isSaving}
                                >
                                    Cancel
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
                                    ? 'Save changes'
                                    : 'Create assessment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Question Dialog */}
            <Dialog
                open={createQuestionDialogOpen}
                onOpenChange={(open) => {
                    setCreateQuestionDialogOpen(open);

                    if (!open) {
                        setAssessmentQuestionForm({
                            question_text: '',
                            explanation: '',
                            points: '10',
                            question_type: 'essay',
                            options: ['', '', '', ''],
                            correct_answer: '',
                            min_words: '',
                            max_words: '',
                        });
                    }
                }}
            >
                <DialogContent className="sm:max-w-sm">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            saveNewAssessmentQuestion();
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>Create New Question</DialogTitle>
                            <DialogDescription>
                                Create a new question for this assessment.
                            </DialogDescription>
                        </DialogHeader>

                        <FieldGroup className="mt-4">
                            <Field>
                                <FieldLabel htmlFor="new-question-type">
                                    Question Type{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Select
                                    value={
                                        assessmentQuestionForm.question_type
                                    }
                                    onValueChange={(value) =>
                                        setAssessmentQuestionForm(
                                            (prev) => ({
                                                ...prev,
                                                question_type:
                                                    value as QuestionType,
                                                options: [
                                                    '',
                                                    '',
                                                    '',
                                                    '',
                                                ],
                                                correct_answer: '',
                                                min_words: '',
                                                max_words: '',
                                            }),
                                        )
                                    }
                                >
                                    <SelectTrigger id="new-question-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {QUESTION_TYPE_OPTIONS.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={
                                                            option.value
                                                        }
                                                        value={
                                                            option.value
                                                        }
                                                    >
                                                        {
                                                            option.label
                                                        }
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="new-question-text">
                                    Question{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Textarea
                                    id="new-question-text"
                                    value={assessmentQuestionForm.question_text}
                                    onChange={(event) =>
                                        setAssessmentQuestionForm((prev) => ({
                                            ...prev,
                                            question_text: event.target.value,
                                        }))
                                    }
                                    rows={4}
                                    placeholder="Enter question..."
                                />
                            </Field>

                            <QuestionTypeFields
                                idPrefix="new-question"
                                questionType={
                                    assessmentQuestionForm.question_type
                                }
                                options={
                                    assessmentQuestionForm.options
                                }
                                correctAnswer={
                                    assessmentQuestionForm.correct_answer
                                }
                                minWords={
                                    assessmentQuestionForm.min_words
                                }
                                maxWords={
                                    assessmentQuestionForm.max_words
                                }
                                onOptionsChange={(next) =>
                                    setAssessmentQuestionForm(
                                        (prev) => ({
                                            ...prev,
                                            options: next,
                                        }),
                                    )
                                }
                                onCorrectAnswerChange={(value) =>
                                    setAssessmentQuestionForm(
                                        (prev) => ({
                                            ...prev,
                                            correct_answer: value,
                                        }),
                                    )
                                }
                                onMinWordsChange={(value) =>
                                    setAssessmentQuestionForm(
                                        (prev) => ({
                                            ...prev,
                                            min_words: value,
                                        }),
                                    )
                                }
                                onMaxWordsChange={(value) =>
                                    setAssessmentQuestionForm(
                                        (prev) => ({
                                            ...prev,
                                            max_words: value,
                                        }),
                                    )
                                }
                            />

                            <Field>
                                <FieldLabel htmlFor="new-question-explanation">
                                    Explanation
                                </FieldLabel>
                                <Textarea
                                    id="new-question-explanation"
                                    value={assessmentQuestionForm.explanation}
                                    onChange={(event) =>
                                        setAssessmentQuestionForm((prev) => ({
                                            ...prev,
                                            explanation: event.target.value,
                                        }))
                                    }
                                    rows={3}
                                    placeholder="Answer explanation (optional)"
                                />
                            </Field>
                        </FieldGroup>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setCreateQuestionDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Add Question
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={editingAssessmentQuestion !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingAssessmentQuestion(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Edit Question</DialogTitle>
                        <DialogDescription>
                            Update the question details.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            saveAssessmentQuestionUpdate();
                        }}
                    >
                    <FieldGroup className="mt-4">
                        <Field>
                            <FieldLabel htmlFor="edit-question-type">
                                Question Type
                            </FieldLabel>
                            <Select
                                value={assessmentQuestionForm.question_type}
                                disabled
                            >
                                <SelectTrigger id="edit-question-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {QUESTION_TYPE_OPTIONS.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="assessment-question-text">
                                Question{' '}
                                <span className="text-destructive">*</span>
                            </FieldLabel>
                            <Textarea
                                id="assessment-question-text"
                                value={assessmentQuestionForm.question_text}
                                onChange={(event) =>
                                    setAssessmentQuestionForm((prev) => ({
                                        ...prev,
                                        question_text: event.target.value,
                                    }))
                                }
                                rows={4}
                                placeholder="Enter question..."
                            />
                        </Field>

                        <QuestionTypeFields
                            idPrefix="edit-question"
                            questionType={assessmentQuestionForm.question_type}
                            options={assessmentQuestionForm.options}
                            correctAnswer={assessmentQuestionForm.correct_answer}
                            minWords={assessmentQuestionForm.min_words}
                            maxWords={assessmentQuestionForm.max_words}
                            onOptionsChange={(next) =>
                                setAssessmentQuestionForm((prev) => ({
                                    ...prev,
                                    options: next,
                                }))
                            }
                            onCorrectAnswerChange={(value) =>
                                setAssessmentQuestionForm((prev) => ({
                                    ...prev,
                                    correct_answer: value,
                                }))
                            }
                            onMinWordsChange={(value) =>
                                setAssessmentQuestionForm((prev) => ({
                                    ...prev,
                                    min_words: value,
                                }))
                            }
                            onMaxWordsChange={(value) =>
                                setAssessmentQuestionForm((prev) => ({
                                    ...prev,
                                    max_words: value,
                                }))
                            }
                        />

                        <Field>
                            <FieldLabel htmlFor="assessment-question-explanation">
                                Explanation
                            </FieldLabel>
                            <Textarea
                                id="assessment-question-explanation"
                                value={assessmentQuestionForm.explanation}
                                onChange={(event) =>
                                    setAssessmentQuestionForm((prev) => ({
                                        ...prev,
                                        explanation: event.target.value,
                                    }))
                                }
                                rows={3}
                                placeholder="Answer explanation (optional)"
                            />
                        </Field>
                    </FieldGroup>

                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit">
                            Save changes
                        </Button>
                    </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

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

            <AlertDialog
                open={deletingAssessmentQuestion !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingAssessmentQuestion(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete question?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Question &quot;
                            {deletingAssessmentQuestion?.question_text}&quot;
                            will be deleted from this assessment. This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteAssessmentQuestion}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={restoreTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setRestoreTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore version?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The current version will be saved as a snapshot
                            before the item is restored to version{' '}
                            {restoreTarget?.version_number}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => submitRestoreVersion()}>
                            Restore
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
