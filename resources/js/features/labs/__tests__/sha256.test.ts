/**
 * SHA-256 Test Suite
 *
 * Tests SHA-256 implementation against FIPS 180-4 Known Answer Test (KAT) vectors.
 */

import { describe, it, expect } from 'vitest';
import { sha256, sha256Trace, K, H0 } from '../algorithms/sha256';

describe('SHA-256', () => {
    describe('FIPS 180-4 KAT vectors', () => {
        it('empty string', () => {
            const result = sha256('');
            expect(result).toBe('E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855');
        });

        it('abc', () => {
            const result = sha256('abc');
            expect(result).toBe('BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD');
        });

        it('long message', () => {
            const message = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
            const result = sha256(message);
            expect(result).toBe('248D6A61D20638B8E5C026930C3E6039A33CE45964FF2167F6ECEDD419DB06C1');
        });
    });

    describe('sha256Trace structure', () => {
        it('returns proper trace structure', () => {
            const trace = sha256Trace('abc');

            expect(trace).toHaveProperty('message');
            expect(trace).toHaveProperty('paddedHex');
            expect(trace).toHaveProperty('blocks');
            expect(trace).toHaveProperty('digest');
            expect(trace.message).toBe('abc');
        });

        it('digest matches sha256 output', () => {
            const message = 'test';
            const hash = sha256(message);
            const trace = sha256Trace(message);

            expect(trace.digest).toBe(hash);
        });

        it('trace contains correct number of blocks', () => {
            // Empty string: 448 bits + 64-bit length = 512 bits = 1 block
            const emptyTrace = sha256Trace('');
            expect(emptyTrace.blocks).toHaveLength(1);

            // 'abc': 24 bits + 64-bit length = 88 bits = 1 block
            const abcTrace = sha256Trace('abc');
            expect(abcTrace.blocks).toHaveLength(1);

            // 'abcdbc...': 56 bytes = 448 bits
            // After '1' bit: 57 bytes (456 bits) which is > 448
            // So zeros = 55 - (56 mod 64) = 55 - 56 = -1, + 64 = 63
            // Total: 56 + 1 + 63 + 8 = 128 bytes = 2 blocks
            const longMessage = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
            const longTrace = sha256Trace(longMessage);
            expect(longTrace.blocks).toHaveLength(2);
        });

        it('block contains 64 rounds', () => {
            const trace = sha256Trace('abc');

            expect(trace.blocks[0].rounds).toHaveLength(64);
            expect(trace.blocks[0].W).toHaveLength(64);
        });

        it('round contains all expected fields', () => {
            const trace = sha256Trace('abc');
            const round = trace.blocks[0].rounds[0];

            expect(round).toHaveProperty('t');
            expect(round).toHaveProperty('a');
            expect(round).toHaveProperty('b');
            expect(round).toHaveProperty('c');
            expect(round).toHaveProperty('d');
            expect(round).toHaveProperty('e');
            expect(round).toHaveProperty('f');
            expect(round).toHaveProperty('g');
            expect(round).toHaveProperty('h');
            expect(round).toHaveProperty('T1');
            expect(round).toHaveProperty('T2');
        });
    });

    describe('constants', () => {
        it('K array has 64 elements', () => {
            expect(K).toHaveLength(64);
        });

        it('H0 array has 8 elements', () => {
            expect(H0).toHaveLength(8);
        });

        it('K and H0 match FIPS 180-4', () => {
            // First few values from FIPS 180-4
            expect(K[0]).toBe(0x428a2f98);
            expect(K[1]).toBe(0x71374491);
            expect(K[2]).toBe(0xb5c0fbcf);

            expect(H0[0]).toBe(0x6a09e667);
            expect(H0[1]).toBe(0xbb67ae85);
        });
    });

    describe('determinism', () => {
        it('produces same hash for same input', () => {
            const message = 'Hello, World!';

            const hash1 = sha256(message);
            const hash2 = sha256(message);
            const trace1 = sha256Trace(message);
            const trace2 = sha256Trace(message);

            expect(hash1).toBe(hash2);
            expect(trace1.digest).toBe(trace2.digest);
        });

        it('produces different hashes for different inputs', () => {
            const hash1 = sha256('abc');
            const hash2 = sha256('abd');

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('Unicode support', () => {
        it('handles Unicode characters', () => {
            // "hello" in various scripts
            const hello = sha256('hello');
            expect(hello).toBeDefined();
            expect(hello).toHaveLength(64);

            // Different character, different hash
            const hello2 = sha256('héllo');
            expect(hello).not.toBe(hello2);
        });
    });

    describe('edge cases', () => {
        it('handles single character', () => {
            const hash = sha256('a');
            expect(hash).toHaveLength(64);
        });

        it('handles very long string', () => {
            const longString = 'a'.repeat(10000);
            const hash = sha256(longString);
            expect(hash).toHaveLength(64);
        });

        it('produces consistent hashes for edge cases', () => {
            const hash1 = sha256('a'.repeat(56)); // Exactly 448 bits
            const hash2 = sha256('a'.repeat(56));
            expect(hash1).toBe(hash2);
        });
    });
});
