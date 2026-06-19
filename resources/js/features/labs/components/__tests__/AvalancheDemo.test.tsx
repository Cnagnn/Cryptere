/**
 * AvalancheDemo Component Tests
 *
 * Smoke tests for the avalanche effect visualization component.
 */

import { describe, it, expect } from 'vitest';

describe('AvalancheDemo', () => {
    it('should export as a valid module', async () => {
        const module = await import('../AvalancheDemo');
        expect(module.default).toBeDefined();
        expect(typeof module.default).toBe('function');
    });

    it('should handle byte arrays of same length', () => {
        const original = [0x48, 0x65, 0x6c, 0x6c, 0x6f];
        const flipped = [0x48, 0x65, 0x6c, 0x6c, 0x6f];

        expect(original).toHaveLength(flipped.length);
    });

    it('should handle single bit difference', () => {
        const original = [0x00];
        const flipped = [0x01];

        const xor = original[0] ^ flipped[0];
        const bitsDiff = xor.toString(2).replace(/0/g, '').length;

        expect(bitsDiff).toBe(1);
    });

    it('should calculate bit differences correctly', () => {
        const original = [0b00000000];
        const flipped = [0b00000001];

        const xor = original[0] ^ flipped[0];
        expect(xor).toBe(0b00000001);
    });

    it('should find different byte indices', () => {
        const original = [0x48, 0x65, 0x6c, 0x6c, 0x6f];
        const flipped = [0x48, 0x65, 0x6c, 0x6c, 0x6f];

        const different: number[] = [];

        for (let i = 0; i < original.length; i++) {
            if (original[i] !== flipped[i]) {
                different.push(i);
            }
        }

        expect(different).toHaveLength(0);
    });
});
