import { Deferred, Head, Link, usePage, usePoll } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Activity,
    ArrowUpDown,
    ArrowUpRight,
    BookOpen,
    CheckCircle2,
    Clock,
    Crown,
    Flame,
    GraduationCap,
    Lock,
    MapPin,
    Swords,
    Target,
    TrendingUp,
    Users,
    Zap,
} from 'lucide-react';
import { useMemo } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from 'recharts';

import type { Auth, UserLevel } from '@/types/auth';

import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DataTable } from '@/components/ui/data-table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { index as coursesIndex, show as coursesShow } from '@/routes/courses';
import { index as leaderboardIndex } from '@/routes/leaderboard';

type LearnerStats = { enrolledCourses: number; completedCourses: number; completedLessons: number; solvedChallenges: number; points: number };
type AcademyHero = { greeting: string; headline: string; description: string; completionRate: number };
type LearningPathSummary = { name: string; completedModules: number; totalModules: number; progressPercentage: number; currentRank: number };
type SuccessMetrics = { overallSuccessRate: number; previousSuccessRate: number; targetRate: number; totalEnrollments: number; completedEnrollments: number; inProgressEnrollments: number };
type LeaderboardEntry = { rank: number; name: string; username: string | null; avatar: string | null; points: number; isCurrentUser?: boolean };
type ActivityBreakdownItem = { label: string; count: number; percentage: number };
type MonthlyProgressEntry = { month: string; lessonsCompleted: number; challengesSolved: number; totalActivity: number };
type MonthlyProgress = { rangeLabel: string; summaryPercentage: number; deltaFromPrevious: number; series: MonthlyProgressEntry[] };
type AcademyData = { hero: AcademyHero; learningPath: LearningPathSummary; successMetrics: SuccessMetrics; leaderboardPreview: LeaderboardEntry[]; activityBreakdown: ActivityBreakdownItem[]; monthlyProgress: MonthlyProgress; popularCourses: unknown[]; recentActivity: unknown[] };
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

const monthlyProgressConfig: ChartConfig = { lessonsCompleted: { label: 'Lessons', color: 'var(--chart-1)' }, challengesSolved: { label: 'Challenges', color: 'var(--chart-2)' } };
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
        header: 'User',
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Avatar size="sm">
                    {row.original.avatar && <AvatarImage src={row.original.avatar} alt={row.original.name} />}
                    <AvatarFallback>{initials(row.original.username ?? row.original.name)}</AvatarFallback>
                </Avatar>
                <span className={cn('truncate text-sm font-medium', row.original.isCurrentUser && 'text-primary')}>
                    {row.original.username ? `@${row.original.username}` : row.original.name}
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

const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function NodeStatus({ node }: { node: PathNode }) {
    if (node.isLocked) return <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Lock className="size-4" /><span>Requires: {node.prerequisiteTitle}</span></div>;
    if (node.isCompleted) return <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400"><CheckCircle2 className="size-4" /><span>Completed</span></div>;
    if (node.isEnrolled) return <div className="flex flex-col gap-1"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">In Progress</span><span className="font-medium">{node.progressPercentage}%</span></div><Progress value={node.progressPercentage} className="h-2" /></div>;
    return <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" /><span>Not started</span></div>;
}

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

