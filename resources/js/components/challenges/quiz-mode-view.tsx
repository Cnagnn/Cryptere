import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    Flame,
    Lightbulb,
    LoaderCircle,
    Play,
    Trophy,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { postJson } from '@/lib/fetch';
import { cn } from '@/lib/utils';
import {
    quizSubmit,
    sessionSummary as sessionSummaryRoute,
} from '@/routes/challenges';
import type {
    ChallengePayload,
    QuestionResult,
    QuizPhase,
    QuizSession,
    QuizSessionQuestion,
    SessionResult,
    SubmissionSummary,
} from '@/types/challenges';

/* ── Pre-Quiz Screen ── */
function PreQuizScreen({
    challenge,
    submissionSummary,
    totalQuestions,
    canPlay,
    onStart,
}: {
    challenge: ChallengePayload;
    submissionSummary: SubmissionSummary;
    totalQuestions: number;
    canPlay: boolean;
    onStart: () => void;
}) {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-3">
                <Badge variant="secondary">
                    <Clock3 />
                    {challenge.timeLimitSeconds}s per question
                </Badge>
                <Badge variant="secondary">{totalQuestions} questions</Badge>
                <Badge variant="secondary">
                    <Trophy />
                    Max {challenge.maxPointsPerQuestion} pts/question
                </Badge>
            </div>

            {submissionSummary.bestScore > 0 && (
                <div className="text-sm text-muted-foreground">
                    Your best score:{' '}
                    <span className="font-semibold text-foreground">
                        {submissionSummary.bestScore} pts
                    </span>
                </div>
            )}

            {challenge.hint && (
                <Alert>
                    <Lightbulb />
                    <AlertTitle>Hint</AlertTitle>
                    <AlertDescription>{challenge.hint}</AlertDescription>
                </Alert>
            )}

            {!canPlay ? (
                <Alert>
                    <AlertCircle />
                    <AlertTitle>Challenge is not playable now</AlertTitle>
                    <AlertDescription>
                        {challenge.status === 'upcoming'
                            ? 'The challenge has not started yet.'
                            : 'The challenge window has ended.'}
                    </AlertDescription>
                </Alert>
            ) : (
                <Button size="lg" onClick={onStart} className="gap-2">
                    <Play data-icon="inline-start" />
                    Start Quiz
                </Button>
            )}
        </div>
    );
}

/* ── Answer Area (type-dependent) ── */
function AnswerArea({
    question,
    textAnswer,
    onTextChange,
    onSubmit,
    isSubmitting,
    disabled,
}: {
    question: QuizSessionQuestion;
    textAnswer: string;
    onTextChange: (v: string) => void;
    onSubmit: (answer: string) => void;
    isSubmitting: boolean;
    disabled: boolean;
}) {
    if (question.type === 'mcq' && question.options) {
        return (
            <div className="grid gap-2 sm:grid-cols-2">
                {question.options.map((opt, i) => (
                    <Button
                        key={i}
                        type="button"
                        variant="outline"
                        disabled={isSubmitting || disabled}
                        className="h-auto min-h-12 justify-start px-4 py-3 text-left whitespace-normal"
                        onClick={() => onSubmit(opt)}
                    >
                        {opt}
                    </Button>
                ))}
            </div>
        );
    }

    if (question.type === 'true_false') {
        return (
            <div className="grid grid-cols-2 gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={isSubmitting || disabled}
                    onClick={() => onSubmit('True')}
                >
                    True
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={isSubmitting || disabled}
                    onClick={() => onSubmit('False')}
                >
                    False
                </Button>
            </div>
        );
    }

    // text / fill_blank
    return (
        <div className="flex gap-2">
            <Input
                value={textAnswer}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder={
                    question.type === 'fill_blank'
                        ? 'Fill in the blank...'
                        : 'Type your answer...'
                }
                disabled={isSubmitting || disabled}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && textAnswer.trim()) {
                        onSubmit(textAnswer.trim());
                    }
                }}
                autoFocus
            />
            <Button
                type="button"
                disabled={isSubmitting || disabled || !textAnswer.trim()}
                onClick={() => onSubmit(textAnswer.trim())}
            >
                {isSubmitting ? (
                    <LoaderCircle className="animate-spin" />
                ) : (
                    'Submit'
                )}
            </Button>
        </div>
    );
}

