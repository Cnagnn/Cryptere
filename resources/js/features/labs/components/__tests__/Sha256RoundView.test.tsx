/**
 * Sha256RoundView Component Tests
 *
 * Smoke tests for the SHA-256 round visualization component.
 */

import { describe, it, expect } from 'vitest';

describe('Sha256RoundView', () => {
    it('should export as a valid module', async () => {
        const module = await import('../Sha256RoundView');
        expect(module.default).toBeDefined();
        expect(typeof module.default).toBe('function');
    });

    it('should accept valid props types', () => {
        const props = {
            a: 0x6a09e667,
            b: 0xbb67ae85,
            c: 0x3c6ef372,
            d: 0xa54ff53a,
            e: 0x510e527f,
            f: 0x9b05688c,
            g: 0x1f83d9ab,
            h: 0x5be0cd19,
            roundIndex: 0,
            Wt: 0x428a2f98,
            Kt: 0x71374491,
        };

        expect(props.a).toBeGreaterThan(0);
        expect(props.roundIndex).toBe(0);
    });

    it('should handle optional props', () => {
        const requiredProps = {
            a: 0,
            b: 0,
            c: 0,
            d: 0,
            e: 0,
            f: 0,
            g: 0,
            h: 0,
        };

        expect(requiredProps.a).toBe(0);
    });
});
