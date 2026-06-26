/**
 * useFadeUpOnMount — auto-animate direct children of a container with a
 * staggered fade-up on mount. Drop a ref on the wrapper and direct children
 * will rise into view. Respects `prefers-reduced-motion`.
 */
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';

export function useFadeUpOnMount<T extends HTMLElement = HTMLDivElement>(opts: {
    selector?: string;
    y?: number;
    stagger?: number;
    duration?: number;
} = {}) {
    const ref = useRef<T | null>(null);
    const { selector = ':scope > *', y = 16, stagger = 0.08, duration = 0.5 } = opts;

    useGSAP(
        () => {
            if (!ref.current) {
                return;
            }

            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (reduced) {
                return;
            }

            const targets = ref.current.querySelectorAll(selector);

            if (targets.length === 0) {
                return;
            }

            gsap.from(targets, {
                opacity: 0,
                y,
                duration,
                ease: 'power2.out',
                stagger,
            });
        },
        { scope: ref },
    );

    return ref;
}
