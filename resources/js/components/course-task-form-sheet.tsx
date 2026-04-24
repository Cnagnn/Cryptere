import { useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    store as storeTask,
    update as updateTask,
} from '@/actions/App/Http/Controllers/Admin/TaskController';
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
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
    lessonCourseMap?: Record<number, number>;
    courseOptions?: ComboboxOption[];
    selectedLessonId: number;
    selectedCourseId?: number;
    showLessonFieldOnCreate?: boolean;
    showQuizQuestionsEditor?: boolean;
    /** Edit mode only */
    task?: TaskRow | null;
}

export function TaskFormSheet({
    mode,
    open,
    onOpenChange,
    lessonOptions,
    lessonCourseMap = {},
    courseOptions = [],
    selectedLessonId,
    selectedCourseId = 0,
    showLessonFieldOnCreate = true,
    showQuizQuestionsEditor = true,
    task,
}: TaskFormSheetProps) {
    const fallbackLessonId = Number(lessonOptions[0]?.value ?? 0);
    const fallbackCourseId = Number(courseOptions[0]?.value ?? selectedCourseId ?? 0);

    const form = useForm<TaskFormData>({
        lesson_id:
            selectedLessonId > 0
                ? selectedLessonId
                : fallbackLessonId,
        title: '',
        description: '',
        type: 'video',
        minutes: 10,
        video_url: '',
        document: null,
        xp_reward: 0,
        quiz_questions: [createEmptyQuizQuestion()],
    });

    useEffect(() => {
        if (mode === 'edit' && open && task) {
            form.setData({
                lesson_id: task.lesson_id,
                title: task.title,
                description: task.description,
                type: task.type as TaskType,
                minutes: task.minutes,
                video_url: task.video_url ?? '',
                document: null,
                xp_reward: task.xp_reward ?? 0,
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
                        : fallbackLessonId,
                title: '',
                description: '',
                type: 'video',
                minutes: 10,
                video_url: '',
                document: null,
                xp_reward: 0,
                quiz_questions: [createEmptyQuizQuestion()],
            });
            form.clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fallbackLessonId, mode, open, selectedLessonId, task]);

    const [selectedCreateCourseId, setSelectedCreateCourseId] = useState<number>(
        selectedCourseId > 0 ? selectedCourseId : fallbackCourseId,
    );

    useEffect(() => {
        if (!open || mode !== 'create') {
            return;
        }

        const nextCourseId = selectedCourseId > 0 ? selectedCourseId : fallbackCourseId;
        setSelectedCreateCourseId(nextCourseId);
    }, [fallbackCourseId, mode, open, selectedCourseId]);

    const filteredLessonOptions = useMemo(() => {
        if (courseOptions.length === 0) {
            return lessonOptions;
        }

        return lessonOptions.filter((option) => {
            const lessonId = Number(option.value);

            return lessonCourseMap[lessonId] === selectedCreateCourseId;
        });
    }, [courseOptions.length, lessonCourseMap, lessonOptions, selectedCreateCourseId]);

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

    const availableLessonOptions = filteredLessonOptions.length > 0 ? filteredLessonOptions : lessonOptions;

    const handleCreateCourseChange = (value: string) => {
        const nextCourseId = Number(value);
        setSelectedCreateCourseId(nextCourseId);

        const lessonFromSelectedCourse = lessonOptions.find((option) => {
            const lessonId = Number(option.value);

            return lessonCourseMap[lessonId] === nextCourseId;
        });

        if (lessonFromSelectedCourse !== undefined) {
            form.setData('lesson_id', Number(lessonFromSelectedCourse.value));
        }
    };

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
                            ? 'Create a new task in selected topic.'
                            : 'Update selected task details.'}
                    </DialogDescription>
                </DialogHeader>

                <FieldGroup className="px-4">
                    {isCreate && showLessonFieldOnCreate && courseOptions.length > 0 ? (
                        <Field>
                            <FieldLabel>Course Title</FieldLabel>
                            <FieldContent>
                                <SearchableCombobox
                                    value={String(selectedCreateCourseId)}
                                    options={courseOptions}
                                    placeholder="Select course title"
                                    searchPlaceholder="Search course title..."
                                    emptyMessage="No course title found."
                                    className="w-full"
                                    onSelect={handleCreateCourseChange}
                                />
                            </FieldContent>
                        </Field>
                    ) : null}

                    {isCreate && showLessonFieldOnCreate ? (
                        <Field>
                            <FieldLabel>Topic</FieldLabel>
                            <FieldContent>
                            <SearchableCombobox
                                value={
                                    form.data.lesson_id > 0
                                        ? String(form.data.lesson_id)
                                        : undefined
                                }
                                options={availableLessonOptions}
                                placeholder="Select topic"
                                searchPlaceholder="Search topic..."
                                emptyMessage="No topic found."
                                className="w-full"
                                onSelect={(value) =>
                                    form.setData('lesson_id', Number(value))
                                }
                            />
                                <FieldError>{form.errors.lesson_id}</FieldError>
                            </FieldContent>
                        </Field>
                    ) : null}

                    <Field>
                        <FieldLabel htmlFor={`${mode}-task-title`}>Title</FieldLabel>
                        <FieldContent>
                        <Input
                            id={`${mode}-task-title`}
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData('title', e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.title)}
                        />
                            <FieldError>{form.errors.title}</FieldError>
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor={`${mode}-task-description`}>Description</FieldLabel>
                        <FieldContent>
                            <Textarea
                                id={`${mode}-task-description`}
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData('description', event.target.value)
                                }
                                maxLength={5000}
                                rows={4}
                                aria-invalid={Boolean(form.errors.description)}
                            />
                            <FieldError>{form.errors.description}</FieldError>
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel>Type</FieldLabel>
                        <FieldContent>
                        <SearchableCombobox
                            value={form.data.type}
                            options={TASK_TYPE_OPTIONS}
                            placeholder="Select type"
                            searchPlaceholder="Search type..."
                            emptyMessage="No type found."
                            className="w-full"
                            onSelect={handleTypeChange}
                        />
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor={`${mode}-task-xp-reward`}>XP Reward</FieldLabel>
                        <FieldContent>
                            <Input
                                id={`${mode}-task-xp-reward`}
                                type="number"
                                min={0}
                                max={10000}
                                value={form.data.xp_reward}
                                onChange={(e) =>
                                    form.setData('xp_reward', Number(e.target.value) || 0)
                                }
                            />
                            <FieldDescription>
                                XP awarded when this task is completed. 0 = no XP.
                            </FieldDescription>
                            <FieldError>{form.errors.xp_reward}</FieldError>
                        </FieldContent>
                    </Field>

                    {form.data.type === 'video' ? (
                        <Field>
                            <FieldLabel htmlFor={`${mode}-task-video-url`}>Video URL</FieldLabel>
                            <FieldContent>
                            <Input
                                id={`${mode}-task-video-url`}
                                value={form.data.video_url}
                                onChange={(e) =>
                                    form.setData('video_url', e.target.value)
                                }
                            />
                                <FieldError>{form.errors.video_url}</FieldError>
                            </FieldContent>
                        </Field>
                    ) : null}

                    {form.data.type === 'read' ? (
                        <Field>
                            <FieldLabel htmlFor={`${mode}-task-document`}>Document</FieldLabel>
                            <FieldContent>
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
                                <FieldError>{form.errors.document}</FieldError>
                            {!isCreate ? (
                                    <FieldDescription>
                                    Upload dokumen baru jika ingin mengganti
                                    dokumen saat ini.
                                    </FieldDescription>
                            ) : null}
                            </FieldContent>
                        </Field>
                    ) : null}

                    {form.data.type === 'quiz' && showQuizQuestionsEditor ? (
                        <QuizQuestionsEditor
                            prefix={mode}
                            questions={form.data.quiz_questions}
                            onChange={(questions) =>
                                form.setData('quiz_questions', questions)
                            }
                        />
                    ) : null}
                </FieldGroup>

                <DialogFooter className="mt-4 sm:flex-row sm:justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                        </Button>
                    </DialogClose>
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
