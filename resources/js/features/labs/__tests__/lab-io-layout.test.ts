import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
    return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('lab io guided layout', () => {
    it('uses a minimal guided story workbench with native shadcn composition', () => {
        const labIO = readSource('resources/js/features/labs/LabIO.tsx');

        expect(labIO).toContain("from '@/components/ui/card'");
        expect(labIO).toContain("from '@/components/ui/field'");
        expect(labIO).toContain("from '@/components/ui/progress'");
        expect(labIO).toContain('Guided Story Workbench');
        expect(labIO).toContain('Langkah belajar');
        expect(labIO).toContain('Narasi guru');
        expect(labIO).not.toContain("from '@/components/ui/badge'");
    });

    it('removes the algorithm explainer section from the lab detail panel', () => {
        const labIO = readSource('resources/js/features/labs/LabIO.tsx');

        expect(labIO).not.toContain('Tentang Algoritma');
        expect(labIO).not.toContain('Parameter');
        expect(labIO).not.toContain("from '@/components/ui/accordion'");
        expect(labIO).not.toContain("from '@/components/ui/separator'");
    });

    it('removes the example picker from the lab detail panel', () => {
        const labIO = readSource('resources/js/features/labs/LabIO.tsx');
        const labShow = readSource('resources/js/pages/labs/show.tsx');

        expect(labIO).not.toContain('Contoh');
        expect(labIO).not.toContain("from '@/components/ui/dropdown-menu'");
        expect(labShow).not.toContain('examplesByLab');
        expect(labShow).not.toContain('onExampleSelect');
    });
});
