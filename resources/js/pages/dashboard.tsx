import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Crown } from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { dashboard } from '@/routes';
import { index as challengesIndex } from '@/routes/challenges';
import { index as coursesIndex, show } from '@/routes/courses';
import { index as leaderboardIndex } from '@/routes/leaderboard';

type DashboardStats = {
    enrolledCourses: number;
    completedCourses: number;
    completedLessons: number;
    solvedChallenges: number;
    points: number;
};

type LeaderboardItem = {
    rank: number;
    name: string;
    username: string | null;
    points: number;
};

type ActivityBreakdownItem = {
    label: string;
    count: number;
    percentage: number;
};

type MonthlyProgressPoint = {
    month: string;
    lessonsCompleted: number;
    challengesSolved: number;
    totalActivity: number;
};

type PopularCourseItem = {
    id: number;
    slug: string;
    title: string;
    lessonCount: number;
    enrollmentCount: number;
    completionRate: number;
    currentUserProgress: number | null;
    callToAction: string;
};

type RecentActivityItem = {
    id: string;
    title: string;
    tag: string;
    timestamp: string | null;
    isoDate: string;
};

type AcademyPayload = {
    hero: {
        greeting: string;
        headline: string;
        description: string;
        completionRate: number;
    };
    learningPath: {
        name: string;
        completedModules: number;
        totalModules: number;
        progressPercentage: number;
        currentRank: number;
    };
    successMetrics: {
        overallSuccessRate: number;
        previousSuccessRate: number;
        targetRate: number;
        totalEnrollments: number;
        completedEnrollments: number;
        inProgressEnrollments: number;
    };
    leaderboardPreview: LeaderboardItem[];
    activityBreakdown: ActivityBreakdownItem[];
    monthlyProgress: {
        rangeLabel: string;
        summaryPercentage: number;
        deltaFromPrevious: number;
        series: MonthlyProgressPoint[];
    };
    popularCourses: PopularCourseItem[];
    recentActivity: RecentActivityItem[];
};

type Props = {
    stats: DashboardStats;
    academy: AcademyPayload;
};

const activityColors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
];

function deltaLabel(deltaValue: number): string {
    if (deltaValue > 0) {
        return `+${deltaValue}%`;
    }

    return `${deltaValue}%`;
}

