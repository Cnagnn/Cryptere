import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import {
    storeTask,
    updateTask,
} from '@/actions/App/Http/Controllers/Admin/CourseManagementController';
import { QuizQuestionsEditor } from '@/components/course-quiz-questions-editor';
import { SearchableCombobox } from '@/components/course-searchable-combobox';
import { createEmptyQuizQuestion } from '@/components/course-types';
import type {
    ComboboxOption,
    TaskFormData,
    TaskRow,
    TaskType,
} from '@/components/course-types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TASK_TYPE_OPTIONS: ComboboxOption[] = [
    { value: 'video', label: 'Video' },
    { value: 'read', label: 'Read' },
    { value: 'quiz', label: 'Quiz' },
];

interface TaskFormSheetProps {
    mode: 'create' | 'edit';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lessonOptions: ComboboxOption[];
    selectedLessonId: number;
    /** Edit mode only */
    task?: TaskRow | null;
}

export function TaskFormSheet({
    mode,
    open,
    onOpenChange,
    lessonOptions,
    selectedLessonId,
    task,
}: TaskFormSheetProps) {
    const form = useForm<TaskFormData>({
        lesson_id:
            selectedLessonId > 0
                ? selectedLessonId
                : Number(lessonOptions[0]?.value ?? 0),
        title: '',
        type: 'video',
        minutes: 10,
        video_url: '',
        document: null,
        quiz_questions: [createEmptyQuizQuestion()],
    });

    useEffect(() => {
        if (mode === 'edit' && open && task) {
            form.setData({
                lesson_id: task.lesson_id,
                title: task.title,
                type: task.type as TaskType,
                minutes: task.minutes,
                video_url: task.video_url ?? '',
                document: null,
                quiz_questions:
                    task.quiz_questions.length > 0
                        ? task.quiz_questions
                        : [createEmptyQuizQuestion()],
            });
            form.clearErrors();
        }

        if (mode === 'create' && open) {
            form.setData({
                lesson_id:
                    selectedLessonId > 0
                        ? selectedLessonId
                        : Number(lessonOptions[0]?.value ?? 0),
                title: '',
                type: 'video',
                minutes: 10,
                video_url: '',
                document: null,
                quiz_questions: [createEmptyQuizQuestion()],
            });
            form.clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleClose = () => {
        form.reset();
        form.clearErrors();
        onOpenChange(false);
    };

    const handleTypeChange = (value: string) => {
        const selectedType = value as TaskType;
        form.setData('type', selectedType);

        if (selectedType !== 'video') {
            form.setData('video_url', '');
        }

        if (selectedType !== 'read') {
            form.setData('document', null);
        }

        if (selectedType !== 'quiz') {
            form.setData('quiz_questions', [createEmptyQuizQuestion()]);
        }
    };

    const handleSubmit = () => {
        if (mode === 'create') {
            form.post(storeTask.url(), {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: handleClose,
            });
        } else {
            if (!task) {
                return;
            }

            form.patch(updateTask.url({ task: task.id }), {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: handleClose,
            });
        }
    };

    const isCreate = mode === 'create';

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handleClose();
                }
            }}
        >
            <DialogContent className="max-h-[85vh] w-full overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isCreate ? 'Create Task' : 'Edit Task'}
                    </DialogTitle>
                    <DialogDescription>
                        {isCreate
                            ? 'Create a new task in selected lesson.'
                            : 'Update selected task details.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 px-4">
                    {isCreate ? (
                        <div className="flex flex-col gap-2">
                            <Label>Lesson</Label>
                            <SearchableCombobox
                                value={
                                    form.data.lesson_id > 0
                                        ? String(form.data.lesson_id)
                                        : undefined
                                }
                                options={lessonOptions}
                                placeholder="Select lesson"
                                searchPlaceholder="Search lesson..."
                                emptyMessage="No lesson found."
                                className="w-full"
                                onSelect={(value) =>
                                    form.setData('lesson_id', Number(value))
                                }
                            />
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-2">
                        <Label htmlFor={`${mode}-task-title`}>Title</Label>
                        <Input
                            id={`${mode}-task-title`}
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData('title', e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.title)}
                        />
                        {form.errors.title ? (
                            <p className="text-sm text-destructive">
                                {form.errors.title}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Type</Label>
                        <SearchableCombobox
                            value={form.data.type}
                            options={TASK_TYPE_OPTIONS}
                            placeholder="Select type"
                            searchPlaceholder="Search type..."
                            emptyMessage="No type found."
                            className="w-full"
                            onSelect={handleTypeChange}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor={`${mode}-task-minutes`}>Minutes</Label>
                        <Input
                            id={`${mode}-task-minutes`}
                            type="number"
                            min={1}
                            max={240}
                            value={form.data.minutes}
                            onChange={(e) =>
                                form.setData(
                                    'minutes',
                                    Number(e.target.value) || 1,
                                )
                            }
                        />
                    </div>

                    {form.data.type === 'video' ? (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor={`${mode}-task-video-url`}>
                                Video URL
                            </Label>
                            <Input
                                id={`${mode}-task-video-url`}
                                value={form.data.video_url}
                                onChange={(e) =>
                                    form.setData('video_url', e.target.value)
                                }
                            />
                        </div>
                    ) : null}

                    {form.data.type === 'read' ? (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor={`${mode}-task-document`}>
                                Document
                            </Label>
                            <Input
                                id={`${mode}-task-document`}
                                type="file"
                                onChange={(e) => {
                                    form.setData(
                                        'document',
                                        e.currentTarget.files?.[0] ?? null,
                                    );
                                }}
                            />
                            {!isCreate ? (
                                <p className="text-sm text-muted-foreground">
                                    Upload dokumen baru jika ingin mengganti
                                    dokumen saat ini.
                                </p>
                            ) : null}
                        </div>
                    ) : null}

                    {form.data.type === 'quiz' ? (
                        <QuizQuestionsEditor
                            prefix={mode}
                            questions={form.data.quiz_questions}
                            onChange={(questions) =>
                                form.setData('quiz_questions', questions)
                            }
                        />
                    ) : null}
                </div>

                <DialogFooter className="mt-4 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        disabled={form.processing || (mode === 'edit' && !task)}
                        onClick={handleSubmit}
                    >
                        {isCreate ? 'Create' : 'Update'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
