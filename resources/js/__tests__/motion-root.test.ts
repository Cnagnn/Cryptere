import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
    return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('global motion root', () => {
    it('wraps every Inertia page with Lenis smooth scroll and GSAP page transitions', () => {
        const app = readSource('resources/js/app.tsx');
        const smoothScroll = readSource(
            'resources/js/components/smooth-scroll.tsx',
        );
        const pageTransition = readSource(
            'resources/js/components/page-transition.tsx',
        );

        expect(app).toContain(
            "import SmoothScroll from '@/components/smooth-scroll'",
        );
        expect(app).toContain(
            "import PageTransition from '@/components/page-transition'",
        );
        expect(app).toContain('<SmoothScroll>');
        expect(app).toContain('<PageTransition>{app}</PageTransition>');
        expect(app).toContain("import '@/lib/gsap'");
        expect(smoothScroll).toContain("from 'lenis/react'");
        expect(smoothScroll).toContain('gsap.ticker.add');
        expect(pageTransition).toContain("from '@gsap/react'");
        expect(pageTransition).toContain("from 'gsap'");
        expect(pageTransition).not.toContain("from '@inertiajs/react'");
        expect(pageTransition).not.toContain('usePage');
    });
});
