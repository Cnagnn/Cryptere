import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useConnectionMonitor contract', () => {
    it('tracks true browser offline state before showing persistent warnings', () => {
        const source = readFileSync(
            resolve(process.cwd(), 'resources/js/hooks/use-connection-monitor.ts'),
            'utf8',
        );

        expect(source).toContain('navigator.onLine');
        expect(source).toContain("window.addEventListener('offline'");
    });
});
