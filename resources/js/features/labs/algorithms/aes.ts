/**
 * AES-128 Block Cipher Implementation
 *
 * Implements AES-128 encryption and decryption with full round-by-round traces.
 * All operations follow FIPS-197 specification.
 *
 * AES-128: 128-bit key → 10 rounds → 128-bit block
 */

import {
    S_BOX,
    INV_S_BOX,
    RCON,
    gfMul,
    subWord,
    rotWord,
} from './aes-tables';

// ── Utility Functions ────────────────────────────────────────────────────────

/**
 * Convert hex string to byte array
 * "48656c6c6f" → [72, 101, 108, 108, 111]
 */
export function hexToBytes(hex: string): number[] {
    const bytes: number[] = [];

    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }

    return bytes;
}

/**
 * Convert byte array to hex string
 * [72, 101, 108, 108, 111] → "48656C6C6F"
 */
export function bytesToHex(bytes: number[]): string {
    return bytes.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ── Key Expansion ───────────────────────────────────────────────────────────

/**
 * Key Expansion: 128-bit key → 44 words (176 bytes) → 11 round keys
 *
 * Each round key is 16 bytes (128 bits)
 * W[0-3] = Round Key 0
 * W[4-7] = Round Key 1
 * etc.
 */
function keyExpansion(key: number[]): number[][] {
    const Nk = 4; // 4 words for AES-128
    const Nb = 4; // 4 words block size
    const Nr = 10; // 10 rounds for AES-128

    const w: number[][] = [];

    // First 4 words are the original key
    for (let i = 0; i < Nk; i++) {
        w.push([key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]]);
    }

    // Generate remaining words
    for (let i = Nk; i < Nb * (Nr + 1); i++) {
        let temp = [...w[i - 1]];

        if (i % Nk === 0) {
            // RotWord + SubWord + Rcon
            temp = subWord(rotWord(temp));
            temp[0] ^= RCON[i / Nk];
        } else if (Nk > 6 && i % Nk === 4) {
            // Only for AES-192/256, skip for AES-128
            temp = subWord(temp);
        }

        w.push([w[i - Nk][0] ^ temp[0], w[i - Nk][1] ^ temp[1], w[i - Nk][2] ^ temp[2], w[i - Nk][3] ^ temp[3]]);
    }

    // Convert words to round keys (each round key = 16 bytes)
    const roundKeys: number[][] = [];

    for (let round = 0; round < Nr + 1; round++) {
        const roundKey: number[] = [];

        for (let word = 0; word < 4; word++) {
            const wordIdx = round * 4 + word;
            roundKey.push(...w[wordIdx]);
        }

        roundKeys.push(roundKey);
    }

    return roundKeys;
}

// ── AES Round Operations ────────────────────────────────────────────────────

/**
 * SubBytes: Substitute each byte using S-Box
 */
function subBytes(state: number[]): number[] {
    return state.map((byte) => S_BOX[byte]);
}

/**
 * InvSubBytes: Inverse substitution using inverse S-Box
 */
function invSubBytes(state: number[]): number[] {
    return state.map((byte) => INV_S_BOX[byte]);
}

/**
 * ShiftRows: Cyclically shift bytes in each row
 * Row 0: no shift
 * Row 1: shift left by 1
 * Row 2: shift left by 2
 * Row 3: shift left by 3
 */
function shiftRows(state: number[]): number[] {
    const result = new Array(16);

    // Column-major to row-major conversion happens after
    // In state matrix (column-major):
    // [0,4,8,12]  [1,5,9,13]  [2,6,10,14]  [3,7,11,15]
    // Row 0: [0,4,8,12]  - no shift
    // Row 1: [1,5,9,13]  - shift left by 1 → [5,9,13,1]
    // Row 2: [2,6,10,14] - shift left by 2 → [10,14,2,6]
    // Row 3: [3,7,11,15] - shift left by 3 → [15,3,7,11]

    result[0] = state[0];
    result[1] = state[5];
    result[2] = state[10];
    result[3] = state[15];

    result[4] = state[4];
    result[5] = state[9];
    result[6] = state[14];
    result[7] = state[3];

    result[8] = state[8];
    result[9] = state[13];
    result[10] = state[2];
    result[11] = state[7];

    result[12] = state[12];
    result[13] = state[1];
    result[14] = state[6];
    result[15] = state[11];

    return result;
}

/**
 * InvShiftRows: Inverse shift rows
 * Row 0: no shift
 * Row 1: shift right by 1
 * Row 2: shift right by 2
 * Row 3: shift right by 3
 */
