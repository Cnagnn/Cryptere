import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Award,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Flag,
    Lightbulb,
    Lock,
    Medal,
    Send,
    Shield,
    Trophy,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { useInitials } from '@/hooks/use-initials';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

// ── Types ──

type CtfEventData = {
    id: number;
    slug: string;
    title: string;
    description: string;
    rules: string | null;
    startsAt: string;
    endsAt: string;
    isActive: boolean;
    isUpcoming: boolean;
    hasEnded: boolean;
    maxParticipants: number | null;
    bonusXp: number;
    participantCount: number;
    flagsCount: number;
    isFull: boolean;
};

type CtfFlagItem = {
    id: number;
    title: string;
    description: string;
    hint: string | null;
    points: number;
    difficulty: string;
    category: string | null;
    sortOrder: number;
    isSolved: boolean;
    pointsEarned: number;
    solveCount: number;
};

type LeaderboardEntry = {
    rank: number;
    userId: number;
    name: string;
    username: string | null;
    avatar: string | null;
    totalPoints: number;
    flagsCaptured: number;
    completedAt: string | null;
};

type Registration = {
    isRegistered: boolean;
    totalPoints: number;
    flagsCaptured: number;
    completedAt: string | null;
};

type Props = {
    event: CtfEventData;
    flags: CtfFlagItem[];
    leaderboard: LeaderboardEntry[];
    registration: Registration;
};

// ── Countdown Hook ──

function useCountdown(targetDate: string) {
    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetDate));
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return timeLeft;
}

function calculateTimeLeft(targetDate: string) {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
    };
}

// ── Difficulty Badge ──

function DifficultyBadge({ difficulty }: { difficulty: string }) {
    const colors: Record<string, string> = {
        beginner: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
        intermediate: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
        advanced: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    };

    return (
        <Badge className={colors[difficulty] ?? 'bg-muted text-muted-foreground'}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </Badge>
    );
}

function CategoryBadge({ category }: { category: string | null }) {
    if (!category) return null;
    return (
        <Badge variant="outline" className="text-xs">
            {category}
        </Badge>
    );
}

// ── Main Component ──

