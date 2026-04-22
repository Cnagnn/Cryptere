import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { quiz as submitQuiz } from '@/routes/courses/lessons';

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
};

export function QuizPanel({ task, courseSlug, lessonId }: QuizPanelProps) {
    const questions = task.quizQuestions;
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>(() =>
        questions.map(() => -1),
    );
    const [result, setResult] = useState<{
        score: number;
        total: number;
        correctness: boolean[];
        explanations: Array<string | null>;
    } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const normalizedAnswers =
        selectedAnswers.length === questions.length
            ? selectedAnswers
            : questions.map(() => -1);
    const quizResult =
        result && result.total === questions.length ? result : null;

    if (questions.length === 0) {
        return (
            <Card className="border-dashed border-border/70">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quiz</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This quiz task has no questions yet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const allAnswered = normalizedAnswers.every((answer) => answer !== -1);
    const hasTaskId = task.id > 0;

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
                    };
                })
                .then(
                    (data) => {
                        setResult({
                            score: data.score,
                            total: data.total,
                            correctness: data.results.map((r) => r.correct),
                            explanations: data.results.map(
                                (r) => r.explanation,
                            ),
                        });
                    },
                )
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
        setSelectedAnswers(questions.map(() => -1));
        setResult(null);
        setSubmitError(null);
    };

    return (
        <Card className="border-border/80">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                    Quiz - {task.title}
                    {quizResult ? (
                        <span className="ml-2 text-base font-normal text-primary">
                            {quizResult.score}/{quizResult.total} correct
                        </span>
                    ) : null}
                </CardTitle>
                <CardDescription>
                    Answer all questions, then submit to check your
                    understanding.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {questions.map((question, questionIndex) => {
                    const answerResult =
                        quizResult?.correctness[questionIndex] ?? null;

                    return (
                        <div
                            key={`${task.id}-q-${questionIndex}`}
                            className={cn(
                                'rounded-lg border p-4',
                                answerResult === true &&
                                    'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20',
                                answerResult === false &&
                                    'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20',
                            )}
                        >
                            <p className="mb-3 font-medium">
                                {question.question}
                            </p>
                            <RadioGroup
                                value={String(normalizedAnswers[questionIndex])}
                                onValueChange={(value) => {
                                    if (quizResult || isSubmitting) {
                                        return;
                                    }

                                    const newAnswers = [...normalizedAnswers];
                                    newAnswers[questionIndex] = Number(value);
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
                                            id={`task-${task.id}-q-${questionIndex}-o-${optionIndex}`}
                                            disabled={
                                                quizResult !== null ||
                                                isSubmitting
                                            }
                                        />
                                        <Label
                                            htmlFor={`task-${task.id}-q-${questionIndex}-o-${optionIndex}`}
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
                                        {quizResult?.explanations[
                                            questionIndex
                                        ] ?? question.explanation}
                                    </span>
                                </div>
                            ) : null}
                        </div>
                    );
                })}

                <div className="mt-2 flex items-center gap-3">
                    {quizResult ? (
                        <Button type="button" onClick={handleRetryQuiz}>
                            Retry Quiz
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleSubmitQuiz}
                            disabled={!allAnswered || isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Answers'}
                        </Button>
                    )}
                    {!allAnswered && !quizResult ? (
                        <span className="text-sm text-muted-foreground">
                            Please answer all questions to submit
                        </span>
                    ) : null}

                    {submitError ? (
                        <span className="text-sm text-destructive">
                            {submitError}
                        </span>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}
