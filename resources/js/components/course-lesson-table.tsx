import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { useMemo } from 'react';
import type { LessonRow } from '@/components/course-types';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LessonTableProps {
    lessons: LessonRow[];
    filterValue: string;
    onFilterChange: (value: string) => void;
    onEdit: (lesson: LessonRow) => void;
    onDelete: (lesson: LessonRow) => void;
}

export function LessonTable({
    lessons,
    filterValue,
    onFilterChange,
    onEdit,
    onDelete,
}: LessonTableProps) {
    const columns = useMemo<ColumnDef<LessonRow>[]>(
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
                        Topik
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
                accessorKey: 'course_title',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="mx-auto"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        Kursus
                        <ArrowUpDown className="size-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.original.course_title ?? '-'}
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
                        Tugas
                        <ArrowUpDown className="size-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.original.tasks_count}
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
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => onEdit(row.original)}
                                >
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDelete(row.original)}
                                >
                                    Hapus
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
            data={lessons}
            filterColumn="title"
            filterValue={filterValue}
            onFilterChange={onFilterChange}
            showFilterInput={false}
            centered
            showColumnToggle={false}
            showPageInfo={false}
            footerInfo={`Menampilkan ${lessons.length} topik.`}
        />
    );
}