function invShiftRows(state: number[]): number[] {
    const result = new Array(16);

    result[0] = state[0];
    result[1] = state[13];
    result[2] = state[10];
    result[3] = state[7];

    result[4] = state[4];
    result[5] = state[1];
    result[6] = state[14];
    result[7] = state[11];

    result[8] = state[8];
    result[9] = state[5];
    result[10] = state[2];
    result[11] = state[15];

    result[12] = state[12];
    result[13] = state[9];
    result[14] = state[6];
    result[15] = state[3];

    return result;
}

/**
 * MixColumns: Mix each column using GF(2^8) matrix multiplication
 * Each column is treated as a 4-element vector and multiplied by the MixColumns matrix
 */
function mixColumns(state: number[]): number[] {
    const result = new Array(16);

    // Process each column (4 bytes at indices 0-3, 4-7, 8-11, 12-15)
    for (let col = 0; col < 4; col++) {
        const offset = col * 4;
        const s0 = state[offset];
        const s1 = state[offset + 1];
        const s2 = state[offset + 2];
        const s3 = state[offset + 3];

        // Matrix multiplication with GF(2^8) multiplication
        // [2 3 1 1]
        // [1 2 3 1]
        // [1 1 2 3]
        // [3 1 1 2]

        result[offset] = gfMul(0x02, s0) ^ gfMul(0x03, s1) ^ s2 ^ s3;
        result[offset + 1] = s0 ^ gfMul(0x02, s1) ^ gfMul(0x03, s2) ^ s3;
        result[offset + 2] = s0 ^ s1 ^ gfMul(0x02, s2) ^ gfMul(0x03, s3);
        result[offset + 3] = gfMul(0x03, s0) ^ s1 ^ s2 ^ gfMul(0x02, s3);
    }

    return result.map((b) => b & 0xff);
}

/**
 * InvMixColumns: Inverse mix columns using inverse matrix
 * Multiplies each column by:
 * [0e 0b 0d 09]
 * [09 0e 0b 0d]
 * [0d 09 0e 0b]
 * [0b 0d 09 0e]
 */
function invMixColumns(state: number[]): number[] {
    const result = new Array(16);

    for (let col = 0; col < 4; col++) {
        const offset = col * 4;
        const s0 = state[offset];
        const s1 = state[offset + 1];
        const s2 = state[offset + 2];
        const s3 = state[offset + 3];

        result[offset] = gfMul(0x0e, s0) ^ gfMul(0x0b, s1) ^ gfMul(0x0d, s2) ^ gfMul(0x09, s3);
        result[offset + 1] = gfMul(0x09, s0) ^ gfMul(0x0e, s1) ^ gfMul(0x0b, s2) ^ gfMul(0x0d, s3);
        result[offset + 2] = gfMul(0x0d, s0) ^ gfMul(0x09, s1) ^ gfMul(0x0e, s2) ^ gfMul(0x0b, s3);
        result[offset + 3] = gfMul(0x0b, s0) ^ gfMul(0x0d, s1) ^ gfMul(0x09, s2) ^ gfMul(0x0e, s3);
    }

    return result.map((b) => b & 0xff);
}

/**
 * AddRoundKey: XOR state with round key
 */
function addRoundKey(state: number[], roundKey: number[]): number[] {
    return state.map((byte, i) => byte ^ roundKey[i]);
}

// ── Main AES Functions ──────────────────────────────────────────────────────

export interface AesRoundTrace {
    roundIndex: number;
    label: string;
    stateBefore: number[];
    afterSubBytes: number[];
    afterShiftRows: number[];
    afterMixColumns: number[];
    afterAddRoundKey: number[];
    roundKey: number[];
}

export interface AesTrace {
    plaintext: number[];
    key: number[];
    keySchedule: number[][];
    rounds: AesRoundTrace[];
    ciphertext: number[];
}

/**
 * AES-128 Block Encryption
 *
 * Encrypts a single 16-byte block using AES-128.
 * Returns a complete trace of all round operations.
 *
 * @param plaintext - 16 bytes (128 bits)
 * @param key - 16 bytes (128 bits)
 * @returns Full encryption trace with all intermediate states
 */
