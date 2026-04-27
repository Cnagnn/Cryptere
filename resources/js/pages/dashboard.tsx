import { Deferred, Head, Link, usePage, usePoll } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Activity,
    AlertTriangle,
    ArrowUpDown,
    ArrowUpRight,
    Award,
    BookOpen,
    ClipboardCheck,
    Flame,
    FlaskConical,
    GraduationCap,
    Link2,

    Shield,
    Swords,
    Trophy,
    TrendingUp,
    UserCheck,
    Users,
    X,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
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
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ScrollArea } from '@/components/ui/scroll-area';

import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { index as coursesIndex, show as courseShow } from '@/routes/courses';
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
type RecentActivityItem = { id: string; title: string; tag: string; timestamp: string; isoDate: string };
type AcademyData = { hero: AcademyHero; learningPath: LearningPathSummary; successMetrics: SuccessMetrics; leaderboardPreview: LeaderboardEntry[]; activityBreakdown: ActivityBreakdownItem[]; monthlyProgress: MonthlyProgress; earningsHistory: EarningsHistory; popularCourses: unknown[]; recentActivity: RecentActivityItem[] };
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
type RecentCourse = { id: number | null; slug: string | null; title: string | null; summary: string | null; lessonCount: number | null; progressPercentage: number };
type DecayWarning = { daysUntilDecay: number; currentPoints: number; decayPercent: number };

type Props = {
    stats?: LearnerStats;
    level?: UserLevel;
    academy?: AcademyData;
    learningPath?: LearningPathData;
    analytics?: AnalyticsData;
    admin?: AdminData;
    decayWarning?: DecayWarning | null;
    recentCourses?: RecentCourse[];
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

function getTimeGreeting(name: string): { text: string; emoji: string; subtitle: string } {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: `Good morning, ${name}`, emoji: '☀️', subtitle: 'Ready to learn something new today?' };
    if (hour >= 12 && hour < 17) return { text: `Good afternoon, ${name}`, emoji: '👋', subtitle: 'Keep the momentum going!' };
    if (hour >= 17 && hour < 21) return { text: `Good evening, ${name}`, emoji: '🌆', subtitle: 'Wind down with a quick lesson?' };
    return { text: `Good night, ${name}`, emoji: '🌙', subtitle: 'A little late-night learning?' };
}

const ACTIVITY_TAG_CONFIG: Record<string, { icon: typeof BookOpen; label: string }> = {
    Lesson: { icon: BookOpen, label: 'Lesson' },
    Challenge: { icon: Swords, label: 'Challenge' },
    Course: { icon: GraduationCap, label: 'Course' },
    Badge: { icon: Award, label: 'Badge' },
    Quiz: { icon: ClipboardCheck, label: 'Quiz' },
    Lab: { icon: FlaskConical, label: 'Lab' },
    Account: { icon: UserCheck, label: 'Account' },
    Security: { icon: Shield, label: 'Security' },
    Social: { icon: Link2, label: 'Social' },
};
const DEFAULT_ACTIVITY_TAG = ACTIVITY_TAG_CONFIG.Lesson;

/* ── Decay Warning Banner ── */
function DecayWarningBanner({ warning, onDismiss }: { warning: DecayWarning; onDismiss: () => void }) {
    const isUrgent = warning.daysUntilDecay <= 1;
    return (
        <Alert variant={isUrgent ? 'destructive' : 'default'} className={cn('relative', !isUrgent && 'border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-400')}>
            <AlertTriangle className="size-4" />
            <AlertTitle className="font-semibold">
                {isUrgent ? 'Points decay tomorrow!' : `Points decay in ${warning.daysUntilDecay} days`}
            </AlertTitle>
            <AlertDescription className={cn(!isUrgent && 'text-amber-600/80 dark:text-amber-400/80')}>
                Complete a lesson or challenge to keep your {formatNumber(warning.currentPoints)} points safe from {warning.decayPercent}% decay.
            </AlertDescription>
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 size-6" onClick={onDismiss} aria-label="Dismiss decay warning">
                <X className="size-3.5" />
            </Button>
        </Alert>
    );
}

