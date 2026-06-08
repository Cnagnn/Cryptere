import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

interface SmartPollingConfig {
    enabled: boolean;
    only?: string[];
    onPoll?: () => void;
}

export function useSmartPolling(config: SmartPollingConfig) {
    const { enabled, only = ['academy', 'stats'], onPoll } = config;
    const [pollingInterval, setPollingInterval] = useState(15000);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!enabled) {
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }

            setPollingInterval(15000);
            startTimeRef.current = Date.now();

            return;
        }

        const elapsed = Date.now() - startTimeRef.current;

        if (elapsed > 900000 && pollingInterval !== 60000) {
            setPollingInterval(60000);

            return;
        }

        if (elapsed > 300000 && pollingInterval !== 30000) {
            setPollingInterval(30000);

            return;
        }

        const poll = () => {
            if (onPoll) {
                onPoll();
            } else {
                router.reload({ only });
            }
        };

        timerRef.current = window.setInterval(poll, pollingInterval);

        return () => {
            if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [enabled, pollingInterval, only, onPoll]);

    return { currentInterval: pollingInterval };
}
