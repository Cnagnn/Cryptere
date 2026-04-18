import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import {
    store as coursesStore,
    update as coursesUpdate,
} from '@/actions/App/Http/Controllers/Admin/CourseManagementController';
import type { CourseFormData, CourseRow } from '@/components/course-types';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        <AlertDialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handleClose();
                }
            }}
        >
            <AlertDialogContent className="w-full overflow-y-auto sm:max-w-xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isCreate ? 'Create Course' : 'Edit Course'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isCreate
                            ? 'Fill the initial information to create a new course.'
                            : 'Update title and description for this course.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-4 px-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor={`${mode}-course-title`}>Title</Label>
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
                        {form.errors.title ? (
                            <p className="text-sm text-destructive">
                                {form.errors.title}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor={`${mode}-course-description`}>
                            Description
                        </Label>
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
                        {form.errors.description ? (
                            <p className="text-sm text-destructive">
                                {form.errors.description}
                            </p>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor={`${mode}-course-cover`}>
                            Grid Cover Image
                        </Label>
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
                            <p className="text-sm text-muted-foreground">
                                Leave empty to keep the current grid cover.
                            </p>
                        ) : null}
                        {form.errors.cover_image ? (
                            <p className="text-sm text-destructive">
                                {form.errors.cover_image}
                            </p>
                        ) : null}
                    </div>

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
                </div>

                <AlertDialogFooter className="mt-4 sm:flex-row sm:justify-end">
                    <AlertDialogCancel onClick={handleClose}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        type="button"
                        disabled={form.processing}
                        onClick={handleSubmit}
                    >
                        {isCreate ? 'Create' : 'Update'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