export default function CtfShow({ event, flags, leaderboard, registration }: Props) {
    const countdown = useCountdown(event.isActive ? event.endsAt : event.startsAt);
    const progressPercent = event.flagsCount > 0
        ? (registration.flagsCaptured / event.flagsCount) * 100
        : 0;

    const handleRegister = () => {
        router.post(`/ctf/${event.slug}/register`);
    };

    return (
        <AppLayout>
            <Head title={event.title} />

            <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:px-6">
                {/* Event Header */}
                <div className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                            <TypographyH1>{event.title}</TypographyH1>
                            <TypographyMuted className="mt-2 max-w-2xl">
                                {event.description}
                            </TypographyMuted>
                        </div>

                        {/* Status + Registration */}
                        <div className="flex flex-col items-end gap-2">
                            {event.isActive && (
                                <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                                    <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                    Active
                                </Badge>
                            )}
                            {event.isUpcoming && (
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Upcoming
                                </Badge>
                            )}
                            {event.hasEnded && (
                                <Badge variant="outline" className="text-muted-foreground">
                                    <Lock className="mr-1 h-3 w-3" />
                                    Ended
                                </Badge>
                            )}

                            {!registration.isRegistered && !event.hasEnded && (
                                <Button onClick={handleRegister} disabled={event.isFull}>
                                    {event.isFull ? 'Event Full' : 'Register Now'}
                                </Button>
                            )}
                            {registration.isRegistered && (
                                <Badge variant="secondary" className="text-green-600 dark:text-green-400">
                                    ✓ Registered
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Countdown Timer */}
                    {(event.isActive || event.isUpcoming) && !countdown.expired && (
                        <Card className="border-dashed">
                            <CardContent className="flex items-center justify-center gap-6 py-4">
                                <span className="text-sm font-medium text-muted-foreground">
                                    {event.isActive ? 'Ends in:' : 'Starts in:'}
                                </span>
                                <div className="flex gap-4">
                                    {countdown.days > 0 && (
                                        <TimeUnit value={countdown.days} label="days" />
                                    )}
                                    <TimeUnit value={countdown.hours} label="hrs" />
                                    <TimeUnit value={countdown.minutes} label="min" />
                                    <TimeUnit value={countdown.seconds} label="sec" />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Event Stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                            {event.bonusXp} bonus XP for completion
                        </span>
                    </div>

                    {/* User Progress */}
                    {registration.isRegistered && (
                        <Card>
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Your Progress</span>
                                    <span className="text-muted-foreground">
                                        {registration.flagsCaptured}/{event.flagsCount} flags · {registration.totalPoints} points
                                    </span>
                                </div>
                                <Progress value={progressPercent} className="mt-2 h-2" />
                                {registration.completedAt && (
                                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                                        🎉 All flags captured! Bonus XP awarded.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Flags Column */}
                    <div className="space-y-4 lg:col-span-2">
                        <h2 className="text-xl font-semibold">Flags</h2>

                        {/* Rules (collapsible) */}
                        {event.rules && (
                            <Collapsible>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="mb-2 gap-1 text-muted-foreground">
                                        <Shield className="h-4 w-4" />
                                        Event Rules
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <Card className="mb-4">
                                        <CardContent className="py-4">
                                            <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                                                {event.rules}
                                            </pre>
                                        </CardContent>
                                    </Card>
                                </CollapsibleContent>
                            </Collapsible>
                        )}

                        {flags.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    No flags available yet.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {flags.map((flag) => (
                                    <FlagCard
                                        key={flag.id}
                                        flag={flag}
                                        eventSlug={event.slug}
                                        canSubmit={registration.isRegistered && event.isActive}
                                        showSolutions={event.hasEnded}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Leaderboard Sidebar */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Leaderboard</h2>
                        <LeaderboardPanel entries={leaderboard} eventSlug={event.slug} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

// ── Flag Card ──

function FlagCard({
    flag,
    eventSlug,
    canSubmit,
    showSolutions,
}: {
    flag: CtfFlagItem;
    eventSlug: string;
    canSubmit: boolean;
    showSolutions: boolean;
}) {
    const [flagInput, setFlagInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [solved, setSolved] = useState(flag.isSolved);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = useCallback(async () => {
        if (!flagInput.trim() || submitting) return;

        setSubmitting(true);
        setFeedback(null);

        try {
            const response = await fetch(`/ctf/${eventSlug}/flags/${flag.id}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ flag: flagInput }),
            });

            const data = await response.json();
            setFeedback({ correct: data.is_correct, message: data.message });

            if (data.is_correct) {
                setSolved(true);
                setFlagInput('');
                // Refresh page data after a short delay
                setTimeout(() => {
                    router.reload({ only: ['flags', 'leaderboard', 'registration'] });
                }, 1500);
            }
        } catch {
            setFeedback({ correct: false, message: 'Network error. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    }, [flagInput, submitting, eventSlug, flag.id]);

    return (
        <Card className={cn(
            'transition-all',
            solved && 'border-green-500/30 bg-green-500/5',
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            {solved ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                            ) : (
                                <Flag className="h-5 w-5 shrink-0 text-muted-foreground" />
                            )}
                            <CardTitle className="text-base">{flag.title}</CardTitle>
                        </div>
                        <CardDescription className="mt-2 whitespace-pre-wrap">
                            {flag.description}
                        </CardDescription>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant="secondary" className="font-mono text-sm">
                            {flag.points} pts
                        </Badge>
                        <DifficultyBadge difficulty={flag.difficulty} />
                        <CategoryBadge category={flag.category} />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Solve count */}
                <p className="text-xs text-muted-foreground">
                    {flag.solveCount} {flag.solveCount === 1 ? 'solve' : 'solves'}
                </p>

                {/* Hint toggle */}
                {flag.hint && (
                    <div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs text-muted-foreground"
                            onClick={() => setShowHint(!showHint)}
                        >
                            <Lightbulb className="h-3 w-3" />
                            {showHint ? 'Hide Hint' : 'Show Hint'}
                            {showHint ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                        {showHint && (
                            <div className="mt-1 rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-300">
                                💡 {flag.hint}
                            </div>
                        )}
                    </div>
                )}

                {/* Solved state */}
                {solved && (
                    <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
                        <CheckCircle2 className="h-4 w-4" />
                        Captured! +{flag.pointsEarned || flag.points} points
                    </div>
                )}

                {/* Submission form */}
                {canSubmit && !solved && (
                    <div className="flex gap-2">
                        <Input
                            ref={inputRef}
                            placeholder="CTF{your_answer_here}"
                            value={flagInput}
                            onChange={(e) => setFlagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            disabled={submitting}
                            className="font-mono"
                        />
                        <Button
                            onClick={handleSubmit}
                            disabled={!flagInput.trim() || submitting}
                            size="sm"
                        >
                            <Send className="mr-1 h-4 w-4" />
                            Submit
                        </Button>
                    </div>
                )}

                {/* Feedback */}
                {feedback && (
                    <div className={cn(
                        'rounded-md p-3 text-sm',
                        feedback.correct
                            ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                            : 'bg-red-500/10 text-red-700 dark:text-red-300',
                    )}>
                        {feedback.message}
                    </div>
                )}

                {/* Not registered warning */}
                {!canSubmit && !solved && !showSolutions && (
                    <p className="text-xs text-muted-foreground">
                        <AlertTriangle className="mr-1 inline h-3 w-3" />
                        {!canSubmit ? 'Register for this event to submit flags.' : ''}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

// ── Countdown Time Unit ──

function TimeUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-2xl font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );
}

// ── Leaderboard Panel ──

function LeaderboardPanel({ entries, eventSlug }: { entries: LeaderboardEntry[]; eventSlug: string }) {
    const getInitials = useInitials();

    if (entries.length === 0) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    <Trophy className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    No participants on the leaderboard yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4" />
                    Top Participants
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {entries.slice(0, 10).map((entry) => (
                    <div
                        key={entry.userId}
                        className={cn(
                            'flex items-center gap-3 rounded-md p-2 text-sm',
                            entry.rank <= 3 && 'bg-muted/50',
                        )}
                    >
                        {/* Rank */}
                        <span className="w-6 shrink-0 text-center font-bold">
                            {entry.rank === 1 && <Medal className="mx-auto h-4 w-4 text-yellow-500" />}
                            {entry.rank === 2 && <Medal className="mx-auto h-4 w-4 text-gray-400" />}
                            {entry.rank === 3 && <Medal className="mx-auto h-4 w-4 text-amber-700" />}
                            {entry.rank > 3 && entry.rank}
                        </span>

                        {/* Avatar */}
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={entry.avatar ?? undefined} />
                            <AvatarFallback className="text-xs">
                                {getInitials(entry.name)}
                            </AvatarFallback>
                        </Avatar>

                        {/* Name */}
                        <span className="min-w-0 flex-1 truncate font-medium">
                            {entry.name}
                        </span>

                        {/* Points */}
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                            {entry.totalPoints} pts
                        </span>

                        {/* Flags */}
                        <span className="shrink-0 text-xs text-muted-foreground">
                            <Flag className="mr-0.5 inline h-3 w-3" />
                            {entry.flagsCaptured}
                        </span>
                    </div>
                ))}

                {entries.length > 10 && (
                    <p className="pt-2 text-center text-xs text-muted-foreground">
                        +{entries.length - 10} more participants
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

CtfShow.layout = {
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
