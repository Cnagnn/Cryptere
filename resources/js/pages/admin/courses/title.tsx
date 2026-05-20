import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Archive,
    ArrowRightLeft,
    BadgeCheck,
    CircleDashed,
    Eye,
    History,
    MoreHorizontal,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
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
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
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
import { restore as restoreVersion } from '@/routes/admin/versions';
import { show as coursesShow } from '@/routes/courses';
import type { Paginated } from '@/types';
import type { CourseRow } from '@/types/course-management';

type ContentStatus = 'draft' | 'published' | 'archived';

type VersionHistoryItem = {
    id: number;
    version_number: number;
    changed_fields: string[];
    change_summary: string | null;
    creator_name: string | null;
    created_at: string | null;
    restored_at: string | null;
};

function formatVersionDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function StatusBadge({
    status,
    className,
}: {
    status: ContentStatus;
    className?: string;
}) {
    const config = {
        draft: {
            icon: CircleDashed,
            label: 'Draft',
            variant: 'outline' as const,
            iconClass: 'text-amber-500',
        },
        published: {
            icon: BadgeCheck,
            label: 'Published',
            variant: 'outline' as const,
            iconClass: 'text-emerald-500',
        },
        archived: {
            icon: Archive,
            label: 'Archived',
            variant: 'destructive' as const,
            iconClass: 'text-red-500',
        },
    };

    const { icon: Icon, label, variant, iconClass } = config[status];

    return (
        <Badge variant={variant} className={className}>
            <Icon className={iconClass} />
            {label}
        </Badge>
    );
}

type Props = {
    courses: Paginated<CourseRow>;
    versionHistories: Record<number, VersionHistoryItem[]>;
};

