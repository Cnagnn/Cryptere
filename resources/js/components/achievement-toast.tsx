import { usePage } from '@inertiajs/react';
import { Award, ScrollText, Shield, Star, Trophy } from 'lucide-react';
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

type StoryChapterFlash = {
    id: number;
    slug: string;
    title: string;
    chapter_number: number;
    icon: string;
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
            newStoryChapters?: StoryChapterFlash[];
        };
    }>();

    const flash = page.props.flash;
    const processedRef = useRef<string | null>(null);

    useEffect(() => {
        const key = JSON.stringify({ b: flash?.newBadges, l: flash?.levelUp, s: flash?.newStoryChapters });

        if (key === processedRef.current) {
            return;
        }

        processedRef.current = key;

        if (flash?.levelUp) {
            toast.success('Level Up!', {
                description: `You reached Level ${flash.levelUp.level}!`,
                icon: <Shield className="size-5 text-primary" />,
                duration: 6000,
            });
        }

        if (flash?.newBadges && flash.newBadges.length > 0) {
            flash.newBadges.forEach((badge, i) => {
                setTimeout(
                    () => {
                        toast.success('Badge Earned!', {
                            description: `${badge.name} — ${badge.description}`,
                            icon: <BadgeIcon tier={badge.tier} />,
                            duration: 5000,
                        });
                    },
                    (flash?.levelUp ? 800 : 0) + i * 600,
                );
            });
        }

        if (flash?.newStoryChapters && flash.newStoryChapters.length > 0) {
            const baseDelay =
                (flash?.levelUp ? 800 : 0) +
                (flash?.newBadges?.length ?? 0) * 600;

            flash.newStoryChapters.forEach((chapter, i) => {
                setTimeout(
                    () => {
                        toast.success('📜 New Chapter Unlocked!', {
                            description: `Chapter ${chapter.chapter_number}: ${chapter.title}`,
                            icon: <ScrollText className="size-5 text-amber-600" />,
                            duration: 7000,
                            action: {
                                label: 'Read',
                                onClick: () => {
                                    window.location.href = '/story';
                                },
                            },
                        });
                    },
                    baseDelay + i * 600,
                );
            });
        }
    }, [flash?.newBadges, flash?.levelUp, flash?.newStoryChapters]);

    return null;
}
