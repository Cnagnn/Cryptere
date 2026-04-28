// ── Challenge Show Page Types ──

export type ChallengeOption = { label: string; value: string };

export type QuizSessionQuestion = {
    id: number;
    index: number;
    type: 'mcq' | 'true_false' | 'text' | 'fill_blank';
    question: string;
    options: string[] | null;
};

export type QuizSession = {
    sessionId: string;
    questions: QuizSessionQuestion[];
};

export type ChallengePayload = {
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

export type SubmissionSummary = {
    attemptCount: number;
    correctCount: number;
    bestScore: number;
    lastSubmittedAt: string | null;
};

export type RecentSubmission = {
    id: number;
    answer: string;
    isCorrect: boolean;
    score: number;
    streakBonus: number;
    submittedAt: string | null;
    submittedAtHuman: string | null;
};

export type RelatedChallenge = {
    id: number;
    slug: string;
    title: string;
};

export type QuestionResult = {
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string | null;
    questionScore: number;
    streakBonus: number;
    totalQuestionPoints: number;
};

export type SessionResult = {
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

export type QuizPhase = 'pre' | 'playing' | 'feedback' | 'summary';

export type ChallengeShowProps = {
    challenge: ChallengePayload;
    quizSession: QuizSession | null;
    submissionSummary: SubmissionSummary;
    recentSubmissions: RecentSubmission[];
    relatedChallenges: RelatedChallenge[];
};
