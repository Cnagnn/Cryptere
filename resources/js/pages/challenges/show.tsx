import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Clock3,
    Lightbulb,
    LoaderCircle,
    RotateCcw,
    Trophy,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
    index as challengesIndex,
    quickSubmit,
    show as challengeShow,
} from '@/routes/challenges';
import { dashboard } from '@/routes';

type ChallengeOption = {
    label: string;
    value: string;
};

type ChallengePayload = {
    id: number;
    slug: string;
    title: string;
    prompt: string;
    hint: string | null;
    pointsReward: number;
    timeStart: string | null;
    timeEnd: string | null;
    status: 'upcoming' | 'active' | 'ended';
    timeLimitSeconds: number;
    options: ChallengeOption[];
    isSolved: boolean;
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
    submittedAt: string | null;
    submittedAtHuman: string | null;
};

type RelatedChallenge = {
    id: number;
    slug: string;
    title: string;
    pointsReward: number;
};

type Props = {
    challenge: ChallengePayload;
    submissionSummary: SubmissionSummary;
    recentSubmissions: RecentSubmission[];
    relatedChallenges: RelatedChallenge[];
};

type FeedbackState = {
    variant: 'default' | 'destructive';
    title: string;
    message: string;
};

function availabilityLabel(status: ChallengePayload['status']): string {
    if (status === 'upcoming') {
        return 'Upcoming';
    }

    if (status === 'ended') {
        return 'Ended';
    }

    return 'Active';
}

