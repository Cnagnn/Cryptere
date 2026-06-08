import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

interface SmartPollingConfig {
    enabled: boolean;
    only?: string[];
    onPoll?: () => void;
}

export function useSmartPolling(config: SmartPollingConfig) {
    const { enabled, only = ['academy', 'stats'], onPoll } = config;
    const [interval, setInterval] = useState(15000); // Start at 15s
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!enabled) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setInterval(15000); // Reset
            startTimeRef.current = Date.now();
            return;
        }

        // Adaptive interval adjustment
        const elapsed = Date.now() - startTimeRef.current;

        if (elapsed > 900000 && interval !== 60000) {
            // After 15 minutes: 60s
            setInterval(60000);
        } else if (elapsed > 300000 && interval !== 30000) {
            // After 5 minutes: 30s
            setInterval(30000);
        }

        // Poll function
        const poll = () => {
            if (onPoll) {
                onPoll();
            } else {
                router.reload({ only });
            }
        };

        // Start polling
        timerRef.current = setInterval(poll, interval);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [enabled, interval, only, onPoll]);

    return { currentInterval: interval };
}
