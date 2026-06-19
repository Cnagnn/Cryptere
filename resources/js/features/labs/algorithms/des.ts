/**
 * DES Block Cipher Implementation
 *
 * Implements DES (Data Encryption Standard) encryption and decryption
 * with full Feistel round traces. Follows FIPS-46-3 specification.
 *
 * DES: 64-bit key (56 effective) → 16 rounds → 64-bit block
 */

import {
    IP,
    FP,
    PC1,
    PC2,
    E,
    P,
    SHIFT_SCHEDULE,
    S_BOXES,
    permute,
    sboxSubstitute,
} from './des-tables';

// ── Utility Functions ────────────────────────────────────────────────────────

/**
 * Convert hex string to bit array
 * "0123456789ABCDEF" → [0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,1,...] (64 bits)
 */
export function hexToBits(hex: string): number[] {
    const bits: number[] = [];
    for (const char of hex.toUpperCase()) {
        const value = parseInt(char, 16);
        bits.push((value >> 3) & 1);
        bits.push((value >> 2) & 1);
        bits.push((value >> 1) & 1);
        bits.push(value & 1);
    }
    return bits;
}

/**
 * Convert bit array to hex string
 * [0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,1,...] → "0123456789ABCDEF"
 */
export function bitsToHex(bits: number[]): string {
    let hex = '';
    for (let i = 0; i < bits.length; i += 4) {
        const value = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
        hex += value.toString(16).toUpperCase();
    }
    return hex;
}

/**
 * XOR two bit arrays of equal length
 */
function xorBits(a: number[], b: number[]): number[] {
    return a.map((bit, i) => bit ^ b[i]);
}

/**
 * Left shift a bit array by n positions
 */
function leftShift(bits: number[], n: number): number[] {
    const len = bits.length;
    return [...bits.slice(n), ...bits.slice(0, n)];
}

// ── Key Schedule ────────────────────────────────────────────────────────────

/**
 * Generate the 16 round keys from the 64-bit DES key
 *
 * @param key - 64-bit key (bits 0-55 used, bits 7,15,23,31,39,47,55,63 are parity)
 * @returns Array of 16 48-bit round keys
 */
function generateRoundKeys(key: number[]): number[][] {
    // Step 1: Apply PC-1 to get 56-bit key (C and D halves)
    const permutedKey = permute(key, PC1);

    // Split into C and D (28 bits each)
    const C = permutedKey.slice(0, 28);
    const D = permutedKey.slice(28);

    const roundKeys: number[][] = [];

    // Step 2: Generate 16 round keys
    for (let round = 0; round < 16; round++) {
        // Left shift C and D
        const shift = SHIFT_SCHEDULE[round];
        const newC = leftShift(C, shift);
        const newD = leftShift(D, shift);

        // Copy for next iteration
        C.length = 0;
        C.push(...newC);
        D.length = 0;
        D.push(...newD);

        // Apply PC-2 to get 48-bit round key
        const CD = [...C, ...D];
        const roundKey = permute(CD, PC2);
        roundKeys.push(roundKey);
    }

    return roundKeys;
}

// ── Feistel Function ────────────────────────────────────────────────────────

/**
 * The Feistel function (f)
 *
 * @param R - 32-bit right half
 * @param roundKey - 48-bit round key
 * @returns 32-bit output
 */
function feistelFunction(R: number[], roundKey: number[]): number[] {
    // Step 1: Expansion E (32 → 48 bits)
    const expandedR = permute(R, E);

    // Step 2: XOR with round key
    const xored = xorBits(expandedR, roundKey);

    // Step 3: S-box substitution (48 → 32 bits)
    const sboxOutput: number[] = [];
    for (let i = 0; i < 8; i++) {
        const sixBits = xored.slice(i * 6, i * 6 + 6);
        const fourBits = sboxSubstitute(sixBits, S_BOXES[i]);
        sboxOutput.push(...fourBits);
    }

    // Step 4: Permutation P
    const permutedOutput = permute(sboxOutput, P);

    return permutedOutput;
}

// ── Main DES Functions ───────────────────────────────────────────────────────

export interface DesRoundTrace {
    roundIndex: number;
    L: number[];
    R: number[];
    expandedR: number[];
    xoredWithKey: number[];
    sboxOutput: number[];
    permutedOutput: number[];
    newL: number[];
    newR: number[];
    roundKey: number[];
}

export interface DesTrace {
    plaintext: number[];
    key: number[];
    afterIP: number[];
    L0: number[];
    R0: number[];
    rounds: DesRoundTrace[];
    ciphertext: number[];
}

