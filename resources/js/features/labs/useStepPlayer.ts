import { useEffect, useState } from 'react';

/** Step playback state + nav. Resets to 0 when `total` changes. */
export function useStepPlayer(total: number, intervalMs = 1200) {
    const [step, setStep] = useState(0);
    const [playing, setPlaying] = useState(false);

    useEffect(() => {
        setStep(0);
        setPlaying(false);
    }, [total]);

    useEffect(() => {
        if (!playing || total <= 1) {
            return;
        }

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
    }, [playing, total, intervalMs]);

    const safe = Math.min(step, Math.max(0, total - 1));

    return {
        step: safe,
        playing,
        setStep,
        setPlaying,
        next: () => setStep((s) => Math.min(s + 1, total - 1)),
        prev: () => setStep((s) => Math.max(s - 1, 0)),
        reset: () => {
            setStep(0);
            setPlaying(false);
        },
    };
}
