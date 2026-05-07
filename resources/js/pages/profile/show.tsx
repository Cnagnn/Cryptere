import { Head, Link } from '@inertiajs/react';
import {
    Award,
    CalendarDays,
    Check,
    Lock,
    MapPin,
    Pencil,
    Share2,
    SlidersHorizontal,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

type ProfileBadge = {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    tier: string;
    earned_at: string;
};

type ProfileUser = {
    id?: number;
    name: string;
    username: string | null;
    email?: string | null;
    avatar?: string | null;
    bio?: string | null;
    pronoun?: string | null;
    location?: string | null;
    profile_visibility?: 'public' | 'private';
    created_at?: string;
};

type Props = {
    profileUser: ProfileUser;
    isOwner: boolean;
    isPrivate: boolean;
    badges: ProfileBadge[];
    mustVerifyEmail?: boolean;
    status?: string;
};

export default function ProfileShow({
    profileUser,
    isOwner,
    isPrivate,
    badges,
}: Props) {
    const pageTitle = isOwner ? 'Profil Saya' : `Profil ${profileUser.name}`;

    if (isPrivate) {
        return (
            <>
                <Head title={pageTitle} />
                <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                    <ProfilePrivate user={profileUser} />
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={pageTitle} />

            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-10">
                    <div className="lg:col-span-3">
                        <ProfileOverviewCard
                            profileUser={profileUser}
                            isOwner={isOwner}
                        />
                    </div>

                    <div className="lg:col-span-7">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lencana</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ProfileBadges badges={badges} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

function ProfileOverviewCard({
    profileUser,
    isOwner,
}: {
    profileUser: ProfileUser;
    isOwner: boolean;
}) {
    const getInitials = useInitials();
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${profileUser.name}'s Profile — Cryptere`,
                    url,
                });

                return;
            } catch {
                // User cancelled the share sheet.
            }
        }

        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="sticky top-24">
            <CardHeader className="space-y-4">
                <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
                    <Avatar className="size-28 rounded-full ring-4 ring-card sm:size-32">
                        <AvatarImage
                            src={profileUser.avatar ?? undefined}
                            alt={profileUser.name}
                        />
                        <AvatarFallback className="bg-muted text-2xl font-semibold text-foreground sm:text-3xl">
                            {getInitials(profileUser.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-2xl">
                            {profileUser.name}
                        </CardTitle>
                        {profileUser.username && (
                            <p className="text-sm text-muted-foreground">
                                @{profileUser.username}
                            </p>
                        )}
                        {profileUser.created_at && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CalendarDays className="size-3.5 shrink-0" />
                                Bergabung{' '}
                                {new Date(
                                    profileUser.created_at,
                                ).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                })}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isOwner && (
                        <Badge
                            variant={
                                profileUser.profile_visibility === 'private'
                                    ? 'secondary'
                                    : 'outline'
                            }
                        >
                            {profileUser.profile_visibility === 'private'
                                ? 'Profil pribadi'
                                : 'Profil publik'}
                        </Badge>
                    )}

                    {isOwner && (
                        <Button asChild variant="outline" size="sm">
                            <Link href="/settings/profile/">
                                <Pencil className="size-4" />
                                Edit profil
                            </Link>
                        </Button>
                    )}

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={handleShare}
                                    className="shrink-0"
                                >
                                    {copied ? (
                                        <Check className="size-4" />
                                    ) : (
                                        <Share2 className="size-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {copied ? 'Tautan disalin!' : 'Bagikan profil'}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                {profileUser.bio && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {profileUser.bio}
                    </p>
                )}

                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {profileUser.pronoun && <span>{profileUser.pronoun}</span>}
                    {profileUser.location && (
                        <span className="inline-flex items-center gap-2">
                            <MapPin className="size-3.5 shrink-0" />
                            {profileUser.location}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// ProfilePrivate Component (inlined)
// ============================================================================

function ProfilePrivate({
    user,
}: {
    user: {
        name: string;
        username: string | null;
        avatar?: string | null;
    };
}) {
    return (
        <PageShell
            name={user.name}
            avatar={user.avatar}
            title={user.name}
            subtitle={user.username ? `@${user.username}` : undefined}
            gradient="muted"
        >
            <Separator />

            <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                    <Lock className="size-7 text-muted-foreground" />
                </div>
                <div className="flex max-w-xs flex-col gap-1.5">
                    <p className="text-base font-semibold">
                        This profile is private
                    </p>
                    <p className="text-sm text-muted-foreground">
                        This user has chosen to keep their profile private. Only
                        they can see their full profile details.
                    </p>
                </div>
            </div>
        </PageShell>
    );
}

// ============================================================================
// ProfileBadges Component (inlined)
// ============================================================================

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

function ProfileBadges({ badges }: { badges: ProfileBadge[] }) {
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
