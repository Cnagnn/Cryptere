import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import {
    storeLesson,
    updateLesson,
} from '@/actions/App/Http/Controllers/Admin/CourseManagementController';
import { SearchableCombobox } from '@/components/course-searchable-combobox';
import type {
    ComboboxOption,
    LessonFormData,
    LessonRow,
} from '@/components/course-types';
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

interface LessonFormSheetProps {
    mode: 'create' | 'edit';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    courseOptions: ComboboxOption[];
    selectedCourseId: number;
    /** Edit mode only */
    lesson?: LessonRow | null;
}

export function LessonFormSheet({
    mode,
    open,
    onOpenChange,
    courseOptions,
    selectedCourseId,
    lesson,
}: LessonFormSheetProps) {
    const form = useForm<LessonFormData>({
        course_id:
            selectedCourseId > 0
                ? selectedCourseId
                : Number(courseOptions[0]?.value ?? 0),
        title: '',
        xp_reward: 50,
    });

    useEffect(() => {
        if (mode === 'edit' && open && lesson) {
            form.setData({
                course_id: lesson.course_id,
                title: lesson.title,
                xp_reward: lesson.xp_reward,
            });
            form.clearErrors();
        }

        if (mode === 'create' && open) {
            form.setData({
                course_id:
                    selectedCourseId > 0
                        ? selectedCourseId
                        : Number(courseOptions[0]?.value ?? 0),
                title: '',
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
                        {isCreate ? 'Create Lesson' : 'Edit Lesson'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isCreate
                            ? 'Create a new lesson in selected course.'
                            : 'Update selected lesson details.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-3 px-4">
                    {isCreate ? (
                        <div className="flex flex-col gap-2">
                            <Label>Course</Label>
                            <SearchableCombobox
                                value={
                                    form.data.course_id > 0
                                        ? String(form.data.course_id)
                                        : undefined
                                }
                                options={courseOptions}
                                placeholder="Select course"
                                searchPlaceholder="Search course..."
                                emptyMessage="No course found."
                                className="w-full"
                                onSelect={(value) =>
                                    form.setData('course_id', Number(value))
                                }
                            />
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-2">
                        <Label htmlFor={`${mode}-lesson-title`}>Title</Label>
                        <Input
                            id={`${mode}-lesson-title`}
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
                </div>

                <AlertDialogFooter className="mt-4 sm:flex-row sm:justify-end">
                    <AlertDialogCancel onClick={handleClose}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        type="button"
                        disabled={
                            form.processing || (mode === 'edit' && !lesson)
                        }
                        onClick={handleSubmit}
                    >
                        {isCreate ? 'Create' : 'Update'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
