import { Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    Flame,
    Lightbulb,
    LoaderCircle,
    Play,
    RotateCcw,
    Trophy,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import {
    index as challengesIndex,
    quickSubmit,
    quizSubmit,
    sessionSummary as sessionSummaryRoute,
    show as challengeShow,
} from '@/routes/challenges';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ChallengeOption = { label: string; value: string };

type QuizQuestion = {
    id: number;
    index: number;
    type: 'mcq' | 'true_false' | 'text' | 'fill_blank';
    question: string;
    options: string[] | null;
};

type QuizSession = {
    sessionId: string;
    questions: QuizQuestion[];
};

type ChallengePayload = {
    id: number;
    slug: string;
    title: string;
    prompt: string;
    hint: string | null;
    timeStart: string | null;
    timeEnd: string | null;
    status: 'upcoming' | 'active' | 'ended';
    isSolved: boolean;
    hasCompletedSession: boolean;
    hasQuestionBank: boolean;
    timeLimitSeconds: number;
    questionsPerSession: number;
    maxPointsPerQuestion: number;
    options: ChallengeOption[];
};

type SubmissionSummary = {
    attemptCount: number;
    correctCount: number;
    bestScore: number;
    lastSubmittedAt: string | null;
};

type RecentSubmission = {
    id: number;
    answer: string;
    isCorrect: boolean;
    score: number;
    streakBonus: number;
    submittedAt: string | null;
    submittedAtHuman: string | null;
};

type RelatedChallenge = {
    id: number;
    slug: string;
    title: string;
};

type Props = {
    challenge: ChallengePayload;
    quizSession: QuizSession | null;
    submissionSummary: SubmissionSummary;
    recentSubmissions: RecentSubmission[];
    relatedChallenges: RelatedChallenge[];
};

type QuestionResult = {
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string | null;
    questionScore: number;
    streakBonus: number;
    totalQuestionPoints: number;
};

type SessionResult = {
    totalScore: number;
    totalStreakBonus: number;
    totalPoints: number;
    correctCount: number;
    totalQuestions: number;
    averageElapsedMs: number;
    bestStreak: number;
    awardedPoints: number;
    isFirstSession: boolean;
    userTotalPoints: number;
};

type QuizPhase = 'pre' | 'playing' | 'feedback' | 'summary';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getCsrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? 'Request failed');
    }
    return response.json() as Promise<T>;
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ChallengesShow({
    challenge,
    quizSession,
    submissionSummary,
    recentSubmissions,
    relatedChallenges,
}: Props) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Home', href: dashboard() },
            { title: 'Challenges', href: challengesIndex() },
            { title: challenge.title, href: challengeShow.url({ challenge: challenge.slug }) },
        ],
    });

    // Read ?autostart=1 from URL and clean it up
    const autoStart = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        const value = params.get('autostart') === '1';
        if (value) {
            params.delete('autostart');
            const cleanUrl =
                window.location.pathname +
                (params.toString() ? `?${params.toString()}` : '') +
                window.location.hash;
            window.history.replaceState({}, '', cleanUrl);
        }
        return value;
    }, []);

    const isQuizMode = challenge.hasQuestionBank;

    // Challenge already completed — show result view
    if (isQuizMode && challenge.hasCompletedSession) {
        return (
            <CompletedChallengeView
                challenge={challenge}
                submissionSummary={submissionSummary}
            />
        );
    }

    if (isQuizMode && quizSession !== null) {
        return (
            <QuizModeView
                challenge={challenge}
                quizSession={quizSession}
                submissionSummary={submissionSummary}
                autoStart={autoStart}
            />
        );
    }

    return (
        <LegacySpeedRoundView
            challenge={challenge}
            submissionSummary={submissionSummary}
            recentSubmissions={recentSubmissions}
            relatedChallenges={relatedChallenges}
        />
    );
}

