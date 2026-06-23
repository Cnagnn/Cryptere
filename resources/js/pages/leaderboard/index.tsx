import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    CalendarDays,
    CalendarRange,
    Crown,
    Flame,
    Infinity as InfinityIcon,
    Medal,
    TrendingDown,
    TrendingUp,
    Trophy,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
    xp: number;
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

const TIMEFRAME_ICONS: Record<string, typeof CalendarDays> = {
    all: InfinityIcon,
    weekly: CalendarDays,
    monthly: CalendarRange,
};

const OVERALL_LABELS: Record<string, string> = {
    points: 'Points',
    xp: 'XP',
    current_streak: 'Current Streak',
    longest_streak: 'Longest Streak',
};

const OVERALL_OPTIONS = ['points', 'xp', 'current_streak', 'longest_streak'] as const;

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
    sortBy: string;
    sortOrder: string;
    levelMin: number;
    levelMax: number;
};

function RankTrend({ change }: { change: 'up' | 'down' | 'same' | null }) {
    if (change === 'up') {
        return (
            <span className="inline-flex items-center gap-0.5 text-green-500" title="Rank naik">
                <TrendingUp className="size-3.5" />
            </span>
        );
    }

    if (change === 'down') {
        return (
            <span className="inline-flex items-center gap-0.5 text-red-400" title="Rank turun">
                <TrendingDown className="size-3.5" />
            </span>
        );
    }

    return null;
}

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
    sortBy,
    sortOrder,
    levelMin,
    levelMax,
}: Props) {
    const getInitials = useInitials();
    const pointsFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
    const [usernameInput, setUsernameInput] = useState('');
    const [usernameFilter, setUsernameFilter] = useState('');
    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setUsernameFilter(usernameInput);
        }, 250);

        return () => clearTimeout(timer);
    }, [usernameInput]);

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
                cell: ({ row }) => (
                    <div className="flex items-center justify-center gap-1.5">
                        <RankDisplay rank={row.original.rank} />
                        <RankTrend change={row.original.rankChange} />
                    </div>
                ),
            },
            {
                accessorKey: 'username',
                header: 'Username',
                cell: ({ row }) => (
                    <div className="flex justify-center">
                        <div className="grid w-64 grid-cols-[2rem_1fr] items-center gap-3 text-left">
                            <Avatar className="size-8 rounded-none">
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

    const buildQuery = useCallback(
        (overrides: Record<string, string | number>) => ({
            timeframe,
            page: 1,
            per_page: leaders.per_page,
            sort_by: sortBy,
            sort_order: sortOrder,
            level_min: levelMin,
            level_max: levelMax,
            ...overrides,
        }),
        [timeframe, leaders.per_page, sortBy, sortOrder, levelMin, levelMax],
    );

    const navigate = (overrides: Record<string, string | number>) => {
        router.get(
            leaderboardIndex.url({ query: buildQuery(overrides) }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const handleSortOrderToggle = () => {
        navigate({ sort_order: sortOrder === 'desc' ? 'asc' : 'desc' });
    };

    const handleLevelFilter = () => {
        const minEl = document.getElementById('level-min') as HTMLInputElement | null;
        const maxEl = document.getElementById('level-max') as HTMLInputElement | null;
        navigate({
            level_min: minEl ? parseInt(minEl.value, 10) || 0 : 0,
            level_max: maxEl ? parseInt(maxEl.value, 10) || 0 : 0,
        });
    };

    // Debounced level filter — auto-submit on Enter or after user stops typing
    const levelFilterTimer = useRef<ReturnType<typeof setTimeout>>(null);
    const handleLevelInput = () => {
        if (levelFilterTimer.current) {
clearTimeout(levelFilterTimer.current);
}

        levelFilterTimer.current = setTimeout(handleLevelFilter, 400);
    };

    return (
        <>
            <Head title="Leaderboard" />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-4">
                <header className="animate-fade-in-up flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                        <TypographyH1>Leaderboard</TypographyH1>
                        <TypographyMuted>
                            Live ranking based on points earned from lessons and
                            course completions.
                        </TypographyMuted>
                    </div>

                    {/* Controls: all filters right-aligned, sejajar dengan deskripsi */}
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <Input
                            value={usernameInput}
                            onChange={(event) =>
                                setUsernameInput(event.target.value)
                            }
                            placeholder="Search username..."
                            className="w-40 h-8 text-xs"
                        />

                        <Select
                            value={timeframe}
                            onValueChange={(v) => navigate({ timeframe: v })}
                        >
                            <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {timeframes.map((tf) => {
                                    const Icon = TIMEFRAME_ICONS[tf] ?? null;

                                    return (
                                        <SelectItem key={tf} value={tf}>
                                            <span className="inline-flex items-center gap-1.5">
                                                {Icon ? (
                                                    <Icon className="size-3.5" />
                                                ) : null}
                                                {TIMEFRAME_LABELS[tf] ?? tf}
                                            </span>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>

                        <Select
                            value={sortBy}
                            onValueChange={(v) => navigate({ sort_by: v })}
                        >
                            <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {OVERALL_OPTIONS.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                        {OVERALL_LABELS[opt]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleSortOrderToggle}
                            title={sortOrder === 'desc' ? 'Descending' : 'Ascending'}
                        >
                            {sortOrder === 'desc' ? (
                                <ArrowDown className="size-3.5" />
                            ) : (
                                <ArrowUp className="size-3.5" />
                            )}
                        </Button>

                        <Input
                            id="level-min"
                            type="number"
                            defaultValue={levelMin || ''}
                            placeholder="Min Lv"
                            className="w-20 h-8 text-xs"
                            min={1}
                            onInput={handleLevelInput}
                            onKeyDown={(e) => e.key === 'Enter' && handleLevelFilter()}
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <Input
                            id="level-max"
                            type="number"
                            defaultValue={levelMax || ''}
                            placeholder="Max Lv"
                            className="w-20 h-8 text-xs"
                            min={1}
                            onInput={handleLevelInput}
                            onKeyDown={(e) => e.key === 'Enter' && handleLevelFilter()}
                        />
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
                        className="animate-fade-in-up grid grid-cols-1 items-end gap-3 sm:grid-cols-3"
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
                                        Leaderboard is Empty
                                    </EmptyTitle>
                                    <EmptyDescription>
                                        No participant points have been recorded
                                        yet. Complete lessons to appear here.
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
                                        onPageChange={(nextPage) =>
                                            navigate({ page: nextPage })
                                        }
                                        onPageSizeChange={(nextSize) =>
                                            navigate({
                                                page: 1,
                                                per_page: nextSize,
                                            })
                                        }
                                        footerInfo={`Showing ${leaders.from ?? 0} - ${leaders.to ?? 0} of ${leaders.total} participants`}
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
                                        participants
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
                                                    navigate({
                                                        page:
                                                            leaders.current_page -
                                                            1,
                                                    })
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
                                                    navigate({
                                                        page:
                                                            leaders.current_page +
                                                            1,
                                                    })
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

/* ─── Podium Section (Geist + shadcn/ui redesign) ─── */

const PODIUM_ORDER = [1, 0, 2] as const; // Display: #2, #1, #3

const PODIUM_STYLES = [
    // #1 — Gold accent
    {
        card: 'border-amber-500/30 bg-linear-to-b from-amber-500/5 to-transparent',
        rankBg: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
        avatarRing: 'ring-amber-500/30',
        badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    },
    // #2 — Silver accent
    {
        card: 'border-slate-400/25 bg-linear-to-b from-slate-400/5 to-transparent',
        rankBg: 'bg-slate-400/10 text-slate-400 ring-slate-400/20',
        avatarRing: 'ring-slate-400/30',
        badge: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
    },
    // #3 — Bronze accent
    {
        card: 'border-amber-700/25 bg-linear-to-b from-amber-700/5 to-transparent',
        rankBg: 'bg-amber-700/10 text-amber-700 ring-amber-700/20',
        avatarRing: 'ring-amber-700/30',
        badge: 'bg-amber-700/10 text-amber-700 border-amber-700/20',
    },
] as const;

function PodiumSection({
    top3,
    pointsFormatter,
}: {
    top3: LeaderboardEntry[];
    pointsFormatter: Intl.NumberFormat;
}) {
    const getInitials = useInitials();
    const ordered = PODIUM_ORDER.map((i) => top3[i]).filter(Boolean);

    if (ordered.length === 0) {
        return null;
    }

    const gridCols =
        ordered.length === 1
            ? 'grid-cols-1 max-w-xs mx-auto'
            : ordered.length === 2
              ? 'grid-cols-2 max-w-lg mx-auto'
              : 'grid-cols-3';

    return (
        <div className={cn('grid gap-4', gridCols)}>
            {ordered.map((entry) => {
                const rankIndex = entry.rank - 1;
                const style = PODIUM_STYLES[rankIndex];
                const isFirst = entry.rank === 1;

                return (
                    <Card
                        key={entry.id}
                        className={cn(
                            'relative flex flex-col items-center gap-4 overflow-hidden border p-6 transition-shadow hover:shadow-md',
                            style.card,
                            isFirst && 'shadow-lg shadow-amber-500/5',
                        )}
                    >
                        {/* Rank badge — top-right */}
                        <div
                            className={cn(
                                'absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
                                style.rankBg,
                            )}
                        >
                            {isFirst && (
                                <Crown className="size-3" />
                            )}
                            #{entry.rank}
                        </div>

                        {/* Avatar */}
                        <Avatar
                            className={cn(
                                'ring-2 ring-offset-2 ring-offset-background',
                                style.avatarRing,
                                isFirst ? 'size-20' : 'size-16',
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
                                className={cn(
                                    'font-medium',
                                    isFirst ? 'text-lg' : 'text-sm',
                                )}
                            >
                                {getInitials(entry.username ?? entry.name)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex flex-col items-center gap-1 text-center">
                            <span
                                className={cn(
                                    'font-semibold leading-tight',
                                    isFirst ? 'text-base' : 'text-sm',
                                )}
                            >
                                @{entry.username ?? 'unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {entry.name}
                            </span>
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <Flame className="size-3 fill-orange-500 text-orange-500" />
                                {entry.longestStreak}d
                            </span>
                            <span>Lv.{entry.level}</span>
                        </div>

                        {/* Points — prominent */}
                        <div className="flex flex-col items-center">
                            <span
                                className={cn(
                                    'font-bold tabular-nums tracking-tight',
                                    isFirst ? 'text-2xl' : 'text-xl',
                                )}
                            >
                                {pointsFormatter.format(entry.points)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                points
                            </span>
                        </div>

                        {/* Rank trend */}
                        {entry.rankChange && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    'text-xs',
                                    style.badge,
                                )}
                            >
                                <RankTrend change={entry.rankChange} />
                                <span className="ml-1">
                                    {entry.rankChange === 'up'
                                        ? 'Rising'
                                        : entry.rankChange === 'down'
                                          ? 'Slipping'
                                          : 'Steady'}
                                </span>
                            </Badge>
                        )}
                    </Card>
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
                            <div className="flex w-10 shrink-0 items-center justify-center gap-0.5">
                                <RankDisplay rank={entry.rank} />
                                <RankTrend change={entry.rankChange} />
                            </div>

                            <Avatar className="size-10 shrink-0 rounded-none">
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