/* ── Feedback Area ── */
function FeedbackArea({
    result,
    onAdvance,
}: {
    result: QuestionResult | null;
    onAdvance: () => void;
}) {
    if (!result) {
        return null;
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className={cn(
                    'flex items-center gap-2 text-lg font-bold',
                    result.isCorrect ? 'text-emerald-600' : 'text-destructive',
                )}
            >
                {result.isCorrect ? (
                    <>
                        <CheckCircle2 className="size-6" />
                        Correct!
                    </>
                ) : (
                    <>
                        <XCircle className="size-6" />
                        Incorrect
                    </>
                )}
            </div>

            {result.isCorrect && result.totalQuestionPoints > 0 && (
                <div className="flex flex-col items-center gap-1">
                    <span className="animate-in text-2xl font-bold text-emerald-600 fade-in slide-in-from-bottom-2">
                        +{result.questionScore} pts
                    </span>
                    {result.streakBonus > 0 && (
                        <span className="animate-in text-sm font-medium text-orange-500 fade-in slide-in-from-bottom-1">
                            +{result.streakBonus} streak bonus 🔥
                        </span>
                    )}
                </div>
            )}

            {!result.isCorrect && (
                <p className="text-sm text-muted-foreground">
                    Correct answer:{' '}
                    <span className="font-medium text-foreground">
                        {result.correctAnswer}
                    </span>
                </p>
            )}

            {result.explanation && (
                <p className="max-w-md text-center text-sm text-muted-foreground">
                    {result.explanation}
                </p>
            )}

            <Button type="button" variant="ghost" size="sm" onClick={onAdvance}>
                Continue →
            </Button>
        </div>
    );
}

