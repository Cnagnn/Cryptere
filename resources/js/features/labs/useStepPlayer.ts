import { useCallback, useEffect, useMemo, useState } from 'react';

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

const SPEED_MS: Record<PlaybackSpeed, number> = {
    0.5: 2400,
    1: 1200,
    1.5: 800,
    2: 600,
};

/** Step playback state + nav + speed control. Resets to 0 when `total` changes. */
export function useStepPlayer(total: number) {
    const [step, setStep] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState<PlaybackSpeed>(1);

    useEffect(() => {
        setStep(0);
        setPlaying(false);
    }, [total]);

    useEffect(() => {
        if (!playing || total <= 1) {
            return;
        }

        const intervalMs = SPEED_MS[speed];
        const id = setInterval(() => {
            setStep((s) => {
                if (s >= total - 1) {
                    setPlaying(false);

                    return s;
                }

                return s + 1;
            });
        }, intervalMs);

        return () => clearInterval(id);
    }, [playing, total, speed]);

    const safe = Math.min(step, Math.max(0, total - 1));
    const progress = total <= 1 ? 100 : ((safe + 1) / total) * 100;

    const next = useCallback(() => setStep((s) => Math.min(s + 1, total - 1)), [total]);
    const prev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
    const reset = useCallback(() => {
        setStep(0);
        setPlaying(false);
    }, []);

    return {
        step: safe,
        total,
        progress,
        playing,
        speed,
        setStep,
        setPlaying,
        setSpeed,
        next,
        prev,
        reset,
    };
}
