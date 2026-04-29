import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    HelpCircle,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
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
import { DataTable } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
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
import { Input } from '@/components/ui/input';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { ChallengeFormDialog } from '@/pages/challenges/_components/ChallengeFormDialog';
import { dashboard } from '@/routes';
import {
    destroy as destroyChallenge,
    index as adminChallengesIndex,
    reorder as reorderChallenges,
} from '@/routes/admin/challenges';
import { QuestionBankPanel } from './_components/QuestionBankPanel';
import type { QuestionRow } from './_components/QuestionFormDialog';

type ChallengeRow = {
    id: number;
    slug: string;
    title: string;
    prompt: string;
    hint: string | null;
    expected_answer: string;
    is_published: boolean;
    time_start: string | null;
    time_end: string | null;
    time_limit_seconds: number;
    questions_per_session: number;
    max_points_per_question: number;
    questions_count: number;
    created_at: string;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type Props = {
    challenges: Paginated<ChallengeRow>;
    questions: QuestionRow[];
    selectedChallengeId: number;
    filters: {
        search: string;
    };
};

function formatChallengeCode(id: number): string {
    return `CHL-${String(id).padStart(4, '0')}`;
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return '-';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        return '-';
    }

    const formattedDate = new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(parsedDate);

    const titleCaseDate = formattedDate.replace(/\b\p{L}[\p{L}]*/gu, (word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    });

    const cleanedDate = titleCaseDate
        .replace(/\bPukul\b/gi, '')
        .replace(/\s+,/g, ',')
        .replace(/,\s*,/g, ',')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .replace(/(\d{2})\.(\d{2})/, '$1:$2');

    return `${cleanedDate} WIB`;
}

