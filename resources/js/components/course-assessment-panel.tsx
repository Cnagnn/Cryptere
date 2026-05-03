import { router } from '@inertiajs/react';
import {
    AlertCircle,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Loader2,
    MessageSquare,
    Send,
    Target,
    Trophy,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { saveAnswer, start, submit } from '@/routes/assessments';

// ── Types ──

type BloomLevel = string;
type GradingType = string;
type QuestionType = string;

export type AssessmentQuestion = {
    id: number;
    bloomLevel: BloomLevel;
    questionType: QuestionType;
    questionText: string;
    options: string[] | null;
    points: number;
    gradingType: GradingType;
    minWords: number | null;
    maxWords: number | null;
    sortOrder: number;
};

export type ActiveSubmission = {
    id: number;
    attemptNumber: number;
    startedAt: string;
} | null;

export type PastSubmission = {
    id: number;
    attemptNumber: number;
    status: string;
    totalScore: number | null;
    passed: boolean;
    submittedAt: string | null;
    gradedAt: string | null;
};

export type RubricCriterionScore = {
    score: number;
    feedback: string | null;
};

export type AnswerResult = {
    id: number;
    questionId: number;
    questionText: string;
    questionType: string;
    bloomLevel: string;
    answerText: string | null;
    selectedOption: string | null;
    isCorrect: boolean | null;
    pointsAwarded: number | null;
    maxPoints: number;
    rubricScores: Record<string, RubricCriterionScore> | null;
    feedback: string | null;
    explanation: string | null;
    correctAnswer: string | null;
};

export type SubmissionResult = {
    id: number;
    attemptNumber: number;
    status: string;
    totalScore: number | null;
    pointsEarned: number | null;
    pointsPossible: number | null;
    passed: boolean;
    submittedAt: string | null;
    gradedAt: string | null;
    overallFeedback: string | null;
    graderName: string | null;
};

export type LatestResults = {
    submission: SubmissionResult;
    answers: AnswerResult[];
} | null;

export type AssessmentFullData = {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    bloomLevel: string;
    bloomLabel: string;
    gradingType: string;
    passingScore: number;
    maxAttempts: number | null;
    timeLimitMinutes: number | null;
    questionsCount: number;
    totalPoints: number;
    bestScore: number | null;
    passed: boolean;
    attemptCount: number;
    canAttempt: boolean;
    isLocked: boolean;
    questions: AssessmentQuestion[];
    activeSubmission: ActiveSubmission;
    pastSubmissions: PastSubmission[];
    latestResults: LatestResults;
};

type AssessmentView = 'overview' | 'attempt' | 'results';

type Props = {
    assessment: AssessmentFullData;
    onBack: () => void;
};

// ── Main Panel ──

export function CourseAssessmentPanel({ assessment, onBack }: Props) {
    const [view, setView] = useState<AssessmentView>(() => {
        if (assessment.activeSubmission) {
            return 'attempt';
        }

        return 'overview';
    });

    return (
        <div className="flex flex-col gap-4">
            {view === 'overview' && (
                <AssessmentOverview
                    assessment={assessment}
                    onViewResults={() => setView('results')}
                    onBack={onBack}
                />
            )}
            {view === 'attempt' && assessment.activeSubmission && (
                <ActiveAttemptView
                    assessment={assessment}
                    questions={assessment.questions}
                    submission={assessment.activeSubmission}
                />
            )}
            {view === 'results' && assessment.latestResults && (
                <AssessmentResultsView
                    assessment={assessment}
                    results={assessment.latestResults}
                    onBack={() => setView('overview')}
                />
            )}
        </div>
    );
}

// ── Overview ──

function AssessmentOverview({
    assessment,
    onViewResults,
    onBack,
}: {
    assessment: AssessmentFullData;
    onViewResults: () => void;
    onBack: () => void;
}) {
    const [starting, setStarting] = useState(false);

    const handleStart = () => {
        setStarting(true);
        router.post(
            start.url(assessment.slug),
            {},
            {
                preserveScroll: true,
                onFinish: () => setStarting(false),
            },
        );
    };

    return (
        <div className="space-y-4">
            {/* Back button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="gap-1"
            >
                <ChevronLeft className="size-4" />
                Back to lessons
            </Button>

            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Badge variant="outline">{assessment.bloomLevel}</Badge>
                    <Badge variant="secondary">{assessment.bloomLabel}</Badge>
                    <Badge variant="secondary">
                        {assessment.gradingType} grading
                    </Badge>
                </div>
                <h2 className="text-xl font-semibold">{assessment.title}</h2>
                {assessment.description && (
                    <p className="text-sm text-muted-foreground">
                        {assessment.description}
                    </p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        Pass: {assessment.passingScore}%
                    </span>
                    <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {assessment.totalPoints} points
                    </span>
                    {assessment.timeLimitMinutes && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {assessment.timeLimitMinutes} min limit
                        </span>
                    )}
                </div>
            </div>

            {/* Question Preview */}
            <Card>
                <CardHeader>
                    <CardTitle>Assessment Overview</CardTitle>
                    <CardDescription>
                        {assessment.questions.length} questions ·{' '}
                        {assessment.totalPoints} total points
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {assessment.questions.map((q, i) => (
                        <div
                            key={q.id}
                            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                            <span className="text-muted-foreground">
                                Q{i + 1}. {q.questionType.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                    {q.bloomLevel}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {q.points} pts
                                </span>
                            </div>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                    {assessment.canAttempt ? (
                        <Button
                            onClick={handleStart}
                            disabled={starting}
                            className="w-full"
                        >
                            {starting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <BookOpen className="mr-2 h-4 w-4" />
                            )}
                            {assessment.attemptCount > 0
                                ? 'Retry Assessment'
                                : 'Start Assessment'}
                        </Button>
                    ) : (
                        <Button disabled className="w-full" variant="secondary">
                            No Attempts Remaining
                        </Button>
                    )}
                </CardFooter>
            </Card>

            {/* Past Submissions */}
            {assessment.pastSubmissions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Past Attempts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {assessment.pastSubmissions.map((sub) => (
                                <div
                                    key={sub.id}
                                    className="flex items-center justify-between rounded-md border px-3 py-2"
                                >
                                    <div className="flex items-center gap-3">
                                        {sub.passed ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                        )}
                                        <span className="text-sm">
                                            Attempt #{sub.attemptNumber}
                                        </span>
                                        <Badge
                                            variant={
                                                sub.status === 'graded'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            className="text-xs"
                                        >
                                            {sub.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {sub.totalScore !== null && (
                                            <span className="text-sm font-medium">
                                                {sub.totalScore}%
                                            </span>
                                        )}
                                        {sub.status === 'graded' &&
                                            assessment.latestResults && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={onViewResults}
                                                >
                                                    View
                                                </Button>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ── Active Attempt ──

function ActiveAttemptView({
    assessment,
    questions,
    submission,
}: {
    assessment: AssessmentFullData;
    questions: AssessmentQuestion[];
    submission: NonNullable<ActiveSubmission>;
}) {
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [currentIndex, setCurrentIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;

    // Timer — resume from startedAt so refresh doesn't reset the clock
    const [elapsed, setElapsed] = useState(() => {
        const started = new Date(submission.startedAt).getTime();

        return Math.max(0, Math.floor((Date.now() - started) / 1000));
    });
    useEffect(() => {
        const interval = setInterval(() => setElapsed((e) => e + 1), 1000);

        return () => clearInterval(interval);
    }, []);

    const timeLimit = assessment.timeLimitMinutes
        ? assessment.timeLimitMinutes * 60
        : null;
    const timeRemaining = timeLimit ? timeLimit - elapsed : null;

    // Auto-submit when time runs out
    useEffect(() => {
        if (timeRemaining !== null && timeRemaining <= 0) {
            handleSubmit();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRemaining]);

    const autoSave = useCallback(
        (questionId: number, value: string) => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(() => {
                const question = questions.find((q) => q.id === questionId);

                if (!question) {
                    return;
                }

                const isObjective = ['mcq', 'true_false'].includes(
                    question.questionType,
                );

                fetch(saveAnswer.url(assessment.slug), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>(
                                'meta[name="csrf-token"]',
                            )?.content ?? '',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        question_id: questionId,
                        ...(isObjective
                            ? { selected_option: value }
                            : { answer_text: value }),
                    }),
                });
            }, 800);
        },
        [assessment.slug, questions],
    );

    const handleAnswer = (questionId: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        autoSave(questionId, value);
    };

    const handleSubmit = () => {
        setSubmitting(true);
        router.post(
            submit.url(assessment.slug),
            {},
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(Math.abs(seconds) / 60);
        const s = Math.abs(seconds) % 60;

        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-4">
            {/* Progress Bar */}
            <Card>
                <CardContent className="flex items-center gap-4 py-3">
                    <Progress value={progress} className="flex-1" />
                    <span className="text-sm text-muted-foreground">
                        {answeredCount}/{questions.length}
                    </span>
                    {timeRemaining !== null && (
                        <Badge
                            variant={
                                timeRemaining < 60 ? 'destructive' : 'outline'
                            }
                        >
                            <Clock className="mr-1 h-3 w-3" />
                            {formatTime(timeRemaining)}
                        </Badge>
                    )}
                </CardContent>
            </Card>

            {/* Question Navigation */}
            <div className="flex flex-wrap gap-1">
                {questions.map((q, i) => (
                    <button
                        key={q.id}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-8 w-8 rounded text-xs font-medium transition-colors ${
                            i === currentIndex
                                ? 'bg-primary text-primary-foreground'
                                : answers[q.id]
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-muted text-muted-foreground'
                        }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>

            {/* Current Question */}
            {currentQuestion && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                                Question {currentIndex + 1}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                    {currentQuestion.bloomLevel}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {currentQuestion.points} pts
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {currentQuestion.questionText}
                        </p>

                        <Separator />

                        <QuestionInput
                            question={currentQuestion}
                            value={answers[currentQuestion.id] ?? ''}
                            onChange={(val) =>
                                handleAnswer(currentQuestion.id, val)
                            }
                        />
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            variant="outline"
                            disabled={currentIndex === 0}
                            onClick={() => setCurrentIndex((i) => i - 1)}
                        >
                            Previous
                        </Button>
                        {currentIndex < questions.length - 1 ? (
                            <Button
                                onClick={() => setCurrentIndex((i) => i + 1)}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                variant="default"
                            >
                                {submitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                Submit Assessment
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            )}

            {/* Submit Button (always visible) */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={submitting || answeredCount === 0}
                    variant="destructive"
                    size="sm"
                >
                    {submitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="mr-2 h-4 w-4" />
                    )}
                    Submit All Answers
                </Button>
            </div>
        </div>
    );
}

// ── Results View ──

function AssessmentResultsView({
    assessment,
    results,
    onBack,
}: {
    assessment: AssessmentFullData;
    results: NonNullable<LatestResults>;
    onBack: () => void;
}) {
    const { submission, answers } = results;
    const passed = submission.passed;

    return (
        <div className="space-y-4">
            {/* Back button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="gap-1"
            >
                <ChevronLeft className="size-4" />
                Back to overview
            </Button>

            {/* Score Summary */}
            <Card
                className={
                    passed
                        ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                        : 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
                }
            >
                <CardHeader className="text-center">
                    {passed ? (
                        <Trophy className="mx-auto h-12 w-12 text-green-500" />
                    ) : (
                        <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
                    )}
                    <CardTitle className="text-2xl">
                        {passed
                            ? 'Assessment Passed!'
                            : 'Assessment Not Passed'}
                    </CardTitle>
                    <CardDescription>
                        {assessment.title} · Attempt #{submission.attemptNumber}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mx-auto max-w-sm space-y-4">
                        <div className="text-center">
                            <span className="text-4xl font-bold">
                                {submission.totalScore ?? '—'}%
                            </span>
                            <p className="text-sm text-muted-foreground">
                                {submission.pointsEarned ?? 0} /{' '}
                                {submission.pointsPossible ?? 0} points
                            </p>
                        </div>
                        <Progress
                            value={submission.totalScore ?? 0}
                            className="h-3"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0%</span>
                            <span className="font-medium">
                                Pass: {assessment.passingScore}%
                            </span>
                            <span>100%</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Badge variant="outline">
                                {assessment.bloomLevel}
                            </Badge>
                            <Badge variant="secondary">
                                {assessment.bloomLabel}
                            </Badge>
                            <Badge
                                variant={
                                    submission.status === 'graded'
                                        ? 'default'
                                        : 'secondary'
                                }
                            >
                                {submission.status}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Overall Feedback */}
            {submission.overallFeedback && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MessageSquare className="h-4 w-4" />
                            Instructor Feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {submission.overallFeedback}
                        </p>
                        {submission.graderName && (
                            <p className="mt-2 text-xs text-muted-foreground">
                                — {submission.graderName}
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Answer Details */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Answer Details</h3>
                {answers.map((answer, i) => (
                    <AnswerCard key={answer.id} answer={answer} index={i} />
                ))}
            </div>
        </div>
    );
}

// ── Question Input ──

function QuestionInput({
    question,
    value,
    onChange,
}: {
    question: AssessmentQuestion;
    value: string;
    onChange: (val: string) => void;
}) {
    switch (question.questionType) {
        case 'mcq':
        case 'true_false':
            return (
                <div className="space-y-2">
                    {(question.options ?? []).map((option, i) => (
                        <label
                            key={i}
                            className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition-colors ${
                                value === option
                                    ? 'border-primary bg-primary/5'
                                    : 'hover:bg-muted/50'
                            }`}
                        >
                            <input
                                type="radio"
                                name={`q-${question.id}`}
                                value={option}
                                checked={value === option}
                                onChange={() => onChange(option)}
                                className="h-4 w-4"
                            />
                            <span className="text-sm">{option}</span>
                        </label>
                    ))}
                </div>
            );

        case 'short_answer':
        case 'computation':
            return (
                <div className="space-y-2">
                    <Label>Your Answer</Label>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder={
                            question.questionType === 'computation'
                                ? 'Enter your computed answer...'
                                : 'Type your answer...'
                        }
                    />
                </div>
            );

        case 'essay':
        case 'case_study':
        case 'design':
            return (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Your Response</Label>
                        {(question.minWords || question.maxWords) && (
                            <span className="text-xs text-muted-foreground">
                                {question.minWords &&
                                    `Min: ${question.minWords}`}
                                {question.minWords &&
                                    question.maxWords &&
                                    ' · '}
                                {question.maxWords &&
                                    `Max: ${question.maxWords}`}
                                {' words'}
                            </span>
                        )}
                    </div>
                    <Textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={8}
                        placeholder="Write your detailed response here..."
                        className="resize-y"
                    />
                    <p className="text-xs text-muted-foreground">
                        Word count:{' '}
                        {value.trim() ? value.trim().split(/\s+/).length : 0}
                    </p>
                </div>
            );

        default:
            return (
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={4}
                    placeholder="Type your answer..."
                />
            );
    }
}

// ── Answer Card ──

function AnswerCard({
    answer,
    index,
}: {
    answer: AnswerResult;
    index: number;
}) {
    const isGraded = answer.pointsAwarded !== null;
    const isCorrect = answer.isCorrect;

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                        Question {index + 1}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            {answer.bloomLevel}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                            {answer.questionType.replace('_', ' ')}
                        </Badge>
                        {isGraded && (
                            <span className="text-sm font-medium">
                                {answer.pointsAwarded}/{answer.maxPoints}
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">
                    {answer.questionText}
                </p>

                <Separator />

                {/* Student's Answer */}
                <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                        Your Answer:
                    </p>
                    <div className="flex items-start gap-2">
                        {isCorrect === true && (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        )}
                        {isCorrect === false && (
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        )}
                        <p className="text-sm whitespace-pre-wrap">
                            {answer.selectedOption || answer.answerText || (
                                <span className="text-muted-foreground italic">
                                    No answer provided
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Correct Answer */}
                {answer.correctAnswer && (
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                            Correct Answer:
                        </p>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            {answer.correctAnswer}
                        </p>
                    </div>
                )}

                {/* Explanation */}
                {answer.explanation && (
                    <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                            Explanation:
                        </p>
                        <p className="mt-1 text-sm">{answer.explanation}</p>
                    </div>
                )}

                {/* Rubric Scores */}
                {answer.rubricScores &&
                    Object.keys(answer.rubricScores).length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">
                                Rubric Breakdown:
                            </p>
                            {Object.entries(answer.rubricScores).map(
                                ([criterion, score]) => (
                                    <div
                                        key={criterion}
                                        className="flex items-center justify-between rounded border px-3 py-1.5 text-sm"
                                    >
                                        <span>{criterion}</span>
                                        <span className="font-medium">
                                            {score.score} pts
                                        </span>
                                    </div>
                                ),
                            )}
                        </div>
                    )}

                {/* Feedback */}
                {answer.feedback && (
                    <div className="rounded-md border-l-2 border-primary bg-primary/5 p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                            Feedback:
                        </p>
                        <p className="mt-1 text-sm whitespace-pre-wrap">
                            {answer.feedback}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