function LearnerDashboard({ stats, level, academy, learningPath, analytics }: { stats: LearnerStats; level?: UserLevel; academy: AcademyData; learningPath?: LearningPathData; analytics?: AnalyticsData }) {
    const { auth } = usePage<{ auth: Auth }>().props;

    // Poll leaderboard data every 30 seconds
    usePoll(30_000, { only: ['academy'] });

    // Learning path grouping
    const grouped = useMemo(() => {
        if (!learningPath) return {};
        return learningPath.nodes.reduce<Record<string, PathNode[]>>((acc, node) => {
            const cat = node.category ?? 'General';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(node);
            return acc;
        }, {});
    }, [learningPath]);

    const totalCourses = learningPath?.nodes.length ?? 0;
    const completedCourses = learningPath?.nodes.filter((n) => n.isCompleted).length ?? 0;
    const overallProgress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

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
                        <CardDescription>Total XP</CardDescription>
                        <CardTitle className="text-2xl leading-tight tracking-tight tabular-nums">{formatNumber(stats.points)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">Lifetime points</div>
                    </CardContent>
                </Card>
            </section>

            {/* ── Monthly Progress Chart (full width) ── */}
            <section>
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Progress</CardTitle>
                        <CardDescription>{academy.monthlyProgress.rangeLabel}</CardDescription>
                        <CardAction>
                            <Badge variant="outline">
                                <TrendingUp data-icon="inline-start" />
                                {academy.monthlyProgress.deltaFromPrevious > 0 ? '+' : ''}{academy.monthlyProgress.deltaFromPrevious}%
                            </Badge>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={monthlyProgressConfig} className="h-72 w-full">
                            <BarChart data={academy.monthlyProgress.series} accessibilityLayer>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar dataKey="lessonsCompleted" fill="var(--color-lessonsCompleted)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="challengesSolved" fill="var(--color-challengesSolved)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </section>

            {/* ── Activity Breakdown + Streak & Calendar ── */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Activity Breakdown */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Activity Breakdown</CardDescription>
                        <CardTitle className="text-2xl leading-tight tracking-tight">
                            {level ? `Lv.${level.level} ${level.name}` : 'Getting Started'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {level ? (
                            <div className="mb-4 flex flex-col gap-1.5">
                                <Progress value={level.progress} className="h-2" />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="tabular-nums">{level.current_xp.toLocaleString()} / {level.next_level_xp ? `${level.next_level_xp.toLocaleString()} XP` : 'Max Level'}</span>
                                    <span className="tabular-nums font-medium">{level.progress}%</span>
                                </div>
                            </div>
                        ) : (
                            <p className="mb-4 text-sm text-muted-foreground">Complete activities to level up!</p>
                        )}
                        <div className="flex flex-col gap-3">
                            {academy.activityBreakdown.map((item) => {
                                const icon = item.label === 'Lessons' ? BookOpen : item.label === 'Challenges' ? Swords : GraduationCap;
                                const color = item.label === 'Lessons' ? 'text-blue-500' : item.label === 'Challenges' ? 'text-orange-500' : 'text-emerald-500';
                                const Icon = icon;
                                return (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-md bg-muted', color)}>
                                            <Icon className="size-4" />
                                        </div>
                                        <div className="flex flex-1 flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{item.label}</span>
                                                <span className="text-sm font-semibold tabular-nums">{item.count}</span>
                                            </div>
                                            <Progress value={item.percentage} className="h-1.5" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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

            {/* ── Learning Path (full width, collapsible) ── */}
            {learningPath && learningPath.nodes.length > 0 && (
                <section>
                    <Card>
                        <CardHeader>
                            <CardTitle>Learning Path</CardTitle>
                            <CardDescription>{academy.learningPath.name}</CardDescription>
                            <CardAction>
                                <Badge variant="outline">
                                    {completedCourses} / {totalCourses} completed
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Overall progress</span>
                                    <span className="font-semibold tabular-nums">{overallProgress}%</span>
                                </div>
                                <Progress value={overallProgress} className="h-2.5" />
                            </div>

                            <Accordion type="multiple" defaultValue={Object.keys(grouped).slice(0, 1)} className="w-full">
                                {Object.entries(grouped).map(([category, courseNodes]) => (
                                    <AccordionItem key={category} value={category}>
                                        <AccordionTrigger>
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold">{category}</span>
                                                <Badge variant="secondary">
                                                    {courseNodes.filter((n) => n.isCompleted).length}/{courseNodes.length}
                                                </Badge>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="flex flex-col gap-3">
                                                {courseNodes.map((node) => (
                                                    <div
                                                        key={node.id}
                                                        className={cn(
                                                            'rounded-lg border p-4 transition-all',
                                                            node.isLocked && 'opacity-60',
                                                            !node.isLocked && 'hover:bg-muted/50',
                                                        )}
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-medium">
                                                                    {node.isLocked ? (
                                                                        <span className="flex items-center gap-2">
                                                                            <Lock className="size-4 text-muted-foreground" />
                                                                            {node.title}
                                                                        </span>
                                                                    ) : (
                                                                        <Link href={coursesShow({ course: node.slug })} className="hover:text-primary hover:underline">
                                                                            {node.title}
                                                                        </Link>
                                                                    )}
                                                                </p>
                                                                {node.summary && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{node.summary}</p>}
                                                                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <BookOpen className="size-3.5" />
                                                                        {node.lessonCount} lessons
                                                                    </span>
                                                                    {node.estimatedMinutes && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="size-3.5" />
                                                                            {node.estimatedMinutes} min
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Badge variant="outline" className={difficultyColors[node.difficulty] ?? ''}>
                                                                {node.difficulty}
                                                            </Badge>
                                                        </div>
                                                        <div className="mt-3">
                                                            <NodeStatus node={node} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </section>
            )}


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
                            <BarChart data={admin.enrollmentTrends} accessibilityLayer><CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} /><YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="enrollments" fill="var(--color-enrollments)" radius={[4, 4, 0, 0]} /></BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>User Growth</CardTitle><CardDescription>New registrations per month (last 6 months)</CardDescription></CardHeader>
                    <CardContent>
                        <ChartContainer config={userGrowthConfig} className="h-62.5 w-full">
                            <AreaChart data={admin.userGrowth} accessibilityLayer>
                                <CartesianGrid vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} /><YAxis tickLine={false} axisLine={false} tickMargin={8} allowDecimals={false} /><ChartTooltip content={<ChartTooltipContent />} />
                                <defs><linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-users)" stopOpacity={0.8} /><stop offset="95%" stopColor="var(--color-users)" stopOpacity={0.1} /></linearGradient></defs>
                                <Area dataKey="users" type="monotone" fill="url(#fillUsers)" stroke="var(--color-users)" strokeWidth={2} />
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
