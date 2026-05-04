import { AlertCircle } from 'lucide-react';
import { TaskDocument } from '@/components/task/task-document';
import { TaskQuiz } from '@/components/task/task-quiz';
import type { QuizQuestion, QuizSubmission } from '@/components/task/task-quiz';
import { TaskVideo } from '@/components/task/task-video';
import { Alert, AlertDescription } from '@/components/ui/alert';

type TaskType = 'video' | 'read' | 'reading' | 'quiz';

type Task = {
    id: number;
    type: TaskType;
    title: string;
    description: string;
    videoUrl?: string | null;
    videoProcessingStatus?: string | null;
    content?: string;
    pdfUrl?: string | null;
    pdfName?: string | null;
    quizQuestions?: QuizQuestion[];
    submission?: QuizSubmission | null;
};

type TaskViewerProps = {
    courseSlug: string;
    lessonId: number;
    task: Task;
    onComplete?: () => void;
};

export function TaskViewer({
    courseSlug,
    lessonId,
    task,
    onComplete,
}: TaskViewerProps) {
    // Normalize 'reading' to 'read'
    const normalizedType = task.type === 'reading' ? 'read' : task.type;

    switch (normalizedType) {
        case 'video':
            if (!task.videoUrl) {
                return (
                    <Alert variant="destructive">
                        <AlertCircle className="size-4" />
                        <AlertDescription>
                            Video URL is missing for this task.
                        </AlertDescription>
                    </Alert>
                );
            }

            return (
                <TaskVideo
                    courseSlug={courseSlug}
                    lessonId={lessonId}
                    task={{
                        id: task.id,
                        title: task.title,
                        description: task.description,
                        videoUrl: task.videoUrl,
                        videoProcessingStatus:
                            task.videoProcessingStatus as any,
                    }}
                    onComplete={onComplete}
                />
            );

        case 'read':
            return (
                <TaskDocument
                    courseSlug={courseSlug}
                    lessonId={lessonId}
                    task={{
                        id: task.id,
                        title: task.title,
                        description: task.description,
                        content: task.content,
                        pdfUrl: task.pdfUrl ?? undefined,
                        pdfName: task.pdfName ?? undefined,
                    }}
                    onComplete={onComplete}
                />
            );

        case 'quiz':
            if (!task.quizQuestions || task.quizQuestions.length === 0) {
                return (
                    <Alert>
                        <AlertCircle className="size-4" />
                        <AlertDescription>
                            This quiz has no questions yet.
                        </AlertDescription>
                    </Alert>
                );
            }

            return (
                <TaskQuiz
                    courseSlug={courseSlug}
                    lessonId={lessonId}
                    task={{
                        id: task.id,
                        title: task.title,
                        description: task.description,
                        quizQuestions: task.quizQuestions,
                    }}
                    submission={task.submission}
                    onComplete={onComplete}
                />
            );

        default:
            return (
                <Alert variant="destructive">
                    <AlertCircle className="size-4" />
                    <AlertDescription>
                        Unknown task type: {task.type}
                    </AlertDescription>
                </Alert>
            );
    }
}
