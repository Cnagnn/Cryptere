import { Deferred, Link, usePage, usePoll } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
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
                    ? 'Poin akan berkurang besok!'
                    : `Poin akan berkurang dalam ${warning.daysUntilDecay} hari`}
            </AlertTitle>
            <AlertDescription
                className={cn(
                    !isUrgent && 'text-amber-600/80 dark:text-amber-400/80',
                )}
            >
                Selesaikan pelajaran untuk menjaga{' '}
                {formatNumber(warning.currentPoints)} poin Anda dari pengurangan{' '}
                {warning.decayPercent}%.
            </AlertDescription>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 size-6"
                onClick={onDismiss}
                aria-label="Tutup peringatan pengurangan"
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
                    <CardTitle>Lanjutkan Belajar</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                    <GraduationCap className="size-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                        Tidak ada kursus yang sedang berlangsung. Mulai satu!
                    </p>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={coursesIndex.url()}>
                            Jelajahi Kursus
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
                <CardTitle>Lanjutkan Belajar</CardTitle>
                <CardDescription>
                    {inProgress.length}{' '}
                    {inProgress.length === 1 ? 'kursus' : 'kursus'} sedang
                    berlangsung
                </CardDescription>
                <CardAction>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={coursesIndex.url()}>
                            Lihat Semua
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
                                                ? 'pelajaran'
                                                : 'pelajaran'}
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
                    <CardTitle>Aktivitas Terkini</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
                    <Activity className="size-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                        Belum ada aktivitas terkini. Mulai belajar!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-2 flex flex-col md:col-span-3 lg:col-span-4">
            <CardHeader className="gap-1">
                <CardTitle>Aktivitas Terkini</CardTitle>
                <CardDescription>Tindakan terbaru Anda</CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 p-0">
                <ScrollArea className="h-full max-h-56">
                    <div
                        className="flex flex-col px-6 pb-6"
                        role="list"
                        aria-label="Umpan aktivitas terkini"
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
        header: 'Nama Pengguna',
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
                            (Anda)
                        </span>
                    )}
                </span>
            </div>
        ),
    },
    {
        accessorKey: 'points',
        header: 'Poin',
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
            aria-label="Kalender streak aktivitas"
            role="grid"
        >
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, i) => (
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
    adminTabs,
}: {
    stats: LearnerStats;
    level?: UserLevel;
    academy: AcademyData;
    learningPath?: LearningPathData;
    analytics?: AnalyticsData;
    decayWarning?: DecayWarning | null;
    recentCourses?: RecentCourse[];
    adminTabs?: React.ReactNode;
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
            <section className="animate-fade-in-up relative flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-0">
                        <TypographyH1>
                            {greeting.text} {greeting.emoji}
                        </TypographyH1>
                        <TypographyMuted className="text-sm/6">
                            {auth.user.current_streak > 0
                                ? `${greeting.subtitle} Anda sedang dalam streak ${auth.user.current_streak} hari! 🔥`
                                : greeting.subtitle}
                        </TypographyMuted>
                    </div>
                    {adminTabs && <div>{adminTabs}</div>}
                </div>
            </section>

            {/* ── Bento Grid: Unified grid with KPI + charts + cards ── */}
            <section
                className="animate-fade-in-up grid grid-cols-2 gap-3 md:grid-cols-6 lg:grid-cols-12"
                style={{ animationDelay: '100ms' }}
            >
                {/* Row 1: KPI Cards — 2×2 on mobile, 4 across on md+lg */}
                <Card className="md:col-span-3 lg:col-span-3">
                    <CardHeader className="gap-1">
                        <CardTitle>Total Poin</CardTitle>
                        <CardDescription>
                            Kumpulkan poin untuk naik peringkat
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold tabular-nums">
                            {formatNumber(stats.points)}{' '}
                            <span className="text-sm font-medium text-muted-foreground">
                                poin
                            </span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-3 lg:col-span-3">
                    <CardHeader className="gap-1">
                        <CardTitle>Level & XP Saat Ini</CardTitle>
                        <CardDescription>
                            Anda melakukannya dengan baik!
                        </CardDescription>
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
                        <CardTitle>Kursus Selesai</CardTitle>
                        <CardDescription>
                            Satu langkah pada satu waktu
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold tabular-nums">
                            {stats.completedCourses}{' '}
                            <span className="text-base font-normal text-muted-foreground">
                                kursus
                            </span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="md:col-span-3 lg:col-span-3">
                    <CardHeader className="gap-1">
                        <CardTitle>Peringkat Anda</CardTitle>
                        <CardDescription>Pertahankan!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-semibold tabular-nums">
                            Peringkat #
                            {academy.learningPath?.currentRank ?? '-'}
                        </p>
                    </CardContent>
                </Card>

                {/* Row 2: Area Chart (8 cols) + Streak Calendar (4 cols) */}
                <div className="col-span-2 flex *:flex-1 md:col-span-4 lg:col-span-8">
                    <ChartAreaInteractive
                        weekly={academy.earningsHistory?.weekly ?? []}
                        monthly={academy.earningsHistory?.monthly ?? []}
                    />
                </div>

                <Card className="col-span-2 flex flex-col md:col-span-2 lg:col-span-4">
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <CardTitle>Streak & Kalender</CardTitle>
                                <CardDescription>
                                    Ringkasan aktivitas
                                </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                                    <Flame className="size-4 fill-orange-500 text-orange-500" />
                                    Streak {auth.user.current_streak} hari
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    Streak terbaik: {auth.user.longest_streak}{' '}
                                    hari
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
                                    Data streak tidak tersedia.
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
                        <CardTitle>Papan Peringkat</CardTitle>
                        <CardDescription>
                            Peserta teratas bulan ini
                        </CardDescription>
                        <CardAction>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={leaderboardIndex()}>
                                    Lihat Semua
                                    <ArrowUpRight data-icon="inline-end" />
                                </Link>
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const top = academy.leaderboardPreview ?? [];
                            const myRank =
                                academy.learningPath?.currentRank ?? 0;
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