export default function ChallengesShow({
    challenge,
    submissionSummary,
    recentSubmissions,
    relatedChallenges,
}: Props) {
    const [secondsLeft, setSecondsLeft] = useState(challenge.timeLimitSeconds);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHintVisible, setIsHintVisible] = useState(false);
    const [isSolved, setIsSolved] = useState(challenge.isSolved);
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [totalPoints, setTotalPoints] = useState<number | null>(null);

    const roundStartTimestampRef = useRef<number>(Date.now());

    const canPlay = challenge.status === 'active' && !isSolved;
    const isRoundExpired = secondsLeft <= 0;

    useEffect(() => {
        roundStartTimestampRef.current = Date.now();
    }, []);

    useEffect(() => {
        if (!canPlay || isRoundExpired) {
            return;
        }

        const timer = window.setInterval(() => {
            setSecondsLeft((currentValue) => Math.max(currentValue - 1, 0));
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
        if (challenge.timeLimitSeconds <= 0) {
            return 0;
        }

        return (secondsLeft / challenge.timeLimitSeconds) * 100;
    }, [challenge.timeLimitSeconds, secondsLeft]);

    const restartRound = (): void => {
        setSecondsLeft(challenge.timeLimitSeconds);
        setSelectedOption(null);
        setFeedback(null);
        roundStartTimestampRef.current = Date.now();
    };

    const submitOption = async (optionValue: string): Promise<void> => {
        if (!canPlay || isSubmitting || isRoundExpired) {
            return;
        }

        setSelectedOption(optionValue);
        setIsSubmitting(true);

        try {
            const elapsedMilliseconds = Math.max(0, Date.now() - roundStartTimestampRef.current);
            const csrfToken = document
                .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                ?.content;

            const response = await fetch(quickSubmit.url({ challenge: challenge.slug }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken ?? '',
                },
                body: JSON.stringify({
                    answer: optionValue,
                    elapsed_ms: elapsedMilliseconds,
                }),
            });

            const payload = await response.json() as {
                isCorrect?: boolean;
                alreadySolved?: boolean;
                awardedPoints?: number;
                correctAnswer?: string;
                totalPoints?: number;
                message?: string;
            };

            if (!response.ok) {
                setFeedback({
                    variant: 'destructive',
                    title: 'Submission failed',
                    message: payload.message ?? 'Unable to submit your answer right now.',
                });

                return;
            }

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

            <div className="flex flex-col gap-6 px-4 py-6">
                <div className="flex items-center justify-between gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={challengesIndex()} prefetch>
                            <ArrowLeft className="size-4" />
                            Back to challenges
                        </Link>
                    </Button>
                    <Badge variant="outline">{availabilityLabel(challenge.status)}</Badge>
                </div>

                <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
                    <Card>
                        <CardHeader className="gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">{challenge.pointsReward} points</Badge>
                                <Badge variant="outline">
                                    <Clock3 className="mr-1 size-3.5" />
                                    {challenge.timeLimitSeconds}s round
                                </Badge>
                            </div>
                            <CardTitle className="text-2xl tracking-tight">{challenge.title}</CardTitle>
                            <CardDescription className="text-base leading-relaxed">
                                {challenge.prompt}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {challenge.hint ? (
                                <div className="flex flex-col gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-fit"
                                        onClick={() => setIsHintVisible((currentValue) => !currentValue)}
                                    >
                                        <Lightbulb className="size-4" />
                                        {isHintVisible ? 'Hide hint' : 'Show hint'}
                                    </Button>
                                    {isHintVisible ? (
                                        <Alert>
                                            <Lightbulb />
                                            <AlertTitle>Hint</AlertTitle>
                                            <AlertDescription>{challenge.hint}</AlertDescription>
                                        </Alert>
                                    ) : null}
                                </div>
                            ) : null}

                            {challenge.status !== 'active' ? (
                                <Alert>
                                    <AlertCircle />
                                    <AlertTitle>Challenge is not playable now</AlertTitle>
                                    <AlertDescription>
                                        {challenge.status === 'upcoming'
                                            ? 'The challenge has not started yet. Return when the challenge window opens.'
                                            : 'The challenge window has ended. You can still review the prompt and history.'}
                                    </AlertDescription>
                                </Alert>
                            ) : null}

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
                                        onClick={() => {
                                            void submitOption(option.value);
                                        }}
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>

                            {isSubmitting ? (
                                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                                    <LoaderCircle className="size-4 animate-spin" />
                                    Checking your answer...
                                </div>
                            ) : null}

                            {feedback ? (
                                <Alert variant={feedback.variant}>
                                    <Trophy />
                                    <AlertTitle>{feedback.title}</AlertTitle>
                                    <AlertDescription>{feedback.message}</AlertDescription>
                                </Alert>
                            ) : null}

                            {challenge.status === 'active' && !isSolved && isRoundExpired ? (
                                <Button type="button" variant="outline" className="w-fit" onClick={restartRound}>
                                    <RotateCcw className="size-4" />
                                    Restart round
                                </Button>
                            ) : null}
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Your challenge stats</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                                <p>Attempts: <span className="font-medium text-foreground">{submissionSummary.attemptCount}</span></p>
                                <p>Correct attempts: <span className="font-medium text-foreground">{submissionSummary.correctCount}</span></p>
                                <p>Best score: <span className="font-medium text-foreground">{submissionSummary.bestScore}</span></p>
                                <p>
                                    Last submitted:{' '}
                                    <span className="font-medium text-foreground">
                                        {submissionSummary.lastSubmittedAt
                                            ? new Date(submissionSummary.lastSubmittedAt).toLocaleString('en-US')
                                            : 'Never'}
                                    </span>
                                </p>
                                {totalPoints !== null ? (
                                    <p>
                                        Your total points: <span className="font-medium text-foreground">{totalPoints}</span>
                                    </p>
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Related challenges</CardTitle>
                                <CardDescription>Continue with more challenge rounds.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                {relatedChallenges.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No related challenge available yet.</p>
                                ) : (
                                    relatedChallenges.map((related) => (
                                        <Button key={related.id} variant="outline" className="justify-between" asChild>
                                            <Link href={challengeShow({ challenge: related.slug })} prefetch>
                                                <span className="truncate">{related.title}</span>
                                                <span className="text-xs text-muted-foreground">{related.pointsReward} pts</span>
                                            </Link>
                                        </Button>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Recent submissions</CardTitle>
                            <CardDescription>Your latest attempts for this challenge.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentSubmissions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No submission yet. Start your first timed attempt.</p>
                            ) : (
                                <div className="flex flex-col gap-2">
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
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}

ChallengesShow.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: dashboard(),
        },
        {
            title: 'Challenges',
            href: challengesIndex(),
        },
    ],
};
