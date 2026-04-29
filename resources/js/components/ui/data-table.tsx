'use client';

import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Field, FieldLabel } from '@/components/ui/field';
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
    filterValue?: string;
    onFilterChange?: (value: string) => void;
    showFilterInput?: boolean;
    centered?: boolean;
    showColumnToggle?: boolean;
    showPageInfo?: boolean;
    showFooter?: boolean;
    footerInfo?: string;
    page?: number;
    pageCount?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    enableDefaultIdSort?: boolean;
    getRowDataId?: (row: TData) => string;
    dragHandleActiveRowId?: string | null;
    onRowDrop?: (sourceRowId: string, targetRowId: string) => void;
    onRowDragEnd?: () => void;
    getRowClassName?: (row: TData) => string | undefined;
};

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
    filterValue = '',
    onFilterChange,
    showFilterInput = true,
    centered = false,
    showPageInfo = true,
    showFooter = true,
    footerInfo,
    page,
    pageCount,
    pageSize,
    onPageChange,
    onPageSizeChange,
    enableDefaultIdSort = true,
    getRowDataId,
    dragHandleActiveRowId,
    onRowDrop,
    onRowDragEnd,
    getRowClassName,
}: DataTableProps<TData, TValue>) {
    const defaultSorting = useMemo<SortingState>(() => {
        if (!enableDefaultIdSort) {
            return [];
        }

        const hasIdColumn = columns.some((column) => {
            if ('id' in column && column.id === 'id') {
                return true;
            }

            return 'accessorKey' in column && column.accessorKey === 'id';
        });

        return hasIdColumn ? [{ id: 'id', desc: false }] : [];
    }, [columns, enableDefaultIdSort]);

    const [sorting, setSorting] = useState<SortingState>(defaultSorting);
    const [localPageSize, setLocalPageSize] = useState(10);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: pageSize ?? 10,
    });
    const [draggingSourceId, setDraggingSourceId] = useState<string | null>(null);
    const [draggingOverId, setDraggingOverId] = useState<string | null>(null);
    const [dragRowHeight, setDragRowHeight] = useState(0);

    const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
    const pointerOffsetYRef = useRef(0);
    const draggingSourceIdRef = useRef<string | null>(null);
    const draggingOverIdRef = useRef<string | null>(null);
    const ghostRef = useRef<HTMLTableElement | null>(null);
    const dragLeftRef = useRef(0);
    const rafIdRef = useRef<number | null>(null);
    const ghostCurrentYRef = useRef(0);
    const ghostTargetYRef = useRef(0);

    const isDragging = draggingSourceId !== null;

    const isServerPagination = typeof page === 'number' && typeof pageCount === 'number' && !!onPageChange;

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            pagination,
        },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const rows = isServerPagination
        ? table.getSortedRowModel().rows
        : table.getPaginationRowModel().rows;

    const rowIdsInView = useMemo(() => {
        if (!getRowDataId) {
            return [] as string[];
        }

        return rows.map((row) => getRowDataId(row.original));
    }, [getRowDataId, rows]);

    const getPreviewTargetId = (pointerY: number): string | null => {
        if (!getRowDataId) {
            return null;
        }

        for (const row of rows) {
            const rowId = getRowDataId(row.original);
            const element = rowRefs.current.get(rowId);

            if (!element) {
                continue;
            }

            const rect = element.getBoundingClientRect();

            if (pointerY < rect.top + (rect.height / 2)) {
                return rowId;
            }
        }

        const lastRow = rows.at(-1);
        return lastRow ? getRowDataId(lastRow.original) : null;
    };

    const handlePointerMove = (event: PointerEvent) => {
        const sourceId = draggingSourceIdRef.current;
        const ghost = ghostRef.current;

        if (!sourceId || !ghost) {
            return;
        }

        ghostTargetYRef.current = event.clientY - pointerOffsetYRef.current;

        if (rafIdRef.current === null) {
            const animateGhost = () => {
                const currentY = ghostCurrentYRef.current;
                const targetY = ghostTargetYRef.current;
                const nextY = currentY + ((targetY - currentY) * 0.35);

                ghostCurrentYRef.current = nextY;
                ghost.style.transform = `translate3d(${dragLeftRef.current}px, ${nextY}px, 0)`;

                if (Math.abs(targetY - nextY) > 0.4) {
                    rafIdRef.current = window.requestAnimationFrame(animateGhost);
                } else {
                    ghostCurrentYRef.current = targetY;
                    ghost.style.transform = `translate3d(${dragLeftRef.current}px, ${targetY}px, 0)`;
                    rafIdRef.current = null;
                }
            };

            rafIdRef.current = window.requestAnimationFrame(animateGhost);
        }

        const nextOverId = getPreviewTargetId(event.clientY) ?? sourceId;

        if (nextOverId !== draggingOverIdRef.current) {
            draggingOverIdRef.current = nextOverId;
            setDraggingOverId(nextOverId);
        }
    };

    const cleanupDragSession = () => {
        if (rafIdRef.current !== null) {
            window.cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }

        if (ghostRef.current) {
            ghostRef.current.remove();
            ghostRef.current = null;
        }

        document.body.style.userSelect = '';

        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);

        draggingSourceIdRef.current = null;
        draggingOverIdRef.current = null;

        setDraggingSourceId(null);
        setDraggingOverId(null);
        setDragRowHeight(0);

        onRowDragEnd?.();
    };

    const handlePointerUp = () => {
        const sourceId = draggingSourceIdRef.current;
        const targetId = draggingOverIdRef.current;

        if (sourceId && targetId && sourceId !== targetId) {
            onRowDrop?.(sourceId, targetId);
        }

        cleanupDragSession();
    };

    const beginPointerDrag = (rowId: string, rowElement: HTMLTableRowElement, clientY: number) => {
        const rowRect = rowElement.getBoundingClientRect();
        const sourceTable = rowElement.closest('table');
        const ghost = sourceTable
            ? (sourceTable.cloneNode(false) as HTMLTableElement)
            : document.createElement('table');

        ghost.className = `${ghost.className} fixed z-50 rounded-md border bg-background shadow-lg`.trim();
        ghost.style.width = `${rowRect.width}px`;
        ghost.style.pointerEvents = 'none';
        ghost.style.left = '0';
        ghost.style.top = '0';
        ghost.style.tableLayout = 'fixed';

        const sourceColGroup = sourceTable?.querySelector('colgroup');

        if (sourceColGroup) {
            ghost.appendChild(sourceColGroup.cloneNode(true));
        }

        const tbody = document.createElement('tbody');
        const clonedRow = rowElement.cloneNode(true) as HTMLTableRowElement;
        clonedRow.style.opacity = '1';
        clonedRow.style.transform = 'none';

        const sourceCells = Array.from(rowElement.cells);
        const clonedCells = Array.from(clonedRow.cells);

        sourceCells.forEach((sourceCell, index) => {
            const clonedCell = clonedCells[index];

            if (!clonedCell) {
                return;
            }

            const cellWidth = sourceCell.getBoundingClientRect().width;
            const widthPx = `${cellWidth}px`;

            clonedCell.style.width = widthPx;
            clonedCell.style.minWidth = widthPx;
            clonedCell.style.maxWidth = widthPx;
        });

        tbody.appendChild(clonedRow);
        ghost.appendChild(tbody);
        document.body.appendChild(ghost);

        pointerOffsetYRef.current = clientY - rowRect.top;
        dragLeftRef.current = rowRect.left;
        ghostCurrentYRef.current = rowRect.top;
        ghostTargetYRef.current = rowRect.top;
        ghost.style.transform = `translate3d(${dragLeftRef.current}px, ${rowRect.top}px, 0)`;

        ghostRef.current = ghost;
        draggingSourceIdRef.current = rowId;
        draggingOverIdRef.current = rowId;

        setDraggingSourceId(rowId);
        setDraggingOverId(rowId);
        setDragRowHeight(rowRect.height);

        document.body.style.userSelect = 'none';

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    useEffect(() => {
        return () => {
            cleanupDragSession();
        };
    }, []);

    const activePage = isServerPagination ? Math.max(page ?? 1, 1) : table.getState().pagination.pageIndex + 1;
    const totalPages = isServerPagination ? Math.max(pageCount ?? 1, 1) : Math.max(table.getPageCount(), 1);
    const shouldShowPagination = isServerPagination || totalPages > 1;

    return (
        <div className="flex flex-col gap-3">
            {showFilterInput ? (
                <Input
                    value={filterValue}
                    onChange={(event) => onFilterChange?.(event.target.value)}
                    placeholder="Search..."
                    className="w-full sm:max-w-sm"
                />
            ) : null}

            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className={cn(centered && 'text-center align-middle', header.index === 0 && 'pl-4', header.index === headerGroup.headers.length - 1 && 'pr-4')}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {rows.length > 0 ? (
                            rows.map((row) => (
                                (() => {
                                    const rowId = getRowDataId ? getRowDataId(row.original) : null;
                                    const sourceIndex = draggingSourceId ? rowIdsInView.indexOf(draggingSourceId) : -1;
                                    const overIndex = draggingOverId ? rowIdsInView.indexOf(draggingOverId) : -1;
                                    const currentIndex = rowId ? rowIdsInView.indexOf(rowId) : -1;

                                    let rowTransform = '';

                                    if (isDragging && sourceIndex !== -1 && overIndex !== -1 && currentIndex !== -1 && dragRowHeight > 0) {
                                        if (sourceIndex < overIndex && currentIndex > sourceIndex && currentIndex <= overIndex) {
                                            rowTransform = `translateY(${-dragRowHeight}px)`;
                                        }

                                        if (sourceIndex > overIndex && currentIndex >= overIndex && currentIndex < sourceIndex) {
                                            rowTransform = `translateY(${dragRowHeight}px)`;
                                        }
                                    }

                                    return (
                                        <TableRow
                                            key={row.id}
                                            data-id={rowId ?? undefined}
                                            ref={(element) => {
                                                if (!rowId) {
                                                    return;
                                                }

                                                if (element) {
                                                    rowRefs.current.set(rowId, element);
                                                } else {
                                                    rowRefs.current.delete(rowId);
                                                }
                                            }}
                                            onMouseDown={(event) => {
                                                if (!getRowDataId || !rowId) {
                                                    return;
                                                }

                                                if (event.button !== 0) {
                                                    return;
                                                }

                                                const targetElement = event.target as HTMLElement | null;
                                                const isHandleInteraction = targetElement?.closest('[data-row-drag-handle="true"]') !== null;

                                                if (!isHandleInteraction) {
                                                    return;
                                                }

                                                event.preventDefault();
                                                beginPointerDrag(rowId, event.currentTarget, event.clientY);
                                            }}
                                            className={cn(
                                                'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                                isDragging && rowId === draggingSourceId && 'opacity-0',
                                                getRowClassName?.(row.original),
                                            )}
                                            style={rowTransform ? { transform: rowTransform } : undefined}
                                        >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className={cn(centered && 'text-center align-middle', cell.column.getIndex() === 0 && 'pl-4', cell.column.getIsLastColumn() && 'pr-4')}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                        </TableRow>
                                    );
                                })()
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

            {showFooter && <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    {footerInfo ?? `Showing ${rows.length} row(s).`}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                    <Field orientation="horizontal" className="w-fit items-center gap-2">
                        <FieldLabel htmlFor="data-table-rows-per-page" className="text-sm text-muted-foreground">
                            Rows per page
                        </FieldLabel>
                        <Select
                            value={String(isServerPagination ? pageSize ?? 10 : localPageSize)}
                            onValueChange={(value) => {
                                const nextSize = Number(value);

                                if (isServerPagination) {
                                    onPageSizeChange?.(nextSize);

                                    return;
                                }

                                setLocalPageSize(nextSize);
                                table.setPageSize(nextSize);
                            }}
                        >
                            <SelectTrigger className="w-20" id="data-table-rows-per-page">
                                <SelectValue placeholder="Rows" />
                            </SelectTrigger>
                            <SelectContent align="start">
                                <SelectGroup>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </Field>

                    {showPageInfo ? (
                        <span className="text-sm text-muted-foreground">Page {activePage} of {totalPages}</span>
                    ) : null}

                    {shouldShowPagination ? (
                        <Pagination className="mx-0 w-auto justify-end">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(event) => {
                                            event.preventDefault();

                                            if (activePage <= 1) {
                                                return;
                                            }

                                            if (isServerPagination) {
                                                onPageChange?.(activePage - 1);

                                                return;
                                            }

                                            table.previousPage();
                                        }}
                                        aria-disabled={activePage <= 1}
                                        className={activePage <= 1 ? 'pointer-events-none opacity-50' : undefined}
                                    />
                                </PaginationItem>

                                {buildPaginationItems(activePage, totalPages).map((item, index) => (
                                    <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : `page-${item}`}>
                                        {item === 'ellipsis' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink
                                                href="#"
                                                isActive={item === activePage}
                                                onClick={(event) => {
                                                    event.preventDefault();

                                                    if (isServerPagination) {
                                                        onPageChange?.(item);

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

                                            if (activePage >= totalPages) {
                                                return;
                                            }

                                            if (isServerPagination) {
                                                onPageChange?.(activePage + 1);

                                                return;
                                            }

                                            table.nextPage();
                                        }}
                                        aria-disabled={activePage >= totalPages}
                                        className={activePage >= totalPages ? 'pointer-events-none opacity-50' : undefined}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    ) : null}
                </div>
            </div>}
        </div>
    );
}
