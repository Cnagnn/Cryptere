import CoursesIndex from '@/pages/courses/index';
import { index as challengesIndex } from '@/routes/challenges';

type ChallengeItem = {
    id: number;
    slug: string;
    title: string;
    prompt: string;
    hint: string | null;
    pointsReward: number;
    timeStart: string | null;
    timeEnd: string | null;
    status: 'upcoming' | 'active' | 'ended';
    isSolved: boolean;
};

type Props = {
    challenges: ChallengeItem[];
};

export default function ChallengesIndex({ challenges }: Props) {
    const mappedChallenges = challenges.map((challenge) => ({
        id: challenge.id,
        slug: challenge.slug,
        title: challenge.title,
        summary: challenge.prompt,
        coverImage: null,
        estimatedMinutes: 0,
        lessonCount: 1,
        enrollmentCount: 0,
        isEnrolled: false,
        progressPercentage: challenge.isSolved ? 100 : 0,
        pointsReward: challenge.pointsReward,
        timeStart: challenge.timeStart,
        timeEnd: challenge.timeEnd,
        status: challenge.status,
        isSolved: challenge.isSolved,
    }));

    return (
        <CoursesIndex
            courses={mappedChallenges}
            catalogMode="challenges"
            headTitle="Challenges"
            pageTitle="Challenges"
            pageDescription="Published challenges from management appear here automatically with the same catalog experience as courses and labs."
            sidebarMode="filters"
        />
    );
}

ChallengesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Challenges',
            href: challengesIndex(),
        },
    ],
};
