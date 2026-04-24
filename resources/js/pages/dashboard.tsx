import { Deferred, Head, Link, usePage, usePoll } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Activity,
    ArrowUpDown,
    ArrowUpRight,
    BookOpen,
    Clock,
    Crown,
    Flame,
    GraduationCap,
    Swords,
    Target,
    TrendingDown,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Label,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
    XAxis,
} from 'recharts';

/* ── EvilCharts-style custom bar shape (gradient fade) ── */
function GradientBar(props: React.SVGProps<SVGRectElement> & { dataKey?: string; prefix?: string }) {
    const { fill, x, y, width, height, dataKey, prefix = 'gradient-bar' } = props;
    const id = `${prefix}-${dataKey}`;
    return (
        <>
            <rect x={x} y={y} width={width} height={height} stroke="none" fill={`url(#${id})`} />
            <rect x={x} y={y} width={width} height={2} stroke="none" fill={fill} />
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fill} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={fill} stopOpacity={0} />
                </linearGradient>
            </defs>
        </>
    );
}

import type { Auth, UserLevel } from '@/types/auth';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DataTable } from '@/components/ui/data-table';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { index as coursesIndex } from '@/routes/courses';
import { index as leaderboardIndex } from '@/routes/leaderboard';

type LearnerStats = { enrolledCourses: number; completedCourses: number; completedLessons: number; solvedChallenges: number; points: number; xp: number };
type AcademyHero = { greeting: string; headline: string; description: string; completionRate: number };
type LearningPathSummary = { name: string; completedModules: number; totalModules: number; progressPercentage: number; currentRank: number };
type SuccessMetrics = { overallSuccessRate: number; previousSuccessRate: number; targetRate: number; totalEnrollments: number; completedEnrollments: number; inProgressEnrollments: number };
type LeaderboardEntry = { rank: number; name: string; username: string | null; avatar: string | null; points: number; isCurrentUser?: boolean };
type ActivityBreakdownItem = { label: string; completed: number; total: number; percentage: number };
type MonthlyProgressEntry = { month: string; lessonsCompleted: number; challengesSolved: number; totalActivity: number };
type MonthlyProgress = { rangeLabel: string; summaryPercentage: number; deltaFromPrevious: number; series: MonthlyProgressEntry[] };
type EarningsHistoryEntry = { label: string; points: number; xp: number };
type EarningsHistory = { deltaFromPrevious: number; weekly: EarningsHistoryEntry[]; monthly: EarningsHistoryEntry[] };
type AcademyData = { hero: AcademyHero; learningPath: LearningPathSummary; successMetrics: SuccessMetrics; leaderboardPreview: LeaderboardEntry[]; activityBreakdown: ActivityBreakdownItem[]; monthlyProgress: MonthlyProgress; earningsHistory: EarningsHistory; popularCourses: unknown[]; recentActivity: unknown[] };
type PathNode = { id: number; slug: string; title: string; summary: string | null; category: string | null; difficulty: string; pathPosition: number; prerequisiteId: number | null; prerequisiteTitle: string | null; lessonCount: number; estimatedMinutes: number | null; cover: string | null; isEnrolled: boolean; progressPercentage: number; isCompleted: boolean; isLocked: boolean };
type LearningPathData = { nodes: PathNode[]; categories: string[] };
type StreakCalendarEntry = { date: string; active: boolean; isToday?: boolean; isOutOfRange?: boolean; isFuture?: boolean };
type AnalyticsData = { stats: unknown; activityHeatmap: unknown[]; streakCalendar: StreakCalendarEntry[] };
type AdminStats = { totalUsers: number; totalCourses: number; totalChallenges: number; totalEnrollments: number; activeUsers: number; newUsersThisMonth: number };
type AdminEnrollmentTrend = { month: string; enrollments: number };
type AdminUserGrowth = { month: string; users: number };
type AdminCoursePerformance = { title: string; enrollments: number; completionRate: number };
type AdminChallengePerformance = { title: string; submissions: number; successRate: number };
type AdminRecentUser = { id: number; name: string; username: string | null; email: string; role: string; createdAt: string };
type AdminData = { stats: AdminStats; enrollmentTrends: AdminEnrollmentTrend[]; userGrowth: AdminUserGrowth[]; coursePerformance: AdminCoursePerformance[]; challengePerformance: AdminChallengePerformance[]; recentUsers: AdminRecentUser[] };

