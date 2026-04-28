import { useState, useCallback } from 'react';
import type { CheckType } from '@/lib/content-parser';
import { cn } from '@/lib/utils';

type InlineCheckProps = {
    question: string;
    type: CheckType;
    options?: string[];
    answer: number | string;
    hint: string;
};

type CheckState = 'unanswered' | 'correct' | 'incorrect' | 'show-hint';

export function InlineKnowledgeCheck({
    question,
    type,
    options,
    answer,
    hint,
}: InlineCheckProps) {
    const [state, setState] = useState<CheckState>('unanswered');
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [textAnswer, setTextAnswer] = useState('');
    const [showHint, setShowHint] = useState(false);

    const handleCheck = useCallback(() => {
        if (type === 'mcq') {
            if (selectedOption === answer) {
                setState('correct');
            } else {
                setState('incorrect');
                setShowHint(true);
            }
        } else if (type === 'true_false') {
            // answer is 0 for True, 1 for False
            if (selectedOption === answer) {
                setState('correct');
            } else {
                setState('incorrect');
                setShowHint(true);
            }
        } else if (type === 'fill_blank') {
            const normalizedAnswer = String(answer).toLowerCase().trim();
            const normalizedInput = textAnswer.toLowerCase().trim();
            if (normalizedInput === normalizedAnswer) {
                setState('correct');
            } else {
                setState('incorrect');
                setShowHint(true);
            }
        }
    }, [type, selectedOption, textAnswer, answer]);

    const handleRetry = useCallback(() => {
        setState('unanswered');
        setSelectedOption(null);
        setTextAnswer('');
        setShowHint(false);
    }, []);

    // Collapsed state after correct answer
    if (state === 'correct') {
        return (
            <div
                className="my-6 flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-700 dark:bg-emerald-950/30"
                role="status"
                aria-label="Knowledge check passed"
            >
                <span className="text-lg" aria-hidden="true">
                    ✓
                </span>
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Checkpoint passed
                </span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'my-6 rounded-lg border bg-card p-4 shadow-sm',
                state === 'incorrect'
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-border',
            )}
            role="region"
            aria-label="Knowledge check"
        >
            {/* Header */}
            <div className="mb-3 flex items-center gap-2">
                <span className="text-lg" aria-hidden="true">
                    🧠
                </span>
                <span className="text-sm font-semibold text-muted-foreground">
                    Knowledge Check
                </span>
            </div>

            {/* Question */}
            <p className="mb-4 text-sm font-medium leading-relaxed text-foreground">
                {question}
            </p>

            {/* MCQ Options */}
            {type === 'mcq' && options && (
                <div className="mb-4 flex flex-col gap-2" role="radiogroup" aria-label={question}>
                    {options.map((option, index) => (
                        <label
                            key={index}
                            className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors',
                                selectedOption === index
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-muted/50',
                                state === 'incorrect' && selectedOption === index
                                    ? 'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/20'
                                    : '',
                            )}
                        >
                            <input
                                type="radio"
                                name="inline-check"
                                value={index}
                                checked={selectedOption === index}
                                onChange={() => {
                                    setSelectedOption(index);
                                    if (state === 'incorrect') {
                                        setState('unanswered');
                                    }
                                }}
                                className="size-4 accent-primary"
                                aria-label={option}
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
            )}

            {/* True/False Options */}
            {type === 'true_false' && (
                <div className="mb-4 flex gap-3" role="radiogroup" aria-label={question}>
                    {['True', 'False'].map((label, index) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => {
                                setSelectedOption(index);
                                if (state === 'incorrect') {
                                    setState('unanswered');
                                }
                            }}
                            className={cn(
                                'flex-1 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors',
                                selectedOption === index
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:bg-muted/50',
                                state === 'incorrect' && selectedOption === index
                                    ? 'border-red-400 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950/20 dark:text-red-400'
                                    : '',
                            )}
                            role="radio"
                            aria-checked={selectedOption === index}
                            aria-label={label}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* Fill in the Blank */}
            {type === 'fill_blank' && (
                <div className="mb-4">
                    <input
                        type="text"
                        value={textAnswer}
                        onChange={(e) => {
                            setTextAnswer(e.target.value);
                            if (state === 'incorrect') {
                                setState('unanswered');
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && textAnswer.trim()) {
                                handleCheck();
                            }
                        }}
                        placeholder="Type your answer..."
                        className={cn(
                            'w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary/20',
                            state === 'incorrect'
                                ? 'border-red-400 dark:border-red-600'
                                : 'border-border',
                        )}
                        aria-label="Your answer"
                    />
                </div>
            )}

            {/* Feedback */}
            {state === 'incorrect' && (
                <div className="mb-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <span aria-hidden="true">✗</span>
                    <span>Not quite right. Try again!</span>
                </div>
            )}

            {/* Hint */}
            {showHint && hint && (
                <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                    <span className="font-medium">💡 Hint:</span> {hint}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleCheck}
                    disabled={
                        (type === 'fill_blank' && !textAnswer.trim()) ||
                        ((type === 'mcq' || type === 'true_false') && selectedOption === null)
                    }
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Check answer"
                >
                    Check
                </button>

                {state === 'incorrect' && (
                    <button
                        type="button"
                        onClick={handleRetry}
                        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50"
                        aria-label="Retry question"
                    >
                        Retry
                    </button>
                )}

                {!showHint && hint && state === 'unanswered' && (
                    <button
                        type="button"
                        onClick={() => setShowHint(true)}
                        className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        aria-label="Show hint"
                    >
                        Show Hint
                    </button>
                )}
            </div>
        </div>
    );
}
