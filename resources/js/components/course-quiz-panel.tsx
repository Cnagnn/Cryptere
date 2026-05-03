import {
    ChevronLeft,
    ChevronRight,
    Eye,
    RefreshCw,
    Sparkles,
    Star,
    TrendingUp,
    Trophy,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from '@/components/ui/pagination';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { quiz as submitQuiz } from '@/routes/courses/lessons';

export type QuizSubmission = {
    answers: number[];
    score: number;
    total: number;
    results: Array<{ correct: boolean; explanation: string | null }>;
    xpEarned: number;
    pointsEarned: number;
    attemptNumber: number;
    xpMultiplier: number;
    bestScore: number;
    bestTotal: number;
    canRetry: boolean;
};

export type QuizPanelProps = {
    courseSlug: string;
    lessonId: number;
    task: {
        id: number;
        title: string;
        quizQuestions: Array<{
            question: string;
            options: [string, string, string, string];
            explanation: string;
        }>;
    };
    submission?: QuizSubmission | null;
    onNextTask?: () => void;
};

export function QuizPanel({
    task,
    courseSlug,
    lessonId,
    submission,
    onNextTask,
}: QuizPanelProps) {
    const questions = task.quizQuestions;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>(
        () => submission?.answers ?? questions.map(() => -1),
    );
    const [result, setResult] = useState<{
        score: number;
        total: number;
        correctness: boolean[];
        explanations: Array<string | null>;
        xpEarned: number;
        pointsEarned: number;
        attemptNumber: number;
        xpMultiplier: number;
        bestScore: number;
        bestTotal: number;
        canRetry: boolean;
    } | null>(() =>
        submission
            ? {
                  score: submission.score,
                  total: submission.total,
                  correctness: submission.results.map((r) => r.correct),
                  explanations: submission.results.map((r) => r.explanation),
                  xpEarned: submission.xpEarned,
                  pointsEarned: submission.pointsEarned,
                  attemptNumber: submission.attemptNumber ?? 1,
                  xpMultiplier: submission.xpMultiplier ?? 1.0,
                  bestScore: submission.bestScore ?? submission.score,
                  bestTotal: submission.bestTotal ?? submission.total,
                  canRetry: submission.canRetry ?? true,
              }
            : null,
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [showReview, setShowReview] = useState(false);
    const [previousScore, setPreviousScore] = useState<number | null>(
        submission ? submission.score : null,
    );

    const normalizedAnswers =
        selectedAnswers.length === questions.length
            ? selectedAnswers
            : questions.map(() => -1);
    const quizResult =
        result && result.total === questions.length ? result : null;

    if (questions.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-6">
                <p className="text-sm text-muted-foreground">
                    This quiz task has no questions yet.
                </p>
            </div>
        );
    }

    const isFirstQuestion = currentIndex === 0;
    const isLastQuestion = currentIndex === questions.length - 1;
    const allAnswered = normalizedAnswers.every((answer) => answer !== -1);
    const currentAnswered = normalizedAnswers[currentIndex] !== -1;
    const hasTaskId = task.id > 0;

    const question = questions[currentIndex];
    const answerResult = quizResult?.correctness[currentIndex] ?? null;

    const handleSubmitQuiz = () => {
        if (!allAnswered) {
            return;
        }

        setSubmitError(null);

        if (hasTaskId) {
            setIsSubmitting(true);

            const quizUrl = submitQuiz.url({
                course: courseSlug,
                lesson: lessonId,
            });

            fetch(quizUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((row) => row.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] ?? '',
                    ),
                },
                body: JSON.stringify({
                    task_id: task.id,
                    answers: normalizedAnswers,
                }),
            })
                .then(async (response) => {
                    const data = await response.json();

                    if (!response.ok) {
                        const errorMessage =
                            (data as { error?: string })?.error ??
                            'Quiz submission failed. Please try again.';

                        throw new Error(errorMessage);
                    }

                    return data as {
                        score: number;
                        total: number;
                        results: Array<{
                            correct: boolean;
                            explanation: string | null;
                        }>;
                        xp_earned: number;
                        points_earned: number;
                        attempt_number: number;
                        max_attempts: number | null;
                        xp_multiplier: number;
                        best_score: number;
                        best_total: number;
                        can_retry: boolean;
                    };
                })
                .then((data) => {
                    // Save previous score for improvement tracking
                    if (quizResult) {
                        setPreviousScore(quizResult.bestScore);
                    }

                    setResult({
                        score: data.score,
                        total: data.total,
                        correctness: data.results.map((r) => r.correct),
                        explanations: data.results.map((r) => r.explanation),
                        xpEarned: data.xp_earned,
                        pointsEarned: data.points_earned,
                        attemptNumber: data.attempt_number,
                        xpMultiplier: data.xp_multiplier,
                        bestScore: data.best_score,
                        bestTotal: data.best_total,
                        canRetry: data.can_retry,
                    });
                    setShowReview(false);

                    if (data.xp_earned > 0 || data.points_earned > 0) {
                        const parts: string[] = [];

                        if (data.xp_earned > 0) {
                            parts.push(`+${data.xp_earned} XP`);
                        }

                        if (data.points_earned > 0) {
                            parts.push(`+${data.points_earned} Points`);
                        }

                        toast.success(parts.join(' · '), {
                            description: `Score: ${data.score}/${data.total}`,
                        });
                    }
                })
                .catch((error: unknown) => {
                    const message =
                        error instanceof Error
                            ? error.message
                            : 'Quiz submission failed. Please try again.';
                    setSubmitError(message);
                })
                .finally(() => {
                    setIsSubmitting(false);
                });

            return;
        }

        setSubmitError('Quiz task is not ready for submission yet.');
    };

    const handleRetryQuiz = () => {
        // Save the current best score before resetting
        if (quizResult) {
            setPreviousScore(quizResult.bestScore);
        }

        setSelectedAnswers(questions.map(() => -1));
        setResult(null);
        setSubmitError(null);
        setShowReview(false);
        setCurrentIndex(0);
    };

    // Result summary screen (shown after submit, before review)
    if (quizResult && !showReview) {
        const isPerfect = quizResult.score === quizResult.total;
        const hasImproved =
            previousScore !== null && quizResult.score > previousScore;
        const showRetryButton = quizResult.canRetry && !isPerfect;
        const xpMultiplierPercent = Math.round(quizResult.xpMultiplier * 100);

        return (
            <div className="flex flex-col items-center gap-6 py-6">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                    <Trophy
                        className={cn(
                            'size-8',
                            isPerfect
                                ? 'text-amber-500'
                                : 'text-muted-foreground',
                        )}
                    />
                </div>

                <div className="text-center">
                    <h3 className="text-xl font-semibold">Quiz Completed!</h3>
                    <p className="mt-1 text-muted-foreground">
                        You scored {quizResult.score} out of {quizResult.total}
                    </p>

                    {/* Attempt number indicator */}
                    {quizResult.attemptNumber > 1 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            Attempt {quizResult.attemptNumber}
                            {quizResult.xpMultiplier < 1.0 && (
                                <span>
                                    {' '}
                                    · XP reward: {xpMultiplierPercent}%
                                </span>
                            )}
                        </p>
                    )}

                    {/* Improvement tracking */}
                    {hasImproved && (
                        <div className="mt-2 flex items-center justify-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="size-4" />
                            <span>
                                Improved from {previousScore}/{quizResult.total}
                                !
                            </span>
                        </div>
                    )}

                    {/* Best score across all attempts */}
                    {quizResult.attemptNumber > 1 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            Best score: {quizResult.bestScore}/
                            {quizResult.bestTotal}
                        </p>
                    )}
                </div>

                {quizResult.xpEarned > 0 || quizResult.pointsEarned > 0 ? (
                    <div className="flex gap-4">
                        {quizResult.xpEarned > 0 ? (
                            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
                                <Sparkles className="size-4 text-amber-500" />
                                <span className="text-sm font-medium">
                                    +{quizResult.xpEarned} XP
                                </span>
                            </div>
                        ) : null}
                        {quizResult.pointsEarned > 0 ? (
                            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
                                <Star className="size-4 text-blue-500" />
                                <span className="text-sm font-medium">
                                    +{quizResult.pointsEarned} Points
                                </span>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setShowReview(true);
                            setCurrentIndex(0);
                        }}
                        className="gap-2"
                    >
                        <Eye className="size-4" />
                        View Answers
                    </Button>
                    {onNextTask ? (
                        <Button onClick={onNextTask} className="gap-2">
                            Next Task
                            <ChevronRight className="size-4" />
                        </Button>
                    ) : null}
                    {showRetryButton ? (
                        <Button
                            variant="secondary"
                            onClick={handleRetryQuiz}
                            className="gap-2"
                        >
                            <RefreshCw className="size-4" />
                            Retry Quiz
                        </Button>
                    ) : (
                        <Button variant="ghost" onClick={handleRetryQuiz}>
                            Retry Quiz
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Question indicator */}
            <p className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
                {quizResult ? (
                    <span className="ml-2 font-medium text-primary">
                        — {quizResult.score}/{quizResult.total} correct
                    </span>
                ) : null}
            </p>

            {/* Current question */}
            <div
                className={cn(
                    'rounded-lg border p-4',
                    answerResult === true &&
                        'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20',
                    answerResult === false &&
                        'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20',
                )}
            >
                <p className="mb-3 font-medium">
                    {currentIndex + 1}. {question.question}
                </p>
                <RadioGroup
                    value={String(normalizedAnswers[currentIndex])}
                    onValueChange={(value) => {
                        if (quizResult || isSubmitting) {
                            return;
                        }

                        const newAnswers = [...normalizedAnswers];
                        newAnswers[currentIndex] = Number(value);
                        setSelectedAnswers(newAnswers);
                    }}
                    className="flex flex-col gap-2"
                >
                    {question.options.map((option, optionIndex) => (
                        <div
                            key={optionIndex}
                            className="flex items-center gap-2"
                        >
                            <RadioGroupItem
                                value={String(optionIndex)}
                                id={`task-${task.id}-q-${currentIndex}-o-${optionIndex}`}
                                disabled={quizResult !== null || isSubmitting}
                            />
                            <Label
                                htmlFor={`task-${task.id}-q-${currentIndex}-o-${optionIndex}`}
                                className="font-normal"
                            >
                                {option}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>

                {answerResult !== null ? (
                    <div
                        className={cn(
                            'mt-4 rounded-md p-3 text-sm font-medium',
                            answerResult
                                ? 'bg-muted text-foreground'
                                : 'bg-destructive/10 text-destructive',
                        )}
                    >
                        {answerResult ? 'Correct!' : 'Incorrect.'}{' '}
                        <span className="font-normal opacity-90">
                            {quizResult?.explanations[currentIndex] ??
                                question.explanation}
                        </span>
                    </div>
                ) : null}
            </div>

            {/* Error message */}
            {submitError ? (
                <p className="text-sm text-destructive">{submitError}</p>
            ) : null}

            {/* Pagination / Submit */}
            {quizResult && showReview ? (
                <Pagination>
                    <PaginationContent className="w-full justify-between">
                        <PaginationItem>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isFirstQuestion}
                                onClick={() => setCurrentIndex((i) => i - 1)}
                                className="gap-1"
                            >
                                <ChevronLeft className="size-4" />
                                Previous
                            </Button>
                        </PaginationItem>
                        <PaginationItem>
                            {isLastQuestion ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setShowReview(false)}
                                >
                                    Back to Results
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setCurrentIndex((i) => i + 1)
                                    }
                                    className="gap-1"
                                >
                                    Next
                                    <ChevronRight className="size-4" />
                                </Button>
                            )}
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            ) : (
                <Pagination>
                    <PaginationContent className="w-full justify-between">
                        <PaginationItem>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isFirstQuestion}
                                onClick={() => setCurrentIndex((i) => i - 1)}
                                className="gap-1"
                            >
                                <ChevronLeft className="size-4" />
                                Previous
                            </Button>
                        </PaginationItem>
                        <PaginationItem>
                            {isLastQuestion ? (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleSubmitQuiz}
                                    disabled={!allAnswered || isSubmitting}
                                >
                                    {isSubmitting
                                        ? 'Submitting...'
                                        : 'Submit Answers'}
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!currentAnswered}
                                    onClick={() =>
                                        setCurrentIndex((i) => i + 1)
                                    }
                                    className="gap-1"
                                >
                                    Next
                                    <ChevronRight className="size-4" />
                                </Button>
                            )}
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}
