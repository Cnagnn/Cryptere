import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    BookOpen,
    Clock,
    Flame,
    GraduationCap,
    Lightbulb,
    Target,
    Trophy,
    TrendingUp,
    Zap,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    PolarAngleAxis,
    PolarGrid,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { show as courseShow } from '@/routes/courses';
import type { UserLevel } from '@/types/auth';

type SkillRadarEntry = { category: string; score: number };
type HeatmapEntry = { date: string; count: number };
type WeeklyTrend = {
    week: string;
    lessons: number;
    total: number;
};
type StudyStats = {
    totalLessons: number;
    totalEnrollments: number;
    completedCourses: number;
    estimatedStudyMinutes: number;
    completionRate: number;
};
type Recommendation = {
    type: string;
    title: string;
    description: string;
    priority: string;
    slug?: string;
};

type Props = {
    skillRadar: SkillRadarEntry[];
    heatmap: HeatmapEntry[];
    weeklyTrends: WeeklyTrend[];
    studyStats: StudyStats;
    recommendations: Recommendation[];
    level: UserLevel;
    stats: {
        totalXp: number;
        totalPoints: number;
        currentStreak: number;
        longestStreak: number;
    };
};

function formatMinutes(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ── Heatmap Component ──
function ActivityHeatmap({ data }: { data: HeatmapEntry[] }) {
    // Show last 20 weeks (140 days)
    const recent = data.slice(-140);
    const maxCount = Math.max(...recent.map((d) => d.count), 1);

    // Group by week (7 days per column)
    const weeks: HeatmapEntry[][] = [];

    for (let i = 0; i < recent.length; i += 7) {
        weeks.push(recent.slice(i, i + 7));
    }

    return (
        <div className="flex gap-0.5 overflow-x-auto pb-1">
            {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((day) => {
                        const intensity =
                            day.count === 0
                                ? 0
                                : Math.ceil((day.count / maxCount) * 4);

                        return (
                            <div
                                key={day.date}
                                title={`${day.date}: ${day.count} activities`}
                                className={cn(
                                    'size-3 rounded-[2px] transition-colors',
                                    intensity === 0 && 'bg-muted-foreground/10',
                                    intensity === 1 &&
                                        'bg-emerald-200 dark:bg-emerald-900',
                                    intensity === 2 &&
                                        'bg-emerald-400 dark:bg-emerald-700',
                                    intensity === 3 &&
                                        'bg-emerald-500 dark:bg-emerald-500',
                                    intensity === 4 &&
                                        'bg-emerald-700 dark:bg-emerald-300',
                                )}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

// ── Recommendation Card ──
function RecommendationCard({ rec }: { rec: Recommendation }) {
    const icons: Record<string, typeof Lightbulb> = {
        streak: Flame,
        continue: BookOpen,
        enrolled: GraduationCap,
    };
    const Icon = icons[rec.type] ?? Lightbulb;

    const priorityColors: Record<string, string> = {
        high: 'text-red-500',
        medium: 'text-amber-500',
        low: 'text-blue-500',
    };

    return (
        <div className="flex items-start gap-3 rounded-lg border p-3">
            <div
                className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted',
                    priorityColors[rec.priority],
                )}
            >
                <Icon className="size-4" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
                <p className="text-sm font-medium">{rec.title}</p>
                <p className="text-xs text-muted-foreground">
                    {rec.description}
                </p>
            </div>
            {rec.slug && (
                <Button variant="outline" size="sm" asChild>
                    <Link href={courseShow.url({ course: rec.slug })} prefetch>
                        Buka
                    </Link>
                </Button>
            )}
        </div>
    );
}

export default function Analytics({
    skillRadar,
    heatmap,
    weeklyTrends,
    studyStats,
    recommendations,
    level,
    stats,
}: Props) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dasbor', href: '/dashboard' },
                { title: 'Analitik', href: '/analytics' },
            ]}
        >
            <Head title="Analitik Pembelajaran" />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                {/* ── Header ── */}
                <section className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="size-6 text-primary" />
                        <TypographyH1>Analitik Pembelajaran</TypographyH1>
                    </div>
                    <TypographyMuted>
                        Lacak progres Anda, identifikasi kekuatan, dan temukan
                        area yang perlu ditingkatkan.
                    </TypographyMuted>
                </section>

                {/* ── KPI Cards ── */}
                <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                    <Card>
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <Zap className="size-3" />
                                XP
                            </CardDescription>
                            <CardTitle className="text-2xl tabular-nums">
                                {stats.totalXp.toLocaleString()}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <Trophy className="size-3" />
                                Level
                            </CardDescription>
                            <CardTitle className="text-2xl tabular-nums">
                                {level.level}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Progress value={level.progress} className="h-1" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <Flame className="size-3" />
                                Streak
                            </CardDescription>
                            <CardTitle className="text-2xl tabular-nums">
                                {stats.currentStreak}{' '}
                                <span className="text-sm font-normal text-muted-foreground">
                                    hari
                                </span>
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <Clock className="size-3" />
                                Waktu Belajar
                            </CardDescription>
                            <CardTitle className="text-2xl tabular-nums">
                                {formatMinutes(
                                    studyStats.estimatedStudyMinutes,
                                )}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <Target className="size-3" />
                                Penyelesaian
                            </CardDescription>
                            <CardTitle className="text-2xl tabular-nums">
                                {studyStats.completionRate}%
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription className="flex items-center gap-1">
                                <Activity className="size-3" />
                                Aktivitas
                            </CardDescription>
                            <CardTitle className="text-2xl tabular-nums">
                                {studyStats.totalLessons}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </section>

                {/* ── Charts Row ── */}
                <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {/* Skill Radar */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Radar Keterampilan</CardTitle>
                            <CardDescription>
                                Kemahiran Anda di berbagai kategori
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {skillRadar.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <RadarChart data={skillRadar}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="category" />
                                        <Radar
                                            name="Score"
                                            dataKey="score"
                                            stroke="oklch(0.6 0.18 250)"
                                            fill="oklch(0.6 0.18 250)"
                                            fillOpacity={0.3}
                                        />
                                        <RechartsTooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-[280px] items-center justify-center">
                                    <p className="text-sm text-muted-foreground">
                                        Daftar kursus untuk melihat radar
                                        keterampilan Anda.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Weekly Trends */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Aktivitas Mingguan</CardTitle>
                            <CardDescription>
                                Pelajaran selama 8 minggu terakhir
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={weeklyTrends}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="stroke-border"
                                    />
                                    <XAxis dataKey="week" className="text-xs" />
                                    <YAxis
                                        allowDecimals={false}
                                        className="text-xs"
                                    />
                                    <RechartsTooltip />
                                    <Bar
                                        dataKey="lessons"
                                        name="Pelajaran"
                                        fill="oklch(0.6 0.18 250)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </section>

                {/* ── Activity Heatmap ── */}
                <Card>
                    <CardHeader>
                        <CardTitle>Peta Panas Aktivitas</CardTitle>
                        <CardDescription>
                            Aktivitas pembelajaran Anda selama 20 minggu
                            terakhir
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ActivityHeatmap data={heatmap} />
                        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                            <span>Sedikit</span>
                            <div className="size-3 rounded-[2px] bg-muted-foreground/10" />
                            <div className="size-3 rounded-[2px] bg-emerald-200 dark:bg-emerald-900" />
                            <div className="size-3 rounded-[2px] bg-emerald-400 dark:bg-emerald-700" />
                            <div className="size-3 rounded-[2px] bg-emerald-500 dark:bg-emerald-500" />
                            <div className="size-3 rounded-[2px] bg-emerald-700 dark:bg-emerald-300" />
                            <span>Banyak</span>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Study Stats + Recommendations ── */}
                <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {/* Study Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Rincian Belajar</CardTitle>
                            <CardDescription>
                                Ringkasan aktivitas pembelajaran Anda
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm">
                                        <BookOpen className="size-4 text-blue-500" />
                                        Pelajaran Selesai
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                        {studyStats.totalLessons}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm">
                                        <GraduationCap className="size-4 text-purple-500" />
                                        Kursus Selesai
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                        {studyStats.completedCourses} /{' '}
                                        {studyStats.totalEnrollments}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-sm">
                                        <Flame className="size-4 text-orange-500" />
                                        Streak Terpanjang
                                    </span>
                                    <span className="font-semibold tabular-nums">
                                        {stats.longestStreak} hari
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Rekomendasi</CardTitle>
                            <CardDescription>
                                Saran personal untuk meningkatkan kemampuan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recommendations.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {recommendations.map((rec, i) => (
                                        <RecommendationCard key={i} rec={rec} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-6 text-center">
                                    <Trophy className="size-8 text-emerald-500" />
                                    <p className="text-sm text-muted-foreground">
                                        Anda melakukannya dengan baik!
                                        Pertahankan momentum.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