// â”€â”€â”€ Quiz Mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function QuizModeView({
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
    const [summaryResult, setSummaryResult] = useState<SessionResult | null>(null);
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

        if (timerRef.current) cancelAnimationFrame(timerRef.current);

        const tick = () => {
            const elapsed = Date.now() - questionStartRef.current;
            const remaining = Math.max(0, challenge.timeLimitSeconds * 1000 - elapsed);
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
        if (phase === 'playing' && msLeft <= 0 && !isSubmitting && !timerExpiredRef.current) {
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
        if (!currentQuestion || isSubmitting) return;
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
                    elapsed_ms: Math.min(elapsedMs, challenge.timeLimitSeconds * 1000),
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
        if (phase !== 'feedback') return;
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
            setError(err instanceof Error ? err.message : 'Failed to load summary');
        }
    };

    const timerPercent = useMemo(() => {
        if (challenge.timeLimitSeconds <= 0) return 0;
        return (msLeft / (challenge.timeLimitSeconds * 1000)) * 100;
    }, [msLeft, challenge.timeLimitSeconds]);

    const timerColor = timerPercent > 50 ? 'bg-emerald-500' : timerPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

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
                        {(phase === 'playing' || phase === 'feedback') && currentQuestion && (
                            <QuizPlayingScreen
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
                            <PostQuizSummary
                                summaryResult={summaryResult}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

// â”€â”€â”€ Pre-Quiz Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
                <Badge variant="secondary">
                    {totalQuestions} questions
                </Badge>
                <Badge variant="secondary">
                    <Trophy />
                    Max {challenge.maxPointsPerQuestion} pts/question
                </Badge>
            </div>

            {submissionSummary.bestScore > 0 && (
                <div className="text-sm text-muted-foreground">
                    Your best score: <span className="font-semibold text-foreground">{submissionSummary.bestScore} pts</span>
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

// â”€â”€â”€ Quiz Playing Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    question: QuizQuestion;
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

    // Reset text answer when question changes
    useEffect(() => {
        setTextAnswer('');
    }, [currentIndex]);

    return (
        <div className="flex flex-col gap-4">
            {/* Header bar */}
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                    Question {currentIndex + 1} of {totalQuestions}
                </span>
                <div className="flex items-center gap-3">
                    {consecutiveCorrect >= 2 && (
                        <Badge variant="destructive" className="animate-pulse gap-1">
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
                    className={cn('h-full rounded-full transition-all duration-100', timerColor)}
                    style={{ width: `${timerPercent}%` }}
                />
            </div>
            <div className="text-right text-xs text-muted-foreground">
                {Math.ceil(msLeft / 1000)}s
            </div>

            {/* Question */}
            <div className="rounded-lg border bg-muted/20 p-6">
                <div className="flex flex-col gap-6">
                    <p className="text-center text-lg font-medium leading-relaxed">
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

// â”€â”€â”€ Answer Area (type-dependent) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AnswerArea({
    question,
    textAnswer,
    onTextChange,
    onSubmit,
    isSubmitting,
    disabled,
}: {
    question: QuizQuestion;
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
                        className="h-auto min-h-12 justify-start whitespace-normal px-4 py-3 text-left"
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
                placeholder={question.type === 'fill_blank' ? 'Fill in the blank...' : 'Type your answer...'}
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
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Submit'}
            </Button>
        </div>
    );
}

// â”€â”€â”€ Feedback Area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function FeedbackArea({
    result,
    onAdvance,
}: {
    result: QuestionResult | null;
    onAdvance: () => void;
}) {
    if (!result) return null;

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
                    <span className="text-2xl font-bold text-emerald-600 animate-in fade-in slide-in-from-bottom-2">
                        +{result.questionScore} pts
                    </span>
                    {result.streakBonus > 0 && (
                        <span className="text-sm font-medium text-orange-500 animate-in fade-in slide-in-from-bottom-1">
                            +{result.streakBonus} streak bonus ðŸ”¥
                        </span>
                    )}
                </div>
            )}

            {!result.isCorrect && (
                <p className="text-sm text-muted-foreground">
                    Correct answer: <span className="font-medium text-foreground">{result.correctAnswer}</span>
                </p>
            )}

            {result.explanation && (
                <p className="max-w-md text-center text-sm text-muted-foreground">
                    {result.explanation}
                </p>
            )}

            <Button type="button" variant="ghost" size="sm" onClick={onAdvance}>
                Continue â†’
            </Button>
        </div>
    );
}

