import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    ChevronRight,
    Clock,
    Flag,
    Lock,
    Trophy,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

// ── Types ──

type CtfEventItem = {
    id: number;
    slug: string;
    title: string;
    description: string;
    startsAt: string;
    endsAt: string;
    flagsCount: number;
    participantCount: number;
    maxParticipants: number | null;
    bonusXp: number;
    isActive: boolean;
    isUpcoming: boolean;
    hasEnded: boolean;
    isFull: boolean;
    isRegistered: boolean;
    userPoints: number;
    userFlagsCaptured: number;
};

type Props = {
    events: CtfEventItem[];
};

// ── Helpers ──

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getStatusBadge(event: CtfEventItem) {
    if (event.isActive) {
        return (
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
                Active Now
            </Badge>
        );
    }
    if (event.isUpcoming) {
        return (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                <Clock className="mr-1 h-3 w-3" />
                Upcoming
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="text-muted-foreground">
            <Lock className="mr-1 h-3 w-3" />
            Ended
        </Badge>
    );
}

// ── Component ──

export default function CtfIndex({ events }: Props) {
    const grouped = useMemo(() => {
        const active = events.filter((e) => e.isActive);
        const upcoming = events.filter((e) => e.isUpcoming);
        const past = events.filter((e) => e.hasEnded);
        return { active, upcoming, past };
    }, [events]);

    return (
        <AppLayout>
            <Head title="CTF Events" />

            <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-6">
                {/* Header */}
                <div>
                    <TypographyH1>CTF Events</TypographyH1>
                    <TypographyMuted className="mt-2">
                        Compete in timed Capture The Flag challenges. Solve crypto puzzles, capture flags, and climb the leaderboard.
                    </TypographyMuted>
                </div>

                {events.length === 0 ? (
                    <Empty>
                        <EmptyMedia>
                            <Flag className="h-12 w-12 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyContent>
                            <EmptyHeader>
                                <EmptyTitle>No CTF Events Yet</EmptyTitle>
                            </EmptyHeader>
                            <EmptyDescription>
                                Check back soon for upcoming Capture The Flag events!
                            </EmptyDescription>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <>
                        {/* Active Events */}
                        {grouped.active.length > 0 && (
                            <EventSection title="🔴 Active Now" events={grouped.active} />
                        )}

                        {/* Upcoming Events */}
                        {grouped.upcoming.length > 0 && (
                            <EventSection title="📅 Upcoming" events={grouped.upcoming} />
                        )}

                        {/* Past Events */}
                        {grouped.past.length > 0 && (
                            <>
                                <Separator />
                                <EventSection title="📜 Past Events" events={grouped.past} />
                            </>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}

function EventSection({ title, events }: { title: string; events: CtfEventItem[] }) {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <div className="grid gap-4 md:grid-cols-2">
                {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        </div>
    );
}

function EventCard({ event }: { event: CtfEventItem }) {
    const handleRegister = () => {
        router.post(`/ctf/${event.slug}/register`);
    };

    return (
        <Card className={cn(
            'transition-all hover:shadow-md',
            event.isActive && 'border-green-500/30 shadow-green-500/5',
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg leading-tight">
                            <Link
                                href={`/ctf/${event.slug}`}
                                className="hover:underline"
                            >
                                {event.title}
                            </Link>
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                            {event.description}
                        </CardDescription>
                    </div>
                    {getStatusBadge(event)}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.startsAt)} — {formatDate(event.endsAt)}
                    </span>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Flag className="h-4 w-4" />
                        {event.flagsCount} flags
                    </span>
                    <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {event.participantCount}
                        {event.maxParticipants ? `/${event.maxParticipants}` : ''} participants
                    </span>
                    <span className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        {event.bonusXp} bonus XP
                    </span>
                </div>

                {/* User progress (if registered) */}
                {event.isRegistered && (
                    <div className="rounded-md bg-muted/50 p-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">Your Progress</span>
                            <span className="text-muted-foreground">
                                {event.userFlagsCaptured}/{event.flagsCount} flags · {event.userPoints} pts
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {event.isActive || event.isUpcoming ? (
                        <>
                            {!event.isRegistered ? (
                                <Button
                                    size="sm"
                                    onClick={handleRegister}
                                    disabled={event.isFull}
                                >
                                    {event.isFull ? 'Event Full' : 'Register'}
                                </Button>
                            ) : (
                                <Badge variant="secondary" className="text-green-600 dark:text-green-400">
                                    ✓ Registered
                                </Badge>
                            )}
                            <Button size="sm" variant="outline" asChild>
                                <Link href={`/ctf/${event.slug}`}>
                                    View Event
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <Button size="sm" variant="outline" asChild>
                            <Link href={`/ctf/${event.slug}`}>
                                View Results
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

CtfIndex.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: dashboard(),
        },
        {
            title: 'CTF Events',
            href: '/ctf',
        },
    ],
};
