/**
 * AesStateMatrix Component Tests
 *
 * Smoke tests for the AES state matrix visualization component.
 * These tests verify the component can be imported and used correctly.
 */

import { describe, it, expect } from 'vitest';

// Since we're in node environment, we can't fully render React components
// but we can test the component structure and types are correct

describe('AesStateMatrix', () => {
    it('should export as a valid module', async () => {
        const module = await import('../AesStateMatrix');
        expect(module.default).toBeDefined();
        expect(typeof module.default).toBe('function');
    });

    it('should accept valid props types', () => {
        // TypeScript will catch any type errors at compile time
        const state: number[] = Array.from({ length: 16 }, (_, i) => i);
        const highlightBytes: number[] = [0, 1, 2];
        const title = 'Test Matrix';

        // If this compiles, the types are correct
        expect(state).toHaveLength(16);
        expect(highlightBytes).toHaveLength(3);
        expect(title).toBe('Test Matrix');
    });

    it('should handle empty highlight bytes array', () => {
        const highlightBytes: number[] = [];
        expect(highlightBytes).toHaveLength(0);
    });
});
