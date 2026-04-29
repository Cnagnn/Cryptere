import { router } from '@inertiajs/react';
import {
    GripVertical,
    HelpCircle,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
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
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import {
    destroy as destroyQuestion,
    reorder as reorderQuestions,
} from '@/routes/admin/challenges/questions';
import { QuestionFormDialog  } from './QuestionFormDialog';
import type {QuestionRow} from './QuestionFormDialog';

const TYPE_LABELS: Record<string, string> = {
    mcq: 'MCQ',
    true_false: 'T/F',
    text: 'Text',
    fill_blank: 'Fill',
};

const TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    mcq: 'default',
    true_false: 'secondary',
    text: 'outline',
    fill_blank: 'outline',
};

type Props = {
    challengeId: number;
    challengeTitle: string;
    questions: QuestionRow[];
};

export function QuestionBankPanel({ challengeId, challengeTitle, questions }: Props) {
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingQuestion, setEditingQuestion] = useState<QuestionRow | undefined>();
    const [deletingQuestion, setDeletingQuestion] = useState<QuestionRow | null>(null);
    const [rows, setRows] = useState<QuestionRow[]>(questions);
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    // Sync rows when questions prop changes (after server response)
    if (questions !== rows && JSON.stringify(questions) !== JSON.stringify(rows)) {
        setRows(questions);
    }

    const openCreate = () => {
        setFormMode('create');
        setEditingQuestion(undefined);
        setFormOpen(true);
    };

    const openEdit = (q: QuestionRow) => {
        setFormMode('edit');
        setEditingQuestion(q);
        setFormOpen(true);
    };

    const submitDelete = () => {
        if (!deletingQuestion) {
return;
}

        router.delete(
            destroyQuestion.url({ challenge: challengeId, question: deletingQuestion.id }),
            {
                preserveScroll: true,
                onSuccess: () => setDeletingQuestion(null),
            },
        );
    };

    const handleDragStart = (index: number) => {
        setDragIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();

        if (dragIndex === null || dragIndex === targetIndex) {
return;
}

        setRows((prev) => {
            const next = [...prev];
            const [moved] = next.splice(dragIndex, 1);
            next.splice(targetIndex, 0, moved);

            return next;
        });
        setDragIndex(targetIndex);
    };

    const handleDragEnd = () => {
        if (dragIndex === null) {
return;
}

        setDragIndex(null);

        router.post(
            reorderQuestions.url(challengeId),
            {
                items: rows.map((row, index) => ({
                    id: row.id,
                    sort_order: index + 1,
                })),
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <div className="flex flex-col gap-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-semibold">Question Bank</h3>
                    <p className="text-xs text-muted-foreground">
                        {challengeTitle} — {rows.length} question{rows.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button type="button" size="sm" onClick={openCreate}>
                    <Plus data-icon="inline-start" />
                    Add Question
                </Button>
            </div>

            <Separator />

            {rows.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <HelpCircle />
                        </EmptyMedia>
                        <EmptyTitle>No questions yet</EmptyTitle>
                        <EmptyDescription>
                            Add questions to build the quiz for this challenge.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <div className="flex flex-col gap-2">
                    {rows.map((q, index) => (
                        <div
                            key={q.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${
                                dragIndex === index ? 'border-primary bg-muted/50' : 'hover:bg-muted/30'
                            }`}
                        >
                            <button
                                type="button"
                                className="mt-0.5 cursor-grab text-muted-foreground active:cursor-grabbing"
                                aria-label={`Drag question ${index + 1}`}
                            >
                                <GripVertical className="size-4" />
                            </button>

                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant={TYPE_VARIANTS[q.type] ?? 'outline'}>
                                        {TYPE_LABELS[q.type] ?? q.type}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                </div>
                                <p className="line-clamp-2 text-sm">{q.question}</p>
                                {q.correct_answer && (
                                    <p className="text-xs text-muted-foreground">
                                        Answer: <span className="font-medium text-foreground">{q.correct_answer}</span>
                                    </p>
                                )}
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEdit(q)}
                                >
                                    <Pencil />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeletingQuestion(q)}
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <QuestionFormDialog
                mode={formMode}
                open={formOpen}
                onOpenChange={setFormOpen}
                challengeId={challengeId}
                question={editingQuestion}
            />

            <AlertDialog
                open={deletingQuestion !== null}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
setDeletingQuestion(null);
}
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete question?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this question from the bank.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