/**
 * DES Block Encryption
 *
 * Encrypts a single 64-bit block using DES.
 * Returns a complete trace of all Feistel rounds.
 *
 * @param plaintext - 64 bits (array of 0/1)
 * @param key - 64 bits (array of 0/1)
 * @returns Full encryption trace
 */
export function desEncryptBlock(plaintext: number[], key: number[]): DesTrace {
    // Validate inputs
    if (plaintext.length !== 64) {
        throw new Error(`Plaintext must be 64 bits, got ${plaintext.length}`);
    }
    if (key.length !== 64) {
        throw new Error(`Key must be 64 bits, got ${key.length}`);
    }

    // Generate round keys
    const roundKeys = generateRoundKeys(key);

    // Initial Permutation (IP)
    const afterIP = permute(plaintext, IP);

    // Split into L and R (32 bits each)
    const L0 = afterIP.slice(0, 32);
    const R0 = afterIP.slice(32);

    const rounds: DesRoundTrace[] = [];
    let L = [...L0];
    let R = [...R0];

    // Feistel rounds
    for (let round = 0; round < 16; round++) {
        const newR = xorBits(L, feistelFunction(R, roundKeys[round]));
        const newL = [...R];
        const roundKey = roundKeys[round];

        // Calculate intermediate values for trace
        const expandedR = permute(R, E);
        const xoredWithKey = xorBits(expandedR, roundKey);
        let sboxOutput: number[] = [];
        for (let i = 0; i < 8; i++) {
            sboxOutput.push(...sboxSubstitute(xoredWithKey.slice(i * 6, i * 6 + 6), S_BOXES[i]));
        }
        const permutedOutput = permute(sboxOutput, P);

        rounds.push({
            roundIndex: round + 1,
            L: [...L],
            R: [...R],
            expandedR,
            xoredWithKey,
            sboxOutput,
            permutedOutput,
            newL,
            newR,
            roundKey,
        });

        L = newL;
        R = newR;
    }

    // Final permutation: R16L16 (swap L and R, then apply FP)
    const preOutput = [...R, ...L];
    const ciphertext = permute(preOutput, FP);

    return {
        plaintext: [...plaintext],
        key: [...key],
        afterIP,
        L0,
        R0,
        rounds,
        ciphertext,
    };
}

/**
 * DES Block Decryption
 *
 * Decrypts a single 64-bit ciphertext block using DES.
 * Uses the same algorithm as encryption but with reversed round keys.
 *
 * @param ciphertext - 64 bits (array of 0/1)
 * @param key - 64 bits (array of 0/1)
 * @returns Full decryption trace
 */
export function desDecryptBlock(ciphertext: number[], key: number[]): DesTrace {
    // Validate inputs
    if (ciphertext.length !== 64) {
        throw new Error(`Ciphertext must be 64 bits, got ${ciphertext.length}`);
    }
    if (key.length !== 64) {
        throw new Error(`Key must be 64 bits, got ${key.length}`);
    }

    // Generate round keys
    const roundKeys = generateRoundKeys(key);

    // Apply IP to ciphertext (same as in encryption)
    const afterIP = permute(ciphertext, IP);

    // Split into L and R
    // In decryption, we start with R16 and L16 (reversed)
    const R16 = afterIP.slice(0, 32);
    const L16 = afterIP.slice(32);

    const rounds: DesRoundTrace[] = [];
    let L = [...R16]; // Start with R16
    let R = [...L16]; // Start with L16

    // Feistel rounds in reverse order of key usage
    for (let round = 0; round < 16; round++) {
        const roundKey = roundKeys[15 - round]; // Reverse key order
        const newR = xorBits(L, feistelFunction(R, roundKey));
        const newL = [...R];

        // Calculate intermediate values for trace
        const expandedR = permute(R, E);
        const xoredWithKey = xorBits(expandedR, roundKey);
        let sboxOutput: number[] = [];
        for (let i = 0; i < 8; i++) {
            sboxOutput.push(...sboxSubstitute(xoredWithKey.slice(i * 6, i * 6 + 6), S_BOXES[i]));
        }
        const permutedOutput = permute(sboxOutput, P);

        rounds.push({
            roundIndex: round + 1,
            L: [...L],
            R: [...R],
            expandedR,
            xoredWithKey,
            sboxOutput,
            permutedOutput,
            newL,
            newR,
            roundKey,
        });

        L = newL;
        R = newR;
    }

    // Final permutation: R0L0 (swap L and R, then apply FP)
    const preOutput = [...R, ...L];
    const plaintext = permute(preOutput, FP);

    return {
        plaintext,
        ciphertext: [...ciphertext],
        key: [...key],
        afterIP,
        L0: L.slice(0, 32), // After decryption, L contains R0
        R0: R.slice(0, 32), // After decryption, R contains L0
        rounds,
    };
}