export default function AdminChallengesIndex({
    challenges,
    questions,
    selectedChallengeId,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [rows, setRows] = useState<ChallengeRow[]>(challenges.data);
    const [prevData, setPrevData] = useState(challenges.data);

    if (prevData !== challenges.data) {
        setPrevData(challenges.data);
        setRows(challenges.data);
    }

    const [dragHandleActiveRowId, setDragHandleActiveRowId] = useState<
        string | null
    >(null);
    const [deletingChallenge, setDeletingChallenge] =
        useState<ChallengeRow | null>(null);
    const [challengeFormOpen, setChallengeFormOpen] = useState(false);
    const [challengeFormMode, setChallengeFormMode] = useState<
        'create' | 'edit'
    >('create');
    const [editingChallenge, setEditingChallenge] = useState<
        ChallengeRow | undefined
    >();
    const [activeQuestionBankId, setActiveQuestionBankId] = useState<number>(
        selectedChallengeId || 0,
    );

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

            const startSortOrder = Math.max(challenges.from ?? 1, 1);
            router.post(
                reorderChallenges.url(),
                {
                    items: nextRows.map((row, index) => ({
                        id: row.id,
                        sort_order: startSortOrder + index,
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

    const openCreateChallenge = () => {
        setChallengeFormMode('create');
        setEditingChallenge(undefined);
        setChallengeFormOpen(true);
    };

    const openEditChallenge = (challenge: ChallengeRow) => {
        setChallengeFormMode('edit');
        setEditingChallenge(challenge);
        setChallengeFormOpen(true);
    };

    const openQuestionBank = (challengeId: number) => {
        setActiveQuestionBankId(challengeId);
        router.get(
            adminChallengesIndex.url({
                query: {
                    search: search || undefined,
                    page: challenges.current_page,
                    per_page: challenges.per_page,
                    challenge_id: challengeId,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const closeQuestionBank = () => {
        setActiveQuestionBankId(0);
        router.get(
            adminChallengesIndex.url({
                query: {
                    search: search || undefined,
                    page: challenges.current_page,
                    per_page: challenges.per_page,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const submitDeleteChallenge = () => {
        if (!deletingChallenge) {
            return;
        }

        router.delete(
            destroyChallenge.url({ challenge: deletingChallenge.id }),
            {
                preserveScroll: true,
                onSuccess: () => setDeletingChallenge(null),
            },
        );
    };

    const activeChallenge = rows.find((r) => r.id === activeQuestionBankId);

    return (
        <>
            <Head title="Management - Challenges" />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-0">
                        <TypographyH1>Challenge Management</TypographyH1>
                        <TypographyMuted className="text-sm/6">
                            Create and manage challenge content, schedule
                            windows, and publishing status.
                        </TypographyMuted>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <div className="w-full sm:w-80">
                            <Input
                                id="challenge-search"
                                value={search}
                                placeholder="Search Challenge Title..."
                                onChange={(event) => {
                                    const nextValue = event.target.value;
                                    setSearch(nextValue);

                                    router.get(
                                        adminChallengesIndex.url({
                                            query: {
                                                search: nextValue || undefined,
                                                page: 1,
                                                per_page: challenges.per_page,
                                            },
                                        }),
                                        {},
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                            replace: true,
                                        },
                                    );
                                }}
                            />
                        </div>
                        <Button type="button" onClick={openCreateChallenge}>
                            <Plus data-icon="inline-start" />
                            Create
                        </Button>
                    </div>
                </header>

                <section className="grid gap-4">
                    <div className="flex flex-col gap-4">
                        {challenges.data.length === 0 ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <Search />
                                    </EmptyMedia>
                                    <EmptyTitle>No challenge found</EmptyTitle>
                                    <EmptyDescription>
                                        Create your first challenge or adjust
                                        search filter.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <DataTable
                                columns={[
                                    {
                                        id: 'drag',
                                        header: '',
                                        cell: ({ row }) => (
                                            <div className="flex justify-center">
                                                <button
                                                    type="button"
                                                    data-row-drag-handle="true"
                                                    aria-label={`Drag row ${formatChallengeCode(row.original.id)}`}
                                                    onMouseDown={() =>
                                                        setDragHandleActiveRowId(
                                                            String(
                                                                row.original.id,
                                                            ),
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
                                                        <circle
                                                            cx="3"
                                                            cy="3"
                                                            r="1"
                                                        />
                                                        <circle
                                                            cx="7"
                                                            cy="3"
                                                            r="1"
                                                        />
                                                        <circle
                                                            cx="11"
                                                            cy="3"
                                                            r="1"
                                                        />
                                                        <circle
                                                            cx="3"
                                                            cy="7"
                                                            r="1"
                                                        />
                                                        <circle
                                                            cx="7"
                                                            cy="7"
                                                            r="1"
                                                        />
                                                        <circle
                                                            cx="11"
                                                            cy="7"
                                                            r="1"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        ),
                                    },
                                    {
                                        accessorKey: 'title',
                                        header: 'Title',
                                        cell: ({ row }) => (
                                            <div className="flex flex-col gap-0.5 text-left">
                                                <p className="font-medium">
                                                    {row.original.title}
                                                </p>
                                                <p className="line-clamp-1 text-sm text-muted-foreground">
                                                    {row.original.prompt}
                                                </p>
                                            </div>
                                        ),
                                    },
                                    {
                                        accessorKey: 'time_start',
                                        header: 'Time Date Started',
                                        cell: ({ row }) =>
                                            formatDateTime(
                                                row.original.time_start,
                                            ),
                                    },
                                    {
                                        accessorKey: 'time_end',
                                        header: 'Time Date Ended',
                                        cell: ({ row }) =>
                                            formatDateTime(
                                                row.original.time_end,
                                            ),
                                    },
                                    {
                                        id: 'questions_count',
                                        header: 'Questions',
                                        cell: ({ row }) => (
                                            <div className="flex justify-center">
                                                <Badge variant="secondary">
                                                    <HelpCircle />
                                                    {row.original
                                                        .questions_count ?? 0}
                                                </Badge>
                                            </div>
                                        ),
                                    },
                                    {
                                        accessorKey: 'is_published',
                                        header: 'Status',
                                        cell: ({ row }) => (
                                            <div className="flex justify-center">
                                                <Badge variant="outline">
                                                    {row.original
                                                        .is_published ? (
                                                        <CheckCircle2 />
                                                    ) : (
                                                        <Clock3 />
                                                    )}
                                                    {row.original.is_published
                                                        ? 'Published'
                                                        : 'Draft'}
                                                </Badge>
                                            </div>
                                        ),
                                    },
                                    {
                                        id: 'actions',
                                        header: '',
                                        cell: ({ row }) => (
                                            <div className="flex justify-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                        >
                                                            <MoreHorizontal />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>
                                                            Actions
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openEditChallenge(
                                                                        row.original,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil data-icon="inline-start" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openQuestionBank(
                                                                        row
                                                                            .original
                                                                            .id,
                                                                    )
                                                                }
                                                            >
                                                                <HelpCircle data-icon="inline-start" />
                                                                Questions
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    setDeletingChallenge(
                                                                        row.original,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 data-icon="inline-start" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuGroup>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        ),
                                    },
                                ]}
                                data={rows}
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
                                page={challenges.current_page}
                                pageCount={challenges.last_page}
                                pageSize={challenges.per_page}
                                onPageChange={(nextPage: number): void => {
                                    router.get(
                                        adminChallengesIndex.url({
                                            query: {
                                                search: search || undefined,
                                                page: nextPage,
                                                per_page: challenges.per_page,
                                            },
                                        }),
                                        {},
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                        },
                                    );
                                }}
                                onPageSizeChange={(
                                    nextPageSize: number,
                                ): void => {
                                    router.get(
                                        adminChallengesIndex.url({
                                            query: {
                                                search: search || undefined,
                                                page: 1,
                                                per_page: nextPageSize,
                                            },
                                        }),
                                        {},
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                        },
                                    );
                                }}
                                footerInfo={`Showing ${challenges.from ?? 0} - ${challenges.to ?? 0} of ${challenges.total} challenges`}
                            />
                        )}
                    </div>
                </section>
            </div>

            {activeChallenge && activeQuestionBankId > 0 && (
                <div className="px-4 pb-6">
                    <div className="flex items-center justify-between pb-3">
                        <h2 className="text-lg font-semibold">Question Bank</h2>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={closeQuestionBank}
                        >
                            Close
                        </Button>
                    </div>
                    <QuestionBankPanel
                        challengeId={activeQuestionBankId}
                        challengeTitle={activeChallenge.title}
                        questions={questions}
                    />
                </div>
            )}

            <ChallengeFormDialog
                mode={challengeFormMode}
                open={challengeFormOpen}
                onOpenChange={setChallengeFormOpen}
                challenge={editingChallenge as any}
            />

            <AlertDialog
                open={deletingChallenge !== null}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setDeletingChallenge(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete challenge?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently remove the selected
                            challenge.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={submitDeleteChallenge}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

AdminChallengesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: dashboard(),
        },
        {
            title: 'Management',
            href: adminChallengesIndex(),
        },
        {
            title: 'Challenges',
            href: adminChallengesIndex(),
        },
    ],
};