type Props = {
    stats?: LearnerStats;
    level?: UserLevel;
    academy?: AcademyData;
    learningPath?: LearningPathData;
    analytics?: AnalyticsData;
    admin?: AdminData;
};

const earningsHistoryConfig: ChartConfig = { points: { label: 'Points', color: 'var(--chart-1)' }, xp: { label: 'XP', color: 'var(--chart-3)' } };
const GLOW_WIDTH = 300;
const activityBreakdownConfig: ChartConfig = {
    percentage: { label: 'Progress' },
    xp: { label: 'XP', color: 'oklch(0.696 0.217 163.22)' },
    courses: { label: 'Courses', color: 'oklch(0.585 0.233 277.117)' },
    challenges: { label: 'Challenges', color: 'oklch(0.637 0.237 25.331)' },
};
const enrollmentTrendsConfig: ChartConfig = { enrollments: { label: 'Enrollments', color: 'var(--chart-1)' } };
const userGrowthConfig: ChartConfig = { users: { label: 'New Users', color: 'var(--chart-2)' } };


function initials(fullName: string): string {
    const names = fullName.trim().split(' ');
    if (names.length <= 1) return (names[0]?.charAt(0) ?? '').toUpperCase();
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
}

function formatNumber(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

const leaderboardColumns: ColumnDef<LeaderboardEntry>[] = [
    {
        accessorKey: 'rank',
        header: '#',
        cell: ({ row }) => {
            const rank = row.original.rank;
            const isCurrent = row.original.isCurrentUser;
            if (isCurrent) {
                return <span className="font-bold text-primary">#{rank}</span>;
            }
            if (rank <= 3) {
                return <span className={cn('font-bold', rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : 'text-amber-600')}>#{rank}</span>;
            }
            return <span className="text-muted-foreground">#{rank}</span>;
        },
    },
    {
        accessorKey: 'name',
        header: 'Username',
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Avatar size="sm">
                    <AvatarImage src={row.original.avatar ?? undefined} alt={`@${row.original.username ?? row.original.name}`} />
                    <AvatarFallback>{initials(row.original.username ?? row.original.name)}</AvatarFallback>
                </Avatar>
                <span className={cn('truncate text-sm font-medium', row.original.isCurrentUser && 'text-primary')}>
                    @{row.original.username ?? 'unknown'}
                    {row.original.isCurrentUser && <span className="ml-1 text-xs text-muted-foreground">(You)</span>}
                </span>
            </div>
        ),
    },
    {
        accessorKey: 'points',
        header: 'Points',
        cell: ({ row }) => <span className={cn('tabular-nums', row.original.isCurrentUser && 'text-primary')}>{row.original.points.toLocaleString()} pts</span>,
    },
];

