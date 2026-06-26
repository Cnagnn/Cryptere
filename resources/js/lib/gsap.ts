/**
 * GSAP helpers — registers plugins once, exposes utility hooks.
 *
 * - `useGsap`: scoped useGSAP from @gsap/react with auto-cleanup on unmount.
 * - `fadeUp`: declarative fade+rise animation for cards/headers.
 *
 * ponytail: ScrollTrigger registered globally; sync with Lenis happens in
 * app.tsx after Lenis mounts.
 */
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export { gsap, useGSAP, ScrollTrigger };

/** Stagger fade-up for a NodeList of children. Call inside useGSAP. */
export function fadeUp(targets: gsap.TweenTarget, opts: gsap.TweenVars = {}) {
    return gsap.from(targets, {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.08,
        ...opts,
    });
}
