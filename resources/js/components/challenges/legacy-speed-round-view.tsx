import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
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
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { postJson } from '@/lib/fetch';
import { cn } from '@/lib/utils';
import { quickSubmit, show as challengeShow } from '@/routes/challenges';
import type {
    ChallengePayload,
    RecentSubmission,
    RelatedChallenge,
    SubmissionSummary,
} from '@/types/challenges';

export function LegacySpeedRoundView({
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
    const [feedback, setFeedback] = useState<{
        variant: 'default' | 'destructive';
        title: string;
        message: string;
    } | null>(null);
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
            setSecondsLeft((v) => Math.max(v - 1, 0));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [canPlay, isRoundExpired]);

    useEffect(() => {
        if (canPlay && isRoundExpired && feedback === null) {
            setFeedback({
                variant: 'default',
                title: 'Time is up',
                message:
                    'Restart the round to answer again and maximize your score.',
            });
        }
    }, [canPlay, feedback, isRoundExpired]);

    const timerProgress = useMemo(() => {
        if (challenge.timeLimitSeconds <= 0) {
            return 0;
        }

        return (secondsLeft / challenge.timeLimitSeconds) * 100;
    }, [challenge.timeLimitSeconds, secondsLeft]);

    const restartRound = () => {
        setSecondsLeft(challenge.timeLimitSeconds);
        setSelectedOption(null);
        setFeedback(null);
        roundStartTimestampRef.current = Date.now();
    };

    const submitOption = async (optionValue: string) => {
        if (!canPlay || isSubmitting || isRoundExpired) {
            return;
        }

        setSelectedOption(optionValue);
        setIsSubmitting(true);

        try {
            const elapsedMs = Math.max(
                0,
                Date.now() - roundStartTimestampRef.current,
            );
            const payload = await postJson<{
                isCorrect?: boolean;
                alreadySolved?: boolean;
                awardedPoints?: number;
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
                    message: 'Not quite right. Restart to try again.',
                });
                setSecondsLeft(0);

                return;
            }

            if (payload.alreadySolved) {
                setFeedback({
                    variant: 'default',
                    title: 'Already solved',
                    message:
                        'You answered correctly, but points were already claimed earlier.',
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
                                        <AlertDescription>
                                            {challenge.hint}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}

                        {challenge.status !== 'active' && (
                            <Alert>
                                <AlertCircle />
                                <AlertTitle>
                                    Challenge is not playable now
                                </AlertTitle>
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
                                    variant={
                                        selectedOption === option.value
                                            ? 'default'
                                            : 'outline'
                                    }
                                    disabled={
                                        !canPlay ||
                                        isSubmitting ||
                                        isRoundExpired
                                    }
                                    className="h-auto min-h-12 justify-start px-3 py-2 text-left whitespace-normal"
                                    onClick={() =>
                                        void submitOption(option.value)
                                    }
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
                                <AlertDescription>
                                    {feedback.message}
                                </AlertDescription>
                            </Alert>
                        )}

                        {challenge.status === 'active' &&
                            !isSolved &&
                            isRoundExpired && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-fit"
                                    onClick={restartRound}
                                >
                                    <RotateCcw data-icon="inline-start" />
                                    Restart round
                                </Button>
                            )}

                        {/* Stats */}
                        <div className="rounded-lg border bg-muted/20 p-3">
                            <p className="mb-2 text-sm font-medium">
                                Your Stats
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground sm:grid-cols-4">
                                <div>
                                    <span className="text-xs">Attempts</span>
                                    <p className="font-medium text-foreground">
                                        {submissionSummary.attemptCount}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs">Correct</span>
                                    <p className="font-medium text-foreground">
                                        {submissionSummary.correctCount}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs">Best Score</span>
                                    <p className="font-medium text-foreground">
                                        {submissionSummary.bestScore}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs">
                                        Last Submitted
                                    </span>
                                    <p className="font-medium text-foreground">
                                        {submissionSummary.lastSubmittedAt
                                            ? new Date(
                                                  submissionSummary.lastSubmittedAt,
                                              ).toLocaleDateString('en-US')
                                            : 'Never'}
                                    </p>
                                </div>
                            </div>
                            {totalPoints !== null && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Total points:{' '}
                                    <span className="font-medium text-foreground">
                                        {totalPoints}
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Recent submissions */}
                        {recentSubmissions.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium">
                                    Recent Submissions
                                </p>
                                {recentSubmissions.map((submission) => (
                                    <div
                                        key={submission.id}
                                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                Answer: {submission.answer}
                                            </p>
                                            <p className="text-muted-foreground">
                                                {submission.submittedAtHuman ??
                                                    '-'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p
                                                className={cn(
                                                    'font-semibold',
                                                    submission.isCorrect
                                                        ? 'text-emerald-600'
                                                        : 'text-destructive',
                                                )}
                                            >
                                                {submission.isCorrect
                                                    ? 'Correct'
                                                    : 'Incorrect'}
                                            </p>
                                            <p className="text-muted-foreground">
                                                {submission.score} pts
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Related challenges */}
                        {relatedChallenges.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <p className="text-sm font-medium">
                                    Related Challenges
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {relatedChallenges.map((related) => (
                                        <Button
                                            key={related.id}
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <Link
                                                href={challengeShow.url({
                                                    challenge: related.slug,
                                                })}
                                                prefetch
                                            >
                                                <span className="truncate">
                                                    {related.title}
                                                </span>
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
