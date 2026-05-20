import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    BookOpen,
    Check,
    CheckSquare,
    FileQuestion,
    GitMerge,
    HelpCircle,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    Type as TypeIcon,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
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
import { DataTable } from '@/components/ui/data-table';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
import { dashboard } from '@/routes';
import {
    destroy,
    index as questionBankIndex,
    store,
    update,
} from '@/routes/admin/question-bank';
import type {
    QuestionBank,
    QuestionType,
} from '@/types/assessments';

type QuestionRow = QuestionBank;

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type Filters = {
    search: string;
    question_type: QuestionType | null;
    category: string | null;
    is_active: '0' | '1' | null;
};

type Props = {
    questions: Paginated<QuestionRow>;
    filters: Filters;
};

type FormState = {
    title: string;
    category: string;
    question_type: QuestionType;
    question_text: string;
    options: string[];
    correct_answer: string;
    min_words: string;
    max_words: string;
    explanation: string;
    points: string;
    is_active: boolean;
};

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
    { value: 'mcq', label: 'Pilihan Ganda (PG)' },
    { value: 'multiple_select', label: 'Pilihan Ganda Kompleks (PGK)' },
    { value: 'true_false', label: 'Benar / Salah (BS)' },
    { value: 'matching', label: 'Menjodohkan (Matching)' },
    { value: 'short_answer', label: 'Isian Singkat (Short Answer)' },
    { value: 'essay', label: 'Esai / Uraian (Essay)' },
];

const QUESTION_TYPE_ICONS: Record<
    QuestionType,
    React.ComponentType<{ className?: string }>
> = {
    mcq: FileQuestion,
    multiple_select: CheckSquare,
    true_false: HelpCircle,
    matching: GitMerge,
    short_answer: TypeIcon,
    essay: BookOpen,
};

const DEFAULT_FORM: FormState = {
    title: '',
    category: '',
    question_type: 'mcq',
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    min_words: '',
    max_words: '',
    explanation: '',
    points: '10',
    is_active: true,
};

function questionTypeLabel(value: QuestionType): string {
    return (
        QUESTION_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
        value
    );
}

// ── Question Type Fields (inlined) ───────────────────────────────────────────

