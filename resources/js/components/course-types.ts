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
};

export type LessonRow = {
    id: number;
    course_id: number;
    course_slug: string | null;
    course_title: string | null;
    slug: string;
    title: string;
    position: number;
    xp_reward: number;
    tasks_count: number;
};

export type TaskRow = {
    id: number;
    task_index: number;
    lesson_id: number;
    lesson_title: string;
    course_slug: string | null;
    type: string;
    title: string;
    minutes: number;
    video_url: string | null;
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

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type CourseFormData = {
    title: string;
    description: string;
    cover_image: File | null;
};

export type LessonFormData = {
    course_id: number;
    title: string;
    xp_reward: number;
};

export type TaskFormData = {
    lesson_id: number;
    title: string;
    type: TaskType;
    minutes: number;
    video_url: string;
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