export function aesEncryptBlock(plaintext: number[], key: number[]): AesTrace {
    const Nr = 10; // 10 rounds for AES-128

    // Validate inputs
    if (plaintext.length !== 16) {
        throw new Error(`Plaintext must be 16 bytes, got ${plaintext.length}`);
    }

    if (key.length !== 16) {
        throw new Error(`Key must be 16 bytes, got ${key.length}`);
    }

    // Generate key schedule
    const roundKeys = keyExpansion(key);

    const rounds: AesRoundTrace[] = [];
    let state = [...plaintext];

    // Initial round key addition
    state = addRoundKey(state, roundKeys[0]);

    // Main rounds
    for (let round = 0; round < Nr - 1; round++) {
        const stateBefore = [...state];
        const roundKey = roundKeys[round + 1];

        const afterSubBytes = subBytes(state);
        const afterShiftRows = shiftRows(afterSubBytes);
        const afterMixColumns = mixColumns(afterShiftRows);
        const afterAddRoundKey = addRoundKey(afterMixColumns, roundKey);

        rounds.push({
            roundIndex: round,
            label: `Round ${round + 1}`,
            stateBefore,
            afterSubBytes,
            afterShiftRows,
            afterMixColumns,
            afterAddRoundKey,
            roundKey,
        });

        state = afterAddRoundKey;
    }

    // Final round (no MixColumns)
    const stateBefore = [...state];
    const finalRoundKey = roundKeys[Nr];

    const afterSubBytes = subBytes(state);
    const afterShiftRows = shiftRows(afterSubBytes);
    // No MixColumns in final round
    const afterMixColumns = [...afterShiftRows]; // Placeholder (same as shift rows)
    const afterAddRoundKey = addRoundKey(afterShiftRows, finalRoundKey);

    rounds.push({
        roundIndex: Nr - 1,
        label: `Round ${Nr}`,
        stateBefore,
        afterSubBytes,
        afterShiftRows,
        afterMixColumns,
        afterAddRoundKey,
        roundKey: finalRoundKey,
    });

    return {
        plaintext: [...plaintext],
        key: [...key],
        keySchedule: roundKeys,
        rounds,
        ciphertext: afterAddRoundKey,
    };
}

/**
 * AES-128 Block Decryption
 *
 * Decrypts a single 16-byte ciphertext block using AES-128.
 * Returns a complete trace of all round operations.
 *
 * @param ciphertext - 16 bytes (128 bits)
 * @param key - 16 bytes (128 bits)
 * @returns Full decryption trace with all intermediate states
 */
export function aesDecryptBlock(ciphertext: number[], key: number[]): AesTrace {
    const Nr = 10;

    // Validate inputs
    if (ciphertext.length !== 16) {
        throw new Error(`Ciphertext must be 16 bytes, got ${ciphertext.length}`);
    }

    if (key.length !== 16) {
        throw new Error(`Key must be 16 bytes, got ${key.length}`);
    }

    // Generate key schedule
    const roundKeys = keyExpansion(key);

    const rounds: AesRoundTrace[] = [];
    let state = [...ciphertext];

    // Initial round key addition (with final round key)
    state = addRoundKey(state, roundKeys[Nr]);

    // Main rounds (in reverse order, with Inv operations)
    for (let round = Nr - 1; round >= 1; round--) {
        const stateBefore = [...state];
        const roundKey = roundKeys[round];

        const afterInvShiftRows = invShiftRows(state);
        const afterInvSubBytes = invSubBytes(afterInvShiftRows);
        const afterAddRoundKey = addRoundKey(afterInvSubBytes, roundKey);
        const afterInvMixColumns = invMixColumns(afterAddRoundKey);

        rounds.push({
            roundIndex: Nr - round,
            label: `Round ${Nr - round}`,
            stateBefore,
            afterSubBytes: afterInvSubBytes,
            afterShiftRows: afterInvShiftRows,
            afterMixColumns: afterInvMixColumns,
            afterAddRoundKey,
            roundKey,
        });

        state = afterInvMixColumns;
    }

    // Final round (no InvMixColumns)
    const stateBefore = [...state];
    const finalRoundKey = roundKeys[0];

    const afterInvShiftRows = invShiftRows(state);
    const afterInvSubBytes = invSubBytes(afterInvShiftRows);
    const afterAddRoundKey = addRoundKey(afterInvSubBytes, finalRoundKey);

    rounds.push({
        roundIndex: Nr,
        label: `Round ${Nr}`,
        stateBefore,
        afterSubBytes: afterInvSubBytes,
        afterShiftRows: afterInvShiftRows,
        afterMixColumns: [...afterAddRoundKey], // Placeholder
        afterAddRoundKey,
        roundKey: finalRoundKey,
    });

    // Reverse rounds array to show from round 0 to Nr-1
    rounds.reverse();

    // Renumber round indices to 0..Nr-1 for consistent display
    rounds.forEach((r, i) => {
        r.roundIndex = i;
        r.label = `Round ${i + 1}`;
    });

    return {
        plaintext: afterAddRoundKey,
        key: [...key],
        keySchedule: roundKeys,
        rounds,
        ciphertext: [...ciphertext],
    };
}
