/**
 * PageTransition — fades-up the route content on every navigation.
 *
 * Replays a short GSAP tween whenever the rendered page subtree changes,
 * giving the SPA a continuous "page in" feel powered by GSAP.
 * Respects `prefers-reduced-motion`.
 */
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';
import type { ReactNode } from 'react';

export default function PageTransition({ children }: { children: ReactNode }) {
    const ref = useRef<HTMLDivElement | null>(null);

    useGSAP(
        () => {
            if (!ref.current) {
                return;
            }

            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                return;
            }

            gsap.fromTo(
                ref.current,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
            );
        },
        { dependencies: [children], scope: ref },
    );

    return <div ref={ref}>{children}</div>;
}
