import { Deferred, Head, Link, usePage, usePoll } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Activity,
    AlertTriangle,
    ArrowUpDown,
    ArrowUpRight,
    BarChart3,
    BookOpen,
    Flame,
    GraduationCap,
    Home,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { DataTable } from '@/components/ui/data-table';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { index as coursesIndex, show as courseShow } from '@/routes/courses';
import { index as leaderboardIndex } from '@/routes/leaderboard';
import type { Auth, UserLevel } from '@/types/auth';
import type {
    AcademyData,
    AdminCoursePerformance,
    AdminData,
    AdminRecentUser,
    AnalyticsData,
    DashboardProps,
    DecayWarning,
    LeaderboardEntry,
    LearnerStats,
    LearningPathData,
    RecentActivityItem,
    RecentCourse,
    StreakCalendarEntry,
} from '@/types/dashboard';

/* ── Utility Functions ── */

const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num);
};

const getTimeGreeting = (name: string) => {
    const hour = new Date().getHours();
    if (hour < 12) {
        return {
            text: `Selamat Pagi, ${name}`,
            emoji: '☀️',
            subtitle: 'Semangat memulai hari dengan belajar!',
        };
    }
    if (hour < 18) {
        return {
            text: `Selamat Siang, ${name}`,
            emoji: '🌤️',
            subtitle: 'Terus tingkatkan kemampuanmu!',
        };
    }
    return {
        text: `Selamat Malam, ${name}`,
        emoji: '🌙',
        subtitle: 'Waktunya belajar dan berkembang!',
    };
};

const initials = (name: string): string => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const ACTIVITY_TAG_CONFIG: Record<
    string,
    { icon: React.ComponentType<{ className?: string }>; label: string; color: string }
> = {
    course_completed: {
        icon: GraduationCap,
        label: 'Kursus Selesai',
        color: 'text-green-600 dark:text-green-400',
    },
    lesson_completed: {
        icon: BookOpen,
        label: 'Pelajaran Selesai',
        color: 'text-blue-600 dark:text-blue-400',
    },
    challenge_solved: {
        icon: Activity,
        label: 'Tantangan Diselesaikan',
        color: 'text-purple-600 dark:text-purple-400',
    },
};

const DEFAULT_ACTIVITY_TAG = {
    icon: Activity,
    label: 'Aktivitas',
    color: 'text-muted-foreground',
};

