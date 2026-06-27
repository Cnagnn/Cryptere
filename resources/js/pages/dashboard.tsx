import { Deferred, Head, Link, router, usePage } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Activity,
    AlertTriangle,
    ArrowUpDown,
    ArrowUpRight,
    Award,
    BarChart3,
    BookOpen,
    Download,
    Flame,
    Gauge,
    GraduationCap,
    Home,
    ListChecks,
    Target,
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
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { useConnectionMonitor } from '@/hooks/use-connection-monitor';
import { useRealtime } from '@/hooks/use-realtime';
import { useSmartPolling } from '@/hooks/use-smart-polling';
import { cn } from '@/lib/utils';
import { dashboard as dashboardRoute } from '@/routes';
import { index as coursesIndex, show as courseShow } from '@/routes/courses';
import { index as leaderboardIndex } from '@/routes/leaderboard';
import type { Auth, UserLevel } from '@/types/auth';
import type {
    AcademyData,
    AdminCohortRetention,
    AdminCoursePerformance,
    AdminData,
    AdminEconomyHealth,
    AdminGamificationFunnelStage,
    AdminRecentUser,
    AnalyticsData,
    BadgeGoal,
    DashboardProps,
    DecayWarning,
    LeaderboardEntry,
    LearnerNextAction,
    LearnerStats,
    RankProgress,
    RecentActivityItem,
    RecentCourse,
    RecommendedCourse,
    StreakCalendarEntry,
    WeeklyGoal,
} from '@/types/dashboard';

/* ── Utility Functions ── */

const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num);
};

const formatPointsCompact = (points: number): string => {
    if (points < 1000) {
        return formatNumber(points);
    }

    const compactValue = new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
        compactDisplay: 'short',
    }).format(points);

    return compactValue.toUpperCase();
};

const formatPercent = (value: number): string => {
    return `${new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 1,
    }).format(value)}%`;
};

const formatDelta = (value: number): string => {
    if (value === 0) {
        return '0%';
    }

    return `${value > 0 ? '+' : ''}${formatPercent(value)}`;
};

const getTimeGreeting = (name: string) => {
    const hour = new Date().getHours();

    if (hour < 12) {
        return {
            text: `Selamat Pagi, ${name}`,
            emoji: '☀️',
            subtitle: 'Mari mulai hari dengan pembelajaran yang produktif',
        };
    }

    if (hour < 18) {
        return {
            text: `Selamat Siang, ${name}`,
            emoji: '🌤️',
            subtitle: 'Teruskan perjalanan pembelajaran Anda',
        };
    }

    return {
        text: `Selamat Malam, ${name}`,
        emoji: '🌙',
        subtitle: 'Waktu yang tepat untuk mengembangkan keterampilan',
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
    {
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        color: string;
    }
> = {
    course_completed: {
        icon: GraduationCap,
        label: 'Kursus Diselesaikan',
        color: 'text-green-600 dark:text-green-400',
    },
    lesson_completed: {
        icon: BookOpen,
        label: 'Pelajaran Diselesaikan',
        color: 'text-blue-600 dark:text-blue-400',
    },
};

const DEFAULT_ACTIVITY_TAG = {
    icon: Activity,
    label: 'Aktivitas',
    color: 'text-muted-foreground',
};

const bentoCardClass =
    'h-full overflow-hidden border-border/70 bg-card/95 shadow-sm';
const bentoPanelClass =
    'h-full overflow-hidden border-border/60 bg-muted/20 shadow-sm';
const compactChartClass = 'aspect-auto h-52 w-full sm:h-56';

function CompactEmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex min-h-24 items-center gap-3 rounded-lg border bg-muted/20 p-3 text-left">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                </p>
                {action ? <div className="mt-3">{action}</div> : null}
            </div>
        </div>
    );
}

function MetricTile({
    label,
    value,
    description,
    children,
}: {
    label: string;
    value: React.ReactNode;
    description?: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="mt-1 text-lg font-semibold tabular-nums">
                {value}
            </div>
            {description ? (
                <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                </p>
            ) : null}
            {children}
        </div>
    );
}

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
                    ? 'Poin akan berkurang besok'
                    : `Poin akan berkurang dalam ${warning.daysUntilDecay} hari`}
            </AlertTitle>
            <AlertDescription
                className={cn(
                    !isUrgent && 'text-amber-600/80 dark:text-amber-400/80',
                )}
            >
                Selesaikan pelajaran untuk mempertahankan{' '}
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

