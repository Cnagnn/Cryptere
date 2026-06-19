/**
 * AES-128 Test Suite
 *
 * Tests AES-128 encryption/decryption against NIST KAT vectors.
 * Verifies round-trip consistency and round count.
 */

import { describe, it, expect } from 'vitest';
import { aesEncryptBlock, aesDecryptBlock, hexToBytes, bytesToHex } from '../algorithms/aes';

describe('AES-128', () => {
    describe('NIST KAT vectors', () => {
        it('encrypt standard vector (FIPS-197 Appendix B)', () => {
            // From FIPS-197, Appendix B
            // Key: 2b7e1516 28aed2a6 abf71588 09cf4f3c
            // Plaintext: 3243f6a8 885a308d 313198a2 e0370734
            // Ciphertext: 3925841d 02dc09fb dc118597 196a0b32

            const pt = hexToBytes('3243F6A8885A308D313198A2E0370734');
            const key = hexToBytes('2B7E151628AED2A6ABF7158809CF4F3C');
            const trace = aesEncryptBlock(pt, key);

            expect(bytesToHex(trace.ciphertext)).toBe('3925841D02DC09FBDC118597196A0B32');
        });

        it('decrypt standard vector (FIPS-197 Appendix B)', () => {
            const ct = hexToBytes('3925841D02DC09FBDC118597196A0B32');
            const key = hexToBytes('2B7E151628AED2A6ABF7158809CF4F3C');
            const trace = aesDecryptBlock(ct, key);

            expect(bytesToHex(trace.plaintext)).toBe('3243F6A8885A308D313198A2E0370734');
        });

        it('encrypt debug vector (simple)', () => {
            // Simpler test vector for debugging
            // Key: 000102030405060708090A0B0C0D0E0F
            // Plaintext: 00112233445566778899AABBCCDDEEFF
            // Ciphertext: 69C4E0D86A7B0430D8CDB78070B4C55A

            const pt = hexToBytes('00112233445566778899AABBCCDDEEFF');
            const key = hexToBytes('000102030405060708090A0B0C0D0E0F');
            const trace = aesEncryptBlock(pt, key);

            expect(bytesToHex(trace.ciphertext)).toBe('69C4E0D86A7B0430D8CDB78070B4C55A');
        });

        it('decrypt debug vector (simple)', () => {
            const ct = hexToBytes('69C4E0D86A7B0430D8CDB78070B4C55A');
            const key = hexToBytes('000102030405060708090A0B0C0D0E0F');
            const trace = aesDecryptBlock(ct, key);

            expect(bytesToHex(trace.plaintext)).toBe('00112233445566778899AABBCCDDEEFF');
        });
    });

    describe('round-trip consistency', () => {
        it('encrypt then decrypt returns original plaintext', () => {
            const plaintext = [0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff];
            const key = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f];

            const encryptTrace = aesEncryptBlock(plaintext, key);
            const decryptTrace = aesDecryptBlock(encryptTrace.ciphertext, key);

            expect(decryptTrace.plaintext).toEqual(plaintext);
        });

        it('round-trip with random data (10 iterations)', () => {
            for (let i = 0; i < 10; i++) {
                const plaintext = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
                const key = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));

                const encryptTrace = aesEncryptBlock(plaintext, key);
                const decryptTrace = aesDecryptBlock(encryptTrace.ciphertext, key);

                expect(decryptTrace.plaintext).toEqual(plaintext);
            }
        });
    });

    describe('trace structure', () => {
        it('produces 10 rounds (AES-128)', () => {
            const pt = hexToBytes('00112233445566778899AABBCCDDEEFF');
            const key = hexToBytes('000102030405060708090A0B0C0D0E0F');

            const trace = aesEncryptBlock(pt, key);

            expect(trace.rounds).toHaveLength(10);
        });

        it('trace contains all expected fields', () => {
            const pt = hexToBytes('00112233445566778899AABBCCDDEEFF');
            const key = hexToBytes('000102030405060708090A0B0C0D0E0F');

            const trace = aesEncryptBlock(pt, key);

            expect(trace.plaintext).toEqual(pt);
            expect(trace.key).toEqual(key);
            expect(trace.keySchedule).toHaveLength(11); // 10 rounds + initial
            expect(trace.ciphertext).toHaveLength(16);
            expect(trace.rounds[0]).toHaveProperty('roundIndex');
            expect(trace.rounds[0]).toHaveProperty('label');
            expect(trace.rounds[0]).toHaveProperty('stateBefore');
            expect(trace.rounds[0]).toHaveProperty('afterSubBytes');
            expect(trace.rounds[0]).toHaveProperty('afterShiftRows');
            expect(trace.rounds[0]).toHaveProperty('afterMixColumns');
            expect(trace.rounds[0]).toHaveProperty('afterAddRoundKey');
            expect(trace.rounds[0]).toHaveProperty('roundKey');
        });

        it('key schedule generates 11 round keys', () => {
            const key = hexToBytes('000102030405060708090A0B0C0D0E0F');

            const trace = aesEncryptBlock(key, key);

            expect(trace.keySchedule).toHaveLength(11);
            expect(trace.keySchedule[0]).toHaveLength(16); // Each round key is 16 bytes
        });
    });

    describe('hex conversion utilities', () => {
        it('hexToBytes converts correctly', () => {
            const hex = '48656c6c6f';
            const bytes = hexToBytes(hex);

            expect(bytes).toEqual([72, 101, 108, 108, 111]);
        });

        it('bytesToHex converts correctly', () => {
            const bytes = [72, 101, 108, 108, 111];
            const hex = bytesToHex(bytes);

            expect(hex).toBe('48656C6C6F');
        });

        it('round-trip hex conversion', () => {
            const original = '69C4E0D86A7B0430D8CDB78070B4C55A';
            const bytes = hexToBytes(original);
            const reconstructed = bytesToHex(bytes);

            expect(reconstructed).toBe(original);
        });
    });

    describe('error handling', () => {
        it('throws error for non-16 byte plaintext', () => {
            const shortPt = [0x00, 0x11, 0x22]; // Only 3 bytes
            const key = hexToBytes('000102030405060708090A0B0C0D0E0F');

            expect(() => aesEncryptBlock(shortPt, key)).toThrow('Plaintext must be 16 bytes');
        });

        it('throws error for non-16 byte key', () => {
            const pt = hexToBytes('00112233445566778899AABBCCDDEEFF');
            const shortKey = [0x00, 0x11, 0x22]; // Only 3 bytes

            expect(() => aesEncryptBlock(pt, shortKey)).toThrow('Key must be 16 bytes');
        });
    });
});
