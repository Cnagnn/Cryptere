import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
    return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('global typography', () => {
    it('loads and applies Plus Jakarta Sans to all text surfaces', () => {
        const css = readSource('resources/css/app.css');
        const blade = readSource('resources/views/app.blade.php');

        expect(blade).toContain('family=Plus+Jakarta+Sans');
        expect(blade).toContain('<body class="font-sans antialiased">');
        expect(css).toContain("'Plus Jakarta Sans'");
        expect(css).toContain('html {\n        font-family: var(--font-sans);');
        expect(css).toContain(
            'body,\n    button,\n    input,\n    textarea,\n    select',
        );
        expect(css).toContain('code,\n    kbd,\n    pre,\n    samp');
        expect(css).not.toContain('Geist');
        expect(css).not.toContain('Inter');
    });
});
