import { Gift, Sparkles, Star, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
    index as fetchRewards,
    claim as claimReward,
} from '@/actions/App/Http/Controllers/DailyRewardController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type RewardTier = { xp: number; points: number };

type DailyRewardData = {
    claimed_today: boolean;
    day_number: number;
    today_reward: RewardTier;
    tiers: Record<number, RewardTier>;
    calendar: Array<{
        date: string;
        day_number: number;
        xp: number;
        points: number;
    }>;
    current_streak: number;
};

type ClaimResult = {
    success: boolean;
    day_number: number;
    xp_earned: number;
    points_earned: number;
    total_xp: number;
    total_points: number;
};

export function DailyRewards() {
    const [data, setData] = useState<DailyRewardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
    const [open, setOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);

        try {
            const response = await fetch(fetchRewards.url(), {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
return;
}

            const json = await response.json();
            setData(json);
        } catch {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            loadData();
            setClaimResult(null);
        }
    }, [open, loadData]);

    async function handleClaim() {
        setClaiming(true);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(claimReward.url(), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken ?? '',
                },
            });

            if (!response.ok) {
return;
}

            const result: ClaimResult = await response.json();
            setClaimResult(result);

            // Refresh data
            await loadData();
        } catch {
            // Silently fail
        } finally {
            setClaiming(false);
        }
    }

    const tiers = data?.tiers ?? {};
    const tierEntries = Object.entries(tiers).map(([day, tier]) => ({
        day: Number(day),
        ...tier,
    }));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-9 cursor-pointer"
                >
                    <Gift className="size-5 opacity-80" />
                    {data && !data.claimed_today && (
                        <span className="absolute -top-0.5 -right-0.5 flex size-3 rounded-full bg-amber-500">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                        </span>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gift data-icon="inline-start" />
                        Daily Rewards
                    </DialogTitle>
                    <DialogDescription>
                        Log in every day to earn escalating rewards! Complete 7
                        days for the biggest bonus.
                    </DialogDescription>
                </DialogHeader>

                {loading && !data ? (
                    <div className="flex flex-col gap-4 py-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : data ? (
                    <div className="flex flex-col gap-4">
                        {/* Streak Progress */}
                        <div className="flex items-center justify-between rounded-lg bg-accent/50 p-3">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">
                                    Day {data.day_number} of 7
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {data.current_streak}-day streak
                                </span>
                            </div>
                            <Progress
                                value={(data.day_number / 7) * 100}
                                className="w-32"
                            />
                        </div>

                        {/* 7-Day Tier Grid */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {tierEntries.map((tier) => {
                                const isCurrent =
                                    tier.day === data.day_number;
                                const isPast = data.calendar.some(
                                    (c) => c.day_number === tier.day,
                                );
                                const isCompleted =
                                    isPast ||
                                    (isCurrent && data.claimed_today);

                                return (
                                    <div
                                        key={tier.day}
                                        className={cn(
                                            'flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-all',
                                            isCurrent && !data.claimed_today
                                                ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                                                : isCompleted
                                                  ? 'border-emerald-500/30 bg-emerald-500/10'
                                                  : 'border-border bg-card',
                                        )}
                                    >
                                        <span className="text-[10px] font-medium text-muted-foreground">
                                            Day {tier.day}
                                        </span>
                                        {isCompleted ? (
                                            <Star className="size-5 fill-amber-400 text-amber-400" />
                                        ) : isCurrent ? (
                                            <Sparkles className="size-5 text-primary" />
                                        ) : (
                                            <Gift className="size-5 text-muted-foreground/40" />
                                        )}
                                        <span className="text-[10px] font-bold">
                                            {tier.xp} XP
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <Separator />

                        {/* Claim Button or Result */}
                        {claimResult ? (
                            <div className="flex flex-col items-center gap-2 rounded-lg bg-emerald-500/10 p-4 text-center">
                                <Sparkles className="size-8 text-amber-400" />
                                <span className="text-lg font-bold">
                                    Reward Claimed!
                                </span>
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary">
                                        <Zap data-icon="inline-start" />+
                                        {claimResult.xp_earned} XP
                                    </Badge>
                                    <Badge variant="secondary">
                                        <Star data-icon="inline-start" />+
                                        {claimResult.points_earned} Points
                                    </Badge>
                                </div>
                            </div>
                        ) : data.claimed_today ? (
                            <div className="flex flex-col items-center gap-2 py-4 text-center text-sm text-muted-foreground">
                                <Star className="size-6 fill-amber-400 text-amber-400" />
                                <span>
                                    Today's reward has been claimed!
                                </span>
                                <span className="text-xs">
                                    Come back tomorrow for Day{' '}
                                    {data.day_number >= 7
                                        ? 1
                                        : data.day_number + 1}{' '}
                                    rewards.
                                </span>
                            </div>
                        ) : (
                            <Button
                                onClick={handleClaim}
                                disabled={claiming}
                                className="w-full"
                                size="lg"
                            >
                                {claiming ? (
                                    <>
                                        <Spinner
                                            data-icon="inline-start"
                                            className="size-4"
                                        />
                                        Claiming…
                                    </>
                                ) : (
                                    <>
                                        <Gift data-icon="inline-start" />
                                        Claim Day {data.day_number} Reward (+
                                        {data.today_reward.xp} XP, +
                                        {data.today_reward.points} Points)
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
