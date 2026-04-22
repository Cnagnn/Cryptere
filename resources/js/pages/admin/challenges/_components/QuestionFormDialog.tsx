import { router, usePage } from '@inertiajs/react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Field,
    FieldContent,
    FieldError,
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
import { Textarea } from '@/components/ui/textarea';
import {
    store as storeQuestion,
    update as updateQuestion,
} from '@/routes/admin/challenges/questions';

export type QuestionRow = {
    id: number;
    challenge_id: number;
    type: 'mcq' | 'true_false' | 'text' | 'fill_blank';
    question: string;
    options: string[] | null;
    correct_answer: string;
    explanation: string | null;
    sort_order: number;
};

type QuestionFormData = {
    type: string;
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
};

const QUESTION_TYPES = [
    { value: 'mcq', label: 'Multiple Choice' },
    { value: 'true_false', label: 'True / False' },
    { value: 'text', label: 'Text Input' },
    { value: 'fill_blank', label: 'Fill in the Blank' },
] as const;

const defaultForm: QuestionFormData = {
    type: 'mcq',
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
};

function getInitialForm(question?: QuestionRow): QuestionFormData {
    if (question) {
        return {
            type: question.type,
            question: question.question,
            options: question.options ?? ['', '', '', ''],
            correct_answer: question.correct_answer,
            explanation: question.explanation ?? '',
        };
    }
    return { ...defaultForm, options: ['', '', '', ''] };
}

type Props = {
    mode: 'create' | 'edit';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    challengeId: number;
    question?: QuestionRow;
};

export function QuestionFormDialog({ mode, open, onOpenChange, challengeId, question }: Props) {
    const [form, setForm] = useState<QuestionFormData>(() => getInitialForm(question));
    const [processing, setProcessing] = useState(false);
    const { errors } = usePage().props as { errors: Record<string, string> };

    useEffect(() => {
        if (open) {
            setForm(getInitialForm(question));
        }
    }, [open, question]);

    const needsOptions = form.type === 'mcq';
    const isTrueFalse = form.type === 'true_false';

    const handleTypeChange = (type: string) => {
        setForm((prev) => {
            const next = { ...prev, type };
            if (type === 'true_false') {
                next.options = ['True', 'False'];
                next.correct_answer = '';
            } else if (type === 'mcq') {
                next.options = prev.options.length >= 2 ? prev.options : ['', '', '', ''];
            } else {
                next.options = [];
            }
            return next;
        });
    };

    const updateOption = (index: number, value: string) => {
        setForm((prev) => {
            const options = [...prev.options];
            options[index] = value;
            return { ...prev, options };
        });
    };

    const addOption = () => {
        if (form.options.length < 6) {
            setForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
        }
    };

    const removeOption = (index: number) => {
        if (form.options.length > 2) {
            setForm((prev) => ({
                ...prev,
                options: prev.options.filter((_, i) => i !== index),
            }));
        }
    };

    const handleSubmit = () => {
        setProcessing(true);

        const payload: Record<string, unknown> = {
            type: form.type,
            question: form.question,
            correct_answer: form.correct_answer,
            explanation: form.explanation || null,
        };

        if (needsOptions || isTrueFalse) {
            payload.options = form.options;
        }

        if (mode === 'create') {
            router.post(storeQuestion.url(challengeId), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    onOpenChange(false);
                },
                onError: () => setProcessing(false),
            });
        } else if (question) {
            router.patch(
                updateQuestion.url({ challenge: challengeId, question: question.id }),
                payload,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setProcessing(false);
                        onOpenChange(false);
                    },
                    onError: () => setProcessing(false),
                },
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Add Question' : 'Edit Question'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create'
                            ? 'Add a new question to the question bank.'
                            : 'Update the question details.'}
                    </DialogDescription>
                </DialogHeader>

                <FieldGroup className="py-4">
                    <Field data-invalid={errors.type ? 'true' : undefined}>
                        <FieldLabel htmlFor="q-type">Type</FieldLabel>
                        <FieldContent>
                            <Select value={form.type} onValueChange={handleTypeChange}>
                                <SelectTrigger id="q-type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {QUESTION_TYPES.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FieldContent>
                        {errors.type && <FieldError>{errors.type}</FieldError>}
                    </Field>

                    <Field data-invalid={errors.question ? 'true' : undefined}>
                        <FieldLabel htmlFor="q-question">Question</FieldLabel>
                        <FieldContent>
                            <Textarea
                                id="q-question"
                                value={form.question}
                                onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))}
                                rows={3}
                                aria-invalid={errors.question ? true : undefined}
                            />
                        </FieldContent>
                        {errors.question && <FieldError>{errors.question}</FieldError>}
                    </Field>

                    {needsOptions && (
                        <Field data-invalid={errors.options ? 'true' : undefined}>
                            <div className="flex items-center justify-between">
                                <FieldLabel>Options</FieldLabel>
                                {form.options.length < 6 && (
                                    <Button type="button" variant="ghost" size="sm" onClick={addOption}>
                                        <Plus data-icon="inline-start" />
                                        Add
                                    </Button>
                                )}
                            </div>
                            <FieldContent>
                                <div className="flex flex-col gap-2">
                                    {form.options.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <Input
                                                value={opt}
                                                onChange={(e) => updateOption(i, e.target.value)}
                                                placeholder={`Option ${i + 1}`}
                                            />
                                            {form.options.length > 2 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeOption(i)}
                                                >
                                                    <Trash2 />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </FieldContent>
                            {errors.options && <FieldError>{errors.options}</FieldError>}
                        </Field>
                    )}

                    <Field data-invalid={errors.correct_answer ? 'true' : undefined}>
                        <FieldLabel htmlFor="q-correct">Correct Answer</FieldLabel>
                        <FieldContent>
                            {isTrueFalse ? (
                                <Select
                                    value={form.correct_answer}
                                    onValueChange={(v) => setForm((prev) => ({ ...prev, correct_answer: v }))}
                                >
                                    <SelectTrigger id="q-correct">
                                        <SelectValue placeholder="Select answer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="True">True</SelectItem>
                                            <SelectItem value="False">False</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            ) : needsOptions ? (
                                <Select
                                    value={form.correct_answer}
                                    onValueChange={(v) => setForm((prev) => ({ ...prev, correct_answer: v }))}
                                >
                                    <SelectTrigger id="q-correct">
                                        <SelectValue placeholder="Select correct option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {form.options.filter(Boolean).map((opt, i) => (
                                                <SelectItem key={i} value={opt}>
                                                    {opt}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id="q-correct"
                                    value={form.correct_answer}
                                    onChange={(e) => setForm((prev) => ({ ...prev, correct_answer: e.target.value }))}
                                    placeholder={form.type === 'fill_blank' ? 'The blank answer' : 'Expected answer'}
                                    aria-invalid={errors.correct_answer ? true : undefined}
                                />
                            )}
                        </FieldContent>
                        {errors.correct_answer && <FieldError>{errors.correct_answer}</FieldError>}
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="q-explanation">Explanation (optional)</FieldLabel>
                        <FieldContent>
                            <Textarea
                                id="q-explanation"
                                value={form.explanation}
                                onChange={(e) => setForm((prev) => ({ ...prev, explanation: e.target.value }))}
                                rows={2}
                                placeholder="Explain why this is the correct answer..."
                            />
                        </FieldContent>
                    </Field>
                </FieldGroup>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={processing}>
                        {processing && <Loader2 className="animate-spin" data-icon="inline-start" />}
                        {mode === 'create' ? 'Add Question' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
