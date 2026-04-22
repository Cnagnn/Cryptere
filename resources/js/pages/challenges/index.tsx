import CoursesIndex from '@/pages/courses/index';
import { dashboard } from '@/routes';
import { index as challengesIndex } from '@/routes/challenges';

type ChallengeItem = {
    id: number;
    slug: string;
    title: string;
    prompt: string;
    hint: string | null;
    timeStart: string | null;
    timeEnd: string | null;
    status: 'upcoming' | 'active' | 'ended';
    isSolved: boolean;
    hasQuestionBank: boolean;
    questionsCount: number;
    bestScore: number;
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
        timeStart: challenge.timeStart,
        timeEnd: challenge.timeEnd,
        status: challenge.status,
        isSolved: challenge.isSolved,
        hasQuestionBank: challenge.hasQuestionBank,
        questionsCount: challenge.questionsCount,
        bestScore: challenge.bestScore,
    }));

    return (
        <CoursesIndex
            courses={mappedChallenges}
            catalogMode="challenges"
            headTitle="Challenges"
            pageTitle="Challenges"
            pageDescription="Solve published cryptography challenges and track your results alongside courses and labs."
            sidebarMode="filters"
        />
    );
}

ChallengesIndex.layout = {
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
