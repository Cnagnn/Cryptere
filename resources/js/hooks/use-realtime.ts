import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { echo } from '@/lib/echo';

interface RealtimeConfig {
    userId: number;
    onStatsUpdate?: (data: any) => void;
    onBadgeUnlock?: (data: any) => void;
    onLevelUp?: (data: any) => void;
    onRankChanged?: (data: any) => void;
}

export function useRealtime(config: RealtimeConfig) {
    const { userId, onStatsUpdate, onBadgeUnlock, onLevelUp, onRankChanged } =
        config;

    useEffect(() => {
        if (!userId) {
            return;
        }

        const userChannel = echo.private(`user.${userId}`);

        if (onStatsUpdate) {
            userChannel.listen('.stats.updated', (data: any) => {
                onStatsUpdate(data);
            });
        }

        if (onBadgeUnlock) {
            userChannel.listen('.badge.unlocked', (data: any) => {
                toast.success(`Badge baru: ${data.badge.name} unlocked!`, {
                    description: data.badge.description,
                    action: {
                        label: 'Lihat',
                        onClick: () => router.visit('/profile/badges'),
                    },
                    duration: 5000,
                });
                onBadgeUnlock(data);
            });
        }

        if (onLevelUp) {
            userChannel.listen('.level.up', (data: any) => {
                toast.success(`Selamat! Anda naik ke Level ${data.newLevel}!`, {
                    description:
                        data.unlockedFeatures?.length > 0
                            ? `Fitur baru: ${data.unlockedFeatures.join(', ')}`
                            : 'Lanjutkan belajar untuk unlock fitur baru!',
                    duration: 5000,
                });
                onLevelUp(data);
            });
        }

        if (onRankChanged) {
            userChannel.listen('.rank.changed', (data: any) => {
                if (Math.abs(data.change) >= 5) {
                    const message =
                        data.direction === 'up'
                            ? `Posisi leaderboard naik ${data.change} peringkat!`
                            : `Posisi leaderboard turun ${data.change} peringkat`;

                    toast.info(message, {
                        description: `Posisi ${data.timeframe}: #${data.newRank}`,
                        duration: 4000,
                    });
                }

                onRankChanged(data);
            });
        }

        return () => {
            echo.leave(`user.${userId}`);
        };
    }, [userId, onStatsUpdate, onBadgeUnlock, onLevelUp, onRankChanged]);
}
