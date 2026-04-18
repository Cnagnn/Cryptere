import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { useMemo } from 'react';
import type { CourseRow, Paginated } from '@/components/course-types';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { show as coursesShow } from '@/routes/courses';

interface CourseTableProps {
    courses: Paginated<CourseRow>;
    filterValue: string;
    onFilterChange: (value: string) => void;
    onEdit: (course: CourseRow) => void;
    onDelete: (course: CourseRow) => void;
}

export function CourseTable({
    courses,
    filterValue,
    onFilterChange,
    onEdit,
    onDelete,
}: CourseTableProps) {
    const columns = useMemo<ColumnDef<CourseRow>[]>(
        () => [
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
                                    Edit
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

    return (
        <DataTable
            columns={columns}
            data={courses.data}
            filterColumn="title"
            filterValue={filterValue}
            onFilterChange={onFilterChange}
            showFilterInput={false}
            centered
            showColumnToggle={false}
            showPageSizeSelector={false}
            showPageInfo={false}
            footerInfo={`Showing ${courses.from ?? 0} - ${courses.to ?? 0} of ${courses.total} courses.`}
        />
    );
}
