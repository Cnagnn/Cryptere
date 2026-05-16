import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const resourcesJsPath = resolve(__dirname, '../..');
const filesWithPrimaryLogo = [
    'components/app-header.tsx',
    'components/app-sidebar.tsx',
    'pages/welcome.tsx',
    'pages/auth/forgot-password.tsx',
    'pages/auth/login.tsx',
    'pages/auth/register.tsx',
    'pages/auth/reset-password.tsx',
];

function readResource(file: string): string {
    return readFileSync(resolve(resourcesJsPath, file), 'utf8');
}

describe('inline brand logo', () => {
    it('does not keep a shared app-logo component', () => {
        expect(
            existsSync(resolve(resourcesJsPath, 'components/app-logo.tsx')),
        ).toBe(false);
    });

    it('does not import the removed app-logo component', () => {
        for (const file of filesWithPrimaryLogo) {
            expect(readResource(file)).not.toContain(
                "from '@/components/app-logo';",
            );
        }
    });

    it('does not expose primary React logos as directly downloadable image files', () => {
        for (const file of filesWithPrimaryLogo) {
            const source = readResource(file);

            expect(source).not.toContain('/images/Logo/');
        }
    });

    it('keeps casual context-menu and drag protection on inline full logos', () => {
        for (const file of filesWithPrimaryLogo) {
            const source = readResource(file);

            expect(source).toContain('onContextMenu');
            expect(source).toContain('onDragStart');
            expect(source).toContain('select-none');
        }
    });
});
