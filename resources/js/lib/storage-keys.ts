// resources/js/lib/storage-keys.ts
export const STORAGE_KEYS = {
    QUIZ_DRAFT: (taskId: number) => `quiz-draft-${taskId}` as const,
    ASSESSMENT_DRAFT: (assessmentId: number) => `assessment-draft-${assessmentId}` as const,
    VIDEO_POSITION: (taskId: number) => `video-position-${taskId}` as const,
    QUIZ_SHUFFLE_SEED: (taskId: number) => `quiz-shuffle-${taskId}` as const,
    HEARTBEAT_QUEUE: 'heartbeat-queue' as const,
} as const;

export type QuizDraft = {
    taskId: number;
    answers: number[]; // -1 = unanswered, 0-3 = option index
    timestamp: number;
    version: 1;
};

export type AssessmentDraft = {
    assessmentId: number;
    submissionId: number;
    answers: Record<number, {
        answer_text?: string;
        selected_option?: string;
    }>;
    timestamp: number;
    version: 1;
};

export type VideoProgress = {
    taskId: number;
    position: number; // seconds
    duration: number;
    timestamp: number;
};

export type QueuedHeartbeat = {
    id: string;
    taskId: number;
    type: 'video' | 'reading';
    seconds: number;
    timestamp: number;
};
