import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
    return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('lab visualizers layout', () => {
    it('uses a monochrome shell and does not mention the removed example picker', () => {
        const shell = readSource(
            'resources/js/features/labs/LabVisualizerShell.tsx',
        );

        expect(shell).toContain("from '@/components/ui/card'");
        expect(shell).toContain('Visualisasi langkah');
        expect(shell).not.toContain('Pilih contoh');
        expect(shell).not.toContain('Badge variant={hasResult ?');
    });

    it('gives the stage more room and keeps the visualization centered inside the card', () => {
        const shell = readSource(
            'resources/js/features/labs/LabVisualizerShell.tsx',
        );
        const visualizer = readSource(
            'resources/js/features/labs/LabVisualizer.tsx',
        );

        expect(shell).toContain('min-h-[640px]');
        expect(shell).toContain('min-h-[420px]');
        expect(shell).toContain('items-center justify-center');
        expect(visualizer).toContain('max-w-6xl');
    });

    it('keeps algorithm panels free from raw accent color classes', () => {
        const visualizer = readSource(
            'resources/js/features/labs/LabVisualizer.tsx',
        );
        const aes = readSource(
            'resources/js/features/labs/ui/visualizers/AesPanel.tsx',
        );
        const des = readSource(
            'resources/js/features/labs/ui/visualizers/DesPanel.tsx',
        );
        const rsa = readSource(
            'resources/js/features/labs/ui/visualizers/RsaPanel.tsx',
        );
        const signature = readSource(
            'resources/js/features/labs/ui/visualizers/SignaturePanel.tsx',
        );

        for (const source of [visualizer, aes, des, rsa, signature]) {
            expect(source).not.toMatch(
                /(bg|text|border|ring)-(emerald|red|rose|sky|blue|violet|amber|green|yellow)/,
            );
            expect(source).not.toContain('dark:bg-');
            expect(source).not.toContain('dark:text-');
        }
    });

    it('uses one shared inner shell across all algorithm visualizer panels', () => {
        const aes = readSource(
            'resources/js/features/labs/ui/visualizers/AesPanel.tsx',
        );
        const des = readSource(
            'resources/js/features/labs/ui/visualizers/DesPanel.tsx',
        );
        const rsa = readSource(
            'resources/js/features/labs/ui/visualizers/RsaPanel.tsx',
        );
        const signature = readSource(
            'resources/js/features/labs/ui/visualizers/SignaturePanel.tsx',
        );

        for (const source of [aes, des, rsa, signature]) {
            expect(source).toContain(
                "from '@/features/labs/visualizers/VisualizerShell'",
            );
            expect(source).toContain('<VisualizerShell');
        }
    });
});