const GradientBar = ({ prefix }: { prefix: string }) => (
    <svg width="0" height="0">
        <defs>
            <linearGradient id={`gradient-${prefix}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" />
                <stop offset="100%" stopColor="hsl(var(--chart-2))" />
            </linearGradient>
        </defs>
    </svg>
);

/* ── Inline Component: LearnerDashboard ── */

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
                                <div
                                    className="absolute inset-y-0 left-0 bg-primary/5 transition-all"
                                    style={{
                                        width: `${course.progressPercentage}%`,
                                    }}
                                />
                                <div className="relative flex items-center gap-3 p-3">
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
                        <div className="relative flex flex-col">
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
                                        <div className="relative z-10 flex size-3.75 shrink-0 items-center justify-center rounded-full bg-muted ring-2 ring-background">
                                            <Icon className="size-2.5 text-muted-foreground" />
                                        </div>

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

// ── Inline Component: ChartAreaInteractive ──

type EarningsEntry = {
    label: string;
    points: number;
    xp: number;
};

type ChartAreaInteractiveProps = {
    weekly: EarningsEntry[];
    monthly: EarningsEntry[];
};

const earningsChartConfig = {
    earnings: {
        label: 'Perolehan',
    },
    points: {
        label: 'Poin',
        color: 'var(--chart-1)',
    },
    xp: {
        label: 'XP',
        color: 'var(--chart-2)',
    },
} satisfies ChartConfig;

function ChartAreaInteractive({
    weekly = [],
    monthly = [],
}: ChartAreaInteractiveProps) {
    const [timeRange, setTimeRange] = useState('monthly');

    const rawData = timeRange === 'weekly' ? weekly : monthly;
    const data = Array.isArray(rawData) ? rawData : [];

    return (
        <Card className="pt-0">
            <CardHeader className="flex items-center gap-2 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Riwayat Perolehan</CardTitle>
                    <CardDescription>
                        {timeRange === 'weekly'
                            ? 'Poin & XP yang diperoleh dalam 7 hari terakhir'
                            : 'Poin & XP yang diperoleh dalam 12 bulan terakhir'}
                    </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                        className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                        aria-label="Pilih rentang waktu"
                    >
                        <SelectValue placeholder="12 bulan terakhir" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="monthly" className="rounded-lg">
                            12 bulan terakhir
                        </SelectItem>
                        <SelectItem value="weekly" className="rounded-lg">
                            7 hari terakhir
                        </SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={earningsChartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={data} margin={{ left: 12, right: 12 }}>
                        <defs>
                            <linearGradient
                                id="fillPoints"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-points)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-points)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient
                                id="fillXp"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-xp)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-xp)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            interval={0}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Area
                            dataKey="xp"
                            type="natural"
                            fill="url(#fillXp)"
                            stroke="var(--color-xp)"
                            stackId="a"
                        />
                        <Area
                            dataKey="points"
                            type="natural"
                            fill="url(#fillPoints)"
                            stroke="var(--color-points)"
                            stackId="a"
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

function LearnerDashboard({
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

    usePoll(30_000, { only: ['academy'] });

    const greeting = getTimeGreeting(auth.user.name);

    return (
        <div className="relative flex flex-col gap-4 px-4 pt-3 pb-4 lg:gap-6 lg:pt-3 lg:pb-6">
            {decayWarning && showDecayWarning && (
                <div className="animate-fade-in-up relative">
                    <DecayWarningBanner
                        warning={decayWarning}
                        onDismiss={() => setShowDecayWarning(false)}
                    />
                </div>
            )}

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

            <section
                className="animate-fade-in-up grid grid-cols-2 gap-3 md:grid-cols-6 lg:grid-cols-12"
                style={{ animationDelay: '100ms' }}
            >
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

/* ── Inline Component: AdminDashboard ── */

const enrollmentTrendsConfig: ChartConfig = {
    enrollments: { label: 'Enrollments', color: 'var(--chart-1)' },
};
const userGrowthConfig: ChartConfig = {
    users: { label: 'New Users', color: 'var(--chart-2)' },
};

function normalizeArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
        return value;
    }

    if (value && typeof value === 'object') {
        return Object.values(value as Record<string, T>);
    }

    return [];
}

const courseColumns: ColumnDef<AdminCoursePerformance>[] = [
    {
        accessorKey: 'title',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Kursus
                <ArrowUpDown className="size-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <span className="max-w-40 truncate font-medium">
                {row.original.title}
            </span>
        ),
    },
    {
        accessorKey: 'enrollments',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Pendaftaran
                <ArrowUpDown className="size-4" />
            </Button>
        ),
    },
    {
        accessorKey: 'completionRate',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Penyelesaian
                <ArrowUpDown className="size-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <Badge
                variant={
                    row.original.completionRate >= 50 ? 'default' : 'secondary'
                }
            >
                {row.original.completionRate}%
            </Badge>
        ),
    },
];

const userColumns: ColumnDef<AdminRecentUser>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Pengguna
                <ArrowUpDown className="size-4" />
            </Button>
        ),
        cell: ({ row}) => (
            <div className="flex items-center gap-2">
                <Avatar size="sm">
                    <AvatarFallback>
                        {initials(row.original.name)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium">{row.original.name}</p>
                    {row.original.username && (
                        <p className="text-xs text-muted-foreground">
                            @{row.original.username}
                        </p>
                    )}
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'email',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Email
                <ArrowUpDown className="size-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <span className="text-muted-foreground">{row.original.email}</span>
        ),
    },
    {
        accessorKey: 'role',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Peran
                <ArrowUpDown className="size-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <Badge
                variant={
                    row.original.role === 'admin' ? 'default' : 'secondary'
                }
            >
                {row.original.role}
            </Badge>
        ),
    },
    {
        accessorKey: 'createdAt',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Bergabung
                <ArrowUpDown className="size-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <span className="text-muted-foreground">
                {row.original.createdAt}
            </span>
        ),
    },
];

function AdminDashboard({
    admin,
    adminTabs,
}: {
    admin: AdminData;
    adminTabs?: React.ReactNode;
}) {
    const enrollmentTrends = normalizeArray<
        AdminData['enrollmentTrends'][number]
    >(admin.enrollmentTrends);
    const userGrowth = normalizeArray<AdminData['userGrowth'][number]>(
        admin.userGrowth,
    );
    const coursePerformance = normalizeArray<
        AdminData['coursePerformance'][number]
    >(admin.coursePerformance);
    const recentUsers = normalizeArray<AdminData['recentUsers'][number]>(
        admin.recentUsers,
    );

    const statCards = [
        { label: 'Total Pengguna', value: admin.stats.totalUsers, icon: Users },
        {
            label: 'Total Kursus',
            value: admin.stats.totalCourses,
            icon: BookOpen,
        },
        {
            label: 'Total Pendaftaran',
            value: admin.stats.totalEnrollments,
            icon: GraduationCap,
        },
        {
            label: 'Pengguna Aktif (30h)',
            value: admin.stats.activeUsers,
            icon: Activity,
        },
        {
            label: 'Baru Bulan Ini',
            value: admin.stats.newUsersThisMonth,
            icon: TrendingUp,
        },
    ];

    return (
        <div className="relative flex flex-col gap-4 px-4 py-4 lg:gap-6 lg:py-6">
            <section className="animate-fade-in-up relative flex flex-col gap-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <TypographyH1>Dasbor Analitik</TypographyH1>
                    {adminTabs}
                </div>
                <TypographyMuted>
                    Ringkasan platform dan metrik kinerja.
                </TypographyMuted>
            </section>

            <section
                className="animate-fade-in-up grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6"
                style={{ animationDelay: '50ms' }}
            >
                {statCards.map((s) => (
                    <Card key={s.label}>
                        <CardHeader className="flex flex-row items-center justify-between gap-0 pb-1">
                            <CardDescription className="text-sm font-medium">
                                {s.label}
                            </CardDescription>
                            <s.icon className="size-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tabular-nums">
                                {formatNumber(s.value)}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section
                className="animate-fade-in-up grid gap-4 xl:grid-cols-2"
                style={{ animationDelay: '150ms' }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Tren Pendaftaran</CardTitle>
                        <CardDescription>
                            Pendaftaran baru per bulan (6 bulan terakhir)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={enrollmentTrendsConfig}
                            className="h-62.5 w-full"
                        >
                            <BarChart
                                data={enrollmentTrends}
                                accessibilityLayer
                            >
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(v: string) => v.slice(0, 3)}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Bar
                                    dataKey="enrollments"
                                    shape={<GradientBar prefix="enrollment" />}
                                    fill="var(--color-enrollments)"
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Pertumbuhan Pengguna</CardTitle>
                        <CardDescription>
                            Registrasi baru per bulan (6 bulan terakhir)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                            config={userGrowthConfig}
                            className="h-62.5 w-full"
                        >
                            <AreaChart data={userGrowth} accessibilityLayer>
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray="3 3"
                                />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(v: string) => v.slice(0, 3)}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent />}
                                />
                                <defs>
                                    <linearGradient
                                        id="gradient-user-growth"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="var(--color-users)"
                                            stopOpacity={0.5}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="var(--color-users)"
                                            stopOpacity={0.1}
                                        />
                                    </linearGradient>
                                </defs>
                                <Area
                                    dataKey="users"
                                    type="monotone"
                                    fill="url(#gradient-user-growth)"
                                    fillOpacity={0.4}
                                    stroke="var(--color-users)"
                                    strokeWidth={0.8}
                                    strokeDasharray="3 3"
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </section>

            <section
                className="animate-fade-in-up grid gap-4 xl:grid-cols-2"
                style={
                    {
                        animationDelay: '250ms',
                        contentVisibility: 'auto',
                        containIntrinsicSize: 'auto 400px',
                    } as React.CSSProperties
                }
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Kursus Teratas</CardTitle>
                        <CardDescription>
                            Berdasarkan jumlah pendaftaran
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {admin.coursePerformance.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada kursus yang dipublikasikan.
                            </p>
                        ) : (
                            <DataTable
                                columns={courseColumns}
                                data={coursePerformance}
                                centered
                                showFilterInput={false}
                                showFooter={false}
                                enableDefaultIdSort={false}
                            />
                        )}
                    </CardContent>
                </Card>
            </section>

            <section
                className="animate-fade-in-up"
                style={
                    {
                        animationDelay: '350ms',
                        contentVisibility: 'auto',
                        containIntrinsicSize: 'auto 400px',
                    } as React.CSSProperties
                }
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Registrasi Terkini</CardTitle>
                        <CardDescription>
                            Pengguna terbaru di platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {admin.recentUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Belum ada pengguna yang terdaftar.
                            </p>
                        ) : (
                            <DataTable
                                columns={userColumns}
                                data={recentUsers}
                                centered
                                showFilterInput={false}
                                showFooter={false}
                                enableDefaultIdSort={false}
                            />
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}

export default function Dashboard({
    stats,
    level,
    academy,
    learningPath,
    analytics,
    admin,
    decayWarning,
    recentCourses,
}: DashboardProps) {
    const { auth } = usePage<{ auth: Auth }>().props;

    const isAdmin = auth.user.is_admin;
    const [activeTab, setActiveTab] = useState<string>('home');

    // Admin gets tabbed view with Home + Analytics
    if (isAdmin && admin) {
        return (
            <>
                <Head title="Dasbor" />
                {activeTab === 'home' && stats && academy ? (
                    <LearnerDashboard
                        stats={stats}
                        level={level}
                        academy={academy}
                        learningPath={learningPath}
                        analytics={analytics}
                        decayWarning={decayWarning}
                        recentCourses={recentCourses}
                        adminTabs={
                            <Tabs
                                value={activeTab}
                                onValueChange={setActiveTab}
                            >
                                <TabsList>
                                    <TabsTrigger value="home">
                                        <Home className="size-4" />
                                        Beranda
                                    </TabsTrigger>
                                    <TabsTrigger value="analytics">
                                        <BarChart3 className="size-4" />
                                        Analitik
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        }
                    />
                ) : activeTab === 'analytics' ? (
                    <AdminDashboard
                        admin={admin}
                        adminTabs={
                            <Tabs
                                value={activeTab}
                                onValueChange={setActiveTab}
                            >
                                <TabsList>
                                    <TabsTrigger value="home">
                                        <Home className="size-4" />
                                        Beranda
                                    </TabsTrigger>
                                    <TabsTrigger value="analytics">
                                        <BarChart3 className="size-4" />
                                        Analitik
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        }
                    />
                ) : null}
            </>
        );
    }

    // Regular learner view (unchanged)
    return (
        <>
            <Head title="Dasbor" />
            {stats && academy ? (
                <LearnerDashboard
                    stats={stats}
                    level={level}
                    academy={academy}
                    learningPath={learningPath}
                    analytics={analytics}
                    decayWarning={decayWarning}
                    recentCourses={recentCourses}
                />
            ) : null}
        </>
    );
}
