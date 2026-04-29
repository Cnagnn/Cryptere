import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Shape of a leaderboard entry received via WebSocket.
 */
export interface LeaderboardEntry {
    id: number;
    name: string;
    username: string;
    points: number;
}

/**
 * Payload broadcast by the `leaderboard.updated` event.
 */
export interface LeaderboardUpdatePayload {
    timeframe: string;
    top3: LeaderboardEntry[];
}

/**
 * Options for the useLeaderboardChannel hook.
 */
interface UseLeaderboardChannelOptions {
    /** Only react to updates for this timeframe (e.g. 'weekly'). Null = all. */
    timeframe?: string | null;
    /** Callback fired on every leaderboard update. */
    onUpdate?: (payload: LeaderboardUpdatePayload) => void;
}

/**
 * React hook that subscribes to the public `leaderboard` channel via Laravel Echo
 * and listens for `leaderboard.updated` events broadcast by the server.
 *
 * Requires Laravel Echo to be configured and available on `window.Echo`.
 *
 * @example
 * ```tsx
 * const { top3, timeframe, connected } = useLeaderboardChannel({
 *     timeframe: 'weekly',
 *     onUpdate: (payload) => console.log('Leaderboard updated!', payload),
 * });
 * ```
 */
export function useLeaderboardChannel(options: UseLeaderboardChannelOptions = {}) {
    const { timeframe: filterTimeframe = null, onUpdate } = options;

    const [top3, setTop3] = useState<LeaderboardEntry[]>([]);
    const [timeframe, setTimeframe] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    // Keep a stable ref to the onUpdate callback to avoid re-subscribing.
    const onUpdateRef = useRef(onUpdate);
    onUpdateRef.current = onUpdate;

    const handleEvent = useCallback(
        (payload: LeaderboardUpdatePayload) => {
            // If filtering by timeframe, ignore non-matching updates.
            if (filterTimeframe && payload.timeframe !== filterTimeframe) {
                return;
            }

            setTop3(payload.top3);
            setTimeframe(payload.timeframe);
            onUpdateRef.current?.(payload);
        },
        [filterTimeframe],
    );

    useEffect(() => {
        // Laravel Echo must be available globally (typically set up in bootstrap.ts or echo.ts).
        const echo = (window as unknown as { Echo?: EchoInstance }).Echo;

        if (!echo) {
            console.warn(
                '[useLeaderboardChannel] Laravel Echo is not available on window.Echo. ' +
                    'Make sure laravel-echo and the Reverb connector are installed and configured.',
            );

            return;
        }

        const channel = echo.channel('leaderboard');
        setConnected(true);

        channel.listen('.leaderboard.updated', (event: LeaderboardUpdatePayload) => {
            handleEvent(event);
        });

        return () => {
            echo.leaveChannel('leaderboard');
            setConnected(false);
        };
    }, [handleEvent]);

    return { top3, timeframe, connected } as const;
}

/**
 * Minimal type for the Laravel Echo instance so we don't require the full
 * `laravel-echo` package as a compile-time dependency.
 */
interface EchoInstance {
    channel(name: string): {
        listen(event: string, callback: (data: unknown) => void): unknown;
    };
    leaveChannel(name: string): void;
}
