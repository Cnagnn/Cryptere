export type CourseRow = {
    id: number;
    slug: string;
    title: string;
    summary: string;
    cover: string | null;
    is_published?: boolean;
    status?: 'draft' | 'published' | 'archived';
    version?: number;
    published_by?: number;
    published_by_name?: string;
    lessons_count: number;
    tasks_count?: number;
    enrollments_count: number;
    created_at: string;
    updated_at: string;
};

export type LessonRow = {
    id: number;
    management_id: string;
    course_id: number;
    course_slug: string | null;
    course_title: string | null;
    slug: string;
    title: string;
    description: string;
    position: number;
    status?: 'draft' | 'published' | 'archived';
    version?: number;
    published_by?: number;
    published_by_name?: string;
    topic_id?: number | null;
    topic_name?: string | null;
    prerequisite_lesson_id?: number | null;
    prerequisite_lesson_title?: string | null;
    created_at: string;
    updated_at: string;
};

export type TaskRow = {
    id: number;
    management_id: string;
    is_legacy?: boolean;
    task_index: number;
    lesson_id: number;
    lesson_title: string;
    course_slug: string | null;
    type: string;
    title: string;
    description: string;
    minutes: number;
    estimated_minutes?: number | null;
    video_url: string | null;
    status?: 'draft' | 'published' | 'archived';
    version?: number;
    prerequisite_task_id?: number | null;
    prerequisite_task_title?: string | null;
    created_at: string | null;
    updated_at: string | null;
    document_name?: string | null;
    conversion_status?: string | null;
    pdf_url?: string | null;
    is_published?: boolean;
    published_at?: string | null;
    quiz_questions: QuizQuestionForm[];
};

export type QuizQuestionForm = {
    question: string;
    options: [string, string, string, string];
    correct_option: number;
    explanation: string;
};
