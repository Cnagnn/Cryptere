import { usePage } from '@inertiajs/react';
import { Award, Shield, Star, Trophy } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

type BadgeFlash = {
    name: string;
    description: string;
    icon: string | null;
    tier: string;
    category: string;
};

type LevelUpFlash = {
    level: number;
};

const tierColors: Record<string, string> = {
    bronze: 'text-amber-700',
    silver: 'text-gray-400',
    gold: 'text-yellow-500',
    platinum: 'text-cyan-400',
};

function BadgeIcon({ tier }: { tier: string }) {
    const className = `size-6 ${tierColors[tier] ?? 'text-primary'}`;

    switch (tier) {
        case 'gold':
        case 'platinum':
            return <Trophy className={className} />;
        case 'silver':
            return <Star className={className} />;
        default:
            return <Award className={className} />;
    }
}

export function AchievementToast() {
    const page = usePage<{
        flash?: {
            newBadges?: BadgeFlash[];
            levelUp?: LevelUpFlash;
        };
    }>();

    const flash = page.props.flash;
    const processedRef = useRef<string | null>(null);

    useEffect(() => {
        const key = JSON.stringify({ b: flash?.newBadges, l: flash?.levelUp });

        if (key === processedRef.current) {
            return;
        }

        processedRef.current = key;

        if (flash?.levelUp) {
            toast.success('Naik Level!', {
                description: `Anda mencapai Level ${flash.levelUp.level}!`,
                icon: <Shield className="size-5 text-primary" />,
                duration: 6000,
            });
        }

        if (flash?.newBadges && flash.newBadges.length > 0) {
            flash.newBadges.forEach((badge, i) => {
                setTimeout(
                    () => {
                        toast.success('Lencana Diperoleh!', {
                            description: `${badge.name} — ${badge.description}`,
                            icon: <BadgeIcon tier={badge.tier} />,
                            duration: 5000,
                        });
                    },
                    (flash?.levelUp ? 800 : 0) + i * 600,
                );
            });
        }
    }, [flash?.newBadges, flash?.levelUp]);

    return null;
}
