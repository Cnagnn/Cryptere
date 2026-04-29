import { setLayoutProps } from '@inertiajs/react';
import { useMemo } from 'react';

import { CompletedChallengeView } from '@/components/challenges/completed-challenge-view';
import { LegacySpeedRoundView } from '@/components/challenges/legacy-speed-round-view';
import { QuizModeView } from '@/components/challenges/quiz-mode-view';
import { DiscussionPanel } from '@/components/discussion-panel';
import { dashboard } from '@/routes';
import {
    index as challengesIndex,
    show as challengeShow,
} from '@/routes/challenges';
import type { ChallengeShowProps } from '@/types/challenges';

export default function ChallengesShow({
    challenge,
    quizSession,
    submissionSummary,
    recentSubmissions,
    relatedChallenges,
}: ChallengeShowProps) {
    setLayoutProps({
        breadcrumbs: [
            { title: 'Home', href: dashboard() },
            { title: 'Challenges', href: challengesIndex() },
            {
                title: challenge.title,
                href: challengeShow.url({ challenge: challenge.slug }),
            },
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
            <>
                <CompletedChallengeView
                    challenge={challenge}
                    submissionSummary={submissionSummary}
                />
                <DiscussionPanel
                    discussableType="challenge"
                    discussableId={challenge.id}
                    className="mx-auto max-w-4xl px-4"
                />
            </>
        );
    }

    if (isQuizMode && quizSession !== null) {
        return (
            <>
                <QuizModeView
                    challenge={challenge}
                    quizSession={quizSession}
                    submissionSummary={submissionSummary}
                    autoStart={autoStart}
                />
                <DiscussionPanel
                    discussableType="challenge"
                    discussableId={challenge.id}
                    className="mx-auto max-w-4xl px-4"
                />
            </>
        );
    }

    return (
        <>
            <LegacySpeedRoundView
                challenge={challenge}
                submissionSummary={submissionSummary}
                recentSubmissions={recentSubmissions}
                relatedChallenges={relatedChallenges}
            />
            <DiscussionPanel
                discussableType="challenge"
                discussableId={challenge.id}
                className="mx-auto max-w-4xl px-4"
            />
        </>
    );
}