function BadgeGoalCard({ badgeGoal }: { badgeGoal?: BadgeGoal | null }) {
    if (!badgeGoal) {
        return null;
    }

    return (
        <Card
            className={cn(
                bentoPanelClass,
                'col-span-2 md:col-span-3 lg:col-span-4',
            )}
        >
            <CardHeader className="gap-1">
                <CardTitle>Badge Berikutnya</CardTitle>
                <CardDescription>{badgeGoal.title}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                    {badgeGoal.description ??
                        'Lanjutkan aktivitas untuk membuka badge ini.'}
                </p>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium tabular-nums">
                        {formatNumber(badgeGoal.currentValue)} /{' '}
                        {formatNumber(badgeGoal.targetValue)}
                    </span>
                </div>
                <Progress value={badgeGoal.progressPercentage} />
                <Button variant="outline" size="sm" className="w-fit" asChild>
                    <Link href={badgeGoal.url}>
                        {badgeGoal.actionLabel}
                        <ArrowUpRight data-icon="inline-end" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function LearningHubCard({
    recentCourses,
    recommendedCourses,
}: {
    recentCourses: RecentCourse[];
    recommendedCourses: RecommendedCourse[];
}) {
    const inProgress = recentCourses
        .filter((course) => course.progressPercentage > 0)
        .slice(0, 3);
    const recommendations = recommendedCourses.slice(0, 2);

    return (
        <Card
            className={cn(
                bentoCardClass,
                'col-span-2 flex flex-col md:col-span-6 lg:col-span-8',
            )}
        >
            <CardHeader className="gap-1">
                <CardTitle>Pembelajaran</CardTitle>
                <CardDescription>
                    Kursus berjalan dan jalur berikutnya
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
            <CardContent className="grid flex-1 gap-3 lg:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                        <span>Sedang diikuti</span>
                        <span>{formatNumber(inProgress.length)} aktif</span>
                    </div>
                    {inProgress.length === 0 ? (
                        <CompactEmptyState
                            icon={GraduationCap}
                            title="Belum ada kursus berjalan"
                            description="Mulai satu kursus agar progres utama muncul di sini."
                            action={
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={coursesIndex.url()}>
                                        Jelajahi Kursus
                                        <ArrowUpRight data-icon="inline-end" />
                                    </Link>
                                </Button>
                            }
                        />
                    ) : (
                        inProgress.map((course) => (
                            <Link
                                key={course.id}
                                href={
                                    course.slug
                                        ? courseShow.url({
                                              course: course.slug,
                                          })
                                        : coursesIndex.url()
                                }
                                className="group rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {course.title}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                                            {course.lessonCount ?? 0} pelajaran
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold tabular-nums">
                                        {Math.round(course.progressPercentage)}%
                                    </span>
                                </div>
                                <Progress
                                    value={course.progressPercentage}
                                    className="mt-3 h-1.5"
                                />
                            </Link>
                        ))
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
                        <span>Rekomendasi</span>
                        <span>
                            {formatNumber(recommendations.length)} jalur
                        </span>
                    </div>
                    {recommendations.length === 0 ? (
                        <CompactEmptyState
                            icon={BookOpen}
                            title="Belum ada rekomendasi"
                            description="Kursus yang dipublikasikan akan muncul sebagai jalur berikutnya."
                        />
                    ) : (
                        recommendations.map((course) => (
                            <Link
                                key={course.id}
                                href={courseShow.url({ course: course.slug })}
                                className="group rounded-lg border p-3 transition-colors hover:bg-muted/50"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {course.title}
                                        </p>
                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                            {course.summary ??
                                                course.recommendationReason}
                                        </p>
                                    </div>
                                    {course.difficulty ? (
                                        <Badge variant="secondary">
                                            {course.difficulty}
                                        </Badge>
                                    ) : null}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ActivityFeedTimeline({
    activities,
}: {
    activities: RecentActivityItem[];
}) {
    // Config for maintainability
    const config = {
        title: 'Aktivitas Terkini',
        description: 'Riwayat aktivitas pembelajaran Anda',
        emptyState: {
            icon: Activity,
            message:
                'Belum ada aktivitas yang tercatat. Mulai pembelajaran Anda sekarang.',
        },
        timeline: {
            maxHeight: 'max-h-56',
            linePosition: 'left-1.75', // Position of vertical line
            dotSize: 'size-3.75', // Size of activity dots
            iconSize: 'size-2.5', // Size of icons inside dots
        },
        ariaLabel: 'Umpan aktivitas terkini',
    };

    if (activities.length === 0) {
        return (
            <Card
                className={cn(
                    bentoCardClass,
                    'col-span-2 md:col-span-6 lg:col-span-8',
                )}
            >
                <CardHeader>
                    <CardTitle>{config.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
                    <config.emptyState.icon className="size-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                        {config.emptyState.message}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className={cn(
                bentoCardClass,
                'col-span-2 flex flex-col md:col-span-6 lg:col-span-8',
            )}
        >
            <CardHeader className="gap-1">
                <CardTitle>{config.title}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 p-0">
                <ScrollArea className={cn('h-full', config.timeline.maxHeight)}>
                    <div
                        className="flex flex-col px-6 pb-6"
                        role="list"
                        aria-label={config.ariaLabel}
                    >
                        <div className="relative flex flex-col">
                            <div
                                className={cn(
                                    'absolute top-1 bottom-1 w-px bg-border',
                                    config.timeline.linePosition,
                                )}
                                aria-hidden="true"
                            />

                            {activities.map((item, idx) => {
                                const tagConfig =
                                    ACTIVITY_TAG_CONFIG[item.tag] ??
                                    DEFAULT_ACTIVITY_TAG;
                                const Icon = tagConfig.icon;
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
                                        <div
                                            className={cn(
                                                'relative z-10 flex shrink-0 items-center justify-center rounded-full bg-muted ring-2 ring-background',
                                                config.timeline.dotSize,
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    'text-muted-foreground',
                                                    config.timeline.iconSize,
                                                )}
                                            />
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
                {formatPointsCompact(row.original.points)} pts
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
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
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

    const hasAnyData = data.some((d) => (d.points ?? 0) > 0 || (d.xp ?? 0) > 0);

    return (
        <Card className={cn(bentoPanelClass, 'pt-0')}>
            <CardHeader className="flex items-center gap-2 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Riwayat Perolehan</CardTitle>
                    <CardDescription>
                        {timeRange === 'weekly'
                            ? 'Perolehan poin dan XP dalam 7 hari terakhir'
                            : 'Perolehan poin dan XP dalam 12 bulan terakhir'}
                    </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger
                        className="hidden w-40 rounded-lg sm:ml-auto sm:flex"
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

            {!hasAnyData ? (
                <CardContent className="px-6 pt-6">
                    <CompactEmptyState
                        icon={BarChart3}
                        title="Belum ada catatan perolehan"
                        description="Selesaikan pelajaran atau tantangan untuk mulai mengumpulkan poin dan XP."
                        action={
                            <Button variant="outline" size="sm" asChild>
                                <Link href={coursesIndex.url()}>
                                    Jelajahi Kursus
                                </Link>
                            </Button>
                        }
                    />
                </CardContent>
            ) : (
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                    <ChartContainer
                        config={earningsChartConfig}
                        className={compactChartClass}
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
                                content={
                                    <ChartTooltipContent indicator="dot" />
                                }
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
            )}
        </Card>
    );
}

function LearnerDashboard({
    academy,
    analytics,
    decayWarning,
    badgeGoal,
    recentCourses,
    recommendedCourses,
    adminTabs,
}: {
    stats: LearnerStats;
    level?: UserLevel;
    academy: AcademyData;
    analytics?: AnalyticsData;
    decayWarning?: DecayWarning | null;
    nextAction?: LearnerNextAction;
    weeklyGoal?: WeeklyGoal;
    rankProgress?: RankProgress;
    badgeGoal?: BadgeGoal;
    recentCourses?: RecentCourse[];
    recommendedCourses?: RecommendedCourse[];
    adminTabs?: React.ReactNode;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [showDecayWarning, setShowDecayWarning] = useState(true);

    // Connection monitoring
    const { isConnected } = useConnectionMonitor();

    // Real-time updates via WebSocket
    useRealtime({
        userId: auth.user.id,
        onStatsUpdate: () => {
            router.reload({ only: ['stats', 'level'] });
        },
        onBadgeUnlock: () => {
            router.reload({ only: ['stats'] });
        },
        onLevelUp: () => {
            router.reload({ only: ['level', 'stats'] });
        },
        onRankChanged: () => {
            router.reload({ only: ['rankProgress'] });
        },
    });

    // Fallback polling when WebSocket disconnected
    useSmartPolling({
        enabled: !isConnected,
        only: ['academy', 'stats', 'level', 'rankProgress'],
    });

    const greeting = getTimeGreeting(auth.user.name);

    return (
        <div className="relative flex flex-col gap-4 px-4 pt-3 pb-4 lg:gap-6 lg:pt-3 lg:pb-4">
            {decayWarning && showDecayWarning && (
                <div className="animate-fade-in-up relative">
                    <DecayWarningBanner
                        warning={decayWarning}
                        onDismiss={() => setShowDecayWarning(false)}
                    />
                </div>
            )}

            <header className="animate-fade-in-up relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                    <TypographyH1>{`${greeting.text} ${greeting.emoji}`}</TypographyH1>
                    <TypographyMuted>
                        {auth.user.current_streak > 0
                            ? `${greeting.subtitle} Anda sedang dalam konsistensi ${auth.user.current_streak} hari berturut-turut!`
                            : greeting.subtitle}
                    </TypographyMuted>
                </div>
                <div className="flex w-full items-center justify-start gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                    {adminTabs}
                </div>
            </header>

            <section
                className="animate-fade-in-up grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12"
                style={{ animationDelay: '100ms' }}
            >
                <div className="col-span-2 flex *:flex-1 md:col-span-4 lg:col-span-8">
                    <ChartAreaInteractive
                        weekly={academy.earningsHistory?.weekly ?? []}
                        monthly={academy.earningsHistory?.monthly ?? []}
                    />
                </div>

                {/* Streak & Calendar Card - Config-driven for maintainability */}
                {(() => {
                    const streakConfig = {
                        title: 'Konsistensi dan Kalender',
                        description: 'Ringkasan aktivitas pembelajaran',
                        currentStreak: auth.user.current_streak,
                        longestStreak: auth.user.longest_streak,
                        streakIcon: Flame,
                        streakIconClass:
                            'size-4 fill-orange-500 text-orange-500',
                        calendarData: analytics?.streakCalendar,
                        emptyMessage: 'Data konsistensi tidak tersedia.',
                    };

                    return (
                        <Card
                            className={cn(
                                bentoCardClass,
                                'col-span-2 flex flex-col md:col-span-2 lg:col-span-4',
                            )}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <CardTitle>
                                            {streakConfig.title}
                                        </CardTitle>
                                        <CardDescription>
                                            {streakConfig.description}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                                            <streakConfig.streakIcon
                                                className={
                                                    streakConfig.streakIconClass
                                                }
                                            />
                                            Streak {streakConfig.currentStreak}{' '}
                                            hari
                                        </span>
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            Streak terbaik:{' '}
                                            {streakConfig.longestStreak} hari
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <Deferred
                                    data="analytics.streakCalendar"
                                    fallback={
                                        <Skeleton className="h-40 w-full" />
                                    }
                                >
                                    {streakConfig.calendarData ? (
                                        <StreakCalendar
                                            data={streakConfig.calendarData}
                                        />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            {streakConfig.emptyMessage}
                                        </p>
                                    )}
                                </Deferred>
                            </CardContent>
                        </Card>
                    );
                })()}

                <LearningHubCard
                    recentCourses={recentCourses ?? []}
                    recommendedCourses={recommendedCourses ?? []}
                />
                <BadgeGoalCard badgeGoal={badgeGoal} />
                <ActivityFeedTimeline
                    activities={academy.recentActivity ?? []}
                />

                {/* Leaderboard Card - Config-driven for maintainability */}
                {(() => {
                    const leaderboardConfig = {
                        title: 'Papan Peringkat',
                        description: 'Peringkat peserta teratas bulan ini',
                        viewAllLabel: 'Lihat Semua',
                        currentUserLabel: '(Anda)',
                        tableConfig: {
                            showFilterInput: false,
                            showColumnToggle: false,
                            showPageInfo: false,
                            showFooter: false,
                            centered: true,
                        },
                    };

                    const top = academy.leaderboardPreview ?? [];
                    const currentUser = {
                        rank: academy.learningPath?.currentRank ?? 0,
                        name: auth.user.name,
                        username: auth.user.username,
                        avatar: auth.user.avatar ?? null,
                        points: auth.user.points,
                        isCurrentUser: true,
                    };

                    const isInTop = top.some(
                        (entry) => entry.username === currentUser.username,
                    );

                    const data = isInTop
                        ? top.map((entry) =>
                              entry.username === currentUser.username
                                  ? { ...entry, isCurrentUser: true }
                                  : entry,
                          )
                        : [...top, currentUser];

                    return (
                        <Card
                            className={cn(
                                bentoCardClass,
                                'col-span-2 flex flex-col md:col-span-6 lg:col-span-4',
                            )}
                        >
                            <CardHeader className="gap-1">
                                <CardTitle>{leaderboardConfig.title}</CardTitle>
                                <CardDescription>
                                    {leaderboardConfig.description}
                                </CardDescription>
                                <CardAction>
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={leaderboardIndex()}>
                                            {leaderboardConfig.viewAllLabel}
                                            <ArrowUpRight data-icon="inline-end" />
                                        </Link>
                                    </Button>
                                </CardAction>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    columns={leaderboardColumns}
                                    data={data}
                                    {...leaderboardConfig.tableConfig}
                                />
                            </CardContent>
                        </Card>
                    );
                })()}
            </section>
        </div>
    );
}

/* ── Inline Component: AdminDashboard ── */

const adminOverviewConfig: ChartConfig = {
    enrollments: { label: 'Pendaftaran', color: 'var(--chart-1)' },
    users: { label: 'Pengguna baru', color: 'var(--chart-2)' },
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

function normalizeObject<T extends object>(value: unknown): T | null {
    if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.keys(value).length > 0
    ) {
        return value as T;
    }

    return null;
}

function AdminAnalyticsSkeleton() {
    return (
        <Card className={bentoCardClass}>
            <CardHeader className="gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64 max-w-full" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
            </CardContent>
        </Card>
    );
}

function DeltaBadge({ value }: { value: number }) {
    const isPositive = value > 0;
    const isNegative = value < 0;

    return (
        <Badge
            variant={isNegative ? 'secondary' : 'outline'}
            className={cn(
                'w-fit',
                isPositive && 'text-primary',
                isNegative && 'text-destructive',
            )}
        >
            {formatDelta(value)}
        </Badge>
    );
}

function AdminPlatformSummaryCard({ admin }: { admin: AdminData }) {
    const { summary } = admin.reportSnapshot;

    return (
        <Card className={cn(bentoPanelClass, 'sm:col-span-2 md:col-span-4')}>
            <CardHeader className="gap-1">
                <CardTitle>Ringkasan Platform</CardTitle>
                <CardDescription>
                    Sinyal utama periode {admin.reportSnapshot.periodLabel}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <MetricTile
                    label="Total pengguna"
                    value={formatNumber(admin.stats.totalUsers)}
                    description={`${formatNumber(admin.stats.newUsersThisMonth)} baru bulan ini`}
                >
                    <div className="mt-2">
                        <DeltaBadge value={admin.stats.newUsersDelta} />
                    </div>
                </MetricTile>
                <MetricTile
                    label="Total kursus"
                    value={formatNumber(admin.stats.totalCourses)}
                    description="Konten tersedia"
                />
                <MetricTile
                    label="Pendaftaran"
                    value={formatNumber(admin.stats.totalEnrollments)}
                    description={`${formatNumber(admin.stats.periodEnrollments)} dalam ${admin.stats.periodLabel}`}
                >
                    <div className="mt-2">
                        <DeltaBadge value={admin.stats.enrollmentsDelta} />
                    </div>
                </MetricTile>
                <MetricTile
                    label="User aktif"
                    value={formatNumber(summary.activeUsers)}
                    description="Periode pilihan"
                >
                    <div className="mt-2">
                        <DeltaBadge value={admin.stats.activeUsersDelta} />
                    </div>
                </MetricTile>
                <MetricTile
                    label="Aksi terbuka"
                    value={formatNumber(summary.openActions)}
                    description="Perlu ditindak"
                />
                <MetricTile
                    label="Anomali"
                    value={formatNumber(summary.anomalies)}
                    description="Perlu dibaca"
                />
            </CardContent>
        </Card>
    );
}

function AdminDashboardControls({ admin }: { admin: AdminData }) {
    const handlePeriodChange = (period: string) => {
        router.get(
            dashboardRoute.url({ query: { period } }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleExport = () => {
        const payload = JSON.stringify(admin.reportSnapshot, null, 2);
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cryptere-dashboard-${admin.filters.period}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Select
                value={admin.filters.period}
                onValueChange={handlePeriodChange}
            >
                <SelectTrigger size="sm" aria-label="Pilih periode analitik">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {admin.filters.availablePeriods.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                            {period.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select defaultValue={admin.filters.segment}>
                <SelectTrigger size="sm" aria-label="Pilih segmen user">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {admin.filters.availableSegments.map((segment) => (
                        <SelectItem key={segment.value} value={segment.value}>
                            {segment.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport}>
                <Download data-icon="button" />
                Export
            </Button>
        </div>
    );
}

function AdminActionQueueCard({
    actions,
}: {
    actions: AdminData['actionQueue'];
}) {
    return (
        <Card className={cn(bentoCardClass, 'lg:col-span-7')}>
            <CardHeader className="gap-1">
                <CardTitle>Action Queue</CardTitle>
                <CardDescription>
                    Prioritas operasional dari sinyal dashboard
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {actions.length === 0 ? (
                    <Empty className="border-0 p-0">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <ListChecks />
                            </EmptyMedia>
                            <EmptyTitle>Tidak ada tindakan mendesak</EmptyTitle>
                            <EmptyDescription>
                                Semua sinyal utama berada dalam batas aman.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    actions.slice(0, 4).map((action) => (
                        <div
                            key={`${action.type}-${action.title}`}
                            className="rounded-lg border p-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                action.severity === 'high'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {action.severity}
                                        </Badge>
                                        <p className="text-sm font-medium">
                                            {action.title}
                                        </p>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        {action.description}
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={action.actionUrl}>
                                        {action.actionLabel}
                                        <ArrowUpRight data-icon="inline-end" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

function AdminAnomaliesCard({
    anomalies,
}: {
    anomalies: AdminData['anomalies'];
}) {
    return (
        <Card className={cn(bentoCardClass, 'lg:col-span-5')}>
            <CardHeader className="gap-1">
                <CardTitle>Anomali</CardTitle>
                <CardDescription>
                    Perubahan yang perlu dibaca sebelum mengambil keputusan
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {anomalies.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                        <Gauge className="size-4 text-primary" />
                        <p className="text-sm text-muted-foreground">
                            Tidak ada anomali utama pada periode ini.
                        </p>
                    </div>
                ) : (
                    anomalies.map((anomaly) => (
                        <div
                            key={`${anomaly.type}-${anomaly.title}`}
                            className="rounded-lg border p-3"
                        >
                            <div className="flex items-start gap-2">
                                <AlertTriangle
                                    className={cn(
                                        'mt-0.5 size-4',
                                        anomaly.severity === 'high'
                                            ? 'text-destructive'
                                            : 'text-amber-500',
                                    )}
                                />
                                <div>
                                    <p className="text-sm font-medium">
                                        {anomaly.title}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {anomaly.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

function AdminCourseAnalyticsCard({
    courses,
}: {
    courses: AdminData['courseAnalytics'];
}) {
    return (
        <Card className={bentoCardClass}>
            <CardHeader className="gap-1">
                <CardTitle>Course Analytics</CardTitle>
                <CardDescription>
                    Drilldown cepat untuk completion, lesson, kuis, dan user
                    mandek
                </CardDescription>
            </CardHeader>
            <CardContent>
                {courses.length === 0 ? (
                    <Empty className="border-0 p-0">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <GraduationCap />
                            </EmptyMedia>
                            <EmptyTitle>Belum ada course aktif</EmptyTitle>
                            <EmptyDescription>
                                Course analytics muncul setelah course
                                dipublikasikan.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course</TableHead>
                                <TableHead className="text-right">
                                    Enroll
                                </TableHead>
                                <TableHead className="text-right">
                                    Complete
                                </TableHead>
                                <TableHead className="text-right">
                                    Lesson
                                </TableHead>
                                <TableHead className="text-right">
                                    Kuis
                                </TableHead>
                                <TableHead className="text-right">
                                    Mandek
                                </TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell className="max-w-60 truncate font-medium">
                                        {course.title}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatNumber(course.enrollments)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatPercent(course.completionRate)}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatPercent(
                                            course.lessonCompletionRate,
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {course.quizPassRate === null
                                            ? 'N/A'
                                            : formatPercent(
                                                  course.quizPassRate,
                                              )}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatNumber(course.inactiveLearners)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                        >
                                            <Link href={course.actionUrl}>
                                                {course.actionLabel}
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

const adminFunnelStageLabels: Record<string, string> = {
    Registered: 'Terdaftar',
    Enrolled: 'Mendaftar Kursus',
    'Completed Lesson': 'Selesaikan Pelajaran',
    'Completed Quiz': 'Selesaikan Kuis',
};

function AdminFunnelCard({
    funnel,
}: {
    funnel: AdminGamificationFunnelStage[];
}) {
    return (
        <Card className={cn(bentoCardClass, 'lg:col-span-5')}>
            <CardHeader className="gap-1">
                <CardTitle>Funnel Gamifikasi</CardTitle>
                <CardDescription>
                    Konversi pengguna dari daftar hingga menyelesaikan kuis
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {funnel.length === 0 ? (
                    <Empty className="border-0 p-0">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Target />
                            </EmptyMedia>
                            <EmptyTitle>Belum ada funnel</EmptyTitle>
                            <EmptyDescription>
                                Data aktivitas belajar akan muncul setelah ada
                                pendaftaran kursus.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    funnel.map((stage) => (
                        <div key={stage.stage} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-medium">
                                    {adminFunnelStageLabels[stage.stage] ??
                                        stage.stage}
                                </span>
                                <div className="text-right">
                                    <p className="tabular-nums">
                                        {formatNumber(stage.count)} ·{' '}
                                        {formatPercent(stage.percentage)}
                                    </p>
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                        Drop-off{' '}
                                        {formatNumber(stage.dropoff_count)} ·{' '}
                                        {formatPercent(
                                            stage.dropoff_percentage,
                                        )}
                                    </p>
                                </div>
                            </div>
                            <Progress value={stage.percentage} />
                            <p className="text-xs text-muted-foreground tabular-nums">
                                Konversi dari tahap sebelumnya:{' '}
                                {formatPercent(stage.conversion_from_previous)}
                            </p>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

function AdminEconomyHealthCard({
    economy,
}: {
    economy: AdminEconomyHealth | null;
}) {
    const metrics = economy
        ? [
              {
                  label: 'XP hari ini',
                  value: formatNumber(economy.total_xp_awarded_today),
              },
              {
                  label: 'Rata-rata XP/user',
                  value: formatNumber(economy.avg_xp_per_user),
              },
              {
                  label: 'Rata-rata poin/user',
                  value: formatNumber(economy.avg_points_per_user),
              },
              {
                  label: 'Rata-rata streak',
                  value: `${formatNumber(economy.avg_streak)} hari`,
              },
              {
                  label: 'User punya streak',
                  value: formatNumber(economy.users_with_streak),
              },
              {
                  label: 'Badge didapat',
                  value: formatNumber(economy.total_badges_earned),
              },
          ]
        : [];

    return (
        <Card className={cn(bentoCardClass, 'lg:col-span-7')}>
            <CardHeader className="gap-1">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle>Kesehatan Reward</CardTitle>
                    {economy ? (
                        <Badge
                            variant={
                                economy.status === 'healthy'
                                    ? 'default'
                                    : 'secondary'
                            }
                        >
                            {economy.status_label}
                        </Badge>
                    ) : null}
                </div>
                <CardDescription>
                    Sinyal ekonomi XP, poin, streak, dan badge
                </CardDescription>
            </CardHeader>
            <CardContent>
                {!economy ? (
                    <Empty className="border-0 p-0">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Award />
                            </EmptyMedia>
                            <EmptyTitle>Belum ada data reward</EmptyTitle>
                            <EmptyDescription>
                                Metrik reward akan muncul setelah user mulai
                                belajar.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {metrics.map((metric) => (
                            <div
                                key={metric.label}
                                className="rounded-lg border p-3"
                            >
                                <p className="text-xs text-muted-foreground">
                                    {metric.label}
                                </p>
                                <p className="mt-1 text-lg font-semibold tabular-nums">
                                    {metric.value}
                                </p>
                            </div>
                        ))}
                        <div className="col-span-2 grid gap-2">
                            {economy.signals.map((signal) => (
                                <div
                                    key={signal.label}
                                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                                >
                                    <span className="text-muted-foreground">
                                        {signal.label}
                                    </span>
                                    <span className="inline-flex items-center gap-2 font-medium tabular-nums">
                                        {formatNumber(signal.value)}{' '}
                                        {signal.unit}
                                        <Badge
                                            variant={
                                                signal.status === 'healthy'
                                                    ? 'outline'
                                                    : 'secondary'
                                            }
                                        >
                                            {signal.status === 'healthy'
                                                ? 'Aman'
                                                : 'Pantau'}
                                        </Badge>
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="col-span-2 rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">
                                Badge paling sering
                            </p>
                            {economy.top_badge ? (
                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <Badge variant="secondary">
                                        {economy.top_badge.name}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground tabular-nums">
                                        {formatNumber(
                                            Number(
                                                economy.top_badge.earn_count,
                                            ),
                                        )}{' '}
                                        kali
                                    </span>
                                </div>
                            ) : (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Belum ada badge yang didapat.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function retentionCellClass(value: number | null): string {
    if (value === null) {
        return 'bg-muted/40 text-muted-foreground';
    }

    if (value >= 75) {
        return 'bg-primary/15 text-primary';
    }

    if (value >= 40) {
        return 'bg-muted text-foreground';
    }

    return 'bg-destructive/10 text-destructive';
}

function AdminCohortRetentionCard({
    cohorts,
}: {
    cohorts: AdminCohortRetention[];
}) {
    const weekKeys = Array.from(
        new Set(cohorts.flatMap((cohort) => Object.keys(cohort.retention))),
    ).sort(
        (a, b) =>
            Number(a.replace('week_', '')) - Number(b.replace('week_', '')),
    );

    return (
        <Card className={bentoCardClass}>
            <CardHeader className="gap-1">
                <CardTitle>Retensi Cohort</CardTitle>
                <CardDescription>
                    Persentase cohort yang masih aktif per minggu sejak daftar
                </CardDescription>
            </CardHeader>
            <CardContent>
                {cohorts.length === 0 ? (
                    <Empty className="border-0 p-0">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <BarChart3 />
                            </EmptyMedia>
                            <EmptyTitle>Belum ada cohort</EmptyTitle>
                            <EmptyDescription>
                                Cohort akan muncul setelah pengguna baru
                                bergabung.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cohort</TableHead>
                                <TableHead className="text-right">
                                    User
                                </TableHead>
                                <TableHead>Sample</TableHead>
                                {weekKeys.map((weekKey) => (
                                    <TableHead
                                        key={weekKey}
                                        className="text-center"
                                    >
                                        W{weekKey.replace('week_', '')}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cohorts.map((cohort) => (
                                <TableRow key={cohort.cohort_week}>
                                    <TableCell>{cohort.cohort_week}</TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {formatNumber(cohort.signup_count)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                cohort.confidence === 'high'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {cohort.sample_label}
                                        </Badge>
                                    </TableCell>
                                    {weekKeys.map((weekKey) => {
                                        const value =
                                            cohort.retention[weekKey] ?? null;

                                        return (
                                            <TableCell
                                                key={weekKey}
                                                className="text-center"
                                            >
                                                <span
                                                    className={cn(
                                                        'inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-xs font-medium tabular-nums',
                                                        retentionCellClass(
                                                            value,
                                                        ),
                                                    )}
                                                >
                                                    {value === null
                                                        ? 'N/A'
                                                        : formatPercent(value)}
                                                </span>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
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
        cell: ({ row }) => (
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
                    row.original.role === 'Super Admin' ||
                    row.original.role === 'Admin'
                        ? 'default'
                        : 'secondary'
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

function AdminContentAndUsersCard({
    courses,
    users,
}: {
    courses: AdminCoursePerformance[];
    users: AdminRecentUser[];
}) {
    return (
        <Card className={bentoCardClass}>
            <CardHeader className="gap-1">
                <CardTitle>Konten dan Pendaftaran</CardTitle>
                <CardDescription>
                    Kursus teratas dan pengguna terbaru
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-2">
                <div className="min-w-0 rounded-lg border p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium">
                                Kursus teratas
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Berdasarkan pendaftaran dan penyelesaian
                            </p>
                        </div>
                        <BookOpen className="size-4 text-muted-foreground" />
                    </div>
                    {courses.length === 0 ? (
                        <CompactEmptyState
                            icon={BookOpen}
                            title="Belum ada kursus"
                            description="Kursus yang dipublikasikan akan muncul di sini."
                        />
                    ) : (
                        <DataTable
                            columns={courseColumns}
                            data={courses}
                            centered
                            showFilterInput={false}
                            showFooter={false}
                            enableDefaultIdSort={false}
                        />
                    )}
                </div>
                <div className="min-w-0 rounded-lg border p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium">
                                Pendaftaran terkini
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Pengguna yang baru bergabung
                            </p>
                        </div>
                        <Activity className="size-4 text-muted-foreground" />
                    </div>
                    {users.length === 0 ? (
                        <CompactEmptyState
                            icon={Activity}
                            title="Belum ada pengguna baru"
                            description="Pendaftaran pengguna akan muncul setelah akun dibuat."
                        />
                    ) : (
                        <DataTable
                            columns={userColumns}
                            data={users}
                            centered
                            showFilterInput={false}
                            showFooter={false}
                            enableDefaultIdSort={false}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function AdminDashboard({
    admin,
    adminTabs,
}: {
    admin: AdminData;
    adminTabs?: React.ReactNode;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;

    const getTimeGreeting = (name: string) => {
        const hour = new Date().getHours();

        if (hour < 12) {
            return { text: `Selamat Pagi, ${name}`, emoji: '☀️' };
        }

        if (hour < 18) {
            return { text: `Selamat Siang, ${name}`, emoji: '🌤️' };
        }

        return { text: `Selamat Malam, ${name}`, emoji: '🌙' };
    };

    const greeting = getTimeGreeting(auth.user.name);

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
    const actionQueue = normalizeArray<AdminData['actionQueue'][number]>(
        admin.actionQueue,
    );
    const courseAnalytics = normalizeArray<
        AdminData['courseAnalytics'][number]
    >(admin.courseAnalytics);
    const anomalies = normalizeArray<AdminData['anomalies'][number]>(
        admin.anomalies,
    );
    const cohortRetention = normalizeArray<AdminCohortRetention>(
        admin.cohortRetention,
    );
    const gamificationFunnel = normalizeArray<AdminGamificationFunnelStage>(
        admin.gamificationFunnel,
    );
    const economyHealth = normalizeObject<AdminEconomyHealth>(
        admin.economyHealth,
    );

    const overviewSeries = enrollmentTrends.map((entry, index) => ({
        month: entry.month,
        enrollments: entry.enrollments,
        users: userGrowth[index]?.users ?? 0,
    }));

    return (
        <div className="relative flex flex-col gap-3 px-4 pt-3 pb-4 lg:pt-3 lg:pb-4">
            {/* Header Section */}
            <header className="animate-fade-in-up relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                    <TypographyH1>{`${greeting.text} ${greeting.emoji}`}</TypographyH1>
                    <TypographyMuted>
                        Ringkasan pertumbuhan, keterlibatan, dan kinerja konten
                        platform
                    </TypographyMuted>
                </div>
                <div className="flex w-full items-center justify-start gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                    <AdminDashboardControls admin={admin} />
                    {adminTabs}
                </div>
            </header>

            <section
                className="animate-fade-in-up grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4"
                style={{ animationDelay: '100ms' }}
            >
                <AdminPlatformSummaryCard admin={admin} />
            </section>

            <section
                className="animate-fade-in-up grid gap-3 lg:grid-cols-12"
                style={{ animationDelay: '150ms' }}
            >
                <AdminActionQueueCard actions={actionQueue} />
                <AdminAnomaliesCard anomalies={anomalies} />
            </section>

            <section
                className="animate-fade-in-up grid gap-3 lg:grid-cols-12"
                style={{ animationDelay: '200ms' }}
            >
                <Card
                    className={cn(
                        bentoPanelClass,
                        'col-span-2 md:col-span-4 lg:col-span-12',
                    )}
                >
                    <CardHeader className="flex items-center gap-2 border-b py-5 sm:flex-row">
                        <div className="grid flex-1 gap-1">
                            <CardTitle>Pertumbuhan Platform</CardTitle>
                            <CardDescription>
                                Pendaftaran dan pengguna baru dalam 6 bulan
                                terakhir
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                        <ChartContainer
                            config={adminOverviewConfig}
                            className={compactChartClass}
                        >
                            <BarChart data={overviewSeries} accessibilityLayer>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(v: string) => v.slice(0, 3)}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent />}
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar
                                    dataKey="enrollments"
                                    fill="var(--color-enrollments)"
                                />
                                <Bar
                                    dataKey="users"
                                    fill="var(--color-users)"
                                />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </section>

            <section
                className="animate-fade-in-up grid gap-3 lg:grid-cols-12"
                style={{ animationDelay: '300ms' }}
            >
                <Deferred
                    data="admin.gamificationFunnel"
                    fallback={<AdminAnalyticsSkeleton />}
                >
                    <AdminFunnelCard funnel={gamificationFunnel} />
                </Deferred>

                <Deferred
                    data="admin.economyHealth"
                    fallback={<AdminAnalyticsSkeleton />}
                >
                    <AdminEconomyHealthCard economy={economyHealth} />
                </Deferred>
            </section>

            <section
                className="animate-fade-in-up grid gap-3 lg:grid-cols-2"
                style={{ animationDelay: '400ms' }}
            >
                <Deferred
                    data="admin.cohortRetention"
                    fallback={<AdminAnalyticsSkeleton />}
                >
                    <AdminCohortRetentionCard cohorts={cohortRetention} />
                </Deferred>
                <AdminCourseAnalyticsCard courses={courseAnalytics} />
            </section>

            <section
                className="animate-fade-in-up grid gap-3"
                style={{ animationDelay: '500ms' }}
            >
                <AdminContentAndUsersCard
                    courses={coursePerformance}
                    users={recentUsers}
                />
            </section>
        </div>
    );
}

export default function Dashboard({
    stats,
    level,
    academy,
    analytics,
    admin,
    decayWarning,
    nextAction,
    weeklyGoal,
    rankProgress,
    badgeGoal,
    recentCourses,
    recommendedCourses,
}: DashboardProps) {
    const { auth } = usePage<{ auth?: Auth }>().props;
    const user = auth?.user;
    const [activeTab, setActiveTab] = useState<string>('home');

    if (!user) {
        return <Head title="Dasbor" />;
    }

    const isAdmin = user.is_admin;

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
                        analytics={analytics}
                        decayWarning={decayWarning}
                        nextAction={nextAction}
                        weeklyGoal={weeklyGoal}
                        rankProgress={rankProgress}
                        badgeGoal={badgeGoal}
                        recentCourses={recentCourses}
                        recommendedCourses={recommendedCourses}
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
                    analytics={analytics}
                    decayWarning={decayWarning}
                    nextAction={nextAction}
                    weeklyGoal={weeklyGoal}
                    rankProgress={rankProgress}
                    badgeGoal={badgeGoal}
                    recentCourses={recentCourses}
                    recommendedCourses={recommendedCourses}
                />
            ) : null}
        </>
    );
}
