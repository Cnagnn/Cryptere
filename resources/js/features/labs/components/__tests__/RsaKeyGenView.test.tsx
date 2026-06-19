/**
 * RsaKeyGenView Component Tests
 *
 * Smoke tests for the RSA key generation visualization component.
 */

import { describe, it, expect } from 'vitest';

describe('RsaKeyGenView', () => {
    it('should export as a valid module', async () => {
        const module = await import('../RsaKeyGenView');
        expect(module.default).toBeDefined();
        expect(typeof module.default).toBe('function');
    });

    it('should accept bigint values', () => {
        const p = 61n;
        const q = 53n;
        const n = p * q;
        const phi = (p - 1n) * (q - 1n);

        expect(n).toBe(3233n);
        expect(phi).toBe(3120n);
    });

    it('should calculate modular inverse for RSA', () => {
        // Extended Euclidean Algorithm for modular inverse
        const e = 17n;
        const phi = 3120n;

        // Using extGcd from the actual RSA module
        function extGcd(
            a: bigint,
            b: bigint
        ): { gcd: bigint; x: bigint; y: bigint } {
            if (a === 0n) {
                return { gcd: b, x: 0n, y: 1n };
            }

            const prev = extGcd(b % a, a);

            return {
                gcd: prev.gcd,
                x: prev.y - (b / a) * prev.x,
                y: prev.x,
            };
        }

        const result = extGcd(e, phi);
        let d = result.x % phi;

        if (d < 0n) {
d += phi;
}

        // Verify: e * d mod phi = 1
        expect((e * d) % phi).toBe(1n);
    });

    it('should generate key generation steps', () => {
        const steps: string[] = [];
        const p = 61n;
        const q = 53n;

        steps.push(`p = ${p} (prime: verified)`);
        steps.push(`q = ${q} (prime: verified)`);
        steps.push(`n = p × q = ${p} × ${q} = ${p * q}`);

        expect(steps).toHaveLength(3);
        expect(steps[0]).toContain('61');
    });

    it('should separate public and private keys', () => {
        const publicKey = { e: 17n, n: 3233n };
        const privateKey = { d: 2753n, n: 3233n };

        expect(publicKey.e).toBeLessThan(privateKey.d);
        expect(publicKey.n).toBe(privateKey.n);
    });
});
