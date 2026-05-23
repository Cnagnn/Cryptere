// ── Bloom's Taxonomy Assessment Types ──

export type BloomLevel = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export type BloomLabel =
    | 'Remember'
    | 'Understand'
    | 'Apply'
    | 'Analyze'
    | 'Evaluate'
    | 'Create';

export type GradingType = 'auto';

export type QuestionType =
    | 'mcq'
    | 'multiple_select'
    | 'true_false'
    | 'matching'
    | 'short_answer'
    | 'essay';

export type SubmissionStatus =
    | 'in_progress'
    | 'submitted'
    | 'grading'
    | 'graded';

// ── Catalog / Index Page ──

export type AssessmentCard = {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    bloomLevel: BloomLevel;
    bloomLabel: BloomLabel;
    gradingType: GradingType;
    passingScore: number;
    maxAttempts: number;
    timeLimitMinutes: number | null;
    questionsCount: number;
    bestScore: number | null;
    passed: boolean;
    attemptCount: number;
    canAttempt: boolean;
};

export type BloomRadarPoint = {
    level: BloomLevel;
    label: BloomLabel;
    score: number; // 0-100
    attempts: number;
    passed: number;
};

// ── Show Page ──

export type AssessmentDetail = {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    bloomLevel: BloomLevel;
    bloomLabel: BloomLabel;
    gradingType: GradingType;
    passingScore: number;
    maxAttempts: number;
    timeLimitMinutes: number | null;
    totalPoints: number;
    canAttempt: boolean;
};

export type AssessmentQuestionPayload = {
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
    status: SubmissionStatus;
    totalScore: number | null;
    passed: boolean;
    submittedAt: string | null;
    gradedAt: string | null;
};

// ── Results Page ──

export type SubmissionResult = {
    id: number;
    attemptNumber: number;
    status: SubmissionStatus;
    totalScore: number | null;
    pointsEarned: number | null;
    pointsPossible: number | null;
    passed: boolean;
    submittedAt: string | null;
    gradedAt: string | null;
    overallFeedback: string | null;
    graderName: string | null;
};

export type AnswerResult = {
    id: number;
    questionId: number;
    questionText: string;
    questionType: QuestionType;
    bloomLevel: BloomLevel;
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

export type RubricCriterionScore = {
    score: number;
    feedback: string | null;
};

// ── Mastery Dashboard ──

export type MasteryProfile = {
    overallMastery: number;
    totalAssessments: number;
    totalCompleted: number;
    totalPassed: number;
    radarData: BloomRadarPoint[];
    strengths: BloomLevel[];
    weaknesses: BloomLevel[];
    recentSubmissions: RecentAssessmentSubmission[];
};

export type RecentAssessmentSubmission = {
    assessmentTitle: string;
    bloomLevel: BloomLevel;
    score: number;
    passed: boolean;
    gradedAt: string;
};

export type TopicMasteryItem = {
    topicId: number;
    topicName: string;
    averageScore: number;
    assessmentCount: number;
    passedCount: number;
};

// ── Admin: Grading Queue ──

export type GradingQueueItem = {
    id: number;
    userName: string;
    userEmail: string;
    assessmentTitle: string;
    bloomLevel: BloomLevel;
    status: SubmissionStatus;
    attemptNumber: number;
    submittedAt: string | null;
    pendingAnswers: number;
};

export type ClassAnalytics = {
    totalSubmissions: number;
    averageMastery: number;
    bloomDistribution: Record<BloomLevel, number>;
    pendingGrading: number;
};

// ── Admin: Grade Submission ──

export type GradableAnswer = {
    id: number;
    questionId: number;
    questionText: string;
    questionType: QuestionType;
    bloomLevel: BloomLevel;
    gradingType: GradingType;
    answerText: string | null;
    selectedOption: string | null;
    options: string[] | null;
    correctAnswer: string | null;
    rubric: RubricDefinition | null;
    isCorrect: boolean | null;
    pointsAwarded: number | null;
    maxPoints: number;
    rubricScores: Record<string, RubricCriterionScore> | null;
    feedback: string | null;
    isGraded: boolean;
};

export type RubricDefinition = {
    criteria: RubricCriterion[];
};

export type RubricCriterion = {
    name: string;
    description: string;
    max_points: number;
    levels: RubricLevel[];
};

export type RubricLevel = {
    score: number;
    description: string;
};

export type GradingSubmissionDetail = {
    id: number;
    userName: string;
    userEmail: string;
    assessmentTitle: string;
    assessmentBloomLevel: BloomLevel;
    attemptNumber: number;
    status: SubmissionStatus;
    submittedAt: string | null;
    overallFeedback: string | null;
};

// ── Admin: Assessment Management ──

export type AdminAssessment = {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    course_id: number | null;
    course_title: string | null;
    topic_id: number | null;
    bloom_level: BloomLevel;
    grading_type: GradingType;
    passing_score: number;
    max_attempts: number;
    time_limit_minutes: number | null;
    is_published: boolean;
    status?: 'draft' | 'published' | 'archived';
    version?: number;
    published_by?: number | null;
    published_by_name?: string | null;
    available_from: string | null;
    available_until: string | null;
    sort_order: number;
    questions_count: number;
    created_at: string | null;
    updated_at: string | null;
};

export type AdminAssessmentQuestion = {
    id: number;
    assessment_id: number;
    question_bank_id?: number | null;
    question_bank_title?: string | null;
    source_badge?: 'From Bank' | 'Local';
    bloom_level: BloomLevel;
    question_type: QuestionType;
    question_text: string;
    options: string[] | null;
    correct_answer: string | null;
    explanation: string | null;
    rubric: RubricDefinition | null;
    points: number;
    grading_type: GradingType;
    min_words: number | null;
    max_words: number | null;
    sort_order: number;
    // Analytics
    times_shown?: number;
    times_correct?: number;
    difficulty_score?: number | null;
    discrimination?: number | null;
};

// ── Question Bank ──

export type QuestionBank = {
    id: number;
    title: string;
    category: string | null;
    question_type: QuestionType;
    question_text: string;
    options: string[] | null;
    correct_answer: string | null;
    explanation: string | null;
    rubric: RubricDefinition | null;
    min_words: number | null;
    max_words: number | null;
    points: number;
    is_active: boolean;
    // Analytics
    times_used: number;
    difficulty_score: number | null;
    discrimination: number | null;
    created_at: string;
    updated_at: string;
};
