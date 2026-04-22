import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import {
    storeLesson,
    updateLesson,
} from '@/actions/App/Http/Controllers/Admin/CourseManagementController';
import type {
    LessonFormData,
    LessonRow,
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
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface LessonFormSheetProps {
    mode: 'create' | 'edit';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCourseId: number;
    /** Edit mode only */
    lesson?: LessonRow | null;
}

export function LessonFormSheet({
    mode,
    open,
    onOpenChange,
    selectedCourseId,
    lesson,
}: LessonFormSheetProps) {
    const form = useForm<LessonFormData>({
        course_id: selectedCourseId > 0 ? selectedCourseId : 0,
        title: '',
        description: '',
        xp_reward: 50,
    });

    useEffect(() => {
        if (mode === 'edit' && open && lesson) {
            form.setData({
                course_id: lesson.course_id,
                title: lesson.title,
                description: lesson.description,
                xp_reward: lesson.xp_reward,
            });
            form.clearErrors();
        }

        if (mode === 'create' && open) {
            form.setData({
                course_id: selectedCourseId > 0 ? selectedCourseId : 0,
                title: '',
                description: '',
                xp_reward: 50,
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

    const handleSubmit = () => {
        if (mode === 'create') {
            form.post(storeLesson.url(), {
                preserveScroll: true,
                onSuccess: handleClose,
            });
        } else {
            if (!lesson) {
                return;
            }

            form.patch(updateLesson.url({ lesson: lesson.id }), {
                preserveScroll: true,
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
            <DialogContent className="w-full overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isCreate ? 'Create Lesson' : 'Edit Lesson'}
                    </DialogTitle>
                    <DialogDescription>
                        {isCreate
                            ? 'Create a new lesson.'
                            : 'Update selected lesson details.'}
                    </DialogDescription>
                </DialogHeader>

                <FieldGroup className="px-4">
                    <Field>
                        <FieldLabel htmlFor={`${mode}-lesson-title`}>Title</FieldLabel>
                        <FieldContent>
                        <Input
                            id={`${mode}-lesson-title`}
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
                        <FieldLabel htmlFor={`${mode}-lesson-description`}>Description</FieldLabel>
                        <FieldContent>
                            <Textarea
                                id={`${mode}-lesson-description`}
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
                </FieldGroup>

                <DialogFooter className="mt-4 sm:flex-row sm:justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        disabled={
                            form.processing || (mode === 'edit' && !lesson)
                        }
                        onClick={handleSubmit}
                    >
                        {isCreate ? 'Create' : 'Update'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
