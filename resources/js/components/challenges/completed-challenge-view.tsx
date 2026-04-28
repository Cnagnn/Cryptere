import { Head, Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { index as challengesIndex } from '@/routes/challenges';
import type { ChallengePayload, SubmissionSummary } from '@/types/challenges';

export function CompletedChallengeView({
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
                                <h2 className="text-2xl font-semibold tracking-tight">
                                    Challenge Completed
                                </h2>
                                <div>
                                    <p className="text-4xl font-bold">
                                        {submissionSummary.bestScore}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Best Score
                                    </p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    You have already completed this challenge.
                                </p>
                            </div>

                            {/* Right - Stats */}
                            <div className="flex flex-col justify-center gap-6">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="rounded-lg border bg-muted/20 p-3">
                                        <p className="text-2xl font-semibold">
                                            {submissionSummary.correctCount}/
                                            {submissionSummary.attemptCount}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Correct
                                        </p>
                                    </div>
                                    <div className="rounded-lg border bg-muted/20 p-3">
                                        <p className="text-2xl font-semibold">
                                            {submissionSummary.attemptCount > 0
                                                ? Math.round(
                                                      (submissionSummary.correctCount /
                                                          submissionSummary.attemptCount) *
                                                          100,
                                                  )
                                                : 0}
                                            %
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Accuracy
                                        </p>
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