// â”€â”€â”€ Post-Quiz Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    const accuracy = summaryResult.totalQuestions > 0
        ? Math.round((summaryResult.correctCount / summaryResult.totalQuestions) * 100)
        : 0;

    return (
        <div className="grid gap-6 sm:grid-cols-2">
            {/* Left — Score */}
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/20 p-6 text-center">
                <Trophy className="size-12 text-yellow-500" />
                <h2 className="text-2xl font-semibold tracking-tight">Quiz Complete!</h2>
                <div>
                    <p className="text-4xl font-bold">{summaryResult.totalPoints}</p>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                </div>

                {summaryResult.awardedPoints > 0 && summaryResult.isFirstSession && (
                    <Badge variant="default" className="text-sm">
                        +{summaryResult.awardedPoints} points awarded! ðŸŽ‰
                    </Badge>
                )}

                {!summaryResult.isFirstSession && summaryResult.totalPoints > 0 && (
                    <p className="text-sm text-muted-foreground">
                        Points were already awarded from a previous session.
                    </p>
                )}

                {summaryResult.totalStreakBonus > 0 && (
                    <p className="text-sm text-muted-foreground">
                        Streak bonuses: <span className="font-medium text-orange-500">+{summaryResult.totalStreakBonus} pts</span>
                    </p>
                )}
            </div>

            {/* Right — Stats + Actions */}
            <div className="flex flex-col justify-center gap-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-2xl font-semibold">{summaryResult.correctCount}/{summaryResult.totalQuestions}</p>
                        <p className="text-xs text-muted-foreground">Correct</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-2xl font-semibold">{accuracy}%</p>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-2xl font-semibold">{(summaryResult.averageElapsedMs / 1000).toFixed(1)}s</p>
                        <p className="text-xs text-muted-foreground">Avg Time</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-2xl font-semibold">{summaryResult.bestStreak}</p>
                        <p className="text-xs text-muted-foreground">Best Streak ðŸ”¥</p>
                    </div>
                </div>

            </div>
        </div>
    );
}

// â”€â”€â”€ Legacy Speed Round View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// --- Completed Challenge View ------------------------------------------------

