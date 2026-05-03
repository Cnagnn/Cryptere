import type { ColumnDef } from '@tanstack/react-table';
import {
    Activity,
    ArrowUpDown,
    BookOpen,
    GraduationCap,
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

export function AdminDashboard({
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
