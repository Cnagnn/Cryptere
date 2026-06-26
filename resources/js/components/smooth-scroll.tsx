/**
 * Lenis smooth scroll — global singleton.
 *
 * Mount once at app root via <SmoothScroll />. Lenis takes over the window
 * scroll and drives a single rAF loop; GSAP ScrollTrigger is wired to it so
 * scroll-driven tweens read from Lenis instead of native scroll.
 *
 * ponytail: simplest setup — no per-route teardown, no nested scroll.
 * upgrade: switch to context provider when nested scroll containers needed.
 */
import { ReactLenis, useLenis } from 'lenis/react';
import { useEffect  } from 'react';
import type {ReactNode} from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

function LenisGsapBridge() {
    const lenis = useLenis();

    useEffect(() => {
        if (!lenis) {
            return;
        }

        const onScroll = () => ScrollTrigger.update();
        lenis.on('scroll', onScroll);

        const tickerCb = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tickerCb);
        gsap.ticker.lagSmoothing(0);

        return () => {
            lenis.off('scroll', onScroll);
            gsap.ticker.remove(tickerCb);
        };
    }, [lenis]);

    return null;
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
    return (
        <ReactLenis
            root
            options={{
                lerp: 0.1,
                duration: 1.2,
                smoothWheel: true,
            }}
        >
            <LenisGsapBridge />
            {children}
        </ReactLenis>
    );
}
