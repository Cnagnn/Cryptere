import { router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Check,
    ChevronsUpDown,
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { CourseRow, LessonRow } from '@/types/course-management';
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import type { Paginated } from '@/types';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import { destroy as lessonsDestroy } from '@/routes/admin/courses/lessons';
import { reorder as lessonsReorder } from '@/routes/admin/courses/lessons';
import { store as lessonsStore } from '@/routes/admin/courses/lessons';
import { update as lessonsUpdate } from '@/routes/admin/courses/lessons';

type Props = {
    lessons: Paginated<LessonRow>;
    courseOptions: Pick<CourseRow, 'id' | 'title'>[];
    selectedCourseId: number;
};

function formatTopicCode(order: number): string {
    return `TPC-${String(order).padStart(4, '0')}`;
}

export default function AdminCoursesTopic({
    lessons,
    courseOptions,
    selectedCourseId,
}: Props) {
    const { errors } = usePage<{ errors: Record<string, string> }>().props;
    const [filterValue, setFilterValue] = useState('');
    const [rows, setRows] = useState<LessonRow[]>(lessons.data);
    const [dragHandleActiveRowId, setDragHandleActiveRowId] = useState<
        string | null
    >(null);
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

    useEffect(() => {
        setTopicForm((current) => ({
            ...current,
            course_id: selectedCourseId,
        }));
    }, [selectedCourseId]);

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

    useEffect(() => {
        setRows(lessons.data);
    }, [lessons.data]);

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
                header: 'Topik',
                cell: ({ row }) => (
                    <div className="text-left">
                        <p className="font-medium">{row.original.title}</p>
                    </div>
                ),
            },
            {
                accessorKey: 'course_title',
                header: 'Judul',
            },
            {
                accessorKey: 'created_at',
                header: 'Dibuat Pada',
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
                header: 'Diperbarui Pada',
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
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() =>
                                        openEditTopicDialog(row.original)
                                    }
                                >
                                    <Pencil data-icon="inline-start" />
                                    Ubah
                                </DropdownMenuItem>
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
                                                        'Topik berhasil dihapus.',
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
                                                            'Gagal menghapus topik.',
                                                    );
                                                },
                                            },
                                        );
                                    }}
                                >
                                    <Trash2 data-icon="inline-start" />
                                    Hapus
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
                                    Lihat Topik
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            },
        ],
        [],
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
        <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-0">
                    <TypographyH1>Manajemen Topik</TypographyH1>
                    <TypographyMuted className="text-sm/6">
                        Kelola topik untuk setiap kursus.
                    </TypographyMuted>
                </div>

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
                                            (c) => c.id === selectedCourseId,
                                        );

                                        if (course) {
                                            return course.title;
                                        }

                                        return 'Pilih Kursus...';
                                    })()}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Cari kursus..." />
                                <CommandList className="max-h-none overflow-y-hidden">
                                    <CommandEmpty>
                                        Tidak ada hasil ditemukan.
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
                            placeholder="Cari Topik..."
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
                                Buat
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="*:data-[slot=dialog-close]:top-6 *:data-[slot=dialog-close]:right-6 sm:max-w-sm">
                            <form
                                className="flex flex-col gap-5"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const payload = new FormData();
                                    payload.append(
                                        'course_id',
                                        String(topicForm.course_id),
                                    );
                                    payload.append('title', topicForm.title);
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
                                        onStart: () => setIsSavingTopic(true),
                                        onSuccess: () => {
                                            toast.success(
                                                isEditMode
                                                    ? 'Topik berhasil diperbarui.'
                                                    : 'Topik berhasil dibuat.',
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
                                                    'Gagal menyimpan topik.',
                                            );
                                        },
                                        onFinish: () => setIsSavingTopic(false),
                                    });
                                }}
                            >
                                <DialogHeader className="pr-10">
                                    <DialogTitle>
                                        {isEditMode
                                            ? 'Ubah topik'
                                            : 'Buat topik'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {isEditMode
                                            ? 'Perbarui judul dan deskripsi topik.'
                                            : 'Tambahkan topik baru untuk judul kursus yang dipilih.'}
                                    </DialogDescription>
                                </DialogHeader>

                                <FieldGroup className="gap-3">
                                    <Field
                                        className="gap-2"
                                        data-invalid={
                                            topicCourseHasError || undefined
                                        }
                                    >
                                        <FieldLabel htmlFor="topic-course">
                                            Kursus{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Popover
                                            open={courseComboboxOpen}
                                            onOpenChange={setCourseComboboxOpen}
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

                                                            return 'Pilih Kursus...';
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
                                                    <CommandInput placeholder="Cari kursus..." />
                                                    <CommandList
                                                        style={{
                                                            maxHeight: '16rem',
                                                            overflowY: 'auto',
                                                        }}
                                                    >
                                                        <CommandEmpty>
                                                            Tidak ada hasil
                                                            ditemukan.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {courseOptions.map(
                                                                (course) => (
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
                                            Judul{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Input
                                            id="topic-title"
                                            name="title"
                                            placeholder="Masukkan judul topik"
                                            value={topicForm.title}
                                            onChange={(event) =>
                                                setTopicForm((current) => ({
                                                    ...current,
                                                    title: event.target.value,
                                                }))
                                            }
                                            aria-invalid={topicTitleHasError}
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
                                            Deskripsi{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </FieldLabel>
                                        <Textarea
                                            id="topic-description"
                                            name="description"
                                            placeholder="Masukkan deskripsi topik"
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

                                <DialogFooter className="pt-1">
                                    <DialogClose asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={isSavingTopic}
                                        >
                                            Batal
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        disabled={isSavingTopic}
                                    >
                                        {isSavingTopic && (
                                            <Spinner data-icon="inline-start" />
                                        )}
                                        Simpan perubahan
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <section className="grid gap-4">
                <div className="flex flex-col gap-4">
                    {selectedCourseId === 0 && filterValue.trim() === '' ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Search />
                                </EmptyMedia>
                                <EmptyTitle>
                                    Tidak ada topik ditemukan
                                </EmptyTitle>
                                <EmptyDescription>
                                    Pilih kursus lain atau cari dengan kata
                                    kunci lain.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    ) : filteredLessons.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Search />
                                </EmptyMedia>
                                <EmptyTitle>
                                    Tidak ada topik ditemukan
                                </EmptyTitle>
                                <EmptyDescription>
                                    Coba judul kursus atau kata kunci lain.
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
                            footerInfo={`Menampilkan ${lessons.from ?? 0} - ${lessons.to ?? 0} dari ${lessons.total} Topik`}
                        />
                    )}
                </div>
            </section>
        </div>
    );
}
