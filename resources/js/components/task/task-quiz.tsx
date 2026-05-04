import { router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Trophy, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TaskActions } from '@/components/task/task-actions';
import { TaskCard } from '@/components/task/task-card';
import { TaskProgress } from '@/components/task/task-progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { quiz as submitQuizRoute } from '@/routes/courses/lessons';

export type QuizQuestion = {
    id: number;
    question: string;
    options: [string, string, string, string];
    explanation: string;
};

export type QuizSubmission = {
    score: number;
    total: number;
    results: Array<{
        correct: boolean;
        explanation: string | null;
    }>;
    xpEarned: number;
    pointsEarned: number;
    attemptNumber: number;
    xpMultiplier: number;
    bestScore: number;
    bestTotal: number;
    canRetry: boolean;
};

type TaskQuizProps = {
    courseSlug: string;
    lessonId: number;
    task: {
        id: number;
        title: string;
        description: string;
        quizQuestions: QuizQuestion[];
    };
    submission?: QuizSubmission | null;
    onComplete?: () => void;
};

export function TaskQuiz({
    courseSlug,
    lessonId,
    task,
    submission,
    onComplete,
}: TaskQuizProps) {
    const questions = task.quizQuestions || [];

    // Debug logging
    console.log('TaskQuiz render:', {
        taskId: task.id,
        questionsCount: questions.length,
        questions,
        submission,
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [showResults, setShowResults] = useState(!!submission);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localAnswers, setLocalAnswers] = useState<number[]>(() => {
        // Load from localStorage or submission
        const saved = localStorage.getItem(`quiz-${task.id}-answers`);

        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                // Ignore parse errors
            }
        }

        return submission?.results.map((_, i) => i) ?? questions.map(() => -1);
    });

    // Save answers to localStorage
    useEffect(() => {
        if (!showResults) {
            localStorage.setItem(
                `quiz-${task.id}-answers`,
                JSON.stringify(localAnswers),
            );
        }
    }, [localAnswers, task.id, showResults]);

    // Clear localStorage when quiz is completed
    useEffect(() => {
        if (showResults) {
            localStorage.removeItem(`quiz-${task.id}-answers`);
        }
    }, [showResults, task.id]);

    if (questions.length === 0) {
        return (
            <TaskCard title={task.title} description={task.description}>
                <Alert>
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        This quiz has no questions yet.
                    </AlertDescription>
                </Alert>
            </TaskCard>
        );
    }

    const currentQuestion = questions[currentIndex];

    if (!currentQuestion) {
        return (
            <TaskCard title={task.title} description={task.description}>
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        Invalid question index. Please refresh the page.
                    </AlertDescription>
                </Alert>
            </TaskCard>
        );
    }

    const currentAnswer = localAnswers[currentIndex];
    const allAnswered = localAnswers.every((answer) => answer !== -1);
    const isFirstQuestion = currentIndex === 0;
    const isLastQuestion = currentIndex === questions.length - 1;

    const handleAnswerSelect = (value: string) => {
        const answerIndex = parseInt(value, 10);
        const newAnswers = [...localAnswers];
        newAnswers[currentIndex] = answerIndex;
        setLocalAnswers(newAnswers);
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleSubmit = () => {
        if (!allAnswered) {
            toast.error('Please answer all questions before submitting');

            return;
        }

        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        // Build answers array with question IDs
        const answersWithIds = questions.map((question, index) => ({
            question_id: question.id,
            answer: localAnswers[index],
        }));

        router.post(
            submitQuizRoute.url({
                course: courseSlug,
                lesson: lessonId,
            }),
            {
                task_id: task.id,
                answers: answersWithIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowResults(true);
                    setIsSubmitting(false);
                    toast.success('Quiz submitted successfully!');
                    onComplete?.();
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    console.error('Quiz submission error:', errors);
                    const errorMessage =
                        errors.message ||
                        errors.answers ||
                        'Quiz submission failed. Please try again.';
                    toast.error(errorMessage);
                },
            },
        );
    };

    const handleRetry = () => {
        setShowResults(false);
        setLocalAnswers(questions.map(() => -1));
        setCurrentIndex(0);
    };

    // Results view
    if (showResults && submission) {
        const percentage = Math.round(
            (submission.score / submission.total) * 100,
        );
        const passed = percentage >= 70;

        return (
            <TaskCard
                title={task.title}
                description={task.description}
                headerAction={
                    <Badge
                        variant={passed ? 'default' : 'destructive'}
                        className="text-sm"
                    >
                        {percentage}% Score
                    </Badge>
                }
            >
                <div className="space-y-6">
                    {/* Score Summary */}
                    <div className="rounded-lg border bg-muted/50 p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    {passed ? (
                                        <CheckCircle2 className="size-5 text-green-600" />
                                    ) : (
                                        <XCircle className="size-5 text-destructive" />
                                    )}
                                    <h3 className="text-lg font-semibold">
                                        {passed ? 'Great job!' : 'Keep trying!'}
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    You scored {submission.score} out of{' '}
                                    {submission.total} questions
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2">
                                    <Trophy className="size-5 text-yellow-600" />
                                    <span className="text-2xl font-bold">
                                        +{submission.xpEarned} XP
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Attempt {submission.attemptNumber} •{' '}
                                    {Math.round(submission.xpMultiplier * 100)}%
                                    multiplier
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Question Review */}
                    <div className="space-y-4">
                        <h4 className="font-semibold">Review Your Answers</h4>
                        {questions.map((question, index) => {
                            const result = submission.results[index];
                            const userAnswer = localAnswers[index];

                            return (
                                <div
                                    key={question.id}
                                    className={cn(
                                        'rounded-lg border p-4',
                                        result.correct
                                            ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                                            : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {result.correct ? (
                                            <CheckCircle2 className="mt-0.5 size-5 flex-shrink-0 text-green-600" />
                                        ) : (
                                            <XCircle className="mt-0.5 size-5 flex-shrink-0 text-destructive" />
                                        )}
                                        <div className="flex-1 space-y-2">
                                            <p className="font-medium">
                                                {index + 1}. {question.question}
                                            </p>
                                            <p className="text-sm">
                                                <span className="font-medium">
                                                    Your answer:
                                                </span>{' '}
                                                {question.options[userAnswer]}
                                            </p>
                                            {result.explanation && (
                                                <p className="text-sm text-muted-foreground">
                                                    {result.explanation}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    {submission.canRetry && (
                        <TaskActions
                            onRetry={handleRetry}
                            retryLabel="Try Again"
                            isSubmitting={isSubmitting}
                        />
                    )}
                </div>
            </TaskCard>
        );
    }

    // Question view
    return (
        <TaskCard
            title={task.title}
            description={task.description}
            headerAction={
                <Badge variant="outline" className="text-sm">
                    Question {currentIndex + 1} of {questions.length}
                </Badge>
            }
        >
            <div className="space-y-6">
                {/* Progress */}
                <TaskProgress
                    current={localAnswers.filter((a) => a !== -1).length}
                    total={questions.length}
                    label="Answered"
                />

                <Separator />

                {/* Question */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                        {currentIndex + 1}. {currentQuestion.question}
                    </h3>

                    <RadioGroup
                        value={
                            currentAnswer !== -1
                                ? currentAnswer.toString()
                                : undefined
                        }
                        onValueChange={handleAnswerSelect}
                    >
                        {currentQuestion.options.map((option, index) => (
                            <div
                                key={index}
                                className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50"
                            >
                                <RadioGroupItem
                                    value={index.toString()}
                                    id={`option-${index}`}
                                />
                                <Label
                                    htmlFor={`option-${index}`}
                                    className="flex-1 cursor-pointer text-base"
                                >
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {/* Error Message */}
                {errors.answers && (
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>{errors.answers}</AlertDescription>
                    </Alert>
                )}

                {/* Navigation */}
                <TaskActions
                    onPrevious={!isFirstQuestion ? handlePrevious : undefined}
                    onNext={!isLastQuestion ? handleNext : undefined}
                    onSubmit={
                        isLastQuestion && allAnswered ? handleSubmit : undefined
                    }
                    previousLabel="Previous"
                    nextLabel="Next"
                    submitLabel="Submit Quiz"
                    isSubmitting={isSubmitting}
                    isNextDisabled={currentAnswer === -1}
                    isPreviousDisabled={false}
                    isSubmitDisabled={!allAnswered}
                />
            </div>
        </TaskCard>
    );
}