/* ── Continue Learning Section (stacked progress cards) ── */
function ContinueLearningSection({ courses }: { courses: RecentCourse[] }) {
    const inProgress = courses.filter((c) => c.progressPercentage > 0 && c.progressPercentage < 100);

    if (inProgress.length === 0) {
        return (
            <Card className="col-span-2 md:col-span-3 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Continue Learning</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                    <GraduationCap className="size-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No courses in progress. Start one!</p>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={coursesIndex.url()}>Browse Courses<ArrowUpRight data-icon="inline-end" /></Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-2 md:col-span-3 lg:col-span-4">
            <CardHeader className="gap-1">
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>{inProgress.length} {inProgress.length === 1 ? 'course' : 'courses'} in progress</CardDescription>
                <CardAction>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={coursesIndex.url()}>View All<ArrowUpRight data-icon="inline-end" /></Link>
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className={cn(inProgress.length > 3 && 'h-[13.5rem]')}>
                    <div className="flex flex-col gap-2 px-6 pb-6">
                        {inProgress.map((course) => (
                            <Link
                                key={course.id}
                                href={courseShow.url({ course: course.slug! })}
                                className="group relative overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/50"
                            >
                                {/* Progress background fill */}
                                <div
                                    className="absolute inset-y-0 left-0 bg-primary/5 transition-all"
                                    style={{ width: `${course.progressPercentage}%` }}
                                />
                                <div className="relative flex items-center gap-3 p-3">
                                    {/* Circular progress indicator */}
                                    <div className="relative flex size-10 shrink-0 items-center justify-center">
                                        <svg className="size-10 -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="2.5" />
                                            <circle
                                                cx="18" cy="18" r="15.5" fill="none"
                                                className="stroke-primary transition-all"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeDasharray={`${(course.progressPercentage / 100) * 97.4} 97.4`}
                                            />
                                        </svg>
                                        <span className="absolute text-[10px] font-bold tabular-nums">{Math.round(course.progressPercentage)}%</span>
                                    </div>
                                    {/* Course info */}
                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <p className="truncate text-sm font-medium">{course.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
                                        </p>
                                    </div>
                                    {/* Continue arrow */}
                                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

/* ── Activity Feed ── */
function ActivityFeedTimeline({ activities }: { activities: RecentActivityItem[] }) {
    if (activities.length === 0) {
        return (
            <Card className="col-span-2 md:col-span-3 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
                    <Activity className="size-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No recent activity yet. Start learning!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-2 flex flex-col md:col-span-3 lg:col-span-4">
            <CardHeader className="gap-1">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest actions</CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 p-0">
                <ScrollArea className="h-full max-h-56">
                    <div className="flex flex-col px-6 pb-6" role="list" aria-label="Recent activity feed">
                        {/* Timeline */}
                        <div className="relative flex flex-col">
                            {/* Vertical timeline line */}
                            <div className="absolute top-1 bottom-1 left-1.75 w-px bg-border" aria-hidden="true" />

                            {activities.map((item, idx) => {
                                const config = ACTIVITY_TAG_CONFIG[item.tag] ?? DEFAULT_ACTIVITY_TAG;
                                const Icon = config.icon;
                                const isLast = idx === activities.length - 1;
                                return (
                                    <div
                                        key={item.id ?? idx}
                                        className={cn(
                                            'group relative flex gap-3 pb-3',
                                            isLast && 'pb-0',
                                        )}
                                        role="listitem"
                                    >
                                        {/* Timeline dot */}
                                        <div className="relative z-10 flex size-3.75 shrink-0 items-center justify-center rounded-full bg-muted ring-2 ring-background">
                                            <Icon className="size-2.5 text-muted-foreground" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-px">
                                            <p className="truncate text-sm leading-tight">{item.title}</p>
                                            <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

const leaderboardColumns: ColumnDef<LeaderboardEntry>[] = [
    {
        accessorKey: 'rank',
        header: '#',
        cell: ({ row }) => {
            const rank = row.original.rank;
            const color = rank === 1 ? 'text-amber-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-amber-600' : 'text-foreground';
            return <span className={cn('font-bold', color)}>#{rank}</span>;
        },
    },
    {
        accessorKey: 'name',
        header: 'Username',
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Avatar size="sm">
                    <AvatarImage src={row.original.avatar || undefined} alt={`@${row.original.username ?? row.original.name}`} />
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
        <div className="grid grid-cols-7 gap-1" aria-label="Activity streak calendar" role="grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
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
                            'flex aspect-square flex-col items-center justify-center rounded-sm pointer-events-none',
                            entry.isFuture
                                ? 'bg-muted/40'
                                : entry.active
                                    ? 'bg-orange-400 dark:bg-orange-500'
                                    : 'bg-muted',
                            entry.isToday && 'ring-2 ring-orange-400 ring-offset-1 ring-offset-background',
                        )}
                    >
                        <span className={cn('text-xs font-semibold leading-tight tabular-nums', entry.isFuture ? 'text-muted-foreground/60' : entry.active ? 'text-white' : 'text-muted-foreground/70')}>
                            {day}
                        </span>
                        <span className={cn('text-[9px] leading-none font-medium', entry.isFuture ? 'text-muted-foreground/50' : entry.active ? 'text-white/80' : 'text-muted-foreground/60')}>
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



/* NOTE: LearnerDashboard has 7 props — at the threshold. If props exceed 8, group into a single `LearnerDashboardData` object prop. */
function LearnerDashboard({ stats, level, academy, learningPath, analytics, decayWarning, recentCourses }: { stats: LearnerStats; level?: UserLevel; academy: AcademyData; learningPath?: LearningPathData; analytics?: AnalyticsData; decayWarning?: DecayWarning | null; recentCourses?: RecentCourse[] }) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [showDecayWarning, setShowDecayWarning] = useState(true);

    // Poll leaderboard data every 30 seconds
    usePoll(30_000, { only: ['academy'] });

    const greeting = getTimeGreeting(auth.user.name);

    return (
        <div className="relative flex flex-col gap-4 px-4 pt-3 pb-4 lg:gap-6 lg:pt-3 lg:pb-6">
            {/* ── Decay Warning Banner ── */}
            {decayWarning && showDecayWarning && (
                <div className="animate-fade-in-up relative">
                    <DecayWarningBanner warning={decayWarning} onDismiss={() => setShowDecayWarning(false)} />
                </div>
            )}

            {/* ── Greeting ── */}
            <section className="animate-fade-in-up relative flex flex-col gap-1">
                <TypographyH1>
                    {greeting.text} {greeting.emoji}
                </TypographyH1>
                <TypographyMuted>
                    {auth.user.current_streak > 0
                        ? `${greeting.subtitle} You're on a ${auth.user.current_streak}-day streak! 🔥`
                        : greeting.subtitle}
                </TypographyMuted>
            </section>

            {/* ── Bento Grid: Unified grid with KPI + charts + cards ── */}
            <section className="animate-fade-in-up grid grid-cols-2 gap-3 md:grid-cols-6 lg:grid-cols-12" style={{ animationDelay: '100ms' }}>
                {/* Row 1: KPI Cards — 2×2 on mobile, 4 across on md+lg */}
                <Card className="md:col-span-3 lg:col-span-3">
                    <CardHeader className="gap-1">
                        <CardTitle>Total Points</CardTitle>
                        <CardDescription>Keep earning to climb up!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold tabular-nums">{formatNumber(stats.points)} <span className="text-sm font-medium text-muted-foreground">pts</span></p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-3 lg:col-span-3">
                    <CardHeader className="gap-1">
                        <CardTitle>Current Level & XP</CardTitle>
                        <CardDescription>You're doing great!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-4">
                            <p className="shrink-0 text-2xl font-semibold tabular-nums">Level {level?.level ?? 1}</p>
                            {level && level.next_level_xp && (
                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                    <Progress value={level.progress} className="h-1.5" />
                                    <div className="text-xs text-muted-foreground">
                                        <span>{formatNumber(level.current_xp)} / {formatNumber(level.next_level_xp)} XP</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card className="md:col-span-3 lg:col-span-3">
                    <CardHeader className="gap-1">
                        <CardTitle>Courses Completed</CardTitle>
                        <CardDescription>One step at a time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold tabular-nums">{stats.completedCourses} <span className="text-base font-normal text-muted-foreground">courses</span></p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-3 lg:col-span-3">
                    <CardHeader className="gap-1">
                        <CardTitle>Your Rank</CardTitle>
                        <CardDescription>Keep it up!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold tabular-nums">Rank #{academy.learningPath.currentRank}</p>
                    </CardContent>
                </Card>

                {/* Row 2: Area Chart (8 cols) + Streak Calendar (4 cols) */}
                <div className="col-span-2 flex md:col-span-4 lg:col-span-8 *:flex-1">
                    <ChartAreaInteractive weekly={academy.earningsHistory.weekly} monthly={academy.earningsHistory.monthly} />
                </div>

                <Card className="col-span-2 flex flex-col md:col-span-2 lg:col-span-4">
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <CardTitle>Streak & Calendar</CardTitle>
                                <CardDescription>Activity overview</CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                                    <Flame className="size-4 fill-orange-500 text-orange-500" />
                                    {auth.user.current_streak} days streak
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums">Best streak: {auth.user.longest_streak} days</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <Deferred data="analytics.streakCalendar" fallback={<Skeleton className="h-40 w-full" />}>
                            {analytics?.streakCalendar ? (
                                <StreakCalendar data={analytics.streakCalendar} />
                            ) : (
                                <p className="text-sm text-muted-foreground">Streak data is not available.</p>
                            )}
                        </Deferred>
                    </CardContent>
                </Card>

                {/* Row 3: Continue Learning (4 cols) + Recent Activity (4 cols) + Leaderboard (4 cols) */}
                <ContinueLearningSection courses={recentCourses ?? []} />
                <ActivityFeedTimeline activities={academy.recentActivity ?? []} />

                <Card className="col-span-2 flex flex-col md:col-span-6 lg:col-span-4">
                    <CardHeader className="gap-1">
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
                            const myUsername = auth.user.username;
                            const isInTop = top.some((e) => e.username === myUsername);
                            const data = isInTop
                                ? top.map((e) => (e.username === myUsername ? { ...e, isCurrentUser: true } : e))
                                : [...top, { rank: myRank, name: auth.user.name, username: myUsername, avatar: auth.user.avatar ?? null, points: auth.user.points, isCurrentUser: true }];
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

/* ── Admin table column definitions (hoisted to module level for stable references) ── */
const courseColumns: ColumnDef<AdminCoursePerformance>[] = [
    { accessorKey: 'title', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Course<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <span className="max-w-40 truncate font-medium">{row.original.title}</span> },
    { accessorKey: 'enrollments', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Enrollments<ArrowUpDown className="size-4" /></Button> },
    { accessorKey: 'completionRate', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Completion<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <Badge variant={row.original.completionRate >= 50 ? 'default' : 'secondary'}>{row.original.completionRate}%</Badge> },
];

const challengeColumns: ColumnDef<AdminChallengePerformance>[] = [
    { accessorKey: 'title', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Challenge<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <span className="max-w-40 truncate font-medium">{row.original.title}</span> },
    { accessorKey: 'submissions', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Submissions<ArrowUpDown className="size-4" /></Button> },
    { accessorKey: 'successRate', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Success<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <Badge variant={row.original.successRate >= 50 ? 'default' : 'secondary'}>{row.original.successRate}%</Badge> },
];

const userColumns: ColumnDef<AdminRecentUser>[] = [
    { accessorKey: 'name', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>User<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <div className="flex items-center gap-2"><Avatar size="sm"><AvatarFallback>{initials(row.original.name)}</AvatarFallback></Avatar><div><p className="text-sm font-medium">{row.original.name}</p>{row.original.username && <p className="text-xs text-muted-foreground">@{row.original.username}</p>}</div></div> },
    { accessorKey: 'email', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Email<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span> },
    { accessorKey: 'role', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Role<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <Badge variant={row.original.role === 'admin' ? 'default' : 'secondary'}>{row.original.role}</Badge> },
    { accessorKey: 'createdAt', header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>Joined<ArrowUpDown className="size-4" /></Button>, cell: ({ row }) => <span className="text-muted-foreground">{row.original.createdAt}</span> },
];

function AdminDashboard({ admin }: { admin: AdminData }) {
    const statCards = [
        { label: 'Total Users', value: admin.stats.totalUsers, icon: Users },
        { label: 'Total Courses', value: admin.stats.totalCourses, icon: BookOpen },
        { label: 'Total Challenges', value: admin.stats.totalChallenges, icon: Swords },
        { label: 'Total Enrollments', value: admin.stats.totalEnrollments, icon: GraduationCap },
        { label: 'Active Users (30d)', value: admin.stats.activeUsers, icon: Activity },
        { label: 'New This Month', value: admin.stats.newUsersThisMonth, icon: TrendingUp },
    ];

    return (
        <div className="relative flex flex-col gap-4 px-4 py-4 lg:gap-6 lg:py-6">
            <section className="animate-fade-in-up relative flex flex-col gap-1"><TypographyH1>Analytics Dashboard</TypographyH1><TypographyMuted>Platform overview and performance metrics.</TypographyMuted></section>

            <section className="animate-fade-in-up grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6" style={{ animationDelay: '50ms' }}>
                {statCards.map((s) => (
                    <Card key={s.label}>
                        <CardHeader className="flex flex-row items-center justify-between gap-0 pb-1">
                            <CardDescription className="text-sm font-medium">{s.label}</CardDescription>
                            <s.icon className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tabular-nums">{formatNumber(s.value)}</div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="animate-fade-in-up grid gap-4 xl:grid-cols-2" style={{ animationDelay: '150ms' }}>
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

            <section className="animate-fade-in-up grid gap-4 xl:grid-cols-2" style={{ animationDelay: '250ms', contentVisibility: 'auto', containIntrinsicSize: 'auto 400px' } as React.CSSProperties}>
                <Card>
                    <CardHeader><CardTitle>Top Courses</CardTitle><CardDescription>By enrollment count</CardDescription></CardHeader>
                    <CardContent>{admin.coursePerformance.length === 0 ? <p className="text-sm text-muted-foreground">No published courses yet.</p> : <DataTable columns={courseColumns} data={admin.coursePerformance} centered showFilterInput={false} showFooter={false} enableDefaultIdSort={false} />}</CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Top Challenges</CardTitle><CardDescription>By submission count</CardDescription></CardHeader>
                    <CardContent>{admin.challengePerformance.length === 0 ? <p className="text-sm text-muted-foreground">No published challenges yet.</p> : <DataTable columns={challengeColumns} data={admin.challengePerformance} centered showFilterInput={false} showFooter={false} enableDefaultIdSort={false} />}</CardContent>
                </Card>
            </section>

            <section className="animate-fade-in-up" style={{ animationDelay: '350ms', contentVisibility: 'auto', containIntrinsicSize: 'auto 400px' } as React.CSSProperties}>
                <Card>
                    <CardHeader><CardTitle>Recent Registrations</CardTitle><CardDescription>Newest users on the platform</CardDescription></CardHeader>
                    <CardContent>{admin.recentUsers.length === 0 ? <p className="text-sm text-muted-foreground">No users registered yet.</p> : <DataTable columns={userColumns} data={admin.recentUsers} centered showFilterInput={false} showFooter={false} enableDefaultIdSort={false} />}</CardContent>
                </Card>
            </section>
        </div>
    );
}

export default function Dashboard({ stats, level, academy, learningPath, analytics, admin, decayWarning, recentCourses }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAdmin = auth.user.is_admin;
    return (
        <>
            <Head title="Dashboard" />
            {isAdmin && admin ? <AdminDashboard admin={admin} /> : stats && academy ? <LearnerDashboard stats={stats} level={level} academy={academy} learningPath={learningPath} analytics={analytics} decayWarning={decayWarning} recentCourses={recentCourses} /> : null}
        </>
    );
}
