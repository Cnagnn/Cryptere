import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('app sidebar logout', () => {
    it('submits logout with a full form post instead of Inertia XHR', () => {
        const sidebar = readFileSync(
            resolve(process.cwd(), 'resources/js/components/app-sidebar.tsx'),
            'utf8',
        );

        expect(sidebar).not.toContain('router.post(urls.logout)');
        expect(sidebar).toContain('document.createElement(\'form\')');
        expect(sidebar).toContain('meta[name="csrf-token"]');
    });
});
