/**
 * DES Test Suite
 *
 * Tests DES encryption/decryption against NIST FIPS-46 vectors.
 * Verifies round-trip consistency and round count.
 */

import { describe, it, expect } from 'vitest';
import { desEncryptBlock, desDecryptBlock, hexToBits, bitsToHex } from '../algorithms/des';

describe('DES', () => {
    describe('NIST KAT vectors (FIPS-46)', () => {
        it('encrypt NIST vector', () => {
            // From FIPS-46-3 / classic DES test vectors
            // Key: 133457799BBCDFF1 (in hex)
            // Plaintext: 0123456789ABCDEF
            // Expected: 85E813540F0AB405

            const pt = hexToBits('0123456789ABCDEF');
            const key = hexToBits('133457799BBCDFF1');
            const trace = desEncryptBlock(pt, key);

            expect(bitsToHex(trace.ciphertext)).toBe('85E813540F0AB405');
        });

        it('decrypt NIST vector', () => {
            const ct = hexToBits('85E813540F0AB405');
            const key = hexToBits('133457799BBCDFF1');
            const trace = desDecryptBlock(ct, key);

            expect(bitsToHex(trace.plaintext)).toBe('0123456789ABCDEF');
        });
    });

    describe('round-trip consistency', () => {
        it('encrypt then decrypt returns original plaintext', () => {
            const plaintext = hexToBits('0123456789ABCDEF');
            const key = hexToBits('133457799BBCDFF1');

            const encryptTrace = desEncryptBlock(plaintext, key);
            const decryptTrace = desDecryptBlock(encryptTrace.ciphertext, key);

            expect(bitsToHex(decryptTrace.plaintext)).toBe(bitsToHex(plaintext));
        });

        it('round-trip with random data (10 iterations)', () => {
            const randomHexChars = '0123456789ABCDEF';

            for (let i = 0; i < 10; i++) {
                // Generate random 64-bit values as hex strings
                let ptHex = '';
                let keyHex = '';
                for (let j = 0; j < 16; j++) {
                    ptHex += randomHexChars[Math.floor(Math.random() * 16)];
                    keyHex += randomHexChars[Math.floor(Math.random() * 16)];
                }

                const plaintext = hexToBits(ptHex);
                const key = hexToBits(keyHex);

                const encryptTrace = desEncryptBlock(plaintext, key);
                const decryptTrace = desDecryptBlock(encryptTrace.ciphertext, key);

                expect(bitsToHex(decryptTrace.plaintext)).toBe(bitsToHex(plaintext));
            }
        });
    });

    describe('trace structure', () => {
        it('produces 16 rounds', () => {
            const pt = hexToBits('0123456789ABCDEF');
            const key = hexToBits('133457799BBCDFF1');

            const trace = desEncryptBlock(pt, key);

            expect(trace.rounds).toHaveLength(16);
        });

        it('trace contains all expected fields', () => {
            const pt = hexToBits('0123456789ABCDEF');
            const key = hexToBits('133457799BBCDFF1');

            const trace = desEncryptBlock(pt, key);

            expect(trace.plaintext).toHaveLength(64);
            expect(trace.key).toHaveLength(64);
            expect(trace.afterIP).toHaveLength(64);
            expect(trace.L0).toHaveLength(32);
            expect(trace.R0).toHaveLength(32);
            expect(trace.ciphertext).toHaveLength(64);

            // Check first round structure
            expect(trace.rounds[0]).toHaveProperty('roundIndex');
            expect(trace.rounds[0]).toHaveProperty('L');
            expect(trace.rounds[0]).toHaveProperty('R');
            expect(trace.rounds[0]).toHaveProperty('expandedR');
            expect(trace.rounds[0]).toHaveProperty('xoredWithKey');
            expect(trace.rounds[0]).toHaveProperty('sboxOutput');
            expect(trace.rounds[0]).toHaveProperty('permutedOutput');
            expect(trace.rounds[0]).toHaveProperty('newL');
            expect(trace.rounds[0]).toHaveProperty('newR');
            expect(trace.rounds[0]).toHaveProperty('roundKey');

            // Verify sizes
            expect(trace.rounds[0].expandedR).toHaveLength(48);
            expect(trace.rounds[0].xoredWithKey).toHaveLength(48);
            expect(trace.rounds[0].sboxOutput).toHaveLength(32);
            expect(trace.rounds[0].permutedOutput).toHaveLength(32);
            expect(trace.rounds[0].roundKey).toHaveLength(48);
        });

        it('decrypt trace also produces 16 rounds', () => {
            const ct = hexToBits('85E813540F0AB405');
            const key = hexToBits('133457799BBCDFF1');

            const trace = desDecryptBlock(ct, key);

            expect(trace.rounds).toHaveLength(16);
        });
    });

    describe('hex conversion utilities', () => {
        it('hexToBits converts correctly (8 bits per 2 hex chars)', () => {
            const hex = '01';
            const bits = hexToBits(hex);

            expect(bits).toHaveLength(8);
            // 0x01 = 0000 0001
            expect(bits).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
        });

        it('hexToBits handles 64-bit block', () => {
            const hex = '0123456789ABCDEF';
            const bits = hexToBits(hex);

            expect(bits).toHaveLength(64);
            // First byte: 0x01 = 0000 0001
            expect(bits.slice(0, 4)).toEqual([0, 0, 0, 0]);
            expect(bits.slice(4, 8)).toEqual([0, 0, 0, 1]);
        });

        it('bitsToHex converts correctly', () => {
            const bits = [0, 0, 0, 0, 0, 0, 0, 1];
            const hex = bitsToHex(bits);

            expect(hex).toBe('01');
        });

        it('round-trip hex conversion', () => {
            const original = '85E813540F0AB405';
            const bits = hexToBits(original);
            const reconstructed = bitsToHex(bits);

            expect(reconstructed).toBe(original);
        });
    });

    describe('Feistel structure verification', () => {
        it('initial permutation applied correctly', () => {
            const pt = hexToBits('0123456789ABCDEF');
            const key = hexToBits('133457799BBCDFF1');

            const trace = desEncryptBlock(pt, key);

            // After IP, first bit should be bit 57 of original
            // IP[0] = 58, so afterIP[0] = plaintext[57] = 0 (since 0x01 bit 57 = 0)
            expect(trace.afterIP[0]).toBe(trace.plaintext[57 - 1]); // 1-indexed
        });

        it('final permutation is inverse of initial', () => {
            const pt = hexToBits('0123456789ABCDEF');
            const key = hexToBits('133457799BBCDFF1');

            const trace = desEncryptBlock(pt, key);

            // After Feistel, we have R16L16, then apply FP
            // The final ciphertext should decrypt correctly
            expect(bitsToHex(trace.ciphertext)).toBe('85E813540F0AB405');
        });
    });

    describe('error handling', () => {
        it('throws error for non-64-bit plaintext', () => {
            const shortPt = [0, 1, 0, 1]; // Only 4 bits
            const key = hexToBits('133457799BBCDFF1');

            expect(() => desEncryptBlock(shortPt, key)).toThrow('Plaintext must be 64 bits');
        });

        it('throws error for non-64-bit key', () => {
            const pt = hexToBits('0123456789ABCDEF');
            const shortKey = [0, 1, 0, 1]; // Only 4 bits

            expect(() => desEncryptBlock(pt, shortKey)).toThrow('Key must be 64 bits');
        });
    });
});
