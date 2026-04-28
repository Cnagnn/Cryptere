import { Deferred, Link, usePage, usePoll } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    BookOpen,
    Flame,
    GraduationCap,
    X,
} from 'lucide-react';
import { useState } from 'react';

import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import {
    ACTIVITY_TAG_CONFIG,
    DEFAULT_ACTIVITY_TAG,
    formatNumber,
    getTimeGreeting,
    initials,
} from '@/components/dashboard/dashboard-utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { index as coursesIndex, show as courseShow } from '@/routes/courses';
import { index as leaderboardIndex } from '@/routes/leaderboard';
import type { Auth, UserLevel } from '@/types/auth';
import type {
    AcademyData,
    AnalyticsData,
    DecayWarning,
    LeaderboardEntry,
    LearnerStats,
    LearningPathData,
    RecentActivityItem,
    RecentCourse,
    StreakCalendarEntry,
} from '@/types/dashboard';

/* ── Decay Warning Banner ── */
function DecayWarningBanner({
    warning,
    onDismiss,
}: {
    warning: DecayWarning;
    onDismiss: () => void;
}) {
    const isUrgent = warning.daysUntilDecay <= 1;

    return (
        <Alert
            variant={isUrgent ? 'destructive' : 'default'}
            className={cn(
                'relative',
                !isUrgent &&
                    'border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-400',
            )}
        >
            <AlertTriangle className="size-4" />
            <AlertTitle className="font-semibold">
                {isUrgent
                    ? 'Points decay tomorrow!'
                    : `Points decay in ${warning.daysUntilDecay} days`}
            </AlertTitle>
            <AlertDescription
                className={cn(
                    !isUrgent && 'text-amber-600/80 dark:text-amber-400/80',
                )}
            >
                Complete a lesson or challenge to keep your{' '}
                {formatNumber(warning.currentPoints)} points safe from{' '}
                {warning.decayPercent}% decay.
            </AlertDescription>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 size-6"
                onClick={onDismiss}
                aria-label="Dismiss decay warning"
            >
                <X className="size-3.5" />
            </Button>
        </Alert>
    );
}

