import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Crown, Flame, Medal, Trophy } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';

import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as coursesIndex } from '@/routes/courses';
import { index as leaderboardIndex } from '@/routes/leaderboard';

type LeaderboardEntry = {
    id: number;
    rank: number;
    name: string;
    username: string | null;
    avatar: string | null;
    points: number;
    level: number;
    longestStreak: number;
    currentStreak: number;
    rankChange: 'up' | 'down' | 'same' | null;
};

type CurrentUserStanding = {
    id: number;
    rank: number;
    points: number;
    nextRankPoints: number | null;
};

const TIMEFRAME_LABELS: Record<string, string> = {
    all: 'All Time',
    weekly: 'Weekly',
    monthly: 'Monthly',
};

type Props = {
    leaders: {
        data: LeaderboardEntry[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    top3: LeaderboardEntry[];
    currentUser: CurrentUserStanding;
    timeframe: string;
    timeframes: string[];
};

function RankDisplay({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                <Crown className="animate-pulse" data-icon />
                #1
            </span>
        );
    }

    if (rank === 2) {
        return (
            <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                <Medal data-icon />
                #2
            </span>
        );
    }

    if (rank === 3) {
        return (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                <Medal data-icon />
                #3
            </span>
        );
    }

    return <span className="font-semibold">#{rank}</span>;
}

export default function LeaderboardIndex({
    leaders,
    top3,
    currentUser,
    timeframe,
    timeframes,
}: Props) {
    const getInitials = useInitials();
    const pointsFormatter = useMemo(() => new Intl.NumberFormat('id-ID'), []);
    const [usernameInput, setUsernameInput] = useState('');
    const [usernameFilter, setUsernameFilter] = useState('');
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setUsernameFilter(usernameInput);
        }, 250);

        return () => clearTimeout(timer);
    }, [usernameInput]);

    // Track Inertia navigation for skeleton loading
    useEffect(() => {
        const removeStart = router.on('start', () => setIsNavigating(true));
        const removeFinish = router.on('finish', () => setIsNavigating(false));

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    const getRowClassName = useCallback(
        (row: LeaderboardEntry) => {
            if (row.id === currentUser.id) {
                return 'bg-primary/5 border-l-2 border-l-primary';
            }

            return undefined;
        },
        [currentUser.id],
    );

    const columns = useMemo<ColumnDef<LeaderboardEntry>[]>(
        () => [
            {
                accessorKey: 'rank',
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        className="mx-auto"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === 'asc')
                        }
                        aria-sort={
                            column.getIsSorted() === false
                                ? 'none'
                                : column.getIsSorted() === 'asc'
                                  ? 'ascending'
                                  : 'descending'
                        }
                    >
                        Rank
                        <ArrowUpDown className="size-4" />
                    </Button>
                ),
                cell: ({ row }) => <RankDisplay rank={row.original.rank} />,
            },
            {
                accessorKey: 'username',
                header: 'Username',
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <div className="grid w-64 grid-cols-[2rem_1fr] items-center gap-3 text-left">
                            <Avatar className="size-8 rounded-full">
                                <AvatarImage
                                    src={row.original.avatar ?? undefined}
                                    alt={
                                        row.original.username
                                            ? `@${row.original.username}`
                                            : row.original.name
                                    }
                                />
                                <AvatarFallback>
                                    {getInitials(
                                        row.original.username ??
                                            row.original.name,
                                    )}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2 truncate">
                                <span className="truncate text-sm font-medium">
                                    @{row.original.username ?? 'unknown'}
                                </span>
                                {row.original.id === currentUser.id ? (
                                    <Badge
                                        variant="secondary"
                                        className="shrink-0 text-xs"
                                    >
                                        You
                                    </Badge>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'level',
                header: 'Level',
                cell: ({ row }) => (
                    <span className="text-sm font-medium">
                        Lv.{row.original.level}
                    </span>
                ),
            },
            {
                accessorKey: 'longestStreak',
                header: 'Streak',
                cell: ({ row }) => (
                    <span className="inline-flex items-center gap-1 text-sm">
                        <Flame className="size-3.5 fill-orange-500 text-orange-500" />
                        <span className="font-medium tabular-nums">
                            {row.original.longestStreak}d
                        </span>
                    </span>
                ),
            },
            {
                accessorKey: 'points',
                header: 'Points',
                cell: ({ row }) => (
                    <div className="inline-flex items-center justify-center gap-2">
                        <span className="text-sm font-semibold">
                            {pointsFormatter.format(row.original.points)} pts
                        </span>
                    </div>
                ),
            },
        ],
        [getInitials, pointsFormatter, currentUser.id],
    );

    const handleTimeframeChange = (value: string): void => {
        router.get(
            leaderboardIndex.url({
                query: {
                    timeframe: value,
                    page: 1,
                    per_page: leaders.per_page,
                },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handlePageChange = (nextPage: number): void => {
        router.get(
            leaderboardIndex.url({
                query: {
                    timeframe,
                    page: nextPage,
                    per_page: leaders.per_page,
                },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handlePageSizeChange = (nextPageSize: number): void => {
        router.get(
            leaderboardIndex.url({
                query: {
                    timeframe,
                    page: 1,
                    per_page: nextPageSize,
                },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <>
            <Head title="Leaderboard" />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                <header className="animate-fade-in-up">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex flex-col gap-0">
                            <TypographyH1>Leaderboard</TypographyH1>
                            <TypographyMuted className="text-sm/6">
                                Live rankings based on points earned from
                                lessons and challenge submissions.
                            </TypographyMuted>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <Input
                                value={usernameInput}
                                onChange={(event) =>
                                    setUsernameInput(event.target.value)
                                }
                                placeholder="Search username..."
                                className="w-full sm:w-64"
                            />
                            <Tabs
                                value={timeframe}
                                onValueChange={handleTimeframeChange}
                            >
                                <TabsList>
                                    {timeframes.map((tf) => (
                                        <TabsTrigger key={tf} value={tf}>
                                            {TIMEFRAME_LABELS[tf] ?? tf}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </header>

                {/* Podium Top 3 */}
                {top3.length > 0 && !isNavigating ? (
                    <div
                        className="animate-fade-in-up"
                        style={{ animationDelay: '100ms' }}
                    >
                        <PodiumSection
                            top3={top3}
                            pointsFormatter={pointsFormatter}
                        />
                    </div>
                ) : isNavigating ? (
                    <div
                        className="animate-fade-in-up grid grid-cols-3 items-end gap-3"
                        style={{ animationDelay: '100ms' }}
                    >
                        {[2, 1, 3].map((rank) => (
                            <div
                                key={rank}
                                className={cn(
                                    'flex flex-col items-center gap-2',
                                    rank === 1 ? 'pb-4' : 'pb-0',
                                )}
                            >
                                <Skeleton
                                    className={cn(
                                        'rounded-full',
                                        rank === 1 ? 'size-20' : 'size-14',
                                    )}
                                />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        ))}
                    </div>
                ) : null}

                <section
                    className="animate-fade-in-up grid gap-4"
                    style={{ animationDelay: '200ms' }}
                >
                    <div className="flex flex-col gap-4">
                        {isNavigating ? (
                            <div className="flex flex-col gap-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        className="h-14 w-full rounded-lg"
                                    />
                                ))}
                            </div>
                        ) : leaders.data.length === 0 ? (
                            <Empty className="py-12">
                                <EmptyMedia variant="icon">
                                    <Trophy />
                                </EmptyMedia>
                                <EmptyHeader>
                                    <EmptyTitle>
                                        Leaderboard is empty
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        No learner points have been recorded
                                        yet. Complete a lesson or solve a
                                        challenge to appear here.
                                    </EmptyDescription>
                                </EmptyHeader>
                                <EmptyContent>
                                    <Button asChild>
                                        <Link href={coursesIndex()}>
                                            Browse Courses
                                        </Link>
                                    </Button>
                                </EmptyContent>
                            </Empty>
                        ) : (
                            <>
                                {/* Desktop: DataTable */}
                                <div className="hidden md:block">
                                    <DataTable
                                        columns={columns}
                                        data={leaders.data}
                                        filterColumn="username"
                                        filterValue={usernameFilter}
                                        onFilterChange={setUsernameFilter}
                                        showFilterInput={false}
                                        centered
                                        showColumnToggle={false}
                                        showPageInfo={false}
                                        page={leaders.current_page}
                                        pageCount={leaders.last_page}
                                        pageSize={leaders.per_page}
                                        onPageChange={handlePageChange}
                                        onPageSizeChange={handlePageSizeChange}
                                        footerInfo={`Showing ${leaders.from ?? 0} - ${leaders.to ?? 0} of ${leaders.total} learners`}
                                        getRowClassName={getRowClassName}
                                    />
                                </div>

                                {/* Mobile: Card-based layout */}
                                <div className="flex flex-col gap-2 md:hidden">
                                    <MobileLeaderboardCards
                                        entries={leaders.data}
                                        currentUserId={currentUser.id}
                                        pointsFormatter={pointsFormatter}
                                    />

                                    <div className="mt-2 text-center text-xs text-muted-foreground">
                                        Showing {leaders.from ?? 0} -{' '}
                                        {leaders.to ?? 0} of {leaders.total}{' '}
                                        learners
                                    </div>

                                    {leaders.last_page > 1 ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    leaders.current_page <= 1
                                                }
                                                onClick={() =>
                                                    handlePageChange(
                                                        leaders.current_page -
                                                            1,
                                                    )
                                                }
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm text-muted-foreground">
                                                {leaders.current_page} /{' '}
                                                {leaders.last_page}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    leaders.current_page >=
                                                    leaders.last_page
                                                }
                                                onClick={() =>
                                                    handlePageChange(
                                                        leaders.current_page +
                                                            1,
                                                    )
                                                }
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

/* ─── Podium Section ─── */

const PODIUM_ORDER = [1, 0, 2] as const; // Display order: #2, #1, #3
const PODIUM_COLORS = [
    'from-amber-400/20 to-amber-400/5 border-amber-400/30', // Gold (#1)
    'from-slate-300/20 to-slate-300/5 border-slate-300/30', // Silver (#2)
    'from-amber-600/20 to-amber-600/5 border-amber-600/30', // Bronze (#3)
];
const PODIUM_RING_COLORS = [
    'ring-amber-400/50', // Gold
    'ring-slate-300/50', // Silver
    'ring-amber-600/50', // Bronze
];
const PODIUM_HEIGHTS = ['h-28', 'h-20', 'h-16'];

function PodiumSection({
    top3,
    pointsFormatter,
}: {
    top3: LeaderboardEntry[];
    pointsFormatter: Intl.NumberFormat;
}) {
    const getInitials = useInitials();

    // Reorder: #2, #1, #3
    const ordered = PODIUM_ORDER.map((i) => top3[i]).filter(Boolean);

    if (ordered.length === 0) {
        return null;
    }

    const gridCols =
        ordered.length === 1
            ? 'grid-cols-1 max-w-48 mx-auto'
            : ordered.length === 2
              ? 'grid-cols-2 max-w-sm mx-auto'
              : 'grid-cols-3';

    return (
        <div className={cn('grid items-end gap-3', gridCols)}>
            {ordered.map((entry) => {
                const rankIndex = entry.rank - 1; // 0-based for color arrays
                const isFirst = entry.rank === 1;

                return (
                    <div
                        key={entry.id}
                        className="flex flex-col items-center gap-2"
                    >
                        <div className="relative">
                            {isFirst ? (
                                <Crown className="absolute -top-3 left-1/2 size-5 -translate-x-1/2 text-amber-400" />
                            ) : null}
                            <Avatar
                                className={cn(
                                    'ring-2',
                                    isFirst ? 'size-20' : 'size-14',
                                    PODIUM_RING_COLORS[rankIndex],
                                )}
                            >
                                <AvatarImage
                                    src={entry.avatar || undefined}
                                    alt={
                                        entry.username
                                            ? `@${entry.username}`
                                            : entry.name
                                    }
                                    onError={(e) =>
                                        (e.currentTarget.style.display = 'none')
                                    }
                                />
                                <AvatarFallback
                                    className={cn(isFirst && 'text-lg')}
                                >
                                    {getInitials(entry.username ?? entry.name)}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        <div className="flex flex-col items-center gap-0.5">
                            <span
                                className={cn(
                                    'text-center font-medium',
                                    isFirst ? 'text-sm' : 'text-xs',
                                )}
                            >
                                @{entry.username ?? 'unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {pointsFormatter.format(entry.points)} pts
                            </span>
                        </div>

                        {/* Podium bar */}
                        <div
                            className={cn(
                                'w-full rounded-t-lg border-t bg-linear-to-b',
                                PODIUM_COLORS[rankIndex],
                                PODIUM_HEIGHTS[rankIndex],
                            )}
                        >
                            <div className="flex h-full items-center justify-center">
                                <RankDisplay rank={entry.rank} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Mobile Card View ─── */

function MobileLeaderboardCards({
    entries,
    currentUserId,
    pointsFormatter,
}: {
    entries: LeaderboardEntry[];
    currentUserId: number;
    pointsFormatter: Intl.NumberFormat;
}) {
    const getInitials = useInitials();

    return (
        <>
            {entries.map((entry) => {
                const isCurrentUser = entry.id === currentUserId;

                return (
                    <Card
                        key={entry.id}
                        className={cn(
                            'gap-0',
                            isCurrentUser && 'border-primary/30 bg-primary/5',
                        )}
                    >
                        <CardContent className="flex items-center gap-3 py-3">
                            {/* Rank */}
                            <div className="flex w-10 shrink-0 items-center justify-center">
                                <RankDisplay rank={entry.rank} />
                            </div>

                            {/* Avatar */}
                            <Avatar className="size-10 shrink-0 rounded-full">
                                <AvatarImage
                                    src={entry.avatar ?? undefined}
                                    alt={
                                        entry.username
                                            ? `@${entry.username}`
                                            : entry.name
                                    }
                                />
                                <AvatarFallback>
                                    {getInitials(entry.username ?? entry.name)}
                                </AvatarFallback>
                            </Avatar>

                            {/* Info */}
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate text-sm font-medium">
                                        @{entry.username ?? 'unknown'}
                                    </span>
                                    {isCurrentUser ? (
                                        <Badge
                                            variant="secondary"
                                            className="shrink-0 text-xs"
                                        >
                                            You
                                        </Badge>
                                    ) : null}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Lv.{entry.level}</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-0.5">
                                        <Flame className="size-3 text-orange-500" />
                                        {entry.longestStreak}d
                                    </span>
                                </div>
                            </div>

                            {/* Points */}
                            <div className="shrink-0 text-right">
                                <span className="text-sm font-semibold">
                                    {pointsFormatter.format(entry.points)}
                                </span>
                                <span className="ml-0.5 text-xs text-muted-foreground">
                                    pts
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </>
    );
}

LeaderboardIndex.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: dashboard(),
        },
        {
            title: 'Leaderboard',
            href: leaderboardIndex(),
        },
    ],
};