function StreakCalendar({ data, footer }: { data: StreakCalendarEntry[]; footer?: React.ReactNode }) {
    const emptyCells = (7 - (data.length % 7)) % 7;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="grid grid-cols-7 gap-1">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, i) => (
                <div key={i} className="text-center text-xs text-muted-foreground">{day}</div>
            ))}
            {data.map((entry) => {
                const d = new Date(entry.date);
                const day = d.getDate();

                if (entry.isOutOfRange) {
                    return <div key={entry.date} className="aspect-square rounded-sm" />;
                }

                return (
                    <div
                        key={entry.date}
                        className={cn(
                            'flex aspect-square flex-col items-center justify-center rounded-sm',
                            entry.isFuture
                                ? 'bg-muted/40'
                                : entry.active
                                    ? 'bg-orange-400 dark:bg-orange-500'
                                    : 'bg-muted',
                            entry.isToday && 'ring-2 ring-orange-400 ring-offset-1 ring-offset-background',
                        )}
                        title={`${entry.date}: ${entry.isFuture ? 'Upcoming' : entry.active ? 'Active' : 'Inactive'}`}
                    >
                        <span className={cn('text-xs font-semibold leading-tight tabular-nums', entry.isFuture ? 'text-muted-foreground/40' : entry.active ? 'text-white' : 'text-muted-foreground/70')}>
                            {day}
                        </span>
                        <span className={cn('text-[9px] leading-none font-medium', entry.isFuture ? 'text-muted-foreground/30' : entry.active ? 'text-white/80' : 'text-muted-foreground/50')}>
                            {months[d.getMonth()]}
                        </span>
                    </div>
                );
            })}
            {footer && emptyCells > 0 && (
                <div className="flex items-center" style={{ gridColumn: `span ${emptyCells}` }}>
                    {footer}
                </div>
            )}
        </div>
    );
}

function EarningsChart({ data }: { data: EarningsHistoryEntry[] }) {
    const [xAxis, setXAxis] = useState<number | null>(null);

    return (
        <ChartContainer config={earningsHistoryConfig} className="h-72 w-full">
            <AreaChart
                accessibilityLayer
                data={data}
                onMouseMove={(state) => state.activeCoordinate && setXAxis(state.activeCoordinate.x)}
                onMouseLeave={() => setXAxis(null)}
            >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} tickFormatter={(v: string) => v.slice(0, 3)} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <defs>
                    <linearGradient id="eh-mask-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="white" />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                    <linearGradient id="eh-fill-points" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-points)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-points)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="eh-fill-xp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-xp)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-xp)" stopOpacity={0} />
                    </linearGradient>
                    {xAxis !== null && (
                        <mask id="eh-hover-mask">
                            <rect x={xAxis - GLOW_WIDTH / 2} y={0} width={GLOW_WIDTH} height="100%" fill="url(#eh-mask-grad)" />
                        </mask>
                    )}
                </defs>
                <Area dataKey="xp" type="natural" fill="url(#eh-fill-xp)" fillOpacity={0.4} stroke="var(--color-xp)" strokeWidth={0.8} mask="url(#eh-hover-mask)" />
                <Area dataKey="points" type="natural" fill="url(#eh-fill-points)" fillOpacity={0.4} stroke="var(--color-points)" strokeWidth={0.8} mask="url(#eh-hover-mask)" />
            </AreaChart>
        </ChartContainer>
    );
}

const earningsDescriptions = { weekly: 'Last 7 days', monthly: 'Last 12 months' } as const;

function EarningsHistoryChart({ earningsHistory }: { earningsHistory: EarningsHistory }) {
    const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
    const delta = earningsHistory.deltaFromPrevious;
    const isPositive = delta >= 0;

    return (
        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'weekly' | 'monthly')}>
            <Card>
                <CardHeader>
                    <CardTitle>
                        Earnings History
                        <Badge variant="outline" className={cn('ml-2 border-none', isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500')}>
                            {isPositive ? <TrendingUp /> : <TrendingDown />}
                            <span>{isPositive ? '+' : ''}{delta}%</span>
                        </Badge>
                    </CardTitle>
                    <CardDescription>{earningsDescriptions[period]}</CardDescription>
                    <CardAction>
                        <TabsList>
                            <TabsTrigger value="weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        </TabsList>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <TabsContent value="weekly">
                        <EarningsChart data={earningsHistory.weekly} />
                    </TabsContent>
                    <TabsContent value="monthly">
                        <EarningsChart data={earningsHistory.monthly} />
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    );
}