/* ── Continue Learning Section (stacked progress cards) ── */
function ContinueLearningSection({ courses }: { courses: RecentCourse[] }) {
    const inProgress = courses.filter(
        (c) => c.progressPercentage > 0 && c.progressPercentage < 100,
    );

    if (inProgress.length === 0) {
        return (
            <Card className="col-span-2 md:col-span-3 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Continue Learning</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                    <GraduationCap className="size-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                        No courses in progress. Start one!
                    </p>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={coursesIndex.url()}>
                            Browse Courses
                            <ArrowUpRight data-icon="inline-end" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-2 md:col-span-3 lg:col-span-4">
            <CardHeader className="gap-1">
                <CardTitle>Continue Learning</CardTitle>
                <CardDescription>
                    {inProgress.length}{' '}
                    {inProgress.length === 1 ? 'course' : 'courses'} in progress
                </CardDescription>
                <CardAction>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={coursesIndex.url()}>
                            View All
                            <ArrowUpRight data-icon="inline-end" />
                        </Link>
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className={cn(inProgress.length > 3 && 'h-54')}>
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
                                    style={{
                                        width: `${course.progressPercentage}%`,
                                    }}
                                />
                                <div className="relative flex items-center gap-3 p-3">
                                    {/* Circular progress indicator */}
                                    <div className="relative flex size-10 shrink-0 items-center justify-center">
                                        <svg
                                            className="size-10 -rotate-90"
                                            viewBox="0 0 36 36"
                                        >
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="15.5"
                                                fill="none"
                                                className="stroke-muted"
                                                strokeWidth="2.5"
                                            />
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="15.5"
                                                fill="none"
                                                className="stroke-primary transition-all"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeDasharray={`${(course.progressPercentage / 100) * 97.4} 97.4`}
                                            />
                                        </svg>
                                        <span className="absolute text-[10px] font-bold tabular-nums">
                                            {Math.round(
                                                course.progressPercentage,
                                            )}
                                            %
                                        </span>
                                    </div>
                                    {/* Course info */}
                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <p className="truncate text-sm font-medium">
                                            {course.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {course.lessonCount}{' '}
                                            {course.lessonCount === 1
                                                ? 'lesson'
                                                : 'lessons'}
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
function ActivityFeedTimeline({
    activities,
}: {
    activities: RecentActivityItem[];
}) {
    if (activities.length === 0) {
        return (
            <Card className="col-span-2 md:col-span-3 lg:col-span-4">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
                    <Activity className="size-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                        No recent activity yet. Start learning!
                    </p>
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
                    <div
                        className="flex flex-col px-6 pb-6"
                        role="list"
                        aria-label="Recent activity feed"
                    >
                        {/* Timeline */}
                        <div className="relative flex flex-col">
                            {/* Vertical timeline line */}
                            <div
                                className="absolute top-1 bottom-1 left-1.75 w-px bg-border"
                                aria-hidden="true"
                            />

                            {activities.map((item, idx) => {
                                const config =
                                    ACTIVITY_TAG_CONFIG[item.tag] ??
                                    DEFAULT_ACTIVITY_TAG;

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
                                            <p className="truncate text-sm leading-tight">
                                                {item.title}
                                            </p>
                                            <span className="text-xs text-muted-foreground">
                                                {item.timestamp}
                                            </span>
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

/* ── Leaderboard column definitions ── */
const leaderboardColumns: ColumnDef<LeaderboardEntry>[] = [
    {
        accessorKey: 'rank',
        header: '#',
        cell: ({ row }) => {
            const rank = row.original.rank;

            const color =
                rank === 1
                    ? 'text-amber-400'
                    : rank === 2
                      ? 'text-slate-300'
                      : rank === 3
                        ? 'text-amber-600'
                        : 'text-foreground';

            return <span className={cn('font-bold', color)}>#{rank}</span>;
        },
    },
    {
        accessorKey: 'name',
        header: 'Username',
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <Avatar size="sm">
                    <AvatarImage
                        src={row.original.avatar || undefined}
                        alt={`@${row.original.username ?? row.original.name}`}
                    />
                    <AvatarFallback>
                        {initials(row.original.username ?? row.original.name)}
                    </AvatarFallback>
                </Avatar>
                <span
                    className={cn(
                        'truncate text-sm font-medium',
                        row.original.isCurrentUser && 'text-primary',
                    )}
                >
                    @{row.original.username ?? 'unknown'}
                    {row.original.isCurrentUser && (
                        <span className="ml-1 text-xs text-muted-foreground">
                            (You)
                        </span>
                    )}
                </span>
            </div>
        ),
    },
    {
        accessorKey: 'points',
        header: 'Points',
        cell: ({ row }) => (
            <span
                className={cn(
                    'tabular-nums',
                    row.original.isCurrentUser && 'text-primary',
                )}
            >
                {row.original.points.toLocaleString()} pts
            </span>
        ),
    },
];

/* ── Streak Calendar ── */
function StreakCalendar({
    data,
    footer,
}: {
    data: StreakCalendarEntry[];
    footer?: React.ReactNode;
}) {
    const emptyCells = (7 - (data.length % 7)) % 7;
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];

    return (
        <div
            className="grid grid-cols-7 gap-1"
            aria-label="Activity streak calendar"
            role="grid"
        >
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <div
                    key={i}
                    className="text-center text-xs text-muted-foreground"
                >
                    {day}
                </div>
            ))}
            {data.map((entry) => {
                const d = new Date(entry.date);
                const day = d.getDate();

                if (entry.isOutOfRange) {
                    return (
                        <div
                            key={entry.date}
                            className="aspect-square rounded-sm"
                        />
                    );
                }

                return (
                    <div
                        key={entry.date}
                        className={cn(
                            'pointer-events-none flex aspect-square flex-col items-center justify-center rounded-sm',
                            entry.isFuture
                                ? 'bg-muted/40'
                                : entry.active
                                  ? 'bg-orange-400 dark:bg-orange-500'
                                  : 'bg-muted',
                            entry.isToday &&
                                'ring-2 ring-orange-400 ring-offset-1 ring-offset-background',
                        )}
                    >
                        <span
                            className={cn(
                                'text-xs leading-tight font-semibold tabular-nums',
                                entry.isFuture
                                    ? 'text-muted-foreground/60'
                                    : entry.active
                                      ? 'text-white'
                                      : 'text-muted-foreground/70',
                            )}
                        >
                            {day}
                        </span>
                        <span
                            className={cn(
                                'text-[9px] leading-none font-medium',
                                entry.isFuture
                                    ? 'text-muted-foreground/50'
                                    : entry.active
                                      ? 'text-white/80'
                                      : 'text-muted-foreground/60',
                            )}
                        >
                            {months[d.getMonth()]}
                        </span>
                    </div>
                );
            })}
            {footer && emptyCells > 0 && (
                <div
                    className="flex items-center"
                    style={{ gridColumn: `span ${emptyCells}` }}
                >
                    {footer}
                </div>
            )}
        </div>
    );
}

/* ── Main Learner Dashboard ── */
export function LearnerDashboard({
    stats,
    level,
    academy,
    analytics,
    decayWarning,
    recentCourses,
}: {
    stats: LearnerStats;
    level?: UserLevel;
    academy: AcademyData;
    learningPath?: LearningPathData;
    analytics?: AnalyticsData;
    decayWarning?: DecayWarning | null;
    recentCourses?: RecentCourse[];
}) {
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
                    <DecayWarningBanner
                        warning={decayWarning}
                        onDismiss={() => setShowDecayWarning(false)}
                    />
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
            <section
                className="animate-fade-in-up grid grid-cols-2 gap-3 md:grid-cols-6 lg:grid-cols-12"
                style={{ animationDelay: '100ms' }}
            >
                {/* Row 1: KPI Cards — 2×2 on mobile, 4 across on md+lg */}
                <Card className="md:col-span-3 lg:col-span-3">
                    <CardHeader className="gap-1">
                        <CardTitle>Total Points</CardTitle>
                        <CardDescription>
                            Keep earning to climb up!
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold tabular-nums">
                            {formatNumber(stats.points)}{' '}
                            <span className="text-sm font-medium text-muted-foreground">
                                pts
                            </span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-3 lg:col-span-3">
                    <CardHeader className="gap-1">
                        <CardTitle>Current Level & XP</CardTitle>
                        <CardDescription>You're doing great!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-4">
                            <p className="shrink-0 text-2xl font-semibold tabular-nums">
                                Level {level?.level ?? 1}
                            </p>
                            {level && level.next_level_xp && (
                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                    <Progress
                                        value={level.progress}
                                        className="h-1.5"
                                    />
                                    <div className="text-xs text-muted-foreground">
                                        <span>
                                            {formatNumber(level.current_xp)} /{' '}
                                            {formatNumber(level.next_level_xp)}{' '}
                                            XP
                                        </span>
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
                        <p className="text-2xl font-semibold tabular-nums">
                            {stats.completedCourses}{' '}
                            <span className="text-base font-normal text-muted-foreground">
                                courses
                            </span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-3 lg:col-span-3">
                    <CardHeader className="gap-1">
                        <CardTitle>Your Rank</CardTitle>
                        <CardDescription>Keep it up!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold tabular-nums">
                            Rank #{academy.learningPath.currentRank}
                        </p>
                    </CardContent>
                </Card>

                {/* Row 2: Area Chart (8 cols) + Streak Calendar (4 cols) */}
                <div className="col-span-2 flex *:flex-1 md:col-span-4 lg:col-span-8">
                    <ChartAreaInteractive
                        weekly={academy.earningsHistory.weekly}
                        monthly={academy.earningsHistory.monthly}
                    />
                </div>

                <Card className="col-span-2 flex flex-col md:col-span-2 lg:col-span-4">
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <CardTitle>Streak & Calendar</CardTitle>
                                <CardDescription>
                                    Activity overview
                                </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                                    <Flame className="size-4 fill-orange-500 text-orange-500" />
                                    {auth.user.current_streak} days streak
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    Best streak: {auth.user.longest_streak} days
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <Deferred
                            data="analytics.streakCalendar"
                            fallback={<Skeleton className="h-40 w-full" />}
                        >
                            {analytics?.streakCalendar ? (
                                <StreakCalendar
                                    data={analytics.streakCalendar}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Streak data is not available.
                                </p>
                            )}
                        </Deferred>
                    </CardContent>
                </Card>

                {/* Row 3: Continue Learning (4 cols) + Recent Activity (4 cols) + Leaderboard (4 cols) */}
                <ContinueLearningSection courses={recentCourses ?? []} />
                <ActivityFeedTimeline
                    activities={academy.recentActivity ?? []}
                />

                <Card className="col-span-2 flex flex-col md:col-span-6 lg:col-span-4">
                    <CardHeader className="gap-1">
                        <CardTitle>Leaderboard</CardTitle>
                        <CardDescription>
                            Top learners this month
                        </CardDescription>
                        <CardAction>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={leaderboardIndex()}>
                                    View All
                                    <ArrowUpRight data-icon="inline-end" />
                                </Link>
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const top = academy.leaderboardPreview;
                            const myRank = academy.learningPath.currentRank;
                            const myUsername = auth.user.username;
                            const isInTop = top.some(
                                (e) => e.username === myUsername,
                            );
                            const data = isInTop
                                ? top.map((e) =>
                                      e.username === myUsername
                                          ? { ...e, isCurrentUser: true }
                                          : e,
                                  )
                                : [
                                      ...top,
                                      {
                                          rank: myRank,
                                          name: auth.user.name,
                                          username: myUsername,
                                          avatar: auth.user.avatar ?? null,
                                          points: auth.user.points,
                                          isCurrentUser: true,
                                      },
                                  ];

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
