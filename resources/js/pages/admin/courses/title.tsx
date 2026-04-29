import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowRightLeft, BadgeCheck, CircleDashed, CheckCircle2, Clock3, Eye, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { CourseRow, Paginated } from '@/components/course-types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import {
    destroy as coursesDestroy,
    index as adminCoursesIndex,
    store as coursesStore,
    togglePublish as coursesTogglePublish,
    update as coursesUpdate,
} from '@/routes/admin/courses';
import { show as coursesShow } from '@/routes/courses';

type Props = {
    courses: Paginated<CourseRow>;
};

export default function AdminCoursesTitle({ courses }: Props) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [deletingCourse, setDeletingCourse] = useState<CourseRow | null>(null);
    const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null);
    const [courseFilterValue, setCourseFilterValue] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSavingCourse, setIsSavingCourse] = useState(false);
    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
        coverImage: null as File | null,
    });
    const titleHasError = Boolean(errors.title);
    const descriptionHasError = Boolean(errors.description);
    const coverImageHasError = Boolean(errors.cover_image);
    const isEditMode = editingCourse !== null;

    const resetCourseDialogState = () => {
        setEditingCourse(null);
        setCourseForm({
            title: '',
            description: '',
            coverImage: null,
        });
    };

    const openCreateDialog = () => {
        resetCourseDialogState();
        setIsCreateDialogOpen(true);
    };

    const openEditDialog = (course: CourseRow) => {
        setEditingCourse(course);
        setCourseForm({
            title: course.title,
            description: course.summary,
            coverImage: null,
        });
        setIsCreateDialogOpen(true);
    };

    const filteredCourses = useMemo(() => {
        const keyword = courseFilterValue.trim().toLowerCase();

        if (keyword === '') {
            return courses.data;
        }

        return courses.data.filter((course) => {
            return course.title.toLowerCase().includes(keyword)
                || course.summary.toLowerCase().includes(keyword);
        });
    }, [courseFilterValue, courses.data]);

    const submitDeleteCourse = () => {
        if (!deletingCourse) {
            return;
        }

        router.delete(coursesDestroy.url({ course: deletingCourse.id }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Course deleted successfully.');
                setDeletingCourse(null);
            },
            onError: (formErrors) => {
                const messages = Object.values(formErrors).flat().join(', ');
                toast.error(messages || 'Failed to delete course.');
                setDeletingCourse(null);
            },
        });
    };

    const columns = useMemo<ColumnDef<CourseRow>[]>(() => [
        {
            accessorKey: 'title',
            header: 'Title',
            cell: ({ row }) => (
                <div className="min-w-48 max-w-sm text-left">
                    <p className="truncate font-medium" title={row.original.title}>{row.original.title}</p>
                </div>
            ),
        },
        {
            accessorKey: 'is_published',
            header: 'Status',
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <Badge variant="outline">
                        {row.original.is_published ? <BadgeCheck className="text-emerald-500" /> : <CircleDashed className="text-amber-500" />}
                        {row.original.is_published ? 'Published' : 'Draft'}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'enrollments_count',
            header: 'Enrollments',
        },
        {
            accessorKey: 'created_at',
            header: 'Created At',
            cell: ({ row }) => {
                const date = row.original.created_at ? new Date(row.original.created_at) : null;
                if (!date) return '—';
                const d = String(date.getDate()).padStart(2, '0');
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const y = date.getFullYear();
                const h = String(date.getHours()).padStart(2, '0');
                const min = String(date.getMinutes()).padStart(2, '0');
                return `${d}/${m}/${y}, ${h}:${min}`;
            },
        },
        {
            accessorKey: 'updated_at',
            header: 'Updated At',
            cell: ({ row }) => {
                const date = row.original.updated_at ? new Date(row.original.updated_at) : null;
                if (!date) return '—';
                const d = String(date.getDate()).padStart(2, '0');
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const y = date.getFullYear();
                const h = String(date.getHours()).padStart(2, '0');
                const min = String(date.getMinutes()).padStart(2, '0');
                return `${d}/${m}/${y}, ${h}:${min}`;
            },
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon">
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-muted-foreground">Actions</DropdownMenuLabel>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <ArrowRightLeft data-icon="inline-start" />
                                        Set Status
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem
                                            disabled={row.original.is_published}
                                            onClick={() => router.patch(coursesTogglePublish.url({ course: row.original.id }), { is_published: true }, { preserveScroll: true })}
                                        >
                                            <BadgeCheck data-icon="inline-start" />
                                            Published
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            disabled={!row.original.is_published}
                                            onClick={() => router.patch(coursesTogglePublish.url({ course: row.original.id }), { is_published: false }, { preserveScroll: true })}
                                        >
                                            <CircleDashed data-icon="inline-start" />
                                            Draft
                                        </DropdownMenuItem>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuItem onClick={() => openEditDialog(row.original)}>
                                    <Pencil data-icon="inline-start" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeletingCourse(row.original)}>
                                    <Trash2 data-icon="inline-start" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.get(coursesShow.url(row.original.slug))}>
                                <Eye data-icon="inline-start" />
                                View Course
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], []);

    const handlePageChange = (nextPage: number): void => {
        router.get(
            adminCoursesIndex.url({ query: { section: 'catalog', page: nextPage, per_page: courses.per_page } }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePageSizeChange = (nextPageSize: number): void => {
        router.get(
            adminCoursesIndex.url({ query: { section: 'catalog', page: 1, per_page: nextPageSize } }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <>
            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-0">
                        <TypographyH1>Course Title Management</TypographyH1>
                        <TypographyMuted className="text-sm/6">
                            Manage course titles, publication status, and high-level metadata.
                        </TypographyMuted>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <div className="w-full sm:w-80">
                            <Input
                                id="course-search"
                                placeholder="Search Course..."
                                value={courseFilterValue}
                                onChange={(event) => setCourseFilterValue(event.target.value)}
                            />
                        </div>
                        <Dialog
                            open={isCreateDialogOpen}
                            onOpenChange={(open) => {
                                setIsCreateDialogOpen(open);

                                if (!open && !isSavingCourse) {
                                    resetCourseDialogState();
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button type="button" className="sm:shrink-0" onClick={openCreateDialog}>
                                    <Plus data-icon="inline-start" />
                                    Create Course
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-sm *:data-[slot=dialog-close]:top-6 *:data-[slot=dialog-close]:right-6">
                                <form
                                    className="flex flex-col gap-5"
                                    encType="multipart/form-data"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        const form = event.currentTarget;
                                        const payload = new FormData(form);

                                        const requestUrl = isEditMode
                                            ? coursesUpdate.url({ course: editingCourse.id })
                                            : coursesStore.url();

                                        if (isEditMode) {
                                            payload.append('_method', 'PATCH');
                                        }

                                        router.post(requestUrl, payload, {
                                            forceFormData: true,
                                            preserveScroll: true,
                                            preserveState: true,
                                            onStart: () => {
                                                setIsSavingCourse(true);
                                            },
                                            onSuccess: () => {
                                                toast.success(isEditMode ? 'Course updated successfully.' : 'Course created successfully.');
                                                resetCourseDialogState();
                                                setIsCreateDialogOpen(false);
                                            },
                                            onError: (formErrors) => {
                                                const messages = Object.values(formErrors).flat().join(', ');
                                                toast.error(messages || 'Failed to save course.');
                                            },
                                            onFinish: () => {
                                                setIsSavingCourse(false);
                                            },
                                        });
                                    }}
                                >
                                    <DialogHeader className="pr-10">
                                        <DialogTitle>{isEditMode ? 'Edit course' : 'Create course'}</DialogTitle>
                                        <DialogDescription>
                                            {isEditMode
                                                ? 'Update course title, summary, and cover image.'
                                                : 'Add a new course title and summary.'}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <FieldGroup className="gap-3">
                                        <Field className="gap-2" data-invalid={titleHasError || undefined}>
                                            <FieldLabel htmlFor="course-title">
                                                Title <span className="text-destructive">*</span>
                                            </FieldLabel>
                                            <Input
                                                id="course-title"
                                                name="title"
                                                placeholder="Enter course title"
                                                value={courseForm.title}
                                                onChange={(event) => {
                                                    setCourseForm((current) => ({ ...current, title: event.target.value }));
                                                }}
                                                aria-invalid={titleHasError}
                                                required
                                            />
                                            {titleHasError && (
                                                <FieldDescription className="text-destructive">
                                                    {errors.title}
                                                </FieldDescription>
                                            )}
                                        </Field>
                                        <Field className="gap-2" data-invalid={descriptionHasError || undefined}>
                                            <FieldLabel htmlFor="course-description">
                                                Description <span className="text-destructive">*</span>
                                            </FieldLabel>
                                            <Textarea
                                                id="course-description"
                                                name="description"
                                                placeholder="Enter course description"
                                                value={courseForm.description}
                                                onChange={(event) => {
                                                    setCourseForm((current) => ({ ...current, description: event.target.value }));
                                                }}
                                                aria-invalid={descriptionHasError}
                                                required
                                                rows={4}
                                            />
                                            {descriptionHasError && (
                                                <FieldDescription className="text-destructive">
                                                    {errors.description}
                                                </FieldDescription>
                                            )}
                                        </Field>
                                        <Field className="gap-2" data-invalid={coverImageHasError || undefined}>
                                            <FieldLabel htmlFor="course-picture">
                                                Upload Cover <span className="text-destructive"></span>
                                            </FieldLabel>
                                            <Input
                                                id="course-picture"
                                                name="cover_image"
                                                type="file"
                                                accept="image/*"
                                                aria-invalid={coverImageHasError}
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0] ?? null;
                                                    setCourseForm((current) => ({ ...current, coverImage: file }));
                                                }}
                                            />
                                            {coverImageHasError && (
                                                <FieldDescription className="text-destructive">
                                                    {errors.cover_image}
                                                </FieldDescription>
                                            )}
                                            <FieldDescription>
                                                {isEditMode
                                                    ? 'Leave blank to keep current cover.'
                                                    : 'Leave blank to use the system\'s default cover.'}
                                            </FieldDescription>
                                        </Field>
                                    </FieldGroup>
                                    <DialogFooter className="pt-1">
                                        <DialogClose asChild>
                                            <Button variant="outline" type="button" disabled={isSavingCourse}>Cancel</Button>
                                        </DialogClose>
                                        <Button type="submit" disabled={isSavingCourse}>
                                            {isSavingCourse && <Spinner data-icon="inline-start" />}
                                            {isEditMode ? 'Update course' : 'Save draft'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </header>

                <section className="grid gap-4">
                    <div className="flex flex-col gap-4">
                        {filteredCourses.length === 0 ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <Search />
                                    </EmptyMedia>
                                    <EmptyTitle>No course title found</EmptyTitle>
                                    <EmptyDescription>
                                        Try another keyword.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredCourses}
                                centered
                                showFilterInput={false}
                                showColumnToggle={false}
                                showPageInfo={false}
                                enableDefaultIdSort={false}
                                page={courses.current_page}
                                pageCount={courses.last_page}
                                pageSize={courses.per_page}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                                footerInfo={`Showing ${courses.from ?? 0} - ${courses.to ?? 0} of ${courses.total} Course Titles`}
                            />
                        )}
                    </div>
                </section>
            </div>

            <AlertDialog
                open={deletingCourse !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingCourse(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete course?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently remove this course and its related data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDeleteCourse}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </>
    );
}
