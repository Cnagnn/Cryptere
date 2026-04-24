import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import {
    store as coursesStore,
    update as coursesUpdate,
} from '@/actions/App/Http/Controllers/Admin/CourseController';
import type { CourseFormData, CourseRow } from '@/components/course-types';
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

interface CourseFormDialogProps {
    mode: 'create' | 'edit';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Edit mode only */
    course?: CourseRow | null;
}

export function CourseFormDialog({
    mode,
    open,
    onOpenChange,
    course,
}: CourseFormDialogProps) {
    const form = useForm<CourseFormData>({
        title: '',
        description: '',
        cover_image: null,
    });

    /** Pre-fill form when editing */
    useEffect(() => {
        if (mode === 'edit' && open && course) {
            form.setData({
                title: course.title,
                description: course.summary,
                cover_image: null,
            });
            form.clearErrors();
        }

        // Reset on create open
        if (mode === 'create' && open) {
            form.reset();
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
            form.post(coursesStore.url(), {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: handleClose,
            });
        } else {
            if (!course) {
                return;
            }

            form.patch(coursesUpdate.url({ course: course.id }), {
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
            <DialogContent className="w-full overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {isCreate ? 'Create Course' : 'Edit Course'}
                    </DialogTitle>
                    <DialogDescription>
                        {isCreate
                            ? 'Fill the initial information to create a new course.'
                            : 'Update title and description for this course.'}
                    </DialogDescription>
                </DialogHeader>

                <FieldGroup className="px-4">
                    <Field>
                        <FieldLabel htmlFor={`${mode}-course-title`}>Title</FieldLabel>
                        <FieldContent>
                        <Input
                            id={`${mode}-course-title`}
                            placeholder={
                                isCreate ? 'Basic Cryptography' : undefined
                            }
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
                        <FieldLabel htmlFor={`${mode}-course-description`}>Description</FieldLabel>
                        <FieldContent>
                        <Textarea
                            id={`${mode}-course-description`}
                            placeholder={
                                isCreate
                                    ? 'Introduction to core crypto concepts'
                                    : undefined
                            }
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            aria-invalid={Boolean(form.errors.description)}
                        />
                            <FieldError>{form.errors.description}</FieldError>
                        </FieldContent>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor={`${mode}-course-cover`}>Grid Cover Image</FieldLabel>
                        <FieldContent>
                        <Input
                            id={`${mode}-course-cover`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                form.setData(
                                    'cover_image',
                                    e.currentTarget.files?.[0] ?? null,
                                );
                            }}
                            aria-invalid={Boolean(form.errors.cover_image)}
                        />
                        {!isCreate ? (
                                <FieldDescription>
                                Leave empty to keep the current grid cover.
                                </FieldDescription>
                        ) : null}
                            <FieldError>{form.errors.cover_image}</FieldError>
                        </FieldContent>
                    </Field>

                    {!isCreate && course?.cover ? (
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-muted-foreground">
                                Current cover:
                            </p>
                            <img
                                src={course.cover}
                                alt="Current course cover"
                                className="h-24 w-full rounded-lg border object-cover"
                            />
                        </div>
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
                        disabled={form.processing}
                        onClick={handleSubmit}
                    >
                        {isCreate ? 'Create' : 'Update'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
