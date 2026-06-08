import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useRealtime contract', () => {
    it('subscribes to the authenticated user via a private channel only', () => {
        const source = readFileSync(
            resolve(process.cwd(), 'resources/js/hooks/use-realtime.ts'),
            'utf8',
        );

        expect(source).toContain('echo.private(`user.${userId}`)');
        expect(source).not.toContain('echo.channel(`user.${userId}`)');
    });

    it('does not subscribe dashboard updates to leaderboard websocket events', () => {
        const source = readFileSync(
            resolve(process.cwd(), 'resources/js/hooks/use-realtime.ts'),
            'utf8',
        );

        expect(source).not.toContain('leaderboard.updated');
        expect(source).not.toContain("echo.channel('leaderboard')");
    });
});