function parseMultiSelectAnswer(value: string): string[] {
    if (!value) return [];
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
            if (option.trim() === '') return;
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
                if (pair.left.trim() !== '') acc[pair.left] = pair.right;
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

export default function AdminQuestionBankIndex({ questions, filters }: Props) {
    const [searchInput, setSearchInput] = useState(filters.search);
    const [typeFilter, setTypeFilter] = useState<'all' | QuestionType>(
        (filters.question_type as QuestionType) ?? 'all',
    );
    const activeFilter: 'all' | '1' | '0' = filters.is_active ?? 'all';

    const [creatingOpen, setCreatingOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<QuestionRow | null>(
        null,
    );
    const [deletingQuestion, setDeletingQuestion] =
        useState<QuestionRow | null>(null);

    const [formState, setFormState] = useState<FormState>(DEFAULT_FORM);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

    const hasInitializedAutoFilter = useRef(false);

    const syncFilters = useCallback(
        (
            searchValue: string,
            typeValue: 'all' | QuestionType,
            activeValue: 'all' | '1' | '0',
            page = 1,
            perPage = questions.per_page,
        ): void => {
            router.get(
                questionBankIndex.url({
                    query: {
                        page,
                        per_page: perPage,
                        search: searchValue.trim() || undefined,
                        question_type:
                            typeValue === 'all' ? undefined : typeValue,
                        is_active:
                            activeValue === 'all' ? undefined : activeValue,
                    },
                }),
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        },
        [questions.per_page],
    );

    useEffect(() => {
        if (!hasInitializedAutoFilter.current) {
            hasInitializedAutoFilter.current = true;

            return;
        }

        const timer = window.setTimeout(() => {
            syncFilters(searchInput, typeFilter, activeFilter, 1);
        }, 300);

        return () => window.clearTimeout(timer);
    }, [activeFilter, searchInput, syncFilters, typeFilter]);

    const openCreateDialog = (): void => {
        setFormState(DEFAULT_FORM);
        setFormErrors({});
        setCreatingOpen(true);
    };

    const openEditDialog = (question: QuestionRow): void => {
        setFormErrors({});
        // Reconstruct editable options from stored options array or matching pairs
        const rawOptions = (question.options as string[] | null) ?? [];
        const optionsList = rawOptions.length > 0
            ? [...rawOptions, ...Array(Math.max(0, 4 - rawOptions.length)).fill('')]
            : ['', '', '', ''];

        setFormState({
            title: question.title,
            category: question.category ?? '',
            question_type: question.question_type,
            question_text: question.question_text,
            options: optionsList,
            correct_answer: question.correct_answer ?? '',
            min_words: question.min_words ? String(question.min_words) : '',
            max_words: question.max_words ? String(question.max_words) : '',
            explanation: question.explanation ?? '',
            points: String(question.points),
            is_active: question.is_active,
        });
        setEditingQuestion(question);
    };

    const closeFormDialog = (): void => {
        if (isSubmittingForm) {
            return;
        }

        setCreatingOpen(false);
        setEditingQuestion(null);
        setFormErrors({});
    };

    const submitForm = (): void => {
        const isEditing = Boolean(editingQuestion);
        const filteredOptions = formState.options.filter((o) => o.trim() !== '');
        const payload = {
            title: formState.title.trim(),
            category: formState.category.trim() || null,
            question_type: formState.question_type,
            question_text: formState.question_text.trim(),
            options: filteredOptions.length > 0 ? filteredOptions : null,
            correct_answer: formState.correct_answer.trim() || null,
            min_words: formState.min_words ? parseInt(formState.min_words, 10) : null,
            max_words: formState.max_words ? parseInt(formState.max_words, 10) : null,
            explanation: formState.explanation.trim() || null,
            points: Number.parseInt(formState.points, 10) || 1,
            is_active: formState.is_active,
        };

        setIsSubmittingForm(true);
        const onFinish = () => setIsSubmittingForm(false);
        const onError = (errors: Record<string, string>) =>
            setFormErrors(errors);
        const onSuccess = () => {
            setCreatingOpen(false);
            setEditingQuestion(null);
            setFormErrors({});
            setFormState(DEFAULT_FORM);
        };

        if (isEditing && editingQuestion) {
            router.patch(
                update.url({ questionBank: editingQuestion.id }),
                payload,
                { preserveScroll: true, onFinish, onError, onSuccess },
            );

            return;
        }

        router.post(store.url(), payload, {
            preserveScroll: true,
            onFinish,
            onError,
            onSuccess,
        });
    };

    const submitDelete = (): void => {
        if (!deletingQuestion) {
            return;
        }

        setIsSubmittingDelete(true);
        router.delete(destroy.url({ questionBank: deletingQuestion.id }), {
            preserveScroll: true,
            onFinish: () => setIsSubmittingDelete(false),
            onSuccess: () => setDeletingQuestion(null),
        });
    };

    const columns = useMemo<ColumnDef<QuestionRow>[]>(
        () => [
            {
                accessorKey: 'title',
                header: 'Pertanyaan',
                cell: ({ row }) => {
                    const q = row.original;

                    return (
                        <div className="flex max-w-md flex-col gap-1">
                            <span className="font-medium leading-tight">
                                {q.title}
                            </span>
                            <span className="text-muted-foreground line-clamp-2 text-xs">
                                {q.question_text}
                            </span>
                            {q.category ? (
                                <span className="text-muted-foreground text-[11px] uppercase tracking-wide">
                                    {q.category}
                                </span>
                            ) : null}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'question_type',
                header: 'Tipe',
                cell: ({ row }) => {
                    const value = row.original.question_type;
                    const Icon = QUESTION_TYPE_ICONS[value];

                    return (
                        <Badge
                            variant="secondary"
                            className="flex w-fit items-center gap-1.5"
                        >
                            <Icon className="size-3.5" />
                            <span>{questionTypeLabel(value)}</span>
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'times_used',
                header: 'Dipakai',
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.times_used}
                    </span>
                ),
            },
            {
                accessorKey: 'is_active',
                header: 'Status',
                cell: ({ row }) =>
                    row.original.is_active ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
                            Aktif
                        </Badge>
                    ) : (
                        <Badge variant="outline">Nonaktif</Badge>
                    ),
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Aksi</span>,
                cell: ({ row }) => {
                    const q = row.original;

                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                >
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">
                                        Aksi pertanyaan
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onSelect={() => openEditDialog(q)}
                                >
                                    <Pencil className="mr-2 size-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => setDeletingQuestion(q)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    Hapus
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ],
        [],
    );

    const dialogOpen = creatingOpen || editingQuestion !== null;
    const isEditing = editingQuestion !== null;

    return (
        <>
            <Head title="Management - Question Bank" />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-4">
                <header className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                        <TypographyH1>Question Bank</TypographyH1>
                        <TypographyMuted>
                            Manage reusable questions for quizzes and assessments.
                        </TypographyMuted>
                    </div>
                    <div className="flex shrink-0 items-center justify-end gap-2">
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <div className="w-full sm:w-80">
                                <Input
                                    id="question-bank-search"
                                    value={searchInput}
                                    onChange={(event) =>
                                        setSearchInput(event.target.value)
                                    }
                                    placeholder="Search questions..."
                                />
                            </div>
                            <Select
                                value={typeFilter}
                                onValueChange={(value) =>
                                    setTypeFilter(value as 'all' | QuestionType)
                                }
                            >
                                <SelectTrigger
                                    id="question-type-filter"
                                    className="w-full sm:w-56"
                                >
                                    <SelectValue placeholder="Question type" />
                                </SelectTrigger>
                                <SelectContent
                                    position="popper"
                                    align="end"
                                    sideOffset={4}
                                >
                                    <SelectGroup>
                                        <SelectItem value="all">
                                            All types
                                        </SelectItem>
                                        {QUESTION_TYPE_OPTIONS.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                className="sm:shrink-0"
                                onClick={openCreateDialog}
                            >
                                <Plus data-icon="inline-start" />
                                Create Question
                            </Button>
                        </div>
                    </div>
                </header>

                <section className="grid gap-4">
                    <div className="flex flex-col gap-4">
                        {questions.data.length === 0 ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <Search />
                                    </EmptyMedia>
                                    <EmptyTitle>
                                        No questions found
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        Try a different keyword or question
                                        type.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={questions.data}
                                centered
                                showFilterInput={false}
                                showColumnToggle={false}
                                showPageInfo={false}
                                enableDefaultIdSort={false}
                                page={questions.current_page}
                                pageCount={questions.last_page}
                                pageSize={questions.per_page}
                                onPageChange={(nextPage) =>
                                    syncFilters(
                                        searchInput,
                                        typeFilter,
                                        activeFilter,
                                        nextPage,
                                    )
                                }
                                onPageSizeChange={(nextPageSize) =>
                                    syncFilters(
                                        searchInput,
                                        typeFilter,
                                        activeFilter,
                                        1,
                                        nextPageSize,
                                    )
                                }
                                footerInfo={`Showing ${questions.from ?? 0} - ${questions.to ?? 0} of ${questions.total} questions`}
                            />
                        )}
                    </div>
                </section>
            </div>
            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeFormDialog();
                    }
                }}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? 'Edit Question' : 'Create New Question'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? 'Update the question details.'
                                : 'Create a new question for the question bank.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitForm();
                        }}
                    >
                        <FieldGroup className="mt-4">
                            <Field>
                                <FieldLabel htmlFor="qb-question-type">
                                    Question Type{' '}
                                    <span className="text-destructive">
                                        *
                                    </span>
                                </FieldLabel>
                                <Select
                                    value={formState.question_type}
                                    onValueChange={(value) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            question_type:
                                                value as QuestionType,
                                            options: ['', '', '', ''],
                                            correct_answer: '',
                                            min_words: '',
                                            max_words: '',
                                        }))
                                    }
                                >
                                    <SelectTrigger id="qb-question-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {QUESTION_TYPE_OPTIONS.map(
                                                (opt) => (
                                                    <SelectItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                    >
                                                        {opt.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="qb-text">
                                    Question{' '}
                                    <span className="text-destructive">*</span>
                                </FieldLabel>
                                <Textarea
                                    id="qb-text"
                                    rows={4}
                                    value={formState.question_text}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            question_text: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter question..."
                                    aria-invalid={Boolean(formErrors.question_text)}
                                />
                                {formErrors.question_text ? (
                                    <FieldDescription className="text-destructive">
                                        {formErrors.question_text}
                                    </FieldDescription>
                                ) : null}
                            </Field>

                            <QuestionTypeFields
                                idPrefix="qb"
                                questionType={formState.question_type}
                                options={formState.options}
                                correctAnswer={formState.correct_answer}
                                minWords={formState.min_words}
                                maxWords={formState.max_words}
                                onOptionsChange={(next) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        options: next,
                                    }))
                                }
                                onCorrectAnswerChange={(value) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        correct_answer: value,
                                    }))
                                }
                                onMinWordsChange={(value) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        min_words: value,
                                    }))
                                }
                                onMaxWordsChange={(value) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        max_words: value,
                                    }))
                                }
                            />

                            <Field>
                                <FieldLabel htmlFor="qb-explanation">
                                    Explanation
                                </FieldLabel>
                                <Textarea
                                    id="qb-explanation"
                                    rows={3}
                                    value={formState.explanation}
                                    onChange={(e) =>
                                        setFormState((prev) => ({
                                            ...prev,
                                            explanation: e.target.value,
                                        }))
                                    }
                                    placeholder="Answer explanation (optional)"
                                />
                            </Field>
                        </FieldGroup>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isSubmittingForm}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={isSubmittingForm}
                            >
                                {isSubmittingForm ? (
                                    <Spinner data-icon="inline-start" />
                                ) : null}
                                {isEditing ? 'Save Changes' : 'Save Question'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={deletingQuestion !== null}
                onOpenChange={(open) => {
                    if (!open && !isSubmittingDelete) {
                        setDeletingQuestion(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete question?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Pertanyaan{' '}
                            <span className="font-semibold">
                                {deletingQuestion?.title}
                            </span>{' '}
                            will be permanently deleted. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmittingDelete}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                submitDelete();
                            }}
                            disabled={isSubmittingDelete}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            {isSubmittingDelete ? (
                                <Spinner className="mr-2 size-4" />
                            ) : null}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

AdminQuestionBankIndex.layout = {
    breadcrumbs: [
        { title: 'Home', href: dashboard() },
        { title: 'Management', href: questionBankIndex() },
        { title: 'Question Bank', href: questionBankIndex() },
    ],
};
