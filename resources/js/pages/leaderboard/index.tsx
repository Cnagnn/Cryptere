import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as leaderboardIndex } from '@/routes/leaderboard';

type LeaderboardEntry = {
    id: number;
    rank: number;
    name: string;
    username: string | null;
    avatar: string | null;
    points: number;
};

type CurrentUserStanding = {
    rank: number;
    points: number;
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
    currentUser: CurrentUserStanding;
    topScore: number;
};

export default function LeaderboardIndex({ leaders, currentUser, topScore }: Props) {
    const getInitials = useInitials();
    const pointsFormatter = useMemo(() => new Intl.NumberFormat('id-ID'), []);
    const [usernameInput, setUsernameInput] = useState('');
    const [usernameFilter, setUsernameFilter] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setUsernameFilter(usernameInput);
        }, 250);

        return () => clearTimeout(timer);
    }, [usernameInput]);

    const hasCurrentUserRank = currentUser.rank > 0;

    const columns = useMemo<ColumnDef<LeaderboardEntry>[]>(() => [
        {
            accessorKey: 'rank',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="mx-auto"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    aria-sort={column.getIsSorted() === false ? 'none' : column.getIsSorted() === 'asc' ? 'ascending' : 'descending'}
                >
                    Rank
                    <ArrowUpDown className="size-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span
                    className={cn(
                        'font-semibold',
                        row.original.rank === 1 && 'text-amber-400',
                        row.original.rank === 2 && 'text-slate-300',
                        row.original.rank === 3 && 'text-amber-600',
                    )}
                >
                    #{row.original.rank}
                </span>
            ),
        },
        {
            accessorKey: 'username',
            header: 'Username',
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <div className="grid w-56 grid-cols-[2rem_1fr] items-center gap-3 text-left">
                        <Avatar className="size-8 rounded-full">
                            <AvatarImage
                                src={row.original.avatar ?? undefined}
                                alt={row.original.username ? `@${row.original.username}` : row.original.name}
                            />
                            <AvatarFallback>
                                {getInitials(row.original.username ?? row.original.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="truncate text-sm font-medium">
                            @{row.original.username ?? 'unknown'}
                        </div>
                    </div>
                </div>
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
    ], [getInitials, pointsFormatter]);

    const handlePageChange = (nextPage: number): void => {
        router.get(
            leaderboardIndex.url({
                query: {
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

            <div className="flex flex-col gap-6 px-4 py-6">
                <header>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex flex-col gap-0">
                            <TypographyH1>Leaderboard</TypographyH1>
                            <TypographyMuted className="text-sm/6">
                                Live rankings based on points earned from lessons and challenge submissions.
                            </TypographyMuted>
                        </div>

                        <div className="w-full sm:w-auto">
                            <Input
                                value={usernameInput}
                                onChange={(event) => setUsernameInput(event.target.value)}
                                placeholder="Search username..."
                                className="w-full sm:w-80"
                            />
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Your standing</CardDescription>
                                <CardTitle className="text-2xl leading-tight tracking-tight">
                                    {hasCurrentUserRank
                                        ? `Rank #${currentUser.rank}`
                                        : 'Not ranked yet'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    {pointsFormatter.format(currentUser.points)} points
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Top score</CardDescription>
                                <CardTitle className="text-2xl leading-tight tracking-tight">
                                    {pointsFormatter.format(topScore)} pts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    Current first place benchmark
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardDescription>Points to #1</CardDescription>
                                <CardTitle className="text-2xl leading-tight tracking-tight">
                                    {pointsFormatter.format(Math.max(topScore - currentUser.points, 0))}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    {hasCurrentUserRank
                                        ? 'Keep solving challenges to close the gap'
                                        : 'Earn points from courses and challenges to appear in rankings'}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </header>

                <section className="grid gap-4">
                    <div className="flex flex-col gap-4">
                        {leaders.data.length === 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Leaderboard is empty</CardTitle>
                                    <CardDescription>
                                        No learner points have been recorded yet.
                                        Complete a lesson or solve a challenge to appear here.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ) : (
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
                            />
                        )}
                    </div>
                </section>
            </div>
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
