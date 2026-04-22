import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { CourseRow, LessonRow, Paginated } from '@/components/course-types';
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
    DropdownMenuItem,
    DropdownMenuLabel,
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import { destroy as lessonsDestroy } from '@/routes/admin/courses/lessons';
import { reorder as lessonsReorder } from '@/routes/admin/courses/lessons';
import { store as lessonsStore } from '@/routes/admin/courses/lessons';

type Props = {
    lessons: Paginated<LessonRow>;
    courseOptions: Pick<CourseRow, 'id' | 'title'>[];
    selectedCourseId: number;
};

function formatTopicCode(order: number): string {
    return `TPC-${String(order).padStart(4, '0')}`;
}

export default function AdminCoursesTopic({ lessons, courseOptions, selectedCourseId }: Props) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [filterValue, setFilterValue] = useState('');
    const [rows, setRows] = useState<LessonRow[]>(lessons.data);
    const [dragHandleActiveRowId, setDragHandleActiveRowId] = useState<string | null>(null);
    const [createTopicDialogOpen, setCreateTopicDialogOpen] = useState(false);
    const [isSavingTopic, setIsSavingTopic] = useState(false);
    const [topicForm, setTopicForm] = useState({
        course_id: selectedCourseId,
        title: '',
        description: '',
    });

    const topicCourseHasError = Boolean(errors.course_id);
    const topicTitleHasError = Boolean(errors.title);
    const topicDescriptionHasError = Boolean(errors.description);

    useEffect(() => {
        setTopicForm((current) => ({ ...current, course_id: selectedCourseId }));
    }, [selectedCourseId]);

    const resetTopicForm = () => {
        setTopicForm({
            course_id: selectedCourseId,
            title: '',
            description: '',
        });
    };

    useEffect(() => {
        setRows(lessons.data);
    }, [lessons.data]);

    const filteredLessons = useMemo(() => {
        const keyword = filterValue.trim().toLowerCase();

        if (keyword === '') {
            return rows;
        }

        return rows.filter((lesson) => {
            return lesson.title.toLowerCase().includes(keyword)
                || (lesson.course_title ?? '').toLowerCase().includes(keyword);
        });
    }, [filterValue, rows]);

    const reorderRows = (sourceRowId: string, targetRowId: string) => {
        if (sourceRowId === targetRowId) {
            return;
        }

        setRows((currentRows) => {
            const sourceIndex = currentRows.findIndex((row) => String(row.id) === sourceRowId);
            const targetIndex = currentRows.findIndex((row) => String(row.id) === targetRowId);

            if (sourceIndex < 0 || targetIndex < 0) {
                return currentRows;
            }

            const nextRows = [...currentRows];
            const [movedRow] = nextRows.splice(sourceIndex, 1);
            nextRows.splice(targetIndex, 0, movedRow);

            const startPosition = Math.max((lessons.from ?? 1), 1);
            router.post(lessonsReorder.url(), {
                items: nextRows.map((row, index) => ({
                    id: row.id,
                    position: startPosition + index,
                })),
            }, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });

            return nextRows;
        });
    };

    const columns = useMemo<ColumnDef<LessonRow>[]>(() => [
        {
            id: 'drag',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <button
                        type="button"
                        data-row-drag-handle="true"
                        aria-label={`Drag row ${formatTopicCode(row.index + 1)}`}
                        onMouseDown={() => setDragHandleActiveRowId(String(row.original.id))}
                        className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
                        style={{ cursor: 'grab' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
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
            accessorKey: 'tasks_count',
            header: 'Tasks',
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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => {
                                    router.delete(lessonsDestroy.url({ lesson: row.original.id }), {
                                        preserveScroll: true,
                                    });
                                }}
                            >
                                <Trash2 data-icon="inline-start" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], []);

    const handlePageChange = (nextPage: number): void => {
        router.get(
            adminCoursesIndex.url({ query: { section: 'lesson', course_id: selectedCourseId, page: nextPage, per_page: lessons.per_page } }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handlePageSizeChange = (nextPageSize: number): void => {
        router.get(
            adminCoursesIndex.url({ query: { section: 'lesson', course_id: selectedCourseId, page: 1, per_page: nextPageSize } }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <div className="flex flex-col gap-6 px-4 py-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-0">
                    <TypographyH1>Course Topic Management</TypographyH1>
                    <TypographyMuted className="text-sm/6">
                        Manage all topics for each course title with the same management workflow.
                    </TypographyMuted>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <Select
                        value={String(selectedCourseId)}
                        onValueChange={(value) => {
                            router.get(
                                adminCoursesIndex.url({ query: { section: 'lesson', course_id: Number(value), page: 1 } }),
                                {},
                                { preserveState: true, preserveScroll: true },
                            );
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-64">
                            <SelectValue placeholder="Select title" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {courseOptions.map((course) => (
                                    <SelectItem key={course.id} value={String(course.id)}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <div className="w-full sm:w-80">
                        <Input
                            id="topic-search"
                            placeholder="Search Topic..."
                            value={filterValue}
                            onChange={(event) => setFilterValue(event.target.value)}
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
                            <Button type="button" onClick={() => setCreateTopicDialogOpen(true)}>
                                <Plus data-icon="inline-start" />
                                Create Topic
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm *:data-[slot=dialog-close]:top-6 *:data-[slot=dialog-close]:right-6">
                            <form
                                className="flex flex-col gap-5"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const payload = new FormData();
                                    payload.append('course_id', String(topicForm.course_id));
                                    payload.append('title', topicForm.title);
                                    payload.append('description', topicForm.description);

                                    router.post(lessonsStore.url(), payload, {
                                        forceFormData: true,
                                        preserveScroll: true,
                                        preserveState: true,
                                        onStart: () => setIsSavingTopic(true),
                                        onSuccess: () => {
                                            toast.success('Topic created successfully.');
                                            resetTopicForm();
                                            setCreateTopicDialogOpen(false);
                                        },
                                        onFinish: () => setIsSavingTopic(false),
                                    });
                                }}
                            >
                                <DialogHeader className="pr-10">
                                    <DialogTitle>Create topic</DialogTitle>
                                    <DialogDescription>
                                        Add a new topic for the selected course title.
                                    </DialogDescription>
                                </DialogHeader>

                                <FieldGroup className="gap-3">
                                    <Field className="gap-2" data-invalid={topicCourseHasError || undefined}>
                                        <FieldLabel htmlFor="topic-course">
                                            Course <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <Select
                                            value={String(topicForm.course_id)}
                                            onValueChange={(value) => {
                                                setTopicForm((current) => ({ ...current, course_id: Number(value) }));
                                            }}
                                        >
                                            <SelectTrigger id="topic-course" aria-invalid={topicCourseHasError}>
                                                <SelectValue placeholder="Select course" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {courseOptions.map((course) => (
                                                        <SelectItem key={course.id} value={String(course.id)}>
                                                            {course.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {topicCourseHasError && (
                                            <FieldDescription className="text-destructive">{errors.course_id}</FieldDescription>
                                        )}
                                    </Field>

                                    <Field className="gap-2" data-invalid={topicTitleHasError || undefined}>
                                        <FieldLabel htmlFor="topic-title">
                                            Title <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <Input
                                            id="topic-title"
                                            name="title"
                                            placeholder="Enter topic title"
                                            value={topicForm.title}
                                            onChange={(event) => setTopicForm((current) => ({ ...current, title: event.target.value }))}
                                            aria-invalid={topicTitleHasError}
                                            required
                                        />
                                        {topicTitleHasError && (
                                            <FieldDescription className="text-destructive">{errors.title}</FieldDescription>
                                        )}
                                    </Field>

                                    <Field className="gap-2" data-invalid={topicDescriptionHasError || undefined}>
                                        <FieldLabel htmlFor="topic-description">
                                            Description <span className="text-destructive">*</span>
                                        </FieldLabel>
                                        <Textarea
                                            id="topic-description"
                                            name="description"
                                            placeholder="Enter topic description"
                                            value={topicForm.description}
                                            onChange={(event) => setTopicForm((current) => ({ ...current, description: event.target.value }))}
                                            aria-invalid={topicDescriptionHasError}
                                            rows={4}
                                            required
                                        />
                                        {topicDescriptionHasError && (
                                            <FieldDescription className="text-destructive">{errors.description}</FieldDescription>
                                        )}
                                    </Field>
                                </FieldGroup>

                                <DialogFooter className="pt-1">
                                    <DialogClose asChild>
                                        <Button type="button" variant="outline" disabled={isSavingTopic}>Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isSavingTopic}>
                                        {isSavingTopic && <Spinner data-icon="inline-start" />}
                                        Save changes
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
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
                                <EmptyTitle>No topic found</EmptyTitle>
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
        </div>
    );
}