function CompletedChallengeView({
    challenge,
    submissionSummary,
}: {
    challenge: ChallengePayload;
    submissionSummary: SubmissionSummary;
}) {
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
                        <div className="grid gap-6 sm:grid-cols-2">
                            {/* Left - Result */}
                            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/20 p-6 text-center">
                                <CheckCircle2 className="size-12 text-emerald-500" />
                                <h2 className="text-2xl font-semibold tracking-tight">Challenge Completed</h2>
                                <div>
                                    <p className="text-4xl font-bold">{submissionSummary.bestScore}</p>
                                    <p className="text-sm text-muted-foreground">Best Score</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    You have already completed this challenge.
                                </p>
                            </div>

                            {/* Right - Stats */}
                            <div className="flex flex-col justify-center gap-6">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="rounded-lg border bg-muted/20 p-3">
                                        <p className="text-2xl font-semibold">{submissionSummary.correctCount}/{submissionSummary.attemptCount}</p>
                                        <p className="text-xs text-muted-foreground">Correct</p>
                                    </div>
                                    <div className="rounded-lg border bg-muted/20 p-3">
                                        <p className="text-2xl font-semibold">
                                            {submissionSummary.attemptCount > 0
                                                ? Math.round((submissionSummary.correctCount / submissionSummary.attemptCount) * 100)
                                                : 0}%
                                        </p>
                                        <p className="text-xs text-muted-foreground">Accuracy</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Button variant="outline" asChild>
                                        <Link href={challengesIndex()} prefetch>
                                            All Challenges
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function LegacySpeedRoundView({
    challenge,
    submissionSummary,
    recentSubmissions,
    relatedChallenges,
}: {
    challenge: ChallengePayload;
    submissionSummary: SubmissionSummary;
    recentSubmissions: RecentSubmission[];
    relatedChallenges: RelatedChallenge[];
}) {
    const [secondsLeft, setSecondsLeft] = useState(challenge.timeLimitSeconds);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHintVisible, setIsHintVisible] = useState(false);
    const [isSolved, setIsSolved] = useState(challenge.isSolved);
    const [feedback, setFeedback] = useState<{ variant: 'default' | 'destructive'; title: string; message: string } | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [totalPoints, setTotalPoints] = useState<number | null>(null);

    const roundStartTimestampRef = useRef<number>(Date.now());

    const canPlay = challenge.status === 'active' && !isSolved;
    const isRoundExpired = secondsLeft <= 0;

    useEffect(() => {
        roundStartTimestampRef.current = Date.now();
    }, []);

    useEffect(() => {
        if (!canPlay || isRoundExpired) return;
        const timer = window.setInterval(() => {
            setSecondsLeft((v) => Math.max(v - 1, 0));
        }, 1000);
        return () => window.clearInterval(timer);
    }, [canPlay, isRoundExpired]);

    useEffect(() => {
        if (canPlay && isRoundExpired && feedback === null) {
            setFeedback({
                variant: 'default',
                title: 'Time is up',
                message: 'Restart the round to answer again and maximize your score.',
            });
        }
    }, [canPlay, feedback, isRoundExpired]);

    const timerProgress = useMemo(() => {
        if (challenge.timeLimitSeconds <= 0) return 0;
        return (secondsLeft / challenge.timeLimitSeconds) * 100;
    }, [challenge.timeLimitSeconds, secondsLeft]);

    const restartRound = () => {
        setSecondsLeft(challenge.timeLimitSeconds);
        setSelectedOption(null);
        setFeedback(null);
        roundStartTimestampRef.current = Date.now();
    };

    const submitOption = async (optionValue: string) => {
        if (!canPlay || isSubmitting || isRoundExpired) return;
        setSelectedOption(optionValue);
        setIsSubmitting(true);

        try {
            const elapsedMs = Math.max(0, Date.now() - roundStartTimestampRef.current);
            const payload = await postJson<{
                isCorrect?: boolean;
                alreadySolved?: boolean;
                awardedPoints?: number;
                correctAnswer?: string;
                totalPoints?: number;
                message?: string;
            }>(quickSubmit.url({ challenge: challenge.slug }), {
                answer: optionValue,
                elapsed_ms: elapsedMs,
            });

            setTotalPoints(payload.totalPoints ?? null);

            if (!payload.isCorrect) {
                setFeedback({
                    variant: 'destructive',
                    title: 'Incorrect answer',
                    message: `Correct keyword: ${payload.correctAnswer ?? 'not available'}. Restart to try again.`,
                });
                setSecondsLeft(0);
                return;
            }

            if (payload.alreadySolved) {
                setFeedback({
                    variant: 'default',
                    title: 'Already solved',
                    message: 'You answered correctly, but points were already claimed earlier.',
                });
                setIsSolved(true);
                return;
            }

            setFeedback({
                variant: 'default',
                title: 'Correct answer',
                message: `Great speed. You earned ${payload.awardedPoints ?? 0} points.`,
            });
            setIsSolved(true);
        } catch {
            setFeedback({
                variant: 'destructive',
                title: 'Network error',
                message: 'Please check your connection and try again.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    <CardContent className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                                <Clock3 />
                                {challenge.timeLimitSeconds}s round
                            </Badge>
                        </div>
                            {challenge.hint && (
                                <div className="flex flex-col gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-fit"
                                        onClick={() => setIsHintVisible((v) => !v)}
                                    >
                                        <Lightbulb data-icon="inline-start" />
                                        {isHintVisible ? 'Hide hint' : 'Show hint'}
                                    </Button>
                                    {isHintVisible && (
                                        <Alert>
                                            <Lightbulb />
                                            <AlertTitle>Hint</AlertTitle>
                                            <AlertDescription>{challenge.hint}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            )}

                            {challenge.status !== 'active' && (
                                <Alert>
                                    <AlertCircle />
                                    <AlertTitle>Challenge is not playable now</AlertTitle>
                                    <AlertDescription>
                                        {challenge.status === 'upcoming'
                                            ? 'The challenge has not started yet. Return when the challenge window opens.'
                                            : 'The challenge window has ended. You can still review the prompt and history.'}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="rounded-lg border bg-muted/20 p-3">
                                <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Round timer</span>
                                    <span>{secondsLeft}s left</span>
                                </div>
                                <Progress value={timerProgress} className="h-2" />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                {challenge.options.map((option) => (
                                    <Button
                                        key={option.value}
                                        type="button"
                                        variant={selectedOption === option.value ? 'default' : 'outline'}
                                        disabled={!canPlay || isSubmitting || isRoundExpired}
                                        className="h-auto min-h-12 justify-start whitespace-normal px-3 py-2 text-left"
                                        onClick={() => void submitOption(option.value)}
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>

                            {isSubmitting && (
                                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                    <LoaderCircle className="size-4 animate-spin" />
                                    Checking your answer...
                                </div>
                            )}

                            {feedback && (
                                <Alert variant={feedback.variant}>
                                    <Trophy />
                                    <AlertTitle>{feedback.title}</AlertTitle>
                                    <AlertDescription>{feedback.message}</AlertDescription>
                                </Alert>
                            )}

                            {challenge.status === 'active' && !isSolved && isRoundExpired && (
                                <Button type="button" variant="outline" className="w-fit" onClick={restartRound}>
                                    <RotateCcw data-icon="inline-start" />
                                    Restart round
                                </Button>
                            )}

                            {/* Stats */}
                            <div className="rounded-lg border bg-muted/20 p-3">
                                <p className="mb-2 text-sm font-medium">Your Stats</p>
                                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground sm:grid-cols-4">
                                    <div>
                                        <span className="text-xs">Attempts</span>
                                        <p className="font-medium text-foreground">{submissionSummary.attemptCount}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs">Correct</span>
                                        <p className="font-medium text-foreground">{submissionSummary.correctCount}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs">Best Score</span>
                                        <p className="font-medium text-foreground">{submissionSummary.bestScore}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs">Last Submitted</span>
                                        <p className="font-medium text-foreground">
                                            {submissionSummary.lastSubmittedAt
                                                ? new Date(submissionSummary.lastSubmittedAt).toLocaleDateString('en-US')
                                                : 'Never'}
                                        </p>
                                    </div>
                                </div>
                                {totalPoints !== null && (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Total points: <span className="font-medium text-foreground">{totalPoints}</span>
                                    </p>
                                )}
                            </div>

                            {/* Recent submissions */}
                            {recentSubmissions.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-medium">Recent Submissions</p>
                                    {recentSubmissions.map((submission) => (
                                        <div key={submission.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">Answer: {submission.answer}</p>
                                                <p className="text-muted-foreground">{submission.submittedAtHuman ?? '-'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn('font-semibold', submission.isCorrect ? 'text-emerald-600' : 'text-destructive')}>
                                                    {submission.isCorrect ? 'Correct' : 'Incorrect'}
                                                </p>
                                                <p className="text-muted-foreground">{submission.score} pts</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Related challenges */}
                            {relatedChallenges.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm font-medium">Related Challenges</p>
                                    <div className="flex flex-wrap gap-2">
                                        {relatedChallenges.map((related) => (
                                            <Button key={related.id} variant="outline" size="sm" asChild>
                                                <Link href={challengeShow.url({ challenge: related.slug })} prefetch>
                                                    <span className="truncate">{related.title}</span>
                                                </Link>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
