import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('register form route', () => {
    it('uses explicit form action props supported by generated route helpers', () => {
        const registerPage = readFileSync(
            resolve(process.cwd(), 'resources/js/pages/auth/register.tsx'),
            'utf8',
        );

        expect(registerPage).not.toContain('store.form()');
        expect(registerPage).toContain('action={store.url()}');
        expect(registerPage).toContain('method="post"');
    });
});
