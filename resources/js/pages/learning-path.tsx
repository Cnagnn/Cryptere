import { Head, Link } from '@inertiajs/react';
import {
    BookOpen,
    CheckCircle2,
    ChevronRight,
    Clock,
    GraduationCap,
    Lock,
    Map,
    Play,
    Trophy,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { show as courseShow } from '@/routes/courses';
import type { LearningPathData, PathNode } from '@/types/dashboard';

type LearningPathSummary = {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    lockedCourses: number;
    overallProgress: number;
};

type Props = {
    learningPath: LearningPathData;
    summary: LearningPathSummary;
};

// ── Difficulty config ──
const DIFFICULTY_CONFIG: Record<
    string,
    { label: string; color: string; bgColor: string }
> = {
    beginner: {
        label: 'Pemula',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-950',
    },
    intermediate: {
        label: 'Menengah',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-950',
    },
    advanced: {
        label: 'Lanjutan',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-950',
    },
};

// ── Node status helpers ──
function getNodeStatus(node: PathNode) {
    if (node.isCompleted) {
        return 'completed' as const;
    }

    if (node.isLocked) {
        return 'locked' as const;
    }

    if (node.isEnrolled) {
        return 'in-progress' as const;
    }

    return 'available' as const;
}

const STATUS_CONFIG = {
    completed: {
        label: 'Selesai',
        icon: CheckCircle2,
        ringColor: 'ring-emerald-500',
        bgGlow: 'shadow-emerald-500/20',
        badgeVariant: 'default' as const,
    },
    'in-progress': {
        label: 'Sedang Berlangsung',
        icon: Play,
        ringColor: 'ring-blue-500',
        bgGlow: 'shadow-blue-500/20',
        badgeVariant: 'secondary' as const,
    },
    available: {
        label: 'Tersedia',
        icon: BookOpen,
        ringColor: 'ring-primary/50',
        bgGlow: '',
        badgeVariant: 'outline' as const,
    },
    locked: {
        label: 'Terkunci',
        icon: Lock,
        ringColor: 'ring-muted-foreground/30',
        bgGlow: '',
        badgeVariant: 'outline' as const,
    },
};

// ── Path Node Card ──
function PathNodeCard({ node }: { node: PathNode }) {
    const status = getNodeStatus(node);
    const config = STATUS_CONFIG[status];
    const difficulty =
        DIFFICULTY_CONFIG[node.difficulty] ?? DIFFICULTY_CONFIG.beginner;
    const StatusIcon = config.icon;
    const isInteractive = status !== 'locked';

    const cardContent = (
        <Card
            className={cn(
                'group relative transition-all duration-300',
                'ring-2',
                config.ringColor,
                config.bgGlow && `shadow-lg ${config.bgGlow}`,
                status === 'locked' && 'opacity-60',
                isInteractive && 'hover:-translate-y-1 hover:shadow-xl',
                status === 'in-progress' && 'animate-pulse-subtle',
            )}
        >
            {/* Status indicator dot */}
            <div
                className={cn(
                    'absolute -top-1.5 -right-1.5 z-10 flex size-7 items-center justify-center rounded-full ring-2 ring-background',
                    status === 'completed' && 'bg-emerald-500 text-white',
                    status === 'in-progress' && 'bg-blue-500 text-white',
                    status === 'available' && 'bg-primary/20 text-primary',
                    status === 'locked' && 'bg-muted text-muted-foreground',
                )}
            >
                <StatusIcon className="size-3.5" />
            </div>

            <CardHeader className="gap-1 pb-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-sm leading-tight">
                        {node.title}
                    </CardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                        variant="outline"
                        className={cn(
                            'text-[10px] font-medium',
                            difficulty.color,
                            difficulty.bgColor,
                        )}
                    >
                        {difficulty.label}
                    </Badge>
                    {node.category && (
                        <Badge variant="outline" className="text-[10px]">
                            {node.category}
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-2 pt-0">
                {node.summary && (
                    <CardDescription className="line-clamp-2 text-xs">
                        {node.summary}
                    </CardDescription>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <BookOpen className="size-3" />
                        {node.lessonCount} pelajaran
                    </span>
                    {node.estimatedMinutes && (
                        <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {node.estimatedMinutes}m
                        </span>
                    )}
                </div>

                {/* Progress bar for enrolled courses */}
                {node.isEnrolled && !node.isCompleted && (
                    <div className="flex flex-col gap-1">
                        <Progress
                            value={node.progressPercentage}
                            className="h-1.5"
                        />
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                            {node.progressPercentage}% selesai
                        </span>
                    </div>
                )}

                {/* Completed badge */}
                {node.isCompleted && (
                    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <Trophy className="size-3" />
                        Kursus selesai!
                    </div>
                )}

                {/* Locked prerequisite info */}
                {node.isLocked && node.prerequisiteTitle && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="size-3" />
                        Memerlukan: {node.prerequisiteTitle}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (!isInteractive) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="cursor-not-allowed">{cardContent}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            Selesaikan &quot;{node.prerequisiteTitle}&quot;
                            untuk membuka
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Link
            href={courseShow.url({ course: node.slug })}
            className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            prefetch
        >
            {cardContent}
        </Link>
    );
}

// ── Connection Line (SVG arrow between nodes) ──
function ConnectionLine({
    isCompleted,
    isVertical = false,
}: {
    isCompleted: boolean;
    isVertical?: boolean;
}) {
    if (isVertical) {
        return (
            <div className="flex justify-center py-1">
                <div
                    className={cn(
                        'flex flex-col items-center gap-0.5',
                        isCompleted
                            ? 'text-emerald-500'
                            : 'text-muted-foreground/40',
                    )}
                >
                    <div
                        className={cn(
                            'h-4 w-0.5 rounded-full',
                            isCompleted
                                ? 'bg-emerald-500'
                                : 'bg-muted-foreground/30',
                        )}
                    />
                    <ChevronRight
                        className={cn(
                            'size-3 rotate-90',
                            isCompleted
                                ? 'text-emerald-500'
                                : 'text-muted-foreground/30',
                        )}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center px-1">
            <div
                className={cn(
                    'flex items-center gap-0.5',
                    isCompleted
                        ? 'text-emerald-500'
                        : 'text-muted-foreground/40',
                )}
            >
                <div
                    className={cn(
                        'h-0.5 w-6 rounded-full',
                        isCompleted
                            ? 'bg-emerald-500'
                            : 'bg-muted-foreground/30',
                    )}
                />
                <ChevronRight
                    className={cn(
                        'size-3',
                        isCompleted
                            ? 'text-emerald-500'
                            : 'text-muted-foreground/30',
                    )}
                />
            </div>
        </div>
    );
}

// ── Main Page ──
export default function LearningPath({ learningPath, summary }: Props) {
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const categories = useMemo(
        () => ['all', ...learningPath.categories],
        [learningPath.categories],
    );

    // Group nodes by category for the tree view
    const filteredNodes = useMemo(() => {
        if (categoryFilter === 'all') {
            return learningPath.nodes;
        }

        return learningPath.nodes.filter((n) => n.category === categoryFilter);
    }, [learningPath.nodes, categoryFilter]);

    // Build prerequisite chains for visual connections
    const nodeMap = useMemo(() => {
        const map = new Map<number, PathNode>();

        for (const node of learningPath.nodes) {
            map.set(node.id, node);
        }

        return map;
    }, [learningPath.nodes]);

    // Group nodes into tiers (by pathPosition)
    const tiers = useMemo(() => {
        const tierMap = new Map<number, PathNode[]>();

        for (const node of filteredNodes) {
            const pos = node.pathPosition ?? 0;

            if (!tierMap.has(pos)) {
                tierMap.set(pos, []);
            }

            tierMap.get(pos)!.push(node);
        }

        return Array.from(tierMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([position, nodes]) => ({ position, nodes }));
    }, [filteredNodes]);

    const completionPercentage =
        summary.totalCourses > 0
            ? Math.round(
                  (summary.completedCourses / summary.totalCourses) * 100,
              )
            : 0;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dasbor', href: '/dashboard' },
                { title: 'Jalur Pembelajaran', href: '/learning-path' },
            ]}
        >
            <Head title="Learning Path" />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                {/* ── Header ── */}
                <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Map className="size-6 text-primary" />
                            <TypographyH1>Jalur Pembelajaran</TypographyH1>
                        </div>
                        <TypographyMuted>
                            Ikuti pohon keterampilan untuk menguasai kriptografi
                            — selesaikan prasyarat untuk membuka kursus
                            lanjutan.
                        </TypographyMuted>
                    </div>

                    {categories.length > 2 && (
                        <Select
                            value={categoryFilter}
                            onValueChange={setCategoryFilter}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat === 'all' ? 'Semua Kategori' : cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </section>

                {/* ── Summary Stats ── */}
                <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Card>
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription>Total Kursus</CardDescription>
                            <CardTitle className="text-2xl tabular-nums">
                                {summary.totalCourses}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription>Selesai</CardDescription>
                            <CardTitle className="text-2xl text-emerald-600 tabular-nums dark:text-emerald-400">
                                {summary.completedCourses}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription>
                                Sedang Berlangsung
                            </CardDescription>
                            <CardTitle className="text-2xl text-blue-600 tabular-nums dark:text-blue-400">
                                {summary.inProgressCourses}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="gap-1 pb-2">
                            <CardDescription>
                                Progres Keseluruhan
                            </CardDescription>
                            <div className="flex flex-col gap-1.5">
                                <CardTitle className="text-2xl tabular-nums">
                                    {completionPercentage}%
                                </CardTitle>
                                <Progress
                                    value={completionPercentage}
                                    className="h-1.5"
                                />
                            </div>
                        </CardHeader>
                    </Card>
                </section>

                {/* ── Skill Tree ── */}
                <section className="flex flex-col gap-2">
                    <h2 className="text-lg font-semibold">
                        Pohon Keterampilan
                    </h2>

                    {tiers.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center gap-3 py-12">
                                <GraduationCap className="size-12 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">
                                    Belum ada kursus tersedia dalam kategori
                                    ini.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {tiers.map((tier, tierIndex) => (
                                <div key={tier.position}>
                                    {/* Tier label */}
                                    <div className="mb-2 flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="text-xs font-medium"
                                        >
                                            Tahap {tierIndex + 1}
                                        </Badge>
                                        <div className="h-px flex-1 bg-border" />
                                    </div>

                                    {/* Nodes in this tier */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {tier.nodes.map((node) => {
                                            const prereq = node.prerequisiteId
                                                ? nodeMap.get(
                                                      node.prerequisiteId,
                                                  )
                                                : null;

                                            return (
                                                <div
                                                    key={node.id}
                                                    className="flex flex-col"
                                                >
                                                    {/* Show connection from prerequisite */}
                                                    {prereq && (
                                                        <ConnectionLine
                                                            isCompleted={
                                                                prereq.isCompleted
                                                            }
                                                            isVertical
                                                        />
                                                    )}
                                                    <PathNodeCard node={node} />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Connection between tiers */}
                                    {tierIndex < tiers.length - 1 && (
                                        <div className="flex justify-center py-2">
                                            <div className="flex flex-col items-center gap-0.5">
                                                <div className="h-6 w-0.5 rounded-full bg-muted-foreground/20" />
                                                <ChevronRight className="size-4 rotate-90 text-muted-foreground/30" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Legend ── */}
                <section>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Legenda</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                {Object.entries(STATUS_CONFIG).map(
                                    ([key, cfg]) => {
                                        const Icon = cfg.icon;

                                        return (
                                            <div
                                                key={key}
                                                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                            >
                                                <div
                                                    className={cn(
                                                        'flex size-5 items-center justify-center rounded-full',
                                                        key === 'completed' &&
                                                            'bg-emerald-500 text-white',
                                                        key === 'in-progress' &&
                                                            'bg-blue-500 text-white',
                                                        key === 'available' &&
                                                            'bg-primary/20 text-primary',
                                                        key === 'locked' &&
                                                            'bg-muted text-muted-foreground',
                                                    )}
                                                >
                                                    <Icon className="size-3" />
                                                </div>
                                                {cfg.label}
                                            </div>
                                        );
                                    },
                                )}
                                <div className="h-px w-full bg-border sm:hidden" />
                                {Object.entries(DIFFICULTY_CONFIG).map(
                                    ([key, cfg]) => (
                                        <div
                                            key={key}
                                            className="flex items-center gap-1.5 text-xs"
                                        >
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'text-[10px]',
                                                    cfg.color,
                                                    cfg.bgColor,
                                                )}
                                            >
                                                {cfg.label}
                                            </Badge>
                                        </div>
                                    ),
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