function LearnerDashboard({ stats, level, academy, learningPath, analytics }: { stats: LearnerStats; level?: UserLevel; academy: AcademyData; learningPath?: LearningPathData; analytics?: AnalyticsData }) {
    const { auth } = usePage<{ auth: Auth }>().props;

    // Poll leaderboard data every 30 seconds
    usePoll(30_000, { only: ['academy'] });

    return (
        <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
            {/* ── Greeting ── */}
            <section className="flex flex-col">
                <TypographyH1>{academy.hero.greeting}</TypographyH1>
                <TypographyMuted>{academy.hero.description}</TypographyMuted>
            </section>

            {/* ── KPI Stats (4 cards) ── */}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Enrolled Courses</CardDescription>
                        <CardTitle className="text-2xl leading-tight tracking-tight tabular-nums">{formatNumber(stats.enrolledCourses)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">{stats.completedCourses} completed</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Lessons Completed</CardDescription>
                        <CardTitle className="text-2xl leading-tight tracking-tight tabular-nums">{formatNumber(stats.completedLessons)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">{academy.learningPath.progressPercentage}% path progress</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Challenges Solved</CardDescription>
                        <CardTitle className="text-2xl leading-tight tracking-tight tabular-nums">{formatNumber(stats.solvedChallenges)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">{academy.successMetrics.overallSuccessRate}% success rate</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Total Points</CardDescription>
                        <CardTitle className="text-2xl leading-tight tracking-tight tabular-nums">{formatNumber(stats.points)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            {formatNumber(stats.xp)} XP{level?.bonus_percent ? ` · +${level.bonus_percent}% bonus` : ''}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* ── Earnings History (Points + XP) ── */}
            <EarningsHistoryChart earningsHistory={academy.earningsHistory} />

            {/* ── Activity Breakdown + Streak & Calendar ── */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Activity Breakdown — Radial Chart */}
                <Card className="flex flex-col">
                    <CardHeader className="items-center pb-0">
                        <CardDescription>Activity Breakdown</CardDescription>
                        <CardTitle>{level ? `Lv.${level.level} ${level.name}` : 'Getting Started'}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        <ChartContainer config={activityBreakdownConfig} className="mx-auto aspect-square max-h-[250px]">
                            <RadialBarChart
                                data={[
                                    { activity: 'xp', percentage: level?.progress ?? 0, completed: level?.current_xp ?? 0, total: level?.next_level_xp ?? 0, fill: 'var(--color-xp)' },
                                    ...academy.activityBreakdown.map((item) => ({
                                        activity: item.label.toLowerCase(),
                                        percentage: item.percentage,
                                        completed: item.completed,
                                        total: item.total,
                                        fill: `var(--color-${item.label.toLowerCase()})`,
                                    })),
                                ]}
                                innerRadius={30}
                                outerRadius={110}
                            >
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            hideLabel
                                            nameKey="activity"
                                            formatter={(value, name, item) => {
                                                const payload = item?.payload;
                                                const config = activityBreakdownConfig[payload?.activity as keyof typeof activityBreakdownConfig];
                                                return (
                                                    <div className="flex w-full items-center gap-2">
                                                        <div
                                                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                                            style={{ backgroundColor: payload?.fill }}
                                                        />
                                                        <div className="flex flex-1 items-center justify-between gap-4">
                                                            <span className="text-muted-foreground">{config?.label ?? name}</span>
                                                            <span className="font-mono font-medium tabular-nums text-foreground">
                                                                {payload?.completed?.toLocaleString()} / {payload?.total?.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                        />
                                    }
                                />
                                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                                                return (
                                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                                                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 14} className="fill-muted-foreground text-[10px]">
                                                            Level
                                                        </tspan>
                                                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 10} className="fill-foreground text-2xl font-bold">
                                                            {level?.level ?? 0}
                                                        </tspan>
                                                    </text>
                                                );
                                            }
                                        }}
                                    />
                                </PolarRadiusAxis>
                                <RadialBar dataKey="percentage" background cornerRadius={10} className="drop-shadow-lg" />
                            </RadialBarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Streak & Calendar */}
                <Card>
                    <CardHeader>
                        <CardTitle>Streak & Calendar</CardTitle>
                        <CardDescription>Activity overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Deferred data="analytics.streakCalendar" fallback={<Skeleton className="h-45 w-full" />}>
                            {analytics?.streakCalendar ? (
                                <StreakCalendar
                                    data={analytics.streakCalendar}
                                    footer={
                                        <div className="flex w-full items-center justify-between pl-1">
                                            <div className="flex items-center gap-2">
                                                <Flame className="size-4 text-orange-500" />
                                                <span className="text-sm font-semibold tabular-nums">{auth.user.current_streak} day streak</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground tabular-nums">Best: {auth.user.longest_streak}d</span>
                                        </div>
                                    }
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">Streak data is not available.</p>
                            )}
                        </Deferred>
                    </CardContent>
                </Card>

                {/* Leaderboard */}
                <Card>
                    <CardHeader>
                        <CardTitle>Leaderboard</CardTitle>
                        <CardDescription>Top learners this month</CardDescription>
                        <CardAction>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={leaderboardIndex()}>View All<ArrowUpRight data-icon="inline-end" /></Link>
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const top = academy.leaderboardPreview;
                            const myRank = academy.learningPath.currentRank;
                            const isInTop = top.some((e) => e.rank === myRank);
                            const data = isInTop
                                ? top
                                : [...top, { rank: myRank, name: auth.user.name, username: auth.user.username, avatar: auth.user.avatar ?? null, points: auth.user.points, isCurrentUser: true }];
                            return (
                                <DataTable
                                    columns={leaderboardColumns}
                                    data={data}
                                    showFilterInput={false}
                                    showColumnToggle={false}
                                    showPageInfo={false}
                                    showFooter={false}
                                    centered
                                />
                            );
                        })()}
                    </CardContent>
                </Card>
            </section>




        </div>
    );
}

