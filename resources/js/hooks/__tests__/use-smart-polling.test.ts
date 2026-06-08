import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useSmartPolling', () => {
    it('schedules polls with the browser timer instead of the React state setter', () => {
        const source = readFileSync(
            resolve(process.cwd(), 'resources/js/hooks/use-smart-polling.ts'),
            'utf8',
        );

        expect(source).not.toContain('const [interval, setInterval]');
        expect(source).toContain(
            'window.setInterval(poll, pollingInterval)',
        );
    });
});