export default function Dashboard({ academy, stats }: Props) {
    const hasMonthlyActivity = academy.monthlyProgress.series.some(
        (entry) => entry.totalActivity > 0,
    );

    const hasActivityBreakdown = academy.activityBreakdown.some(
        (entry) => entry.count > 0,
    );

    const hasRecentActivity = academy.recentActivity.length > 0;
    const hasLeaderboardPreview = academy.leaderboardPreview.length > 0;
    const isNewLearner = stats.enrolledCourses === 0
        && stats.completedLessons === 0
        && stats.solvedChallenges === 0;

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 px-4 py-6">
                <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                    <Card className="border-primary/20 bg-card">
                        <CardHeader className="relative z-10 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <CardTitle className="text-2xl leading-tight tracking-tight md:text-3xl">
                                    {academy.hero.greeting}
                                </CardTitle>
                                <p className="text-lg font-medium leading-tight">
                                    {academy.hero.headline}
                                </p>
                                <CardDescription className="max-w-2xl text-sm md:text-base">
                                    {academy.hero.description}
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10 flex flex-col gap-4">
                            <div className="flex flex-wrap gap-2">
                                <Button asChild>
                                    <Link href={coursesIndex()} prefetch>
                                        Explore courses
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href={challengesIndex()} prefetch>
                                        Open challenge board
                                    </Link>
                                </Button>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-lg border bg-background/80 p-3">
                                    <p className="text-sm text-muted-foreground">
                                        Success rate
                                    </p>
                                    <p className="text-xl font-semibold tracking-tight">
                                        {academy.hero.completionRate}%
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-background/80 p-3">
                                    <p className="text-sm text-muted-foreground">
                                        Active courses
                                    </p>
                                    <p className="text-xl font-semibold tracking-tight">
                                        {stats.enrolledCourses}
                                    </p>
                                </div>
                                <div className="rounded-lg border bg-background/80 p-3">
                                    <p className="text-sm text-muted-foreground">
                                        Total points
                                    </p>
                                    <p className="text-xl font-semibold tracking-tight">
                                        {stats.points}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Learning Path</CardTitle>
                            <CardDescription>
                                {academy.learningPath.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>
                                        {academy.learningPath.completedModules} of{' '}
                                        {academy.learningPath.totalModules} modules completed
                                    </span>
                                    <span>{academy.learningPath.progressPercentage}%</span>
                                </div>
                                <Progress
                                    value={academy.learningPath.progressPercentage}
                                    className="h-2.5"
                                />
                            </div>
                            <div className="rounded-lg border bg-muted/30 p-3">
                                <p className="text-sm text-muted-foreground">
                                    Current leaderboard rank
                                </p>
                                <p className="mt-1 inline-flex items-center gap-1 text-lg font-semibold tracking-tight">
                                    <Crown className="size-4" />
                                    #{academy.learningPath.currentRank}
                                </p>
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <Link href={leaderboardIndex()} prefetch>
                                    See full leaderboard
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </section>

                {isNewLearner ? (
                    <section>
                        <Card className="border-dashed border-primary/40">
                            <CardHeader>
                                <CardTitle className="text-base">Start your first learning streak</CardTitle>
                                <CardDescription>
                                    Pick one course track or jump into a challenge to begin collecting points.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                <Button asChild>
                                    <Link href={coursesIndex()} prefetch>
                                        Browse courses
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href={challengesIndex()} prefetch>
                                        Try challenges
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </section>
                ) : null}

                <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
                    <Card>
                        <CardHeader className="flex flex-col gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <CardTitle className="text-base">Course Progress by Month</CardTitle>
                                <Badge variant="secondary">
                                    {academy.monthlyProgress.summaryPercentage}%
                                </Badge>
                            </div>
                            <CardDescription>
                                {academy.monthlyProgress.rangeLabel}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span>Compared to previous month</span>
                                <Badge variant="outline">
                                    {deltaLabel(academy.monthlyProgress.deltaFromPrevious)}
                                </Badge>
                            </div>

                            {hasMonthlyActivity ? (
                                <div className="h-70 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={academy.monthlyProgress.series}>
                                            <defs>
                                                <linearGradient
                                                    id="dashboard-activity"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor="var(--chart-1)"
                                                        stopOpacity={0.35}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="var(--chart-1)"
                                                        stopOpacity={0.06}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                stroke="var(--border)"
                                                strokeDasharray="3 3"
                                                opacity={0.45}
                                            />
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                stroke="var(--muted-foreground)"
                                                tickMargin={10}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'var(--card)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '10px',
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="totalActivity"
                                                name="Total activity"
                                                stroke="var(--chart-1)"
                                                strokeWidth={2}
                                                fill="url(#dashboard-activity)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="lessonsCompleted"
                                                name="Lessons"
                                                stroke="var(--chart-2)"
                                                strokeWidth={1.5}
                                                fillOpacity={0}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="challengesSolved"
                                                name="Challenges"
                                                stroke="var(--chart-3)"
                                                strokeWidth={1.5}
                                                fillOpacity={0}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                    Complete lessons and challenges to populate your
                                    monthly trend.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Progress Statistics</CardTitle>
                            <CardDescription>
                                Distribution of your learning activity.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {hasActivityBreakdown ? (
                                <>
                                    <div className="h-55 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={academy.activityBreakdown}
                                                    dataKey="count"
                                                    nameKey="label"
                                                    innerRadius={52}
                                                    outerRadius={86}
                                                    paddingAngle={0}
                                                    stroke="none"
                                                >
                                                    {academy.activityBreakdown.map((item, index) => (
                                                        <Cell
                                                            key={`${item.label}-segment`}
                                                            fill={activityColors[index % activityColors.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        background: 'var(--card)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '10px',
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {academy.activityBreakdown.map((item, index) => (
                                            <div
                                                key={item.label}
                                                className="flex items-center justify-between rounded-md border px-3 py-2"
                                            >
                                                <div className="inline-flex items-center gap-2 text-sm">
                                                    <span
                                                        className="size-2.5 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                activityColors[index % activityColors.length],
                                                        }}
                                                    />
                                                    {item.label}
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {item.count} ({item.percentage}%)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                    Activity distribution will appear after your first
                                    completed items.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Popular Courses</CardTitle>
                            <CardDescription>
                                High-demand tracks and your current momentum.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Course</TableHead>
                                        <TableHead>Completion</TableHead>
                                        <TableHead className="text-right">
                                            Action
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {academy.popularCourses.map((course) => (
                                        <TableRow key={course.id}>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <p className="font-medium">
                                                        {course.title}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {course.lessonCount} lessons
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-sm text-muted-foreground">
                                                        {course.completionRate}%
                                                    </div>
                                                    <Progress
                                                        value={course.completionRate}
                                                        className="h-1.5 w-20"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant={
                                                        course.callToAction ===
                                                        'Continue'
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    asChild
                                                >
                                                    <Link
                                                        href={show({
                                                            course: course.slug,
                                                        })}
                                                        prefetch
                                                    >
                                                        {course.callToAction}
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Leaderboard Preview</CardTitle>
                            <CardDescription>
                                Snapshot of top learners in the current global ranking.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {hasLeaderboardPreview ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Rank</TableHead>
                                            <TableHead>Learner</TableHead>
                                            <TableHead className="text-right">Points</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {academy.leaderboardPreview.map((leader) => (
                                            <TableRow key={`${leader.rank}-${leader.username}`}>
                                                <TableCell>#{leader.rank}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <p className="font-medium">{leader.name}</p>
                                                        <p className="text-sm text-muted-foreground">@{leader.username ?? 'unknown'}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">{leader.points}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                    Leaderboard preview will appear after learners start collecting points.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Recent Activity</CardTitle>
                            <CardDescription>
                                Latest milestones from your own learning timeline.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            {hasRecentActivity ? (
                                academy.recentActivity.map((activity) => (
                                    <div key={activity.id} className="rounded-md border px-3 py-2">
                                        <div className="flex items-center justify-between gap-2 text-sm">
                                            <p className="font-medium">{activity.title}</p>
                                            <Badge variant="outline">{activity.tag}</Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">{activity.timestamp ?? 'just now'}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                    Complete a lesson, course, or challenge to populate your timeline.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: dashboard(),
        },
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
