import { router } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, RowSelectionState, SortingState } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { CourseRow, Paginated } from '@/components/course-types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { show as coursesShow } from '@/routes/courses';

interface CourseTableProps {
    courses: Paginated<CourseRow>;
    filterValue: string;
    onFilterChange: (value: string) => void;
    onEdit: (course: CourseRow) => void;
    onDelete: (course: CourseRow) => void;
    toolbarAction?: ReactNode;
}

export function CourseTable({
    courses,
    filterValue,
    onFilterChange,
    onEdit,
    onDelete,
    toolbarAction,
}: CourseTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const columns = useMemo<ColumnDef<CourseRow>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <div className="flex justify-center">
                        <Checkbox
                            checked={
                                table.getIsAllPageRowsSelected()
                                || (table.getIsSomePageRowsSelected() && 'indeterminate')
                            }
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all rows"
                        />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label={`Select ${row.original.title}`}
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'title',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="mx-auto"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        Title
                        <ArrowUpDown className="size-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-center">
                        <p className="font-medium">{row.original.title}</p>
                    </div>
                ),
            },
            {
                accessorKey: 'lessons_count',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="mx-auto"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        Lesson
                        <ArrowUpDown className="size-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.original.lessons_count}
                    </div>
                ),
            },
            {
                accessorKey: 'tasks_count',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="mx-auto"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        Task
                        <ArrowUpDown className="size-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.original.tasks_count ?? 0}
                    </div>
                ),
            },
            {
                accessorKey: 'enrollments_count',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="mx-auto"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        Enrollment
                        <ArrowUpDown className="size-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.original.enrollments_count}
                    </div>
                ),
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="size-8 p-0"
                                >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() =>
                                        router.get(
                                            coursesShow.url(row.original.slug),
                                        )
                                    }
                                >
                                    View course
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onEdit(row.original)}
                                >
                                    Open Builder
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDelete(row.original)}
                                >
                                    Delete
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        void navigator.clipboard.writeText(
                                            row.original.slug,
                                        );
                                    }}
                                >
                                    Copy slug
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ),
            },
        ],
        [onEdit, onDelete],
    );

    const filteredCourses = useMemo(() => {
        const keyword = filterValue.trim().toLowerCase();

        if (keyword === '') {
            return courses.data;
        }

        return courses.data.filter((course) =>
            course.title.toLowerCase().includes(keyword),
        );
    }, [courses.data, filterValue]);

    const table = useReactTable({
        data: filteredCourses,
        columns,
        getRowId: (row) => String(row.id),
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            rowSelection,
            sorting,
        },
    });

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Input
                    value={filterValue}
                    onChange={(event) => onFilterChange(event.target.value)}
                    placeholder="Search courses..."
                    className="w-full sm:max-w-sm"
                />

                {toolbarAction ? (
                    <div className="sm:shrink-0">
                        {toolbarAction}
                    </div>
                ) : null}
            </div>

            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-center align-middle">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="text-center align-middle">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No courses found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                    {table.getSelectedRowModel().rows.length} of {table.getRowModel().rows.length} row(s) selected.
                </p>

                <p className="text-sm text-muted-foreground">
                    Showing {courses.from ?? 0} - {courses.to ?? 0} of {courses.total} courses.
                </p>
            </div>
        </div>
    );
}
