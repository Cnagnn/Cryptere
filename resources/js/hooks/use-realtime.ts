import { useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
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
        if (!userId) return;

        // Subscribe to private user channel
        const userChannel = echo.channel(`user.${userId}`);

        // User stats updates (animation)
        if (onStatsUpdate) {
            userChannel.listen('.stats.updated', (data: any) => {
                onStatsUpdate(data);
            });
        }

        // Badge unlock (toast)
        if (onBadgeUnlock) {
            userChannel.listen('.badge.unlocked', (data: any) => {
                toast.success(`Badge baru: ${data.badge.name} unlocked!`, {
                    icon: '🏆',
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

        // Level up (toast)
        if (onLevelUp) {
            userChannel.listen('.level.up', (data: any) => {
                toast.success(`Selamat! Anda naik ke Level ${data.newLevel}!`, {
                    icon: '🎉',
                    description:
                        data.unlockedFeatures?.length > 0
                            ? `Fitur baru: ${data.unlockedFeatures.join(', ')}`
                            : 'Lanjutkan belajar untuk unlock fitur baru!',
                    duration: 5000,
                });
                onLevelUp(data);
            });
        }

        // Rank changed (toast for major, animation for minor)
        if (onRankChanged) {
            userChannel.listen('.rank.changed', (data: any) => {
                if (Math.abs(data.change) >= 5) {
                    const icon = data.direction === 'up' ? '📈' : '📉';
                    const message =
                        data.direction === 'up'
                            ? `Posisi leaderboard naik ${data.change} peringkat!`
                            : `Posisi leaderboard turun ${data.change} peringkat`;

                    toast.info(message, {
                        icon,
                        description: `Posisi ${data.timeframe}: #${data.newRank}`,
                        duration: 4000,
                    });
                }
                onRankChanged(data);
            });
        }

        // Subscribe to leaderboard channel
        const leaderboardChannel = echo.channel('leaderboard');
        leaderboardChannel.listen('.leaderboard.updated', () => {
            // Silent update for leaderboard
            router.reload({ only: ['academy'] });
        });

        // Cleanup
        return () => {
            echo.leave(`user.${userId}`);
            echo.leave('leaderboard');
        };
    }, [userId, onStatsUpdate, onBadgeUnlock, onLevelUp, onRankChanged]);
}