export default function AdminCoursesTitle({
    courses,
    versionHistories,
}: Props) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [deletingCourse, setDeletingCourse] = useState<CourseRow | null>(
        null,
    );
    const [restoreTarget, setRestoreTarget] =
        useState<VersionHistoryItem | null>(null);
    const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null);
    const [courseFilterValue, setCourseFilterValue] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSavingCourse, setIsSavingCourse] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
        coverImage: null as File | null,
    });
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
        null,
    );
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
        setIsDirty(false);
        setCoverImagePreview(null);
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
        setIsDirty(false);
        setCoverImagePreview(null);
        setIsCreateDialogOpen(true);
    };

    const filteredCourses = useMemo(() => {
        const keyword = courseFilterValue.trim().toLowerCase();

        if (keyword === '') {
            return courses.data;
        }

        return courses.data.filter((course) => {
            return (
                course.title.toLowerCase().includes(keyword) ||
                course.summary.toLowerCase().includes(keyword)
            );
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

    const submitRestoreVersion = () => {
        if (!restoreTarget) {
            return;
        }

        router.post(
            restoreVersion.url({ version: restoreTarget.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Version ${restoreTarget.version_number} restored.`,
                    );
                    setRestoreTarget(null);
                },
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(messages || 'Failed to restore version.');
                },
            },
        );
    };

    const columns = useMemo<ColumnDef<CourseRow>[]>(
        () => [
            {
                accessorKey: 'title',
                header: 'Title',
                cell: ({ row }) => (
                    <div className="max-w-sm min-w-48 text-left">
                        <p
                            className="truncate font-medium"
                            title={row.original.title}
                        >
                            {row.original.title}
                        </p>
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const status =
                        row.original.status ||
                        (row.original.is_published ? 'published' : 'draft');

                    return (
                        <div className="flex justify-center">
                            <StatusBadge status={status} />
                        </div>
                    );
                },
            },
            {
                accessorKey: 'version',
                header: 'Version',
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.original.version
                            ? `v${row.original.version}`
                            : '—'}
                    </div>
                ),
            },
            {
                accessorKey: 'published_by_name',
                header: 'Published By',
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.original.published_by_name || '—'}
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
                    const date = row.original.created_at
                        ? new Date(row.original.created_at)
                        : null;

                    if (!date) {
                        return '—';
                    }

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
                    const date = row.original.updated_at
                        ? new Date(row.original.updated_at)
                        : null;

                    if (!date) {
                        return '—';
                    }

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
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                >
                                    <MoreHorizontal />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel className="text-muted-foreground">
                                        Actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <ArrowRightLeft data-icon="inline-start" />
                                            Status
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuItem
                                                disabled={
                                                    row.original.is_published
                                                }
                                                onClick={() =>
                                                    router.patch(
                                                        coursesTogglePublish.url(
                                                            {
                                                                course: row
                                                                    .original
                                                                    .id,
                                                            },
                                                        ),
                                                        { is_published: true },
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                <BadgeCheck data-icon="inline-start" />
                                                Publish
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                disabled={
                                                    !row.original.is_published
                                                }
                                                onClick={() =>
                                                    router.patch(
                                                        coursesTogglePublish.url(
                                                            {
                                                                course: row
                                                                    .original
                                                                    .id,
                                                            },
                                                        ),
                                                        { is_published: false },
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                <CircleDashed data-icon="inline-start" />
                                                Draft
                                            </DropdownMenuItem>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            openEditDialog(row.original)
                                        }
                                    >
                                        <Pencil data-icon="inline-start" />
                                        Edit
                                    </DropdownMenuItem>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <DropdownMenuItem
                                                onSelect={(event) =>
                                                    event.preventDefault()
                                                }
                                            >
                                                <History data-icon="inline-start" />
                                                History
                                            </DropdownMenuItem>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Version History
                                                </DialogTitle>
                                                <DialogDescription>
                                                    {row.original.title}
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="max-h-96 space-y-3 overflow-y-auto">
                                                {(
                                                    versionHistories[
                                                        row.original.id
                                                    ] ?? []
                                                ).length === 0 ? (
                                                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                                        No version history for
                                                        this item yet.
                                                    </div>
                                                ) : (
                                                    (
                                                        versionHistories[
                                                            row.original.id
                                                        ] ?? []
                                                    ).map((version) => (
                                                        <div
                                                            key={version.id}
                                                            className="rounded-lg border p-4"
                                                        >
                                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                                <div className="space-y-2">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <Badge variant="outline">
                                                                            v
                                                                            {
                                                                                version.version_number
                                                                            }
                                                                        </Badge>
                                                                        {version.restored_at ? (
                                                                            <Badge variant="secondary">
                                                                                Restored
                                                                            </Badge>
                                                                        ) : null}
                                                                    </div>
                                                                    <p className="text-sm font-medium">
                                                                        {version.change_summary ||
                                                                            'Content changes'}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {version.creator_name ||
                                                                            'System'}{' '}
                                                                        -{' '}
                                                                        {formatVersionDate(
                                                                            version.created_at,
                                                                        )}
                                                                    </p>
                                                                    {version
                                                                        .changed_fields
                                                                        .length >
                                                                    0 ? (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {version.changed_fields.map(
                                                                                (
                                                                                    field,
                                                                                ) => (
                                                                                    <Badge
                                                                                        key={
                                                                                            field
                                                                                        }
                                                                                        variant="outline"
                                                                                    >
                                                                                        {
                                                                                            field
                                                                                        }
                                                                                    </Badge>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        setRestoreTarget(
                                                                            version,
                                                                        )
                                                                    }
                                                                >
                                                                    <RotateCcw data-icon="inline-start" />
                                                                    Restore
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <DialogFooter className="mt-2">
                                                <DialogClose asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                    >
                                                        Close
                                                    </Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setDeletingCourse(row.original)
                                        }
                                    >
                                        <Trash2 data-icon="inline-start" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() =>
                                        router.get(
                                            coursesShow.url(row.original.slug),
                                        )
                                    }
                                >
                                    <Eye data-icon="inline-start" />
                                    View Course
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            },
        ],
        [versionHistories],
    );

    const handlePageChange = (nextPage: number): void => {
        router.get(
            adminCoursesIndex.url({
                query: {
                    section: 'catalog',
                    page: nextPage,
                    per_page: courses.per_page,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePageSizeChange = (nextPageSize: number): void => {
        router.get(
            adminCoursesIndex.url({
                query: { section: 'catalog', page: 1, per_page: nextPageSize },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <>
            <div className="flex flex-col gap-6 px-4 pt-3 pb-4">
                <header className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                        <TypographyH1>Title Management</TypographyH1>
                        <TypographyMuted>
                            Manage course titles, publication status, and high-level metadata.
                        </TypographyMuted>
                    </div>
                    <div className="flex shrink-0 items-center justify-end gap-2">
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <div className="w-full sm:w-80">
                                <Input
                                    id="course-search"
                                    placeholder="Search Courses..."
                                    value={courseFilterValue}
                                    onChange={(event) =>
                                        setCourseFilterValue(event.target.value)
                                    }
                                />
                            </div>
                            <Dialog
                                open={isCreateDialogOpen}
                                onOpenChange={(open) => {
                                    if (!open && isDirty && !isSavingCourse) {
                                        if (
                                            !confirm(
                                                'Changes not saved. Close dialog?',
                                            )
                                        ) {
                                            return;
                                        }
                                    }

                                    setIsCreateDialogOpen(open);

                                    if (!open && !isSavingCourse) {
                                        resetCourseDialogState();
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        type="button"
                                        className="sm:shrink-0"
                                        onClick={openCreateDialog}
                                    >
                                        <Plus data-icon="inline-start" />
                                        Create Course
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-sm">
                                    <form
                                        encType="multipart/form-data"
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            const form = event.currentTarget;
                                            const payload = new FormData(form);

                                            const requestUrl = isEditMode
                                                ? coursesUpdate.url({
                                                      course: editingCourse.id,
                                                  })
                                                : coursesStore.url();

                                            if (isEditMode) {
                                                payload.append(
                                                    '_method',
                                                    'PATCH',
                                                );
                                            }

                                            router.post(requestUrl, payload, {
                                                forceFormData: true,
                                                preserveScroll: true,
                                                preserveState: true,
                                                onStart: () => {
                                                    setIsSavingCourse(true);
                                                },
                                                onSuccess: () => {
                                                    toast.success(
                                                        isEditMode
                                                            ? 'Course updated successfully.'
                                                            : 'Course created successfully.',
                                                    );
                                                    resetCourseDialogState();
                                                    setIsCreateDialogOpen(
                                                        false,
                                                    );
                                                },
                                                onError: (formErrors) => {
                                                    const messages =
                                                        Object.values(
                                                            formErrors,
                                                        )
                                                            .flat()
                                                            .join(', ');
                                                    toast.error(
                                                        messages ||
                                                            'Failed to save course.',
                                                    );
                                                },
                                                onFinish: () => {
                                                    setIsSavingCourse(false);
                                                },
                                            });
                                        }}
                                    >
                                        <DialogHeader>
                                            <DialogTitle>
                                                {isEditMode
                                                    ? 'Edit Course'
                                                    : 'Create New Course'}
                                            </DialogTitle>
                                            <DialogDescription>
                                                {isEditMode
                                                    ? 'Update Course title, summary, and cover image.'
                                                    : 'Add a new course title and summary.'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <FieldGroup className="mt-4">
                                            <Field
                                                data-invalid={
                                                    titleHasError || undefined
                                                }
                                            >
                                                <FieldLabel htmlFor="course-title">
                                                    Title{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <Input
                                                    id="course-title"
                                                    name="title"
                                                    placeholder="Enter course title"
                                                    value={courseForm.title}
                                                    onChange={(event) => {
                                                        setCourseForm(
                                                            (current) => ({
                                                                ...current,
                                                                title: event
                                                                    .target
                                                                    .value,
                                                            }),
                                                        );
                                                        setIsDirty(true);
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
                                            <Field
                                                data-invalid={
                                                    descriptionHasError ||
                                                    undefined
                                                }
                                            >
                                                <FieldLabel htmlFor="course-description">
                                                    Description{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <Textarea
                                                    id="course-description"
                                                    name="description"
                                                    placeholder="Enter course description"
                                                    value={
                                                        courseForm.description
                                                    }
                                                    onChange={(event) => {
                                                        setCourseForm(
                                                            (current) => ({
                                                                ...current,
                                                                description:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        );
                                                        setIsDirty(true);
                                                    }}
                                                    aria-invalid={
                                                        descriptionHasError
                                                    }
                                                    required
                                                    rows={4}
                                                />
                                                {descriptionHasError && (
                                                    <FieldDescription className="text-destructive">
                                                        {errors.description}
                                                    </FieldDescription>
                                                )}
                                            </Field>
                                            <Field
                                                data-invalid={
                                                    coverImageHasError ||
                                                    undefined
                                                }
                                            >
                                                <FieldLabel htmlFor="course-picture">
                                                    Upload Cover{' '}
                                                    <span className="text-destructive"></span>
                                                </FieldLabel>
                                                <Input
                                                    id="course-picture"
                                                    name="cover_image"
                                                    type="file"
                                                    accept="image/*"
                                                    aria-invalid={
                                                        coverImageHasError
                                                    }
                                                    onChange={(event) => {
                                                        const file =
                                                            event.target
                                                                .files?.[0] ??
                                                            null;
                                                        setCourseForm(
                                                            (current) => ({
                                                                ...current,
                                                                coverImage:
                                                                    file,
                                                            }),
                                                        );
                                                        setIsDirty(true);

                                                        // Generate preview
                                                        if (file) {
                                                            const reader =
                                                                new FileReader();
                                                            reader.onloadend =
                                                                () => {
                                                                    setCoverImagePreview(
                                                                        reader.result as string,
                                                                    );
                                                                };
                                                            reader.readAsDataURL(
                                                                file,
                                                            );
                                                        } else {
                                                            setCoverImagePreview(
                                                                null,
                                                            );
                                                        }
                                                    }}
                                                />
                                                {coverImagePreview && (
                                                    <div className="mt-3">
                                                        <img
                                                            src={
                                                                coverImagePreview
                                                            }
                                                            alt="Preview"
                                                            className="h-32 w-full rounded-lg object-cover"
                                                        />
                                                    </div>
                                                )}
                                                {coverImageHasError && (
                                                    <FieldDescription className="text-destructive">
                                                        {errors.cover_image}
                                                    </FieldDescription>
                                                )}
                                                <FieldDescription>
                                                    {isEditMode
                                                        ? 'Leave blank to keep the current cover.'
                                                        : 'Leave blank to use the system default cover.'}
                                                </FieldDescription>
                                            </Field>
                                        </FieldGroup>
                                        <DialogFooter className="mt-6">
                                            <DialogClose asChild>
                                                <Button
                                                    variant="outline"
                                                    type="button"
                                                    disabled={isSavingCourse}
                                                >
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="submit"
                                                disabled={isSavingCourse}
                                            >
                                                {isSavingCourse && (
                                                    <Spinner data-icon="inline-start" />
                                                )}
                                                {isEditMode
                                                    ? 'Update Course'
                                                    : 'Save Draft'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
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
                                    <EmptyTitle>
                                        No course titles found
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        Try a different keyword.
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
                            This action will permanently delete this course and its
                            related data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDeleteCourse}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={restoreTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setRestoreTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore version?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The current version will be saved as a snapshot
                            before the item is restored to version{' '}
                            {restoreTarget?.version_number}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={submitRestoreVersion}>
                            Restore
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
