import type { ColumnDef } from '@tanstack/react-table';
import {
    Activity,
    ArrowUpDown,
    BookOpen,
    GraduationCap,
    Swords,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
    GradientBar,
    formatNumber,
    initials,
} from '@/components/dashboard/dashboard-utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import { DataTable } from '@/components/ui/data-table';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import type {
    AdminChallengePerformance,
    AdminCoursePerformance,
    AdminData,
    AdminRecentUser,
} from '@/types/dashboard';

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

/* ── Admin table column definitions ── */
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
                Course
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
                Enrollments
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
                Completion
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

const challengeColumns: ColumnDef<AdminChallengePerformance>[] = [
    {
        accessorKey: 'title',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Challenge
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
        accessorKey: 'submissions',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Submissions
                <ArrowUpDown className="size-4" />
            </Button>
        ),
    },
    {
        accessorKey: 'successRate',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Success
                <ArrowUpDown className="size-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <Badge
                variant={
                    row.original.successRate >= 50 ? 'default' : 'secondary'
                }
            >
                {row.original.successRate}%
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
                User
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
                Role
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
                Joined
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

export function AdminDashboard({ admin }: { admin: AdminData }) {
    const enrollmentTrends = normalizeArray<
        AdminData['enrollmentTrends'][number]
    >(admin.enrollmentTrends);
    const userGrowth = normalizeArray<AdminData['userGrowth'][number]>(
        admin.userGrowth,
    );
    const coursePerformance = normalizeArray<
        AdminData['coursePerformance'][number]
    >(admin.coursePerformance);
    const challengePerformance = normalizeArray<
        AdminData['challengePerformance'][number]
    >(admin.challengePerformance);
    const recentUsers = normalizeArray<AdminData['recentUsers'][number]>(
        admin.recentUsers,
    );

    const statCards = [
        { label: 'Total Users', value: admin.stats.totalUsers, icon: Users },
        {
            label: 'Total Courses',
            value: admin.stats.totalCourses,
            icon: BookOpen,
        },
        {
            label: 'Total Challenges',
            value: admin.stats.totalChallenges,
            icon: Swords,
        },
        {
            label: 'Total Enrollments',
            value: admin.stats.totalEnrollments,
            icon: GraduationCap,
        },
        {
            label: 'Active Users (30d)',
            value: admin.stats.activeUsers,
            icon: Activity,
        },
        {
            label: 'New This Month',
            value: admin.stats.newUsersThisMonth,
            icon: TrendingUp,
        },
    ];

    return (
        <div className="relative flex flex-col gap-4 px-4 py-4 lg:gap-6 lg:py-6">
            <section className="animate-fade-in-up relative flex flex-col gap-1">
                <TypographyH1>Analytics Dashboard</TypographyH1>
                <TypographyMuted>
                    Platform overview and performance metrics.
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
                        <CardTitle>Enrollment Trends</CardTitle>
                        <CardDescription>
                            New enrollments per month (last 6 months)
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
                        <CardTitle>User Growth</CardTitle>
                        <CardDescription>
                            New registrations per month (last 6 months)
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
                        <CardTitle>Top Courses</CardTitle>
                        <CardDescription>By enrollment count</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {admin.coursePerformance.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No published courses yet.
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
                <Card>
                    <CardHeader>
                        <CardTitle>Top Challenges</CardTitle>
                        <CardDescription>By submission count</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {admin.challengePerformance.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No published challenges yet.
                            </p>
                        ) : (
                            <DataTable
                                columns={challengeColumns}
                                data={challengePerformance}
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
                        <CardTitle>Recent Registrations</CardTitle>
                        <CardDescription>
                            Newest users on the platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {admin.recentUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No users registered yet.
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