function AdminDashboard({ admin }: { admin: AdminData }) {
    const statCards = [
        { label: 'Total Users', value: admin.stats.totalUsers, icon: Users },
        { label: 'Total Courses', value: admin.stats.totalCourses, icon: BookOpen },
        { label: 'Total Challenges', value: admin.stats.totalChallenges, icon: Swords },
        { label: 'Total Enrollments', value: admin.stats.totalEnrollments, icon: GraduationCap },
        { label: 'Active Users (30d)', value: admin.stats.activeUsers, icon: Activity },
        { label: 'New This Month', value: admin.stats.newUsersThisMonth, icon: TrendingUp },
    ];

    const courseColumns = useMemo<ColumnDef<AdminCoursePerformance>[]>(() => [
        { accessorKey: 'title', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Course<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <span className="max-w-40 truncate font-medium">{row.original.title}</span> },
        { accessorKey: 'enrollments', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Enrollments<ArrowUpDown className="size-4" /></Button> },
        { accessorKey: 'completionRate', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Completion<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <Badge variant={row.original.completionRate >= 50 ? 'default' : 'secondary'}>{row.original.completionRate}%</Badge> },
    ], []);

    const challengeColumns = useMemo<ColumnDef<AdminChallengePerformance>[]>(() => [
        { accessorKey: 'title', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Challenge<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <span className="max-w-40 truncate font-medium">{row.original.title}</span> },
        { accessorKey: 'submissions', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Submissions<ArrowUpDown className="size-4" /></Button> },
        { accessorKey: 'successRate', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Success<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <Badge variant={row.original.successRate >= 50 ? 'default' : 'secondary'}>{row.original.successRate}%</Badge> },
    ], []);

    const userColumns = useMemo<ColumnDef<AdminRecentUser>[]>(() => [
        { accessorKey: 'name', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>User<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <div className="flex items-center gap-2"><Avatar size="sm"><AvatarFallback>{initials(row.original.name)}</AvatarFallback></Avatar><div><p className="text-sm font-medium">{row.original.name}</p>{row.original.username && <p className="text-xs text-muted-foreground">@{row.original.username}</p>}</div></div> },
        { accessorKey: 'email', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Email<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span> },
        { accessorKey: 'role', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Role<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <Badge variant={row.original.role === 'admin' ? 'default' : 'secondary'}>{row.original.role}</Badge> },
        { accessorKey: 'createdAt', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Joined<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <span className="text-muted-foreground">{row.original.createdAt}</span> },
    ], []);

    return (
        <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
            <section className="flex flex-col gap-2"><TypographyH1>Analytics Dashboard</TypographyH1><TypographyMuted>Platform overview and performance metrics.</TypographyMuted></section>

            <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
                {statCards.map((s) => <Card key={s.label}><CardHeader><CardDescription>{s.label}</CardDescription><CardTitle className="text-2xl">{formatNumber(s.value)}</CardTitle></CardHeader><CardContent><s.icon className="size-5 text-muted-foreground" /></CardContent></Card>)}
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Enrollment Trends</CardTitle><CardDescription>New enrollments per month (last 6 months)</CardDescription></CardHeader>
                    <CardContent>
                        <ChartContainer config={enrollmentTrendsConfig} className="h-62.5 w-full">
                            <BarChart data={admin.enrollmentTrends} accessibilityLayer>
                                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v: string) => v.slice(0, 3)} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Bar dataKey="enrollments" shape={<GradientBar prefix="enrollment" />} fill="var(--color-enrollments)" />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>User Growth</CardTitle><CardDescription>New registrations per month (last 6 months)</CardDescription></CardHeader>
                    <CardContent>
                        <ChartContainer config={userGrowthConfig} className="h-62.5 w-full">
                            <AreaChart data={admin.userGrowth} accessibilityLayer>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => v.slice(0, 3)} />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                <defs>
                                    <linearGradient id="gradient-user-growth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="var(--color-users)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <Area dataKey="users" type="monotone" fill="url(#gradient-user-growth)" fillOpacity={0.4} stroke="var(--color-users)" strokeWidth={0.8} strokeDasharray="3 3" />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Top Courses</CardTitle><CardDescription>By enrollment count</CardDescription></CardHeader>
                    <CardContent>{admin.coursePerformance.length === 0 ? <p className="text-sm text-muted-foreground">No published courses yet.</p> : <DataTable columns={courseColumns} data={admin.coursePerformance} centered showFilterInput={false} showFooter={false} enableDefaultIdSort={false} />}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Top Challenges</CardTitle><CardDescription>By submission count</CardDescription></CardHeader>
                    <CardContent>{admin.challengePerformance.length === 0 ? <p className="text-sm text-muted-foreground">No published challenges yet.</p> : <DataTable columns={challengeColumns} data={admin.challengePerformance} centered showFilterInput={false} showFooter={false} enableDefaultIdSort={false} />}</CardContent>
                </Card>
            </section>

            <section>
                <Card>
                    <CardHeader><CardTitle>Recent Registrations</CardTitle><CardDescription>Newest users on the platform</CardDescription></CardHeader>
                    <CardContent>{admin.recentUsers.length === 0 ? <p className="text-sm text-muted-foreground">No users registered yet.</p> : <DataTable columns={userColumns} data={admin.recentUsers} centered showFilterInput={false} showFooter={false} enableDefaultIdSort={false} />}</CardContent>
                </Card>
            </section>
        </div>
    );
}

export default function Dashboard({ stats, level, academy, learningPath, analytics, admin }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAdmin = auth.user.is_admin;
    return (
        <>
            <Head title="Dashboard" />
            {isAdmin && admin ? <AdminDashboard admin={admin} /> : stats && academy ? <LearnerDashboard stats={stats} level={level} academy={academy} learningPath={learningPath} analytics={analytics} /> : null}
        </>
    );
}
