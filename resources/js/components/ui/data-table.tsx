import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Field,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type DataTableProps<TData, TValue> = {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    filterColumn?: string;
    filterPlaceholder?: string;
    filterValue?: string;
    onFilterChange?: (value: string) => void;
    showFilterInput?: boolean;
    footerInfo?: string;
    centered?: boolean;
    showColumnToggle?: boolean;
    showPageSizeSelector?: boolean;
    showPageInfo?: boolean;
    page?: number;
    pageCount?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    toolbarPrefix?: ReactNode;
    toolbarSuffix?: ReactNode;
};

function formatColumnLabel(columnId: string): string {
    return columnId
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .filter((part) => part.length > 0)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function buildPaginationItems(page: number, pageCount: number): Array<number | 'ellipsis'> {
    if (pageCount <= 7) {
        return Array.from({ length: pageCount }, (_, index) => index + 1);
    }

    if (page <= 3) {
        return [1, 2, 3, 4, 'ellipsis', pageCount];
    }

    if (page >= pageCount - 2) {
        return [1, 'ellipsis', pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
    }

    return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', pageCount];
}

export function DataTable<TData, TValue>({
    columns,
    data,
    filterColumn,
    filterPlaceholder = 'Filter...',
    filterValue,
    onFilterChange,
    showFilterInput = true,
    footerInfo,
    centered = false,
    showColumnToggle = true,
    showPageSizeSelector = true,
    showPageInfo = true,
    page,
    pageCount,
    pageSize,
    onPageChange,
    onPageSizeChange,
    toolbarPrefix,
    toolbarSuffix,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const isServerPaginated = typeof page === 'number'
        && typeof pageCount === 'number'
        && typeof pageSize === 'number'
        && typeof onPageChange === 'function';

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        manualPagination: isServerPaginated,
        pageCount: isServerPaginated ? pageCount : undefined,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
    });

    useEffect(() => {
        if (!filterColumn || typeof filterValue === 'undefined') {
            return;
        }

        table.getColumn(filterColumn)?.setFilterValue(filterValue);
    }, [filterColumn, filterValue, table]);

    const hasToolbar = Boolean(toolbarPrefix)
        || Boolean(filterColumn && showFilterInput)
        || showColumnToggle
        || Boolean(toolbarSuffix);

    return (
        <div className="w-full">
            {hasToolbar ? (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                    {toolbarPrefix ?? null}

                    {filterColumn && showFilterInput ? (
                        <Input
                            placeholder={filterPlaceholder}
                            value={typeof filterValue === 'string' ? filterValue : (table.getColumn(filterColumn)?.getFilterValue() as string) ?? ''}
                            onChange={(event) => {
                                const value = event.target.value;
                                onFilterChange?.(value);
                                table.getColumn(filterColumn)?.setFilterValue(value);
                            }}
                            className="min-w-56 flex-1 max-w-sm"
                        />
                    ) : null}

                    {showColumnToggle ? (
                        <div className="ml-auto flex w-full items-center justify-end gap-2 sm:w-auto">
                            {toolbarSuffix ?? null}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        Columns
                                        <ChevronDown className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuGroup>
                                        {table
                                            .getAllColumns()
                                            .filter((column) => column.getCanHide())
                                            .map((column) => (
                                                <DropdownMenuCheckboxItem
                                                    key={column.id}
                                                    checked={column.getIsVisible()}
                                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                                >
                                                    {formatColumnLabel(column.id)}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : toolbarSuffix ? (
                        <div className="ml-auto flex items-center gap-2">{toolbarSuffix}</div>
                    ) : null}
                </div>
            ) : null}

            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className={centered ? 'text-center align-middle' : undefined}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className={centered ? 'text-center align-middle' : undefined}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{footerInfo ?? ''}</p>
                <div className="flex items-center gap-2">
                    {showPageSizeSelector ? (
                        <Field orientation="horizontal" className="w-fit items-center gap-2">
                            <FieldLabel htmlFor="select-rows-per-page" className="text-sm text-muted-foreground">
                                Rows per page
                            </FieldLabel>
                            <Select
                                value={String(isServerPaginated ? pageSize : table.getState().pagination.pageSize)}
                                onValueChange={(value) => {
                                    const nextPageSize = Number(value);

                                    if (isServerPaginated) {
                                        onPageSizeChange?.(nextPageSize);

                                        return;
                                    }

                                    table.setPageSize(nextPageSize);
                                }}
                            >
                                <SelectTrigger
                                    id="select-rows-per-page"
                                    aria-label="Rows per page"
                                    className="h-8 w-27.5"
                                >
                                    <SelectValue placeholder="Rows per page" />
                                </SelectTrigger>
                                <SelectContent align="start">
                                    <SelectGroup>
                                        <SelectItem value="10">10 / page</SelectItem>
                                        <SelectItem value="25">25 / page</SelectItem>
                                        <SelectItem value="50">50 / page</SelectItem>
                                        <SelectItem value="100">100 / page</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>
                    ) : null}
                    {showPageInfo ? (
                        <span className="text-sm text-muted-foreground">
                            Page {isServerPaginated ? page : table.getState().pagination.pageIndex + 1} of {Math.max(isServerPaginated ? pageCount : table.getPageCount(), 1)}
                        </span>
                    ) : null}
                    <Pagination className="mx-0 w-auto justify-end">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(event) => {
                                        event.preventDefault();

                                        if (isServerPaginated) {
                                            onPageChange(Math.max(1, page - 1));

                                            return;
                                        }

                                        table.previousPage();
                                    }}
                                    aria-disabled={isServerPaginated ? page <= 1 : !table.getCanPreviousPage()}
                                    className={isServerPaginated ? (page <= 1 ? 'pointer-events-none opacity-50' : undefined) : (!table.getCanPreviousPage() ? 'pointer-events-none opacity-50' : undefined)}
                                />
                            </PaginationItem>
                            {buildPaginationItems(
                                isServerPaginated ? page : table.getState().pagination.pageIndex + 1,
                                Math.max(isServerPaginated ? pageCount : table.getPageCount(), 1),
                            ).map((item, index) => (
                                <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : `page-${item}`}>
                                    {item === 'ellipsis' ? (
                                        <PaginationEllipsis />
                                    ) : (
                                        <PaginationLink
                                            href="#"
                                            isActive={item === (isServerPaginated ? page : table.getState().pagination.pageIndex + 1)}
                                            onClick={(event) => {
                                                event.preventDefault();

                                                if (isServerPaginated) {
                                                    onPageChange(item);

                                                    return;
                                                }

                                                table.setPageIndex(item - 1);
                                            }}
                                        >
                                            {item}
                                        </PaginationLink>
                                    )}
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(event) => {
                                        event.preventDefault();

                                        if (isServerPaginated) {
                                            onPageChange(Math.min(pageCount, page + 1));

                                            return;
                                        }

                                        table.nextPage();
                                    }}
                                    aria-disabled={isServerPaginated ? page >= pageCount : !table.getCanNextPage()}
                                    className={isServerPaginated ? (page >= pageCount ? 'pointer-events-none opacity-50' : undefined) : (!table.getCanNextPage() ? 'pointer-events-none opacity-50' : undefined)}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    );
}
