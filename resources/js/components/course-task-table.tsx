import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { useMemo } from 'react';
import type { TaskRow } from '@/components/course-types';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskTableProps {
    tasks: TaskRow[];
    filterValue: string;
    onFilterChange: (value: string) => void;
    onEdit: (task: TaskRow) => void;
    onDelete: (task: TaskRow) => void;
}

export function TaskTable({
    tasks,
    filterValue,
    onFilterChange,
    onEdit,
    onDelete,
}: TaskTableProps) {
    const columns = useMemo<ColumnDef<TaskRow>[]>(
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
                        Tugas
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
                accessorKey: 'type',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="mx-auto"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        Tipe
                        <ArrowUpDown className="size-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-center uppercase">
                        {row.original.type}
                    </div>
                ),
            },
            {
                accessorKey: 'lesson_title',
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
                        {row.original.lesson_title}
                    </div>
                ),
            },
            {
                accessorKey: 'minutes',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="mx-auto"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        Durasi
                        <ArrowUpDown className="size-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-center">
                        {row.original.minutes} min
                    </div>
                ),
            },
            {
                id: 'task_order',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="mx-auto"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                    >
                        Urutan
                        <ArrowUpDown className="size-4" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="text-center">
                        #{row.original.task_index + 1}
                    </div>
                ),
            },
            {
                id: 'actions',
                enableHiding: false,
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
                    );
                },
            },
        ],
        [onEdit, onDelete],
    );

    return (
        <DataTable
            columns={columns}
            data={tasks}
            filterColumn="title"
            filterValue={filterValue}
            onFilterChange={onFilterChange}
            showFilterInput={false}
            centered
            showColumnToggle={false}
            showPageInfo={false}
            footerInfo={`Menampilkan ${tasks.length} tugas.`}
        />
    );
}
