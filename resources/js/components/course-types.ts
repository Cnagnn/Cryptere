export type CourseRow = {
    id: number;
    slug: string;
    title: string;
    summary: string;
    cover: string | null;
    is_published?: boolean;
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
    video_url: string | null;
    created_at: string | null;
    updated_at: string | null;
    video_processing_status?: string | null;
    video_mp4_url?: string | null;
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

export type TaskType = 'video' | 'read' | 'quiz';

export type ComboboxOption = {
    value: string;
    label: string;
};

export type { Paginated } from '@/types/models';

export type CourseFormData = {
    title: string;
    description: string;
    cover_image: File | null;
};

export type LessonFormData = {
    course_id: number;
    title: string;
    description: string;
};

export type TaskFormData = {
    lesson_id: number;
    title: string;
    description: string;
    type: TaskType;
    minutes: number;
    video_url: string;
    video_file: File | null;
    document: File | null;
    quiz_questions: QuizQuestionForm[];
};

export function createEmptyQuizQuestion(): QuizQuestionForm {
    return {
        question: '',
        options: ['', '', '', ''],
        correct_option: 0,
        explanation: '',
    };
}
