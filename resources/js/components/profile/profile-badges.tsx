import { Award, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type ProfileBadge = {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    tier: string;
    earned_at: string;
};

const tierRing: Record<string, string> = {
    bronze: 'ring-amber-400/60 dark:ring-amber-500/40',
    silver: 'ring-slate-400/60 dark:ring-slate-400/40',
    gold: 'ring-yellow-400/60 dark:ring-yellow-500/40',
    platinum: 'ring-cyan-400/60 dark:ring-cyan-400/40',
};

const tierBg: Record<string, string> = {
    bronze: 'bg-amber-50 dark:bg-amber-950/30',
    silver: 'bg-slate-50 dark:bg-slate-900/30',
    gold: 'bg-yellow-50 dark:bg-yellow-950/30',
    platinum: 'bg-cyan-50 dark:bg-cyan-950/30',
};

const tierLabel: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
};

const categoryLabels: Record<string, string> = {
    all: 'All',
    milestone: 'Milestone',
    course: 'Course',
    streak: 'Streak',
    lab: 'Lab',
    special: 'Special',
};

type SortMode = 'newest' | 'oldest' | 'name';

const sortLabels: Record<SortMode, string> = {
    newest: 'Newest',
    oldest: 'Oldest',
    name: 'A → Z',
};

export function ProfileBadges({ badges }: { badges: ProfileBadge[] }) {
    const [sortMode, setSortMode] = useState<SortMode>('newest');
    const [activeCategory, setActiveCategory] = useState('all');

    const categories = useMemo(() => {
        const cats = new Set(badges.map((b) => b.category));

        return ['all', ...Array.from(cats).sort()];
    }, [badges]);

    const cycleSortMode = () => {
        setSortMode((prev) => {
            if (prev === 'newest') {
                return 'oldest';
            }

            if (prev === 'oldest') {
                return 'name';
            }

            return 'newest';
        });
    };

    const filteredAndSorted = useMemo(() => {
        const result =
            activeCategory === 'all'
                ? [...badges]
                : badges.filter((b) => b.category === activeCategory);

        result.sort((a, b) => {
            if (sortMode === 'newest') {
                return (
                    new Date(b.earned_at).getTime() -
                    new Date(a.earned_at).getTime()
                );
            }

            if (sortMode === 'oldest') {
                return (
                    new Date(a.earned_at).getTime() -
                    new Date(b.earned_at).getTime()
                );
            }

            return a.name.localeCompare(b.name);
        });

        return result;
    }, [badges, activeCategory, sortMode]);

    if (badges.length === 0) {
        return (
            <Empty className="rounded-2xl border">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <Award />
                    </EmptyMedia>
                    <EmptyTitle>No badges yet</EmptyTitle>
                    <EmptyDescription>
                        Complete courses and milestones to earn badges.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    {categories.map((cat) => {
                        const count =
                            cat === 'all'
                                ? badges.length
                                : badges.filter((b) => b.category === cat)
                                      .length;

                        return (
                            <Button
                                key={cat}
                                variant={
                                    activeCategory === cat
                                        ? 'default'
                                        : 'outline'
                                }
                                size="sm"
                                className="h-7 rounded-full px-3 text-xs"
                                onClick={() => setActiveCategory(cat)}
                            >
                                {categoryLabels[cat] ?? cat}
                                <span className="ml-1 opacity-60">{count}</span>
                            </Button>
                        );
                    })}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-muted-foreground"
                    onClick={cycleSortMode}
                >
                    <SlidersHorizontal className="size-3.5" />
                    {sortLabels[sortMode]}
                </Button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                <TooltipProvider>
                    {filteredAndSorted.map((badge) => (
                        <BadgeItem key={badge.id} badge={badge} />
                    ))}
                </TooltipProvider>
            </div>

            {filteredAndSorted.length === 0 && badges.length > 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    No badges in this category.
                </p>
            )}
        </div>
    );
}

function BadgeItem({ badge }: { badge: ProfileBadge }) {
    const earnedDate = new Date(badge.earned_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="group flex cursor-default flex-col items-center gap-2.5 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
                    <div
                        className={cn(
                            'flex size-14 items-center justify-center rounded-full ring-2 transition-transform group-hover:scale-110',
                            tierRing[badge.tier] ?? 'ring-border',
                            tierBg[badge.tier] ?? 'bg-muted',
                        )}
                    >
                        <span className="text-2xl">{badge.icon}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-xs leading-tight font-medium">
                            {badge.name}
                        </p>
                        <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-[10px] capitalize"
                        >
                            {tierLabel[badge.tier] ?? badge.tier}
                        </Badge>
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
                <div className="flex flex-col gap-1">
                    <p className="font-medium">{badge.name}</p>
                    <p className="text-xs opacity-80">{badge.description}</p>
                    <p className="mt-0.5 text-[10px] opacity-60">
                        Earned {earnedDate}
                    </p>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