/* ── Quiz Playing Screen ── */
function QuizPlayingScreen({
    question,
    currentIndex,
    totalQuestions,
    consecutiveCorrect,
    sessionScore,
    timerPercent,
    timerColor,
    msLeft,
    isSubmitting,
    phase,
    lastResult,
    onSubmit,
    onAdvance,
}: {
    question: QuizSessionQuestion;
    currentIndex: number;
    totalQuestions: number;
    consecutiveCorrect: number;
    sessionScore: number;
    timerPercent: number;
    timerColor: string;
    msLeft: number;
    isSubmitting: boolean;
    phase: QuizPhase;
    lastResult: QuestionResult | null;
    onSubmit: (answer: string) => void;
    onAdvance: () => void;
}) {
    const [textAnswer, setTextAnswer] = useState('');
    const isFeedback = phase === 'feedback';

    return (
        <div className="flex flex-col gap-4">
            {/* Header bar */}
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                    Question {currentIndex + 1} of {totalQuestions}
                </span>
                <div className="flex items-center gap-3">
                    {consecutiveCorrect >= 2 && (
                        <Badge
                            variant="destructive"
                            className="animate-pulse gap-1"
                        >
                            <Flame />
                            {consecutiveCorrect} streak
                        </Badge>
                    )}
                    <Badge variant="outline">{sessionScore} pts</Badge>
                </div>
            </div>

            {/* Timer bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-100',
                        timerColor,
                    )}
                    style={{ width: `${timerPercent}%` }}
                />
            </div>
            <div className="text-right text-xs text-muted-foreground">
                {Math.ceil(msLeft / 1000)}s
            </div>

            {/* Question */}
            <div className="rounded-lg border bg-muted/20 p-6">
                <div className="flex flex-col gap-6">
                    <p className="text-center text-lg leading-relaxed font-medium">
                        {question.question}
                    </p>

                    {/* Answer area */}
                    {!isFeedback ? (
                        <AnswerArea
                            question={question}
                            textAnswer={textAnswer}
                            onTextChange={setTextAnswer}
                            onSubmit={onSubmit}
                            isSubmitting={isSubmitting}
                            disabled={msLeft <= 0}
                        />
                    ) : (
                        <FeedbackArea
                            result={lastResult}
                            onAdvance={onAdvance}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Post-Quiz Summary ── */
function PostQuizSummary({
    summaryResult,
}: {
    summaryResult: SessionResult | null;
}) {
    if (!summaryResult) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const accuracy =
        summaryResult.totalQuestions > 0
            ? Math.round(
                  (summaryResult.correctCount / summaryResult.totalQuestions) *
                      100,
              )
            : 0;

    return (
        <div className="grid gap-6 sm:grid-cols-2">
            {/* Left — Score */}
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/20 p-6 text-center">
                <Trophy className="size-12 text-yellow-500" />
                <h2 className="text-2xl font-semibold tracking-tight">
                    Quiz Complete!
                </h2>
                <div>
                    <p className="text-4xl font-bold">
                        {summaryResult.totalPoints}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Total Points
                    </p>
                </div>

                {summaryResult.awardedPoints > 0 &&
                    summaryResult.isFirstSession && (
                        <Badge variant="default" className="text-sm">
                            +{summaryResult.awardedPoints} points awarded! 🎉
                        </Badge>
                    )}

                {!summaryResult.isFirstSession &&
                    summaryResult.totalPoints > 0 && (
                        <p className="text-sm text-muted-foreground">
                            Points were already awarded from a previous session.
                        </p>
                    )}

                {summaryResult.totalStreakBonus > 0 && (
                    <p className="text-sm text-muted-foreground">
                        Streak bonuses:{' '}
                        <span className="font-medium text-orange-500">
                            +{summaryResult.totalStreakBonus} pts
                        </span>
                    </p>
                )}
            </div>

            {/* Right — Stats + Actions */}
            <div className="flex flex-col justify-center gap-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-2xl font-semibold">
                            {summaryResult.correctCount}/
                            {summaryResult.totalQuestions}
                        </p>
                        <p className="text-xs text-muted-foreground">Correct</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-2xl font-semibold">{accuracy}%</p>
                        <p className="text-xs text-muted-foreground">
                            Accuracy
                        </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-2xl font-semibold">
                            {(summaryResult.averageElapsedMs / 1000).toFixed(1)}
                            s
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Avg Time
                        </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-2xl font-semibold">
                            {summaryResult.bestStreak}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Best Streak 🔥
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main Quiz Mode View ── */
export function QuizModeView({
    challenge,
    quizSession,
    submissionSummary,
    autoStart = false,
}: {
    challenge: ChallengePayload;
    quizSession: QuizSession;
    submissionSummary: SubmissionSummary;
    autoStart?: boolean;
}) {
    const [phase, setPhase] = useState<QuizPhase>('pre');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
    const [sessionScore, setSessionScore] = useState(0);
    const [lastResult, setLastResult] = useState<QuestionResult | null>(null);
    const [summaryResult, setSummaryResult] = useState<SessionResult | null>(
        null,
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Timer
    const [msLeft, setMsLeft] = useState(challenge.timeLimitSeconds * 1000);
    const timerRef = useRef<number | null>(null);
    const questionStartRef = useRef<number>(0);
    const timerExpiredRef = useRef(false);

    const questions = quizSession.questions;
    const currentQuestion = questions[currentIndex] ?? null;
    const totalQuestions = questions.length;

    const canPlay = challenge.status === 'active';

    const startTimer = useCallback(() => {
        questionStartRef.current = Date.now();
        timerExpiredRef.current = false;
        setMsLeft(challenge.timeLimitSeconds * 1000);

        if (timerRef.current) {
            cancelAnimationFrame(timerRef.current);
        }

        const tick = () => {
            const elapsed = Date.now() - questionStartRef.current;
            const remaining = Math.max(
                0,
                challenge.timeLimitSeconds * 1000 - elapsed,
            );
            setMsLeft(remaining);

            if (remaining > 0) {
                timerRef.current = requestAnimationFrame(tick);
            }
        };
        timerRef.current = requestAnimationFrame(tick);
    }, [challenge.timeLimitSeconds]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            cancelAnimationFrame(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => stopTimer();
    }, [stopTimer]);

    // Auto-submit when timer expires
    useEffect(() => {
        if (
            phase === 'playing' &&
            msLeft <= 0 &&
            !isSubmitting &&
            !timerExpiredRef.current
        ) {
            timerExpiredRef.current = true;
            void handleSubmitAnswer('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, msLeft, isSubmitting]);

    const startQuiz = () => {
        setPhase('playing');
        setCurrentIndex(0);
        setConsecutiveCorrect(0);
        setSessionScore(0);
        setLastResult(null);
        setSummaryResult(null);
        setError(null);
        startTimer();
    };

    // Auto-start quiz when navigated with ?autostart=1
    useEffect(() => {
        if (autoStart && canPlay && phase === 'pre') {
            startQuiz();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmitAnswer = async (answer: string) => {
        if (!currentQuestion || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        stopTimer();

        const elapsedMs = Math.max(0, Date.now() - questionStartRef.current);

        try {
            const result = await postJson<QuestionResult>(
                quizSubmit.url({ challenge: challenge.slug }),
                {
                    session_id: quizSession.sessionId,
                    challenge_question_id: currentQuestion.id,
                    answer: answer || '(no answer)',
                    elapsed_ms: Math.min(
                        elapsedMs,
                        challenge.timeLimitSeconds * 1000,
                    ),
                    question_index: currentIndex,
                    consecutive_correct: consecutiveCorrect,
                },
            );

            setLastResult(result);
            setSessionScore((prev) => prev + result.totalQuestionPoints);

            if (result.isCorrect) {
                setConsecutiveCorrect((prev) => prev + 1);
            } else {
                setConsecutiveCorrect(0);
            }

            setPhase('feedback');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const advanceToNext = useCallback(() => {
        if (currentIndex + 1 >= totalQuestions) {
            void finishQuiz();
        } else {
            setCurrentIndex((prev) => prev + 1);
            setLastResult(null);
            setPhase('playing');
            startTimer();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, totalQuestions, startTimer]);

    // Auto-advance after feedback
    useEffect(() => {
        if (phase !== 'feedback') {
            return;
        }

        const timeout = setTimeout(advanceToNext, 2500);

        return () => clearTimeout(timeout);
    }, [phase, advanceToNext]);

    const finishQuiz = async () => {
        setPhase('summary');
        stopTimer();

        try {
            const result = await postJson<SessionResult>(
                sessionSummaryRoute.url({ challenge: challenge.slug }),
                { session_id: quizSession.sessionId },
            );
            setSummaryResult(result);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load summary',
            );
        }
    };

    const timerPercent = useMemo(() => {
        if (challenge.timeLimitSeconds <= 0) {
            return 0;
        }

        return (msLeft / (challenge.timeLimitSeconds * 1000)) * 100;
    }, [msLeft, challenge.timeLimitSeconds]);

    const timerColor =
        timerPercent > 50
            ? 'bg-emerald-500'
            : timerPercent > 25
              ? 'bg-yellow-500'
              : 'bg-red-500';

    return (
        <>
            <Head title={challenge.title} />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                <section className="flex flex-col gap-0">
                    <TypographyH1>{challenge.title}</TypographyH1>
                    <TypographyMuted className="max-w-3xl text-sm/6">
                        {challenge.prompt}
                    </TypographyMuted>
                </section>

                <Card>
                    <CardContent className="flex flex-col gap-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Pre-quiz screen */}
                        {phase === 'pre' && (
                            <PreQuizScreen
                                challenge={challenge}
                                submissionSummary={submissionSummary}
                                totalQuestions={totalQuestions}
                                canPlay={canPlay}
                                onStart={startQuiz}
                            />
                        )}

                        {/* Quiz playing + feedback */}
                        {(phase === 'playing' || phase === 'feedback') &&
                            currentQuestion && (
                                <QuizPlayingScreen
                                    key={currentIndex}
                                    question={currentQuestion}
                                    currentIndex={currentIndex}
                                    totalQuestions={totalQuestions}
                                    consecutiveCorrect={consecutiveCorrect}
                                    sessionScore={sessionScore}
                                    timerPercent={timerPercent}
                                    timerColor={timerColor}
                                    msLeft={msLeft}
                                    isSubmitting={isSubmitting}
                                    phase={phase}
                                    lastResult={lastResult}
                                    onSubmit={handleSubmitAnswer}
                                    onAdvance={advanceToNext}
                                />
                            )}

                        {/* Post-quiz summary */}
                        {phase === 'summary' && (
                            <PostQuizSummary summaryResult={summaryResult} />
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
