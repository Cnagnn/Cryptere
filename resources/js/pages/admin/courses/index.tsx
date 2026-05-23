import { router, usePage, Head } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Archive, ArrowRightLeft, BadgeCheck, CircleDashed, Eye, GripVertical, History, MoreHorizontal, Pencil, Plus, RotateCcw, Search, Trash2, Check, ChevronsUpDown, BookOpen, CircleHelp, Download, Play, FileText, Layers3 } from 'lucide-react';
import { useMemo, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { dashboard } from '@/routes';
import { destroy as coursesDestroy, index as adminCoursesIndex, reorder as coursesReorder, store as coursesStore, togglePublish as coursesTogglePublish, update as coursesUpdate } from '@/routes/admin/courses';
import { destroy as lessonsDestroy, reorder as lessonsReorder, store as lessonsStore, update as lessonsUpdate } from '@/routes/admin/courses/lessons';
import { destroy as tasksDestroy, reorder as tasksReorder, store as tasksStore, update as tasksUpdate } from '@/routes/admin/courses/tasks';
import { show as coursesShow } from '@/routes/courses';
import type { Paginated, AdminAssessment, AdminAssessmentQuestion, BloomLevel, QuestionBank } from '@/types';
import type { CourseRow, LessonRow, TaskRow } from '@/types/course-management';
import AdminCoursesAssessment from './assessment';

// ============================================================
// AdminCoursesTitle (was title.tsx)
// ============================================================
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

type TitleProps = {
    courses: Paginated<CourseRow>;
    versionHistories: Record<number, VersionHistoryItem[]>;
    tabsList?: ReactNode;
    isLoading?: boolean;
    search?: string;
};

function AdminCoursesTitle({
    courses,
    versionHistories,
    tabsList,
    isLoading = false,
    search,
}: TitleProps) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [deletingCourse, setDeletingCourse] = useState<CourseRow | null>(
        null,
    );
    const [restoreTarget, setRestoreTarget] =
        useState<VersionHistoryItem | null>(null);
    const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null);
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
    const [dragHandleActiveRowId, setDragHandleActiveRowId] = useState<
        string | null
    >(null);
    const titleHasError = Boolean(errors.title);
    const descriptionHasError = Boolean(errors.description);
    const coverImageHasError = Boolean(errors.cover_image);
    const isEditMode = editingCourse !== null;

    const handleSearch = useCallback((value: string) => {
        router.get(
            adminCoursesIndex.url(),
            { search: value, page: 1, section: 'catalog' },
            { preserveState: true, preserveScroll: true }
        );
    }, []);

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
            `/admin/versions/${restoreTarget.id}/restore`,
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
                id: 'drag-handle',
                header: '',
                size: 40,
                cell: () => (
                    <div
                        data-row-drag-handle="true"
                        className="flex cursor-grab items-center justify-center active:cursor-grabbing"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                ),
            },
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

    const reorderRows = (sourceRowId: string, targetRowId: string): void => {
        const sourceId = Number(sourceRowId);
        const targetId = Number(targetRowId);

        if (Number.isNaN(sourceId) || Number.isNaN(targetId)) {
            return;
        }

        router.post(
            coursesReorder.url(),
            { source_id: sourceId, target_id: targetId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Course order updated.');
                },
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(messages || 'Failed to reorder courses.');
                },
            },
        );
    };

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <TypographyH1>Title Management</TypographyH1>
                    {tabsList}
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between -mt-3">
                    <TypographyMuted className="text-base md:text-sm">
                        Manage course titles, publication status, and high-level metadata.
                    </TypographyMuted>
                    <div className="flex shrink-0 items-center gap-2">
                        <Input
                            id="course-search"
                            className="w-full sm:w-64"
                            placeholder="Search Courses..."
                            defaultValue={search || ''}
                            onChange={(event) =>
                                handleSearch(event.target.value)
                            }
                        />
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
                                        Create
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

                <section className="grid gap-4">
                    <div className="flex flex-col gap-4">
                        {isLoading ? (
                            <Skeleton className="h-150 w-full rounded-lg" />
                        ) : courses.data.length === 0 ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <Search />
                                    </EmptyMedia>
                                    <EmptyTitle>
                                        No course titles found
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        Create your first course title to get started.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : courses.data.length === 0 && search ? (
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
                                data={courses.data}
                                centered
                                showFilterInput={false}
                                showColumnToggle={false}
                                showPageInfo={false}
                                enableDefaultIdSort={false}
                                getRowDataId={(row) => String(row.id)}
                                dragHandleActiveRowId={dragHandleActiveRowId}
                                onRowDragStart={(rowId) => setDragHandleActiveRowId(rowId)}
                                onRowDrop={reorderRows}
                                onRowDragEnd={() => setDragHandleActiveRowId(null)}
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


// ============================================================
// AdminCoursesTopic (was topic.tsx)
// ============================================================


type TopicProps = {
    lessons: Paginated<LessonRow>;
    courseOptions: Pick<CourseRow, 'id' | 'title'>[];
    selectedCourseId: number;
    versionHistories: Record<number, VersionHistoryItem[]>;
    tabsList?: ReactNode;
    isLoading?: boolean;
    search?: string;
};

function AdminCoursesTopic({
    lessons,
    courseOptions,
    selectedCourseId,
    versionHistories,
    tabsList,
    isLoading = false,
    search,
}: TopicProps) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [rows, setRows] = useState<LessonRow[]>(() => lessons.data);
    const [prevLessonsData, setPrevLessonsData] = useState(lessons.data);

    if (prevLessonsData !== lessons.data) {
        setPrevLessonsData(lessons.data);
        setRows(lessons.data);
    }

    const [dragHandleActiveRowId, setDragHandleActiveRowId] = useState<
        string | null
    >(null);
    const [restoreTarget, setRestoreTarget] =
        useState<VersionHistoryItem | null>(null);
    const [createTopicDialogOpen, setCreateTopicDialogOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState<LessonRow | null>(null);
    const [isSavingTopic, setIsSavingTopic] = useState(false);
    const [courseComboboxOpen, setCourseComboboxOpen] = useState(false);
    const [topicForm, setTopicForm] = useState({
        course_id: selectedCourseId,
        title: '',
        description: '',
    });
    const isEditMode = editingTopic !== null;

    const topicCourseHasError = Boolean(errors.course_id);
    const topicTitleHasError = Boolean(errors.title);
    const topicDescriptionHasError = Boolean(errors.description);

    const resetTopicForm = () => {
        setEditingTopic(null);
        setTopicForm({
            course_id: selectedCourseId,
            title: '',
            description: '',
        });
    };

    const openEditTopicDialog = (topic: LessonRow) => {
        setEditingTopic(topic);
        setTopicForm({
            course_id: topic.course_id,
            title: topic.title,
            description: topic.description,
        });
        setCreateTopicDialogOpen(true);
    };

    const reorderRows = (sourceRowId: string, targetRowId: string): void => {
        const sourceId = Number(sourceRowId);
        const targetId = Number(targetRowId);
        router.post(
            lessonsReorder.url(),
            { source_id: sourceId, target_id: targetId },
            { preserveScroll: true, onSuccess: () => toast.success('Order updated.') }
        );
    };

    const updateLessonStatus = (
        lesson: LessonRow,
        status: 'draft' | 'published',
    ) => {
        router.patch(
            lessonsUpdate.url({ lesson: lesson.id }),
            {
                title: lesson.title,
                description: lesson.description,
                course_id: lesson.course_id,
                status,
            },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        status === 'published'
                            ? 'Topic published.'
                            : 'Topic changed to draft.',
                    ),
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(messages || 'Failed to change topic status.');
                },
            },
        );
    };

    const submitRestoreVersion = () => {
        if (!restoreTarget) {
            return;
        }

        router.post(
            `/admin/versions/${restoreTarget.id}/restore`,
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

    const columns = useMemo<ColumnDef<LessonRow>[]>(
        () => [
            {
                id: 'drag-handle',
                header: '',
                size: 40,
                cell: () => (
                    <div
                        data-row-drag-handle="true"
                        className="flex cursor-grab items-center justify-center active:cursor-grabbing"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                ),
            },
            {
                accessorKey: 'title',
                header: 'Topic',
                cell: ({ row }) => (
                    <div className="text-left">
                        <p className="font-medium">{row.original.title}</p>
                    </div>
                ),
            },
            {
                accessorKey: 'course_title',
                header: 'Title',
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const status = row.original.status || 'draft';

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
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                        <ArrowRightLeft data-icon="inline-start" />
                                        Status
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        <DropdownMenuItem
                                            disabled={
                                                (row.original.status ||
                                                    'draft') === 'published'
                                            }
                                            onClick={() =>
                                                updateLessonStatus(
                                                    row.original,
                                                    'published',
                                                )
                                            }
                                        >
                                            <BadgeCheck data-icon="inline-start" />
                                            Publish
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            disabled={
                                                (row.original.status ||
                                                    'draft') === 'draft'
                                            }
                                            onClick={() =>
                                                updateLessonStatus(
                                                    row.original,
                                                    'draft',
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
                                        openEditTopicDialog(row.original)
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
                                    onClick={() => {
                                        router.delete(
                                            lessonsDestroy.url({
                                                lesson: row.original.id,
                                            }),
                                            {
                                                preserveScroll: true,
                                                onSuccess: () =>
                                                    toast.success(
                                                        'Topic deleted successfully.',
                                                    ),
                                                onError: (formErrors) => {
                                                    const messages =
                                                        Object.values(
                                                            formErrors,
                                                        )
                                                            .flat()
                                                            .join(', ');
                                                    toast.error(
                                                        messages ||
                                                            'Failed to delete topic.',
                                                    );
                                                },
                                            },
                                        );
                                    }}
                                >
                                    <Trash2 data-icon="inline-start" />
                                    Delete
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() =>
                                        router.get(
                                            adminCoursesIndex.url({
                                                query: {
                                                    section: 'task',
                                                    course_id:
                                                        row.original.course_id,
                                                    lesson_id: row.original.id,
                                                },
                                            }),
                                        )
                                    }
                                >
                                    <Eye data-icon="inline-start" />
                                    View Topic
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
                    section: 'lesson',
                    course_id: selectedCourseId,
                    page: nextPage,
                    per_page: lessons.per_page,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePageSizeChange = (nextPageSize: number): void => {
        router.get(
            adminCoursesIndex.url({
                query: {
                    section: 'lesson',
                    course_id: selectedCourseId,
                    page: 1,
                    per_page: nextPageSize,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <TypographyH1>Topic Management</TypographyH1>
                {tabsList}
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between -mt-3">
                <TypographyMuted className="text-base md:text-sm">
                    Manage topics for each course.
                </TypographyMuted>
                <div className="flex shrink-0 items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between sm:w-72"
                                >
                                    <span className="truncate">
                                        {(() => {
                                            const course = courseOptions.find(
                                                (c) =>
                                                    c.id === selectedCourseId,
                                            );

                                            if (course) {
                                                return course.title;
                                            }

                                            return 'Select Course...';
                                        })()}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search courses..." />
                                    <CommandList className="max-h-none overflow-y-hidden">
                                        <CommandEmpty>
                                            No results found.
                                        </CommandEmpty>
                                        <ScrollArea className="h-64">
                                            <CommandGroup>
                                                {courseOptions.map((course) => (
                                                    <CommandItem
                                                        key={course.id}
                                                        value={course.title}
                                                        onSelect={() => {
                                                            const newCourseId =
                                                                selectedCourseId ===
                                                                course.id
                                                                    ? 0
                                                                    : course.id;
                                                            router.get(
                                                                adminCoursesIndex.url(
                                                                    {
                                                                        query: {
                                                                            section:
                                                                                'lesson',
                                                                            ...(newCourseId >
                                                                            0
                                                                                ? {
                                                                                      course_id:
                                                                                          newCourseId,
                                                                                  }
                                                                                : {}),
                                                                            page: 1,
                                                                        },
                                                                    },
                                                                ),
                                                                {},
                                                                {
                                                                    preserveState: true,
                                                                    preserveScroll: true,
                                                                },
                                                            );
                                                        }}
                                                    >
                                                        {course.title}
                                                        <Check
                                                            className={`ml-auto h-4 w-4 ${selectedCourseId === course.id ? 'opacity-100' : 'opacity-0'}`}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </ScrollArea>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <div className="w-full sm:w-80">
                            <Input
                                id="topic-search"
                                placeholder="Search Topics..."
                                defaultValue={search || ''}
                                onChange={(event) => {
                                    router.get(
                                        adminCoursesIndex.url(),
                                        { search: event.target.value, page: 1, section: 'topics' },
                                        { preserveState: true, preserveScroll: true }
                                    );
                                }}
                            />
                        </div>

                        <Dialog
                            open={createTopicDialogOpen}
                            onOpenChange={(open) => {
                                setCreateTopicDialogOpen(open);

                                if (!open && !isSavingTopic) {
                                    resetTopicForm();
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        resetTopicForm();
                                        setCreateTopicDialogOpen(true);
                                    }}
                                >
                                    <Plus data-icon="inline-start" />
                                    Create
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-sm">
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        const payload = new FormData();
                                        payload.append(
                                            'course_id',
                                            String(topicForm.course_id),
                                        );
                                        payload.append(
                                            'title',
                                            topicForm.title,
                                        );
                                        payload.append(
                                            'description',
                                            topicForm.description,
                                        );

                                        const requestUrl = isEditMode
                                            ? lessonsUpdate.url({
                                                  lesson: editingTopic.id,
                                              })
                                            : lessonsStore.url();

                                        if (isEditMode) {
                                            payload.append('_method', 'PATCH');
                                        }

                                        router.post(requestUrl, payload, {
                                            forceFormData: true,
                                            preserveScroll: true,
                                            preserveState: true,
                                            onStart: () =>
                                                setIsSavingTopic(true),
                                            onSuccess: () => {
                                                toast.success(
                                                    isEditMode
                                                        ? 'Topic updated successfully.'
                                                        : 'Topic created successfully.',
                                                );
                                                resetTopicForm();
                                                setCreateTopicDialogOpen(false);
                                            },
                                            onError: (formErrors) => {
                                                const messages = Object.values(
                                                    formErrors,
                                                )
                                                    .flat()
                                                    .join(', ');
                                                toast.error(
                                                    messages ||
                                                        'Failed to save topic.',
                                                );
                                            },
                                            onFinish: () =>
                                                setIsSavingTopic(false),
                                        });
                                    }}
                                >
                                    <DialogHeader>
                                        <DialogTitle>
                                            {isEditMode
                                                ? 'Edit Topic'
                                                : 'Create New Topic'}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {isEditMode
                                                ? 'Update topic title and description.'
                                                : 'Add a new topic for the selected course title.'}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <FieldGroup className="mt-4">
                                        <Field
                                            data-invalid={
                                                topicCourseHasError || undefined
                                            }
                                        >
                                            <FieldLabel htmlFor="topic-course">
                                                Course{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Popover
                                                open={courseComboboxOpen}
                                                onOpenChange={
                                                    setCourseComboboxOpen
                                                }
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="topic-course"
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                        aria-invalid={
                                                            topicCourseHasError
                                                        }
                                                    >
                                                        <span className="truncate">
                                                            {(() => {
                                                                const course =
                                                                    courseOptions.find(
                                                                        (c) =>
                                                                            c.id ===
                                                                            topicForm.course_id,
                                                                    );

                                                                if (course) {
                                                                    return course.title;
                                                                }

                                                                return 'Select Course...';
                                                            })()}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="p-0"
                                                    align="start"
                                                    style={{
                                                        width: 'var(--radix-popover-trigger-width)',
                                                    }}
                                                >
                                                    <Command>
                                                        <CommandInput placeholder="Search courses..." />
                                                        <CommandList
                                                            style={{
                                                                maxHeight:
                                                                    '16rem',
                                                                overflowY:
                                                                    'auto',
                                                            }}
                                                        >
                                                            <CommandEmpty>
                                                                No results
                                                                found.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {courseOptions.map(
                                                                    (
                                                                        course,
                                                                    ) => (
                                                                        <CommandItem
                                                                            key={
                                                                                course.id
                                                                            }
                                                                            value={
                                                                                course.title
                                                                            }
                                                                            onSelect={() => {
                                                                                setTopicForm(
                                                                                    (
                                                                                        current,
                                                                                    ) => ({
                                                                                        ...current,
                                                                                        course_id:
                                                                                            course.id,
                                                                                    }),
                                                                                );
                                                                                setCourseComboboxOpen(
                                                                                    false,
                                                                                );
                                                                            }}
                                                                        >
                                                                            {
                                                                                course.title
                                                                            }
                                                                            <Check
                                                                                className={`ml-auto h-4 w-4 ${
                                                                                    topicForm.course_id ===
                                                                                    course.id
                                                                                        ? 'opacity-100'
                                                                                        : 'opacity-0'
                                                                                }`}
                                                                            />
                                                                        </CommandItem>
                                                                    ),
                                                                )}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {topicCourseHasError && (
                                                <FieldDescription className="text-destructive">
                                                    {errors.course_id}
                                                </FieldDescription>
                                            )}
                                        </Field>

                                        <Field
                                            className="gap-2"
                                            data-invalid={
                                                topicTitleHasError || undefined
                                            }
                                        >
                                            <FieldLabel htmlFor="topic-title">
                                                Title{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Input
                                                id="topic-title"
                                                name="title"
                                                placeholder="Enter topic title"
                                                value={topicForm.title}
                                                onChange={(event) =>
                                                    setTopicForm((current) => ({
                                                        ...current,
                                                        title: event.target
                                                            .value,
                                                    }))
                                                }
                                                aria-invalid={
                                                    topicTitleHasError
                                                }
                                                required
                                            />
                                            {topicTitleHasError && (
                                                <FieldDescription className="text-destructive">
                                                    {errors.title}
                                                </FieldDescription>
                                            )}
                                        </Field>

                                        <Field
                                            className="gap-2"
                                            data-invalid={
                                                topicDescriptionHasError ||
                                                undefined
                                            }
                                        >
                                            <FieldLabel htmlFor="topic-description">
                                                Description{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Textarea
                                                id="topic-description"
                                                name="description"
                                                placeholder="Enter topic description"
                                                value={topicForm.description}
                                                onChange={(event) =>
                                                    setTopicForm((current) => ({
                                                        ...current,
                                                        description:
                                                            event.target.value,
                                                    }))
                                                }
                                                aria-invalid={
                                                    topicDescriptionHasError
                                                }
                                                rows={4}
                                                required
                                            />
                                            {topicDescriptionHasError && (
                                                <FieldDescription className="text-destructive">
                                                    {errors.description}
                                                </FieldDescription>
                                            )}
                                        </Field>
                                    </FieldGroup>

                                    <DialogFooter className="mt-6">
                                        <DialogClose asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={isSavingTopic}
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            type="submit"
                                            disabled={isSavingTopic}
                                        >
                                            {isSavingTopic && (
                                                <Spinner data-icon="inline-start" />
                                            )}
                                            Save changes
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                </div>
            </div>

            <section className="grid gap-4">
                <div className="flex flex-col gap-4">
                    {isLoading ? (
                        <Skeleton className="h-150 w-full rounded-lg" />
                    ) : lessons.data.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Search />
                                </EmptyMedia>
                                <EmptyTitle>
                                    No topics found
                                </EmptyTitle>
                                <EmptyDescription>
                                    Create your first topic to get started.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : rows.length === 0 && search ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Search />
                                </EmptyMedia>
                                <EmptyTitle>
                                    No topics found
                                </EmptyTitle>
                                <EmptyDescription>
                                    Try another course title or keyword.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={rows}
                            centered
                            showFilterInput={false}
                            showColumnToggle={false}
                            showPageInfo={false}
                            enableDefaultIdSort={false}
                            getRowDataId={(row) => String(row.id)}
                            dragHandleActiveRowId={dragHandleActiveRowId}
                            onRowDragStart={(rowId) => setDragHandleActiveRowId(rowId)}
                            onRowDrop={(sourceRowId, targetRowId) => {
                                reorderRows(sourceRowId, targetRowId);
                            }}
                            onRowDragEnd={() => {
                                setDragHandleActiveRowId(null);
                            }}
                            page={lessons.current_page}
                            pageCount={lessons.last_page}
                            pageSize={lessons.per_page}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                            footerInfo={`Showing ${lessons.from ?? 0} - ${lessons.to ?? 0} of ${lessons.total} Topics`}
                        />
                    )}
                </div>
            </section>
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
        </div>
    );
}


// ============================================================
// AdminCoursesTask (was task.tsx)
// ============================================================


type LessonOption = { id: number; course_id: number; title: string };

type TaskProps = {
    tasks: Paginated<TaskRow>;
    lessons: Paginated<LessonRow>;
    allLessons: LessonOption[];
    courseOptions: Pick<CourseRow, 'id' | 'title'>[];
    selectedCourseId: number;
    selectedLessonId: number;
    versionHistories: Record<number, VersionHistoryItem[]>;
    tabsList?: ReactNode;
    isLoading?: boolean;
    search?: string;
};

type QuizQuestion = {
    question: string;
    options: [string, string, string, string];
    correct_option: number;
    explanation: string;
};

const QUIZ_IMPORT_TEMPLATE_HEADER =
    'question,option_a,option_b,option_c,option_d,correct_option,explanation';
const QUIZ_IMPORT_TEMPLATE_ROW =
    'What does CIA stand for?,Confidentiality,Integrity,Availability,All of the above,3,Core information security triad.';

function downloadQuizTemplate(kind: 'csv' | 'xlsx' | 'xls'): void {
    const delimiter = kind === 'xls' ? '\t' : ',';
    const extension = kind;
    const fileName = `quiz-template.${extension}`;
    const content = `${QUIZ_IMPORT_TEMPLATE_HEADER.replaceAll(',', delimiter)}\n${QUIZ_IMPORT_TEMPLATE_ROW.replaceAll(',', delimiter)}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function normalizeDelimiter(text: string): ',' | ';' | '\t' {
    const firstLine =
        text.split(/\r?\n/).find((line) => line.trim() !== '') ?? '';

    if (firstLine.includes('\t')) {
        return '\t';
    }

    if (firstLine.includes(';')) {
        return ';';
    }

    return ',';
}

function parseQuizImportText(text: string): QuizQuestion[] {
    const delimiter = normalizeDelimiter(text);
    const rows = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line !== '');

    if (rows.length < 2) {
        return [];
    }

    const header = rows[0]
        .split(delimiter)
        .map((column) => column.trim().toLowerCase());
    const requiredColumns = [
        'question',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'correct_option',
    ];
    const missingColumn = requiredColumns.find(
        (column) => !header.includes(column),
    );

    if (missingColumn) {
        throw new Error(
            'Template header does not match. Use the downloaded template.',
        );
    }

    const getIndex = (column: string) => header.indexOf(column);

    return rows
        .slice(1)
        .map((row) => {
            const columns = row.split(delimiter).map((column) => column.trim());
            const rawCorrectOption = Number(
                columns[getIndex('correct_option')] ?? 0,
            );
            const normalizedCorrectOption = Number.isNaN(rawCorrectOption)
                ? 0
                : rawCorrectOption > 0
                  ? rawCorrectOption - 1
                  : rawCorrectOption;

            return {
                question: columns[getIndex('question')] ?? '',
                options: [
                    columns[getIndex('option_a')] ?? '',
                    columns[getIndex('option_b')] ?? '',
                    columns[getIndex('option_c')] ?? '',
                    columns[getIndex('option_d')] ?? '',
                ] as [string, string, string, string],
                correct_option: Math.min(
                    Math.max(normalizedCorrectOption, 0),
                    3,
                ),
                explanation: columns[getIndex('explanation')] ?? '',
            };
        })
        .filter((row) => row.question !== '');
}

function AdminCoursesTask({
    tasks,
    allLessons,
    courseOptions,
    selectedCourseId,
    selectedLessonId,
    versionHistories,
    tabsList,
    isLoading = false,
    search,
}: TaskProps) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [rows, setRows] = useState<TaskRow[]>(() => tasks.data);
    const [prevTasksData, setPrevTasksData] = useState(tasks.data);

    if (prevTasksData !== tasks.data) {
        setPrevTasksData(tasks.data);
        setRows(tasks.data);
    }

    const [dragHandleActiveRowId, setDragHandleActiveRowId] = useState<
        string | null
    >(null);
    const [restoreTarget, setRestoreTarget] =
        useState<VersionHistoryItem | null>(null);
    const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
    const [isSavingTask, setIsSavingTask] = useState(false);
    const isEditMode = editingTask !== null;
    const [topicComboboxOpen, setTopicComboboxOpen] = useState(false);
    const [quizImportFileName, setQuizImportFileName] = useState('');
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

    // Question editor state
    const [questionEditorOpen, setQuestionEditorOpen] = useState(false);
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<
        number | null
    >(null);
    const [questionForm, setQuestionForm] = useState<QuizQuestion>({
        question: '',
        options: ['', '', '', ''],
        correct_option: 0,
        explanation: '',
    });

    const lessonOptions = useMemo(() => {
        if (selectedCourseId === 0) {
            return allLessons;
        }

        return allLessons.filter(
            (lesson) => lesson.course_id === selectedCourseId,
        );
    }, [allLessons, selectedCourseId]);

    const [taskForm, setTaskForm] = useState({
        lesson_id: selectedLessonId || lessonOptions[0]?.id || 0,
        title: '',
        description: '',
        type: 'video' as 'video' | 'read' | 'quiz',
        video_url: '',
        prerequisite_task_id: '',
        status: 'draft' as 'draft' | 'published' | 'archived',
        document: null as File | null,
    });

    const taskTitleHasError = Boolean(errors.title);
    const taskDescriptionHasError = Boolean(errors.description);
    const taskLessonHasError = Boolean(errors.lesson_id);
    const taskTypeHasError = Boolean(errors.type);
    const taskVideoUrlHasError = Boolean(errors.video_url);
    const taskDocumentHasError = Boolean(errors.document);
    const taskQuizQuestionsHasError = Boolean(errors.quiz_questions);

    const resetTaskForm = () => {
        setEditingTask(null);
        setTaskForm({
            lesson_id: selectedLessonId || lessonOptions[0]?.id || 0,
            title: '',
            description: '',
            type: 'video',
            video_url: '',
            prerequisite_task_id: '',
            status: 'draft',
            document: null,
        });
        setQuizImportFileName('');
        setQuizQuestions([]);
    };

    const openEditTaskDialog = useCallback(
        (task: TaskRow) => {
            setEditingTask(task);
            setTaskForm({
                lesson_id: task.lesson_id,
                title: task.title,
                description: task.description,
                type: task.type as 'video' | 'read' | 'quiz',
                video_url: task.video_url ?? '',
                prerequisite_task_id:
                    task.prerequisite_task_id != null
                        ? String(task.prerequisite_task_id)
                        : '',
                status: task.status || 'draft',
                document: null,
            });
            setQuizImportFileName('');
            setQuizQuestions(
                (task.quiz_questions ?? []).map((q) => ({
                    question: q.question,
                    options: q.options as [string, string, string, string],
                    correct_option: q.correct_option,
                    explanation: q.explanation,
                })),
            );
            setCreateTaskDialogOpen(true);
        },
        [
            setCreateTaskDialogOpen,
            setEditingTask,
            setQuizImportFileName,
            setQuizQuestions,
            setTaskForm,
        ],
    );

    // Question editor handlers
    const openQuestionEditor = (index?: number) => {
        if (index !== undefined) {
            setEditingQuestionIndex(index);
            setQuestionForm(quizQuestions[index]);
        } else {
            setEditingQuestionIndex(null);
            setQuestionForm({
                question: '',
                options: ['', '', '', ''],
                correct_option: 0,
                explanation: '',
            });
        }

        setQuestionEditorOpen(true);
    };

    const saveQuestion = () => {
        if (!questionForm.question.trim()) {
            toast.error('Question cannot be empty.');

            return;
        }

        if (questionForm.options.some((opt) => !opt.trim())) {
            toast.error('All options must be filled.');

            return;
        }

        if (editingQuestionIndex !== null) {
            // Edit existing
            setQuizQuestions((prev) => {
                const updated = [...prev];
                updated[editingQuestionIndex] = questionForm;

                return updated;
            });
            toast.success('Question updated successfully.');
        } else {
            // Add new
            setQuizQuestions((prev) => [...prev, questionForm]);
            toast.success('Question added successfully.');
        }

        setQuestionEditorOpen(false);
    };

    const deleteQuestion = (index: number) => {
        if (!confirm('Delete this question?')) {
            return;
        }

        setQuizQuestions((prev) => prev.filter((_, i) => i !== index));
        toast.success('Question deleted successfully.');
    };

    const reorderRows = (sourceRowId: string, targetRowId: string) => {
        if (sourceRowId === targetRowId) {
            return;
        }

        const sourceId = Number(sourceRowId);
        const targetId = Number(targetRowId);
        router.post(
            tasksReorder.url(),
            { source_id: sourceId, target_id: targetId },
            { preserveScroll: true, onSuccess: () => toast.success('Order updated.') }
        );
    };

    const groupedLessons = useMemo(() => {
        const groups: Record<
            number,
            { course: string; lessons: LessonOption[] }
        > = {};

        allLessons.forEach((lesson) => {
            if (!groups[lesson.course_id]) {
                const course = courseOptions.find(
                    (c) => c.id === lesson.course_id,
                );
                groups[lesson.course_id] = {
                    course: course?.title || 'Unknown Course',
                    lessons: [],
                };
            }

            groups[lesson.course_id].lessons.push(lesson);
        });

        return groups;
    }, [allLessons, courseOptions]);

    const updateTaskStatus = (task: TaskRow, status: 'draft' | 'published') => {
        const payload = new FormData();
        payload.append('_method', 'PATCH');
        payload.append('title', task.title);
        payload.append('description', task.description);
        payload.append('type', task.type);
        payload.append('status', status);

        if (task.type === 'video' && task.video_url) {
            payload.append('video_url', task.video_url);
        }

        if (task.prerequisite_task_id != null) {
            payload.append(
                'prerequisite_task_id',
                String(task.prerequisite_task_id),
            );
        }

        if (task.type === 'quiz') {
            (task.quiz_questions ?? []).forEach((question, index) => {
                payload.append(
                    `quiz_questions[${index}][question]`,
                    question.question,
                );
                question.options.forEach((option, optionIndex) => {
                    payload.append(
                        `quiz_questions[${index}][options][${optionIndex}]`,
                        option,
                    );
                });
                payload.append(
                    `quiz_questions[${index}][correct_option]`,
                    String(question.correct_option),
                );
                payload.append(
                    `quiz_questions[${index}][explanation]`,
                    question.explanation,
                );
            });
        }

        router.post(tasksUpdate.url({ task: task.id }), payload, {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () =>
                toast.success(
                    status === 'published'
                        ? 'Task published.'
                        : 'Task changed to draft.',
                ),
            onError: (formErrors) => {
                const messages = Object.values(formErrors).flat().join(', ');
                toast.error(messages || 'Failed to change task status.');
            },
        });
    };

    const submitRestoreVersion = () => {
        if (!restoreTarget) {
            return;
        }

        router.post(
            `/admin/versions/${restoreTarget.id}/restore`,
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

    const columns = useMemo<ColumnDef<TaskRow>[]>(
        () => [
            {
                id: 'drag-handle',
                header: '',
                size: 40,
                cell: () => (
                    <div
                        data-row-drag-handle="true"
                        className="flex cursor-grab items-center justify-center active:cursor-grabbing"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                ),
            },
            {
                accessorKey: 'title',
                header: 'Task',
                cell: ({ row }) => (
                    <p className="text-left font-medium">
                        {row.original.title}
                    </p>
                ),
            },
            {
                accessorKey: 'type',
                header: 'Type',
                cell: ({ row }) => {
                    const type = row.original.type;
                    const config: Record<
                        string,
                        {
                            icon: ReactNode;
                            label: string;
                            className: string;
                        }
                    > = {
                        video: {
                            icon: <Play className="text-red-500" />,
                            label: 'Video',
                            className: '',
                        },
                        read: {
                            icon: <BookOpen className="text-emerald-500" />,
                            label: 'Dokumen',
                            className: '',
                        },
                        quiz: {
                            icon: <CircleHelp className="text-amber-500" />,
                            label: 'Kuis',
                            className: '',
                        },
                    };
                    const c = config[type] ?? {
                        icon: null,
                        label: type,
                        className: '',
                    };

                    return (
                        <div className="flex justify-center">
                            <Badge variant="outline" className={c.className}>
                                {c.icon}
                                {c.label}
                            </Badge>
                        </div>
                    );
                },
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
                cell: ({ row }) => {
                    if (row.original.is_legacy ?? row.original.id <= 0) {
                        return (
                            <div className="text-center text-sm text-muted-foreground">
                                Lama
                            </div>
                        );
                    }

                    return (
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
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                            <ArrowRightLeft data-icon="inline-start" />
                                            Status
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            <DropdownMenuItem
                                                disabled={
                                                    (row.original.status ||
                                                        'draft') === 'published'
                                                }
                                                onClick={() =>
                                                    updateTaskStatus(
                                                        row.original,
                                                        'published',
                                                    )
                                                }
                                            >
                                                <BadgeCheck data-icon="inline-start" />
                                                Publish
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                disabled={
                                                    (row.original.status ||
                                                        'draft') === 'draft'
                                                }
                                                onClick={() =>
                                                    updateTaskStatus(
                                                        row.original,
                                                        'draft',
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
                                            openEditTaskDialog(row.original)
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
                                        onClick={() => {
                                            router.delete(
                                                tasksDestroy.url({
                                                    task: row.original.id,
                                                }),
                                                {
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        toast.success(
                                                            'Task deleted successfully.',
                                                        ),
                                                    onError: (formErrors) => {
                                                        const messages =
                                                            Object.values(
                                                                formErrors,
                                                            )
                                                                .flat()
                                                                .join(', ');
                                                        toast.error(
                                                            messages ||
                                                                'Failed to delete task.',
                                                        );
                                                    },
                                                },
                                            );
                                        }}
                                    >
                                        <Trash2 data-icon="inline-start" />
                                        Delete
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() =>
                                            router.get(
                                                `/courses/${row.original.course_slug}`,
                                            )
                                        }
                                    >
                                        <Eye data-icon="inline-start" />
                                        View Task
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    );
                },
            },
        ],
        [openEditTaskDialog, versionHistories],
    );

    const handlePageChange = (nextPage: number): void => {
        router.get(
            adminCoursesIndex.url({
                query: {
                    section: 'task',
                    course_id: selectedCourseId,
                    lesson_id: selectedLessonId || lessonOptions[0]?.id,
                    page: nextPage,
                    per_page: tasks.per_page,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePageSizeChange = (nextPageSize: number): void => {
        router.get(
            adminCoursesIndex.url({
                query: {
                    section: 'task',
                    course_id: selectedCourseId,
                    lesson_id: selectedLessonId || lessonOptions[0]?.id,
                    page: 1,
                    per_page: nextPageSize,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <TypographyH1>Task Management</TypographyH1>
                {tabsList}
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between -mt-3">
                <TypographyMuted className="text-base md:text-sm">Manage tasks under each topic.</TypographyMuted>
                <div className="flex shrink-0 items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between sm:w-72"
                                >
                                    <span className="truncate">
                                        {(() => {
                                            if (
                                                selectedLessonId === 0 &&
                                                selectedCourseId === 0
                                            ) {
                                                return 'Select Topic...';
                                            }

                                            const lesson = allLessons.find(
                                                (l) =>
                                                    l.id === selectedLessonId,
                                            );

                                            if (lesson) {
                                                return lesson.title;
                                            }

                                            return 'Select Topic...';
                                        })()}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search course or topic..." />
                                    <CommandList className="max-h-none overflow-y-hidden">
                                        <CommandEmpty>
                                            No results found.
                                        </CommandEmpty>
                                        <ScrollArea className="h-64">
                                            {courseOptions.map((course) => {
                                                const courseLessons =
                                                    allLessons.filter(
                                                        (l) =>
                                                            l.course_id ===
                                                            course.id,
                                                    );

                                                if (
                                                    courseLessons.length === 0
                                                ) {
                                                    return null;
                                                }

                                                return (
                                                    <CommandGroup
                                                        key={course.id}
                                                        heading={course.title}
                                                    >
                                                        {courseLessons.map(
                                                            (lesson) => (
                                                                <CommandItem
                                                                    key={
                                                                        lesson.id
                                                                    }
                                                                    value={`${course.title} ${lesson.title}`}
                                                                    onSelect={() => {
                                                                        const isSelected =
                                                                            selectedLessonId ===
                                                                                lesson.id &&
                                                                            selectedCourseId ===
                                                                                course.id;

                                                                        // Don't navigate if already selected
                                                                        if (
                                                                            isSelected
                                                                        ) {
                                                                            return;
                                                                        }

                                                                        router.get(
                                                                            adminCoursesIndex.url(
                                                                                {
                                                                                    query: {
                                                                                        section:
                                                                                            'task',
                                                                                        course_id:
                                                                                            course.id,
                                                                                        lesson_id:
                                                                                            lesson.id,
                                                                                        page: 1,
                                                                                        per_page:
                                                                                            tasks.per_page,
                                                                                    },
                                                                                },
                                                                            ),
                                                                            {},
                                                                            {
                                                                                preserveState: true,
                                                                                preserveScroll: true,
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    {
                                                                        lesson.title
                                                                    }
                                                                    <Check
                                                                        className={`ml-auto h-4 w-4 ${selectedLessonId === lesson.id && selectedCourseId === course.id ? 'opacity-100' : 'opacity-0'}`}
                                                                    />
                                                                </CommandItem>
                                                            ),
                                                        )}
                                                    </CommandGroup>
                                                );
                                            })}
                                        </ScrollArea>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <div className="w-full sm:w-80">
                            <Input
                                id="task-search"
                                placeholder="Search Tasks..."
                                defaultValue={search || ''}
                                onChange={(event) => {
                                    router.get(
                                        adminCoursesIndex.url(),
                                        { search: event.target.value, page: 1, section: 'tasks' },
                                        { preserveState: true, preserveScroll: true }
                                    );
                                }}
                            />
                        </div>

                        <Dialog
                            open={createTaskDialogOpen}
                            onOpenChange={(open) => {
                                setCreateTaskDialogOpen(open);

                                if (!open && !isSavingTask) {
                                    resetTaskForm();
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        resetTaskForm();
                                        setCreateTaskDialogOpen(true);
                                    }}
                                >
                                    <Plus data-icon="inline-start" />
                                    Create
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="sm:max-w-sm">
                                <form
                                    encType="multipart/form-data"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        const payload = new FormData();
                                        payload.append(
                                            'lesson_id',
                                            String(taskForm.lesson_id),
                                        );
                                        payload.append('title', taskForm.title);
                                        payload.append(
                                            'description',
                                            taskForm.description,
                                        );
                                        payload.append('type', taskForm.type);

                                        if (taskForm.prerequisite_task_id) {
                                            payload.append(
                                                'prerequisite_task_id',
                                                taskForm.prerequisite_task_id,
                                            );
                                        }

                                        payload.append(
                                            'status',
                                            taskForm.status,
                                        );

                                        if (taskForm.type === 'video') {
                                            payload.append(
                                                'video_url',
                                                taskForm.video_url,
                                            );
                                        }

                                        if (
                                            taskForm.type === 'read' &&
                                            taskForm.document
                                        ) {
                                            payload.append(
                                                'document',
                                                taskForm.document,
                                            );
                                        }

                                        if (taskForm.type === 'quiz') {
                                            if (quizQuestions.length === 0) {
                                                toast.error(
                                                    'Add at least 1 question.',
                                                );

                                                return;
                                            }

                                            quizQuestions.forEach(
                                                (question, index) => {
                                                    payload.append(
                                                        `quiz_questions[${index}][question]`,
                                                        question.question,
                                                    );
                                                    payload.append(
                                                        `quiz_questions[${index}][options][0]`,
                                                        question.options[0],
                                                    );
                                                    payload.append(
                                                        `quiz_questions[${index}][options][1]`,
                                                        question.options[1],
                                                    );
                                                    payload.append(
                                                        `quiz_questions[${index}][options][2]`,
                                                        question.options[2],
                                                    );
                                                    payload.append(
                                                        `quiz_questions[${index}][options][3]`,
                                                        question.options[3],
                                                    );
                                                    payload.append(
                                                        `quiz_questions[${index}][correct_option]`,
                                                        String(
                                                            question.correct_option,
                                                        ),
                                                    );
                                                    payload.append(
                                                        `quiz_questions[${index}][explanation]`,
                                                        question.explanation,
                                                    );
                                                },
                                            );
                                        }

                                        const requestUrl = isEditMode
                                            ? tasksUpdate.url({
                                                  task: editingTask.id,
                                              })
                                            : tasksStore.url();

                                        if (isEditMode) {
                                            payload.append('_method', 'PATCH');
                                        }

                                        router.post(requestUrl, payload, {
                                            forceFormData: true,
                                            preserveScroll: true,
                                            preserveState: true,
                                            onStart: () =>
                                                setIsSavingTask(true),
                                            onSuccess: () => {
                                                toast.success(
                                                    isEditMode
                                                        ? 'Task updated successfully.'
                                                        : 'Task created successfully.',
                                                );
                                                resetTaskForm();
                                                setCreateTaskDialogOpen(false);
                                            },
                                            onError: (formErrors) => {
                                                const messages = Object.values(
                                                    formErrors,
                                                )
                                                    .flat()
                                                    .join(', ');
                                                toast.error(
                                                    messages ||
                                                        'Failed to save task.',
                                                );
                                            },
                                            onFinish: () =>
                                                setIsSavingTask(false),
                                        });
                                    }}
                                >
                                    <DialogHeader>
                                        <DialogTitle>
                                            {isEditMode
                                                ? 'Edit Task'
                                                : 'Create New Task'}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {isEditMode
                                                ? 'Update task details and content.'
                                                : 'Add a new task under the selected topic.'}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <FieldGroup className="mt-4">
                                        <Field
                                            data-invalid={
                                                taskLessonHasError || undefined
                                            }
                                        >
                                            <FieldLabel htmlFor="task-lesson">
                                                Topic{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Popover
                                                open={topicComboboxOpen}
                                                onOpenChange={
                                                    setTopicComboboxOpen
                                                }
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="task-lesson"
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                        aria-invalid={
                                                            taskLessonHasError
                                                        }
                                                    >
                                                        <span className="truncate">
                                                            {(() => {
                                                                const lesson =
                                                                    lessonOptions.find(
                                                                        (l) =>
                                                                            l.id ===
                                                                            taskForm.lesson_id,
                                                                    );

                                                                if (lesson) {
                                                                    return lesson.title;
                                                                }

                                                                return 'Select Topic...';
                                                            })()}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="p-0"
                                                    align="start"
                                                    style={{
                                                        width: 'var(--radix-popover-trigger-width)',
                                                    }}
                                                >
                                                    <Command>
                                                        <CommandInput placeholder="Search course or topic..." />
                                                        <CommandList
                                                            style={{
                                                                maxHeight:
                                                                    '16rem',
                                                                overflowY:
                                                                    'auto',
                                                            }}
                                                        >
                                                            <CommandEmpty>
                                                                No results
                                                                found.
                                                            </CommandEmpty>
                                                            {Object.entries(
                                                                groupedLessons,
                                                            ).map(
                                                                ([
                                                                    courseId,
                                                                    {
                                                                        course,
                                                                        lessons,
                                                                    },
                                                                ]) => (
                                                                    <CommandGroup
                                                                        key={
                                                                            courseId
                                                                        }
                                                                        heading={
                                                                            course
                                                                        }
                                                                    >
                                                                        {lessons.map(
                                                                            (
                                                                                lesson,
                                                                            ) => (
                                                                                <CommandItem
                                                                                    key={
                                                                                        lesson.id
                                                                                    }
                                                                                    value={`${course} ${lesson.title}`}
                                                                                    onSelect={() => {
                                                                                        setTaskForm(
                                                                                            (
                                                                                                current,
                                                                                            ) => ({
                                                                                                ...current,
                                                                                                lesson_id:
                                                                                                    lesson.id,
                                                                                            }),
                                                                                        );
                                                                                        setTopicComboboxOpen(
                                                                                            false,
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        lesson.title
                                                                                    }
                                                                                    <Check
                                                                                        className={`ml-auto h-4 w-4 ${
                                                                                            taskForm.lesson_id ===
                                                                                            lesson.id
                                                                                                ? 'opacity-100'
                                                                                                : 'opacity-0'
                                                                                        }`}
                                                                                    />
                                                                                </CommandItem>
                                                                            ),
                                                                        )}
                                                                    </CommandGroup>
                                                                ),
                                                            )}
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {taskLessonHasError && (
                                                <FieldDescription className="text-destructive">
                                                    {errors.lesson_id}
                                                </FieldDescription>
                                            )}
                                        </Field>

                                        <Field
                                            className="gap-2"
                                            data-invalid={
                                                taskTitleHasError || undefined
                                            }
                                        >
                                            <FieldLabel htmlFor="task-title">
                                                Title{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Input
                                                id="task-title"
                                                name="title"
                                                placeholder="Enter task title"
                                                value={taskForm.title}
                                                onChange={(event) =>
                                                    setTaskForm((current) => ({
                                                        ...current,
                                                        title: event.target
                                                            .value,
                                                    }))
                                                }
                                                aria-invalid={taskTitleHasError}
                                                required
                                            />
                                            {taskTitleHasError && (
                                                <FieldDescription className="text-destructive">
                                                    {errors.title}
                                                </FieldDescription>
                                            )}
                                        </Field>

                                        <Field
                                            className="gap-2"
                                            data-invalid={
                                                taskDescriptionHasError ||
                                                undefined
                                            }
                                        >
                                            <FieldLabel htmlFor="task-description">
                                                Description{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Textarea
                                                id="task-description"
                                                name="description"
                                                placeholder="Enter task description"
                                                value={taskForm.description}
                                                onChange={(event) =>
                                                    setTaskForm((current) => ({
                                                        ...current,
                                                        description:
                                                            event.target.value,
                                                    }))
                                                }
                                                aria-invalid={
                                                    taskDescriptionHasError
                                                }
                                                rows={3}
                                                required
                                            />
                                            {taskDescriptionHasError && (
                                                <FieldDescription className="text-destructive">
                                                    {errors.description}
                                                </FieldDescription>
                                            )}
                                        </Field>

                                        <Field
                                            className="gap-2"
                                            data-invalid={
                                                taskTypeHasError || undefined
                                            }
                                        >
                                            <FieldLabel htmlFor="task-type">
                                                Type{' '}
                                                <span className="text-destructive">
                                                    *
                                                </span>
                                            </FieldLabel>
                                            <Select
                                                value={taskForm.type}
                                                onValueChange={(value) => {
                                                    setTaskForm((current) => ({
                                                        ...current,
                                                        type: value as
                                                            | 'video'
                                                            | 'read'
                                                            | 'quiz',
                                                        video_url:
                                                            value === 'video'
                                                                ? current.video_url
                                                                : '',
                                                        document:
                                                            value === 'read'
                                                                ? current.document
                                                                : null,
                                                    }));
                                                }}
                                            >
                                                <SelectTrigger
                                                    id="task-type"
                                                    aria-invalid={
                                                        taskTypeHasError
                                                    }
                                                >
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        <SelectItem value="video">
                                                            Video
                                                        </SelectItem>
                                                        <SelectItem value="read">
                                                            Dokumen
                                                        </SelectItem>
                                                        <SelectItem value="quiz">
                                                            Kuis
                                                        </SelectItem>
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            {taskTypeHasError && (
                                                <FieldDescription className="text-destructive">
                                                    {errors.type}
                                                </FieldDescription>
                                            )}
                                        </Field>

                                        {taskForm.type === 'video' && (
                                            <Field
                                                className="gap-2"
                                                data-invalid={
                                                    taskVideoUrlHasError ||
                                                    undefined
                                                }
                                            >
                                                <FieldLabel htmlFor="task-video-url">
                                                    URL Video{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <Input
                                                    id="task-video-url"
                                                    name="video_url"
                                                    type="url"
                                                    placeholder="https://..."
                                                    value={taskForm.video_url}
                                                    onChange={(event) =>
                                                        setTaskForm(
                                                            (current) => ({
                                                                ...current,
                                                                video_url:
                                                                    event.target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    aria-invalid={
                                                        taskVideoUrlHasError
                                                    }
                                                    required
                                                />
                                                {taskVideoUrlHasError && (
                                                    <FieldDescription className="text-destructive">
                                                        {errors.video_url}
                                                    </FieldDescription>
                                                )}
                                            </Field>
                                        )}

                                        {taskForm.type === 'read' && (
                                            <Field
                                                className="gap-2"
                                                data-invalid={
                                                    taskDocumentHasError ||
                                                    undefined
                                                }
                                            >
                                                <FieldLabel htmlFor="task-document">
                                                    Dokumen{' '}
                                                    {!isEditMode && (
                                                        <span className="text-destructive">
                                                            *
                                                        </span>
                                                    )}
                                                </FieldLabel>
                                                {isEditMode &&
                                                    editingTask.document_name && (
                                                        <p className="text-sm text-muted-foreground">
                                                            Saat ini:{' '}
                                                            {
                                                                editingTask.document_name
                                                            }
                                                        </p>
                                                    )}
                                                <Input
                                                    id="task-document"
                                                    name="document"
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.txt"
                                                    aria-invalid={
                                                        taskDocumentHasError
                                                    }
                                                    onChange={(event) => {
                                                        const file =
                                                            event.target
                                                                .files?.[0] ??
                                                            null;
                                                        setTaskForm(
                                                            (current) => ({
                                                                ...current,
                                                                document: file,
                                                            }),
                                                        );
                                                    }}
                                                    required={!isEditMode}
                                                />
                                                {taskDocumentHasError && (
                                                    <FieldDescription className="text-destructive">
                                                        {errors.document}
                                                    </FieldDescription>
                                                )}
                                            </Field>
                                        )}

                                        {taskForm.type === 'quiz' && (
                                            <>
                                                <Field>
                                                    <FieldLabel htmlFor="task-quiz-import">
                                                        Import Questions{' '}
                                                        {!isEditMode &&
                                                            quizQuestions.length ===
                                                                0 && (
                                                                <span className="text-destructive">
                                                                    *
                                                                </span>
                                                            )}
                                                    </FieldLabel>

                                                    <div className="flex gap-2">
                                                        <Input
                                                            id="task-quiz-import"
                                                            type="file"
                                                            accept=".csv,.xlsx,.xls"
                                                            className="flex-1"
                                                            aria-invalid={
                                                                taskQuizQuestionsHasError
                                                            }
                                                            onChange={async (
                                                                event,
                                                            ) => {
                                                                const selectedFile =
                                                                    event.target
                                                                        .files?.[0] ??
                                                                    null;

                                                                if (
                                                                    !selectedFile
                                                                ) {
                                                                    setQuizImportFileName(
                                                                        '',
                                                                    );
                                                                    setQuizQuestions(
                                                                        [],
                                                                    );

                                                                    return;
                                                                }

                                                                try {
                                                                    const text =
                                                                        await selectedFile.text();
                                                                    const parsedRows =
                                                                        parseQuizImportText(
                                                                            text,
                                                                        );

                                                                    if (
                                                                        parsedRows.length ===
                                                                        0
                                                                    ) {
                                                                        toast.error(
                                                                            'No questions found in file.',
                                                                        );

                                                                        return;
                                                                    }

                                                                    setQuizQuestions(
                                                                        parsedRows,
                                                                    );
                                                                    setQuizImportFileName(
                                                                        selectedFile.name,
                                                                    );
                                                                    toast.success(
                                                                        `Successfully imported ${parsedRows.length} questions.`,
                                                                    );
                                                                } catch {
                                                                    toast.error(
                                                                        'Failed to read file. Please use the template format.',
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="shrink-0"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        downloadQuizTemplate(
                                                                            'csv',
                                                                        )
                                                                    }
                                                                >
                                                                    Format CSV
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        downloadQuizTemplate(
                                                                            'xlsx',
                                                                        )
                                                                    }
                                                                >
                                                                    Excel
                                                                    (.xlsx)
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        downloadQuizTemplate(
                                                                            'xls',
                                                                        )
                                                                    }
                                                                >
                                                                    Excel Lama
                                                                    (.xls)
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    <FieldDescription>
                                                        Upload CSV/Excel or
                                                        klik tombol di bawah
                                                        add manually
                                                    </FieldDescription>

                                                    {quizImportFileName && (
                                                        <>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Check className="h-4 w-4 text-green-600" />
                                                                <span>
                                                                    {
                                                                        quizImportFileName
                                                                    }{' '}
                                                                    (
                                                                    {
                                                                        quizQuestions.length
                                                                    }{' '}
                                                                    questions
                                                                    {quizQuestions.length !==
                                                                    1
                                                                        ? ''
                                                                        : ''}
                                                                    )
                                                                </span>
                                                            </div>

                                                            {/* Quiz Preview */}
                                                            {quizQuestions.length >
                                                                0 && (
                                                                <>
                                                                    <Accordion
                                                                        type="single"
                                                                        collapsible
                                                                        className="mt-3"
                                                                    >
                                                                        <AccordionItem
                                                                            value="preview"
                                                                            className="rounded-lg border px-3"
                                                                        >
                                                                            <AccordionTrigger className="text-sm hover:no-underline">
                                                                                <span className="flex items-center gap-2">
                                                                                    <Eye className="h-4 w-4" />
                                                                                    Preview
                                                                                    Questions
                                                                                    (
                                                                                    {
                                                                                        quizQuestions.length
                                                                                    }

                                                                                    )
                                                                                </span>
                                                                            </AccordionTrigger>
                                                                            <AccordionContent>
                                                                                <div className="max-h-96 space-y-3 overflow-y-auto pt-2">
                                                                                    {quizQuestions.map(
                                                                                        (
                                                                                            q,
                                                                                            i,
                                                                                        ) => (
                                                                                            <div
                                                                                                key={
                                                                                                    i
                                                                                                }
                                                                                                className="rounded-lg border bg-muted/30 p-3 text-sm"
                                                                                            >
                                                                                                <div className="mb-2 flex items-start justify-between gap-2">
                                                                                                    <p className="flex-1 font-medium">
                                                                                                        {i +
                                                                                                            1}

                                                                                                        .{' '}
                                                                                                        {
                                                                                                            q.question
                                                                                                        }
                                                                                                    </p>
                                                                                                    <div className="flex shrink-0 gap-1">
                                                                                                        <Button
                                                                                                            type="button"
                                                                                                            variant="ghost"
                                                                                                            size="sm"
                                                                                                            className="h-7 w-7 p-0"
                                                                                                            onClick={() =>
                                                                                                                openQuestionEditor(
                                                                                                                    i,
                                                                                                                )
                                                                                                            }
                                                                                                        >
                                                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                                                        </Button>
                                                                                                        <Button
                                                                                                            type="button"
                                                                                                            variant="ghost"
                                                                                                            size="sm"
                                                                                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                                                                            onClick={() =>
                                                                                                                deleteQuestion(
                                                                                                                    i,
                                                                                                                )
                                                                                                            }
                                                                                                        >
                                                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                                                        </Button>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="space-y-1 pl-4">
                                                                                                    {q.options.map(
                                                                                                        (
                                                                                                            opt,
                                                                                                            j,
                                                                                                        ) => (
                                                                                                            <div
                                                                                                                key={
                                                                                                                    j
                                                                                                                }
                                                                                                                className={
                                                                                                                    j ===
                                                                                                                    q.correct_option
                                                                                                                        ? 'font-medium text-emerald-600'
                                                                                                                        : 'text-muted-foreground'
                                                                                                                }
                                                                                                            >
                                                                                                                {j ===
                                                                                                                    q.correct_option &&
                                                                                                                    '✓ '}
                                                                                                                {
                                                                                                                    opt
                                                                                                                }
                                                                                                            </div>
                                                                                                        ),
                                                                                                    )}
                                                                                                </div>
                                                                                                {q.explanation && (
                                                                                                    <p className="mt-2 pl-4 text-xs text-muted-foreground">
                                                                                                        💡{' '}
                                                                                                        {
                                                                                                            q.explanation
                                                                                                        }
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                        ),
                                                                                    )}
                                                                                </div>
                                                                            </AccordionContent>
                                                                        </AccordionItem>
                                                                    </Accordion>

                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="mt-2 w-full"
                                                                        onClick={() =>
                                                                            openQuestionEditor()
                                                                        }
                                                                    >
                                                                        <Plus className="mr-2 h-4 w-4" />
                                                                        Add
                                                                        Question
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </>
                                                    )}

                                                    {isEditMode &&
                                                        quizQuestions.length >
                                                            0 &&
                                                        !quizImportFileName && (
                                                            <FieldDescription>
                                                                {
                                                                    quizQuestions.length
                                                                }{' '}
                                                                questions
                                                                loaded. Upload a
                                                                new file to
                                                                replace.
                                                            </FieldDescription>
                                                        )}

                                                    {taskQuizQuestionsHasError && (
                                                        <FieldDescription className="text-destructive">
                                                            {
                                                                errors.quiz_questions
                                                            }
                                                        </FieldDescription>
                                                    )}
                                                </Field>
                                            </>
                                        )}
                                    </FieldGroup>

                                    <DialogFooter className="mt-6">
                                        <DialogClose asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={isSavingTask}
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            type="submit"
                                            disabled={isSavingTask}
                                        >
                                            {isSavingTask && (
                                                <Spinner data-icon="inline-start" />
                                            )}
                                            Save changes
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Question Editor Dialog */}
                        <Dialog
                            open={questionEditorOpen}
                            onOpenChange={setQuestionEditorOpen}
                        >
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingQuestionIndex !== null
                                            ? 'Edit Question'
                                            : 'Add Question'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Fill in the question, 4 answer options, and
                                        select the correct answer.
                                    </DialogDescription>
                                </DialogHeader>

                                <FieldGroup className="mt-4">
                                    <Field>
                                        <FieldLabel htmlFor="q-question">
                                            Question{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Textarea
                                            id="q-question"
                                            value={questionForm.question}
                                            onChange={(e) =>
                                                setQuestionForm((prev) => ({
                                                    ...prev,
                                                    question: e.target.value,
                                                }))
                                            }
                                            placeholder="Enter question"
                                            rows={3}
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel>
                                            Answer Options{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <div className="space-y-2">
                                            {questionForm.options.map(
                                                (opt, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Input
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newOptions =
                                                                    [
                                                                        ...questionForm.options,
                                                                    ] as [
                                                                        string,
                                                                        string,
                                                                        string,
                                                                        string,
                                                                    ];
                                                                newOptions[
                                                                    idx
                                                                ] =
                                                                    e.target.value;
                                                                setQuestionForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        options:
                                                                            newOptions,
                                                                    }),
                                                                );
                                                            }}
                                                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant={
                                                                questionForm.correct_option ===
                                                                idx
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            size="sm"
                                                            className="shrink-0"
                                                            onClick={() =>
                                                                setQuestionForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        correct_option:
                                                                            idx,
                                                                    }),
                                                                )
                                                            }
                                                        >
                                                            {questionForm.correct_option ===
                                                            idx ? (
                                                                <Check className="h-4 w-4" />
                                                            ) : (
                                                                'Correct'
                                                            )}
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                        <FieldDescription>
                                            Click the "Correct" button to mark
                                            the correct answer
                                        </FieldDescription>
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="q-explanation">
                                            Explanation
                                        </FieldLabel>
                                        <Textarea
                                            id="q-explanation"
                                            value={questionForm.explanation}
                                            onChange={(e) =>
                                                setQuestionForm((prev) => ({
                                                    ...prev,
                                                    explanation: e.target.value,
                                                }))
                                            }
                                            placeholder="Answer explanation (optional)"
                                            rows={2}
                                        />
                                    </Field>
                                </FieldGroup>

                                <DialogFooter className="mt-6">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="button"
                                        onClick={saveQuestion}
                                    >
                                        {editingQuestionIndex !== null
                                            ? 'Update'
                                            : 'Add'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                </div>
            </div>
            <section className="grid gap-4">
                <div className="flex flex-col gap-4">
                    {isLoading ? (
                        <Skeleton className="h-150 w-full rounded-lg" />
                    ) : tasks.data.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Search />
                                </EmptyMedia>
                                <EmptyTitle>
                                    No tasks found
                                </EmptyTitle>
                                <EmptyDescription>
                                    Create your first task to get started.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : rows.length === 0 && search ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Search />
                                </EmptyMedia>
                                <EmptyTitle>
                                    No tasks found
                                </EmptyTitle>
                                <EmptyDescription>
                                    Select another topic or search with a
                                    different keyword.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={rows}
                            centered
                            showFilterInput={false}
                            showColumnToggle={false}
                            showPageInfo={false}
                            enableDefaultIdSort={false}
                            getRowDataId={(row) => String(row.id)}
                            dragHandleActiveRowId={dragHandleActiveRowId}
                            onRowDragStart={(rowId) => setDragHandleActiveRowId(rowId)}
                            onRowDrop={(sourceRowId, targetRowId) => {
                                reorderRows(sourceRowId, targetRowId);
                            }}
                            onRowDragEnd={() => {
                                setDragHandleActiveRowId(null);
                            }}
                            page={tasks.current_page}
                            pageCount={tasks.last_page}
                            pageSize={tasks.per_page}
                            onPageChange={handlePageChange}
                            onPageSizeChange={handlePageSizeChange}
                            footerInfo={`Showing ${tasks.from ?? 0} - ${tasks.to ?? 0} of ${tasks.total} Tasks`}
                        />
                    )}
                </div>
            </section>
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
        </div>
    );
}



type IndexProps = {
    section: 'catalog' | 'lesson' | 'task' | 'assessment';
    courses: Paginated<CourseRow>;
    courseOptions: Array<Pick<CourseRow, 'id' | 'title'>>;
    allLessons: LessonOption[];
    lessons: Paginated<LessonRow>;
    tasks: Paginated<TaskRow>;
    selectedCourseId: number;
    selectedLessonId: number;
    filters: {
        search: string;
    };
    // Assessment section data
    assessments: Paginated<AdminAssessment>;
    allAssessments: { id: number; title: string; course_id: number; course_title: string }[];
    assessmentQuestions: AdminAssessmentQuestion[];
    selectedAssessmentId: number;
    assessmentTopics: { id: number; name: string }[];
    courseFilterSelected: boolean;
    assessmentFilters: {
        search: string;
        bloom_level: BloomLevel | null;
    };
    questionBank: Paginated<QuestionBank>;
    versionHistories: {
        courses: Record<number, VersionHistoryItem[]>;
        lessons: Record<number, VersionHistoryItem[]>;
        tasks: Record<number, VersionHistoryItem[]>;
        assessments: Record<number, VersionHistoryItem[]>;
    };
};

type CourseManagementSection = Exclude<IndexProps['section'], 'assessment'>;

export default function AdminCoursesIndex(props: IndexProps) {
    const initialTab: CourseManagementSection =
        props.section === 'assessment' ? 'catalog' : props.section;
    const [activeTab, setActiveTab] = useState<CourseManagementSection>(initialTab);
    const [isLoading, setIsLoading] = useState(false);
    const [cachedData, setCachedData] = useState({
        courses: props.courses,
        lessons: props.lessons,
        tasks: props.tasks,
        allLessons: props.allLessons,
    });

    const handleTabChange = useCallback((value: string) => {
        if (!['catalog', 'lesson', 'task'].includes(value)) {
            return;
        }

        const section = value as CourseManagementSection;

        // Instant client-side tab switch
        setActiveTab(section);

        // Update URL without server request
        window.history.replaceState(
            null,
            '',
            adminCoursesIndex.url({ query: { section } })
        );

        console.log(`✨ Tab switch: ${section} | Latency: 0ms (instant)`);
        console.log('🚀 Excellent performance!');

        // Lazy load data if not cached or empty
        const needsData =
            (section === 'catalog' && (!cachedData.courses || !cachedData.courses.data || cachedData.courses.data.length === 0)) ||
            (section === 'lesson' && (!cachedData.lessons || !cachedData.lessons.data || cachedData.lessons.data.length === 0)) ||
            (section === 'task' && (!cachedData.tasks || !cachedData.tasks.data || cachedData.tasks.data.length === 0));

        if (needsData) {
            console.log(`📡 Fetching data for ${section} tab...`);
            setIsLoading(true);
            router.reload({
                only: ['courses', 'lessons', 'tasks', 'allLessons', 'selectedCourseId', 'selectedLessonId'],
                onSuccess: (page: any) => {
                    console.log(`✅ Data loaded for ${section} tab`);
                    setCachedData({
                        courses: page.props.courses || cachedData.courses,
                        lessons: page.props.lessons || cachedData.lessons,
                        tasks: page.props.tasks || cachedData.tasks,
                        allLessons: page.props.allLessons || cachedData.allLessons,
                    });
                    setIsLoading(false);
                },
                onError: () => {
                    console.error(`❌ Failed to load data for ${section} tab`);
                    setIsLoading(false);
                },
            });
        }
    }, [cachedData]);

    // Assessment has its own page layout (accessed via sidebar)
    if (props.section === 'assessment') {
        return (
            <>
                <Head title="Management - Assessment" />
                <div className="px-4 pt-3 pb-4">
                    <AdminCoursesAssessment
                        assessments={props.assessments}
                        allAssessments={props.allAssessments ?? []}
                        questions={props.assessmentQuestions}
                        selectedAssessmentId={props.selectedAssessmentId}
                        courseOptions={props.courseOptions}
                        selectedCourseId={props.selectedCourseId}
                        courseFilterSelected={props.courseFilterSelected}
                        allLessons={props.allLessons ?? []}
                        topics={props.assessmentTopics}
                        filters={props.assessmentFilters}
                        questionBank={props.questionBank}
                        versionHistories={props.versionHistories.assessments}
                    />
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Management - Courses" />

            <div className="px-4 pt-3 pb-4">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsContent value="catalog">
                        <AdminCoursesTitle
                            courses={cachedData.courses}
                            versionHistories={props.versionHistories.courses}
                            isLoading={isLoading}
                            search={props.filters.search}
                            tabsList={
                                <TabsList>
                                    <TabsTrigger value="catalog">
                                        <BookOpen className="size-4" />
                                        Title
                                    </TabsTrigger>
                                    <TabsTrigger value="lesson">
                                        <Layers3 className="size-4" />
                                        Topic
                                    </TabsTrigger>
                                    <TabsTrigger value="task">
                                        <FileText className="size-4" />
                                        Task
                                    </TabsTrigger>
                                </TabsList>
                            }
                        />
                    </TabsContent>

                    <TabsContent value="lesson">
                        <AdminCoursesTopic
                            lessons={cachedData.lessons}
                            courseOptions={props.courseOptions}
                            selectedCourseId={props.selectedCourseId}
                            versionHistories={props.versionHistories.lessons}
                            isLoading={isLoading}
                            search={props.filters.search}
                            tabsList={
                                <TabsList>
                                    <TabsTrigger value="catalog">
                                        <BookOpen className="size-4" />
                                        Title
                                    </TabsTrigger>
                                    <TabsTrigger value="lesson">
                                        <Layers3 className="size-4" />
                                        Topic
                                    </TabsTrigger>
                                    <TabsTrigger value="task">
                                        <FileText className="size-4" />
                                        Task
                                    </TabsTrigger>
                                </TabsList>
                            }
                        />
                    </TabsContent>

                    <TabsContent value="task">
                        <AdminCoursesTask
                            tasks={cachedData.tasks}
                            lessons={cachedData.lessons}
                            allLessons={cachedData.allLessons ?? []}
                            courseOptions={props.courseOptions}
                            selectedCourseId={props.selectedCourseId}
                            selectedLessonId={props.selectedLessonId}
                            versionHistories={props.versionHistories.tasks}
                            isLoading={isLoading}
                            search={props.filters.search}
                            tabsList={
                                <TabsList>
                                    <TabsTrigger value="catalog">
                                        <BookOpen className="size-4" />
                                        Title
                                    </TabsTrigger>
                                    <TabsTrigger value="lesson">
                                        <Layers3 className="size-4" />
                                        Topic
                                    </TabsTrigger>
                                    <TabsTrigger value="task">
                                        <FileText className="size-4" />
                                        Task
                                    </TabsTrigger>
                                </TabsList>
                            }
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

AdminCoursesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: dashboard(),
        },
        {
            title: 'Courses',
            href: adminCoursesIndex(),
        },
    ],
};
