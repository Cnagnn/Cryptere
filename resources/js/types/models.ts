import type { User } from './auth';

// ----------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/**
 * Paginated response envelope returned by Laravel's `paginate()`.
 * NOTE: A narrower copy of this type previously lived in
 * `@/components/course-types.ts`. New code should import from here instead.
 */
export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

// ---------------------------------------------------------------------------
// Course
// ---------------------------------------------------------------------------

/** Based on `app/Models/Course.php` */
export type Course = {
    id: number;
    slug: string;
    title: string;
    summary: string;
    cover: string | null; // computed accessor (getCoverAttribute)
    cover_path: string | null;
    estimated_minutes: number;
    sort_order: number;
    is_published: boolean;
    prerequisite_course_id: number | null;
    category: string | null;
    difficulty: string;
    path_position: number;
    created_at: string;
    updated_at: string;
    // Relations (present only when eagerly loaded)
    prerequisite?: Course | null;
    dependents?: Course[];
    lessons?: Lesson[];
    enrollments?: Enrollment[];
    // Aggregates (withCount)
    lessons_count?: number;
    enrollments_count?: number;
    tasks_count?: number;
};

// ---------------------------------------------------------------------------
// Lesson
// ---------------------------------------------------------------------------

/** Based on `app/Models/Lesson.php` */
export type Lesson = {
    id: number;
    course_id: number;
    slug: string;
    title: string;
    description: string | null;
    content: string;
    position: number;
    created_at: string;
    updated_at: string;
    // Relations
    course?: Course;
    tasks?: LessonTask[];
    progress?: LessonProgress[];
    // Aggregates
    tasks_count?: number;
};

// ----------------------------------------------------------------
// LessonTask
// ---------------------------------------------------------------------------

export type LessonTaskType = 'video' | 'read' | 'quiz';

/** Based on `app/Models/LessonTask.php` */
export type LessonTask = {
    id: number;
    lesson_id: number;
    title: string;
    description: string | null;
    type: LessonTaskType;
    minutes: number;
    video_url: string | null;
    video_mp4_url: string | null;
    video_processing_status: string | null;
    document_name: string | null;
    conversion_status: string | null;
    pdf_url: string | null;
    sort_order: number;
    published_at: string | null;
    published_by: number | null;
    created_at: string;
    updated_at: string;
    // Relations
    lesson?: Lesson;
    quiz_questions?: QuizQuestion[];
    // Aggregates
    quiz_questions_count?: number;
};

// ---------------------------------------------------------------------------
// QuizQuestion
// ---------------------------------------------------------------------------

/** Based on `app/Models/QuizQuestion.php` */
export type QuizQuestion = {
    id: number;
    lesson_task_id: number;
    question: string;
    options: string[];
    correct_option: number;
    explanation: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
    // Relations
    task?: LessonTask;
};

// ---------------------------------------------------------------------------
// QuizSubmission
// ---------------------------------------------------------------------------

export type QuizResult = {
    question_id: number;
    selected: number;
    correct: number;
    is_correct: boolean;
    explanation: string | null;
};

/** Based on `app/Models/QuizSubmission.php` */
export type QuizSubmission = {
    id: number;
    user_id: number;
    lesson_task_id: number;
    answers: Record<string, number>;
    score: number;
    total: number;
    results: QuizResult[];
    xp_earned: number;
    points_earned: number;
    submitted_at: string;
    created_at: string;
    updated_at: string;
    // Relations
    user?: User;
    task?: LessonTask;
};

// ---------------------------------------------------------------------------
// Enrollment
// ---------------------------------------------------------------------------

/** Based on `app/Models/Enrollment.php` */
export type Enrollment = {
    id: number;
    user_id: number;
    course_id: number;
    progress_percentage: number;
    enrolled_at: string;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    user?: User;
    course?: Course;
};

// ---------------------------------------------------------------------------
// LessonProgress
// ---------------------------------------------------------------------------

/** Based on `app/Models/LessonProgress.php` */
export type LessonProgress = {
    id: number;
    user_id: number;
    lesson_id: number;
    attempts: number;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    user?: User;
    lesson?: Lesson;
};

// ---------------------------------------------------------------------------
// Challenge
// ---------------------------------------------------------------------------

/** Based on `app/Models/Challenge.php` */
export type Challenge = {
    id: number;
    slug: string;
    title: string;
    prompt: string;
    hint: string | null;
    difficulty: string;
    sort_order: number;
    is_published: boolean;
    category: string | null;
    is_daily: boolean;
    daily_date: string | null;
    time_start: string | null;
    time_end: string | null;
    time_limit_seconds: number;
    questions_per_session: number;
    max_points_per_question: number;
    created_at: string;
    updated_at: string;
    // Relations
    questions?: ChallengeQuestion[];
    submissions?: ChallengeSubmission[];
    // Aggregates
    questions_count?: number;
    submissions_count?: number;
};

// ---------------------------------------------------------------------------
// ChallengeQuestion
// ----------------------------------------------------------------

export type ChallengeQuestionType =
    | 'mcq'
    | 'true_false'
    | 'text'
    | 'fill_blank';

/** Based on `app/Models/ChallengeQuestion.php` */
export type ChallengeQuestion = {
    id: number;
    challenge_id: number;
    type: ChallengeQuestionType;
    question: string;
    options: string[] | null;
    correct_answer?: string; // hidden from client by default via #[Hidden]
    explanation: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
    // Relations
    challenge?: Challenge;
};

// ----------------------------------------------------------------
// ChallengeSubmission
// ---------------------------------------------------------------------------

/** Based on `app/Models/ChallengeSubmission.php` */
export type ChallengeSubmission = {
    id: number;
    user_id: number;
    challenge_id: number;
    session_id: string | null;
    challenge_question_id: number | null;
    answer: string;
    is_correct: boolean;
    score: number;
    elapsed_ms: number | null;
    streak_bonus: number;
    question_index: number | null;
    submitted_at: string;
    created_at: string;
    updated_at: string;
    // Relations
    user?: User;
    challenge?: Challenge;
    challenge_question?: ChallengeQuestion;
};

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export type BadgeCategory =
    | 'milestone'
    | 'course'
    | 'challenge'
    | 'streak'
    | 'lab'
    | 'special';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/** Based on `app/Models/Badge.php` */
export type Badge = {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    category: BadgeCategory;
    tier: BadgeTier;
    criteria_type: string;
    criteria_value: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
    // Pivot data (when loaded through user relationship)
    pivot?: {
        earned_at: string;
    };
};

// ---------------------------------------------------------------------------
// LabVisit
// ---------------------------------------------------------------------------

export type LabSlug =
    | 'caesar-cipher-lab'
    | 'vigenere-cipher-lab'
    | 'aes-lab'
    | 'rsa-lab'
    | 'sha-lab'
    | 'digital-signature-lab';

/** Based on `app/Models/LabVisit.php` */
export type LabVisit = {
    id: number;
    user_id: number;
    lab_slug: LabSlug;
    visit_count: number;
    first_visited_at: string;
    last_visited_at: string;
    created_at: string;
    updated_at: string;
    // Relations
    user?: User;
};

// ---------------------------------------------------------------------------
// SocialAccount
// ---------------------------------------------------------------------------

export type SocialProvider = 'google' | 'github';

/** Based on `app/Models/SocialAccount.php` */
export type SocialAccount = {
    id: number;
    user_id: number;
    provider: SocialProvider;
    provider_user_id: string;
    provider_email: string | null;
    provider_name: string | null;
    provider_avatar: string | null;
    created_at: string;
    updated_at: string;
    // Relations
    user?: User;
};
