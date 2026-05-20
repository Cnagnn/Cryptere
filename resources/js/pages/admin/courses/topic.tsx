import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Archive,
    ArrowRightLeft,
    BadgeCheck,
    Check,
    ChevronsUpDown,
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import { destroy as lessonsDestroy } from '@/routes/admin/courses/lessons';
import { reorder as lessonsReorder } from '@/routes/admin/courses/lessons';
import { store as lessonsStore } from '@/routes/admin/courses/lessons';
import { update as lessonsUpdate } from '@/routes/admin/courses/lessons';
import { restore as restoreVersion } from '@/routes/admin/versions';
import type { Paginated } from '@/types';
import type { CourseRow, LessonRow } from '@/types/course-management';

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
    lessons: Paginated<LessonRow>;
    courseOptions: Pick<CourseRow, 'id' | 'title'>[];
    selectedCourseId: number;
    versionHistories: Record<number, VersionHistoryItem[]>;
};

function formatTopicCode(order: number): string {
    return `TPC-${String(order).padStart(4, '0')}`;
}

export default function AdminCoursesTopic({
    lessons,
    courseOptions,
    selectedCourseId,
    versionHistories,
}: Props) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [filterValue, setFilterValue] = useState('');
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

    const filteredLessons = useMemo(() => {
        const keyword = filterValue.trim().toLowerCase();

        if (keyword === '') {
            return rows;
        }

        return rows.filter((lesson) => {
            return (
                lesson.title.toLowerCase().includes(keyword) ||
                (lesson.course_title ?? '').toLowerCase().includes(keyword)
            );
        });
    }, [filterValue, rows]);

    const reorderRows = (sourceRowId: string, targetRowId: string) => {
        if (sourceRowId === targetRowId) {
            return;
        }

        setRows((currentRows) => {
            const sourceIndex = currentRows.findIndex(
                (row) => String(row.id) === sourceRowId,
            );
            const targetIndex = currentRows.findIndex(
                (row) => String(row.id) === targetRowId,
            );

            if (sourceIndex < 0 || targetIndex < 0) {
                return currentRows;
            }

            const nextRows = [...currentRows];
            const [movedRow] = nextRows.splice(sourceIndex, 1);
            nextRows.splice(targetIndex, 0, movedRow);

            const startPosition = Math.max(lessons.from ?? 1, 1);
            router.post(
                lessonsReorder.url(),
                {
                    items: nextRows.map((row, index) => ({
                        id: row.id,
                        position: startPosition + index,
                    })),
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );

            return nextRows;
        });
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

    const columns = useMemo<ColumnDef<LessonRow>[]>(
        () => [
            {
                id: 'drag',
                header: '',
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <button
                            type="button"
                            data-row-drag-handle="true"
                            aria-label={`Drag row ${formatTopicCode(row.index + 1)}`}
                            onMouseDown={() =>
                                setDragHandleActiveRowId(
                                    String(row.original.id),
                                )
                            }
                            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
                            style={{ cursor: 'grab' }}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 14 14"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <circle cx="3" cy="3" r="1" />
                                <circle cx="7" cy="3" r="1" />
                                <circle cx="11" cy="3" r="1" />
                                <circle cx="3" cy="7" r="1" />
                                <circle cx="7" cy="7" r="1" />
                                <circle cx="11" cy="7" r="1" />
                            </svg>
                        </button>
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
        <div className="flex flex-col gap-6 px-4 pt-3 pb-4">
            <header className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                    <TypographyH1>Topic Management</TypographyH1>
                    <TypographyMuted>
                        Manage topics for each course.
                    </TypographyMuted>
                </div>
                <div className="flex shrink-0 items-center justify-end gap-2">
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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
                                value={filterValue}
                                onChange={(event) =>
                                    setFilterValue(event.target.value)
                                }
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
                                    Create Topic
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
            </header>

            <section className="grid gap-4">
                <div className="flex flex-col gap-4">
                    {filteredLessons.length === 0 ? (
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
                            data={filteredLessons}
                            centered
                            showFilterInput={false}
                            showColumnToggle={false}
                            showPageInfo={false}
                            enableDefaultIdSort={false}
                            getRowDataId={(row) => String(row.id)}
                            dragHandleActiveRowId={dragHandleActiveRowId}
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
