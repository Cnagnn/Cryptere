/**
 * PageTransition — fades-up the route content on every navigation.
 *
 * Listens to Inertia's `usePage().url` and replays a short GSAP tween when it
 * changes, giving the SPA a continuous "page in" feel powered by GSAP.
 * Respects `prefers-reduced-motion`.
 */
import { useGSAP } from '@gsap/react';
import { usePage } from '@inertiajs/react';
import gsap from 'gsap';
import { useRef  } from 'react';
import type {ReactNode} from 'react';

export default function PageTransition({ children }: { children: ReactNode }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const { url } = usePage();

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
        { dependencies: [url], scope: ref },
    );

    return <div ref={ref}>{children}</div>;
}
