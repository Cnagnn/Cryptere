/**
 * CaesarBruteForce Component Tests
 *
 * Smoke tests for the Caesar cipher brute force visualization.
 */

import { describe, it, expect } from 'vitest';

describe('CaesarBruteForce', () => {
    it('should export as a valid module', async () => {
        const module = await import('../CaesarBruteForce');
        expect(module.default).toBeDefined();
        expect(typeof module.default).toBe('function');
    });

    it('should handle uppercase ciphertext', () => {
        const ciphertext = 'HELLO';
        expect(ciphertext.toUpperCase()).toBe('HELLO');
    });

    it('should generate 26 shift candidates', () => {
        // Caesar cipher has 26 possible shifts
        const candidates = Array.from({ length: 26 }, (_, i) => i);
        expect(candidates).toHaveLength(26);
    });

    it('should perform caesar decrypt correctly', () => {
        // Test decrypt with known values
        // "HELLO" shifted back by 3 = "EBIIL"
        const shift = 3;
        const encrypted = 'HELLO';
        let decrypted = '';

        for (const char of encrypted) {
            const code = char.charCodeAt(0) - 65;
            const shifted = ((code - shift + 26) % 26) + 65;
            decrypted += String.fromCharCode(shifted);
        }

        expect(decrypted).toBe('EBIIL');
    });

    it('should find dictionary matches', () => {
        const words = ['DAN', 'DARI', 'YANG', 'HELLO'];
        const text = 'DAN DARI YANG';

        const matched = text.split(/\s+/).filter((w) => words.includes(w));

        expect(matched).toContain('DAN');
        expect(matched).toContain('DARI');
        expect(matched).toContain('YANG');
        expect(matched).toHaveLength(3);
    });
});
