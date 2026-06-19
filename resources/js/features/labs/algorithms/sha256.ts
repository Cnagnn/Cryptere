/**
 * SHA-256 Implementation
 *
 * Pure TypeScript implementation of SHA-256 hash function.
 * Follows FIPS 180-4 specification exactly.
 *
 * SHA-256: Arbitrary length message → 256-bit (32-byte) hash
 */

/**
 * Round constants (K)
 * First 32 bits of the fractional parts of the cube roots of the first 64 primes
 */
export const K: readonly number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/**
 * Initial hash values (H0)
 * First 32 bits of the fractional parts of the square roots of the first 8 primes
 */
export const H0: readonly number[] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Right rotate a 32-bit value
 *
 * @param x - 32-bit value
 * @param n - number of positions to rotate
 * @returns rotated value as unsigned 32-bit
 */
function rotr(x: number, n: number): number {
    const shifted = ((x >>> n) | (x << (32 - n))) >>> 0;
    return shifted;
}

/**
 * Right shift a 32-bit value
 *
 * @param x - 32-bit value
 * @param n - number of positions to shift
 * @returns shifted value as unsigned 32-bit
 */
function shr(x: number, n: number): number {
    return (x >>> n) >>> 0;
}

/**
 * Ch(x, y, z) = (x AND y) XOR (NOT x AND z)
 */
function ch(x: number, y: number, z: number): number {
    return (x & y) ^ (~x & z);
}

/**
 * Maj(x, y, z) = (x AND y) XOR (x AND z) XOR (y AND z)
 */
function maj(x: number, y: number, z: number): number {
    return (x & y) ^ (x & z) ^ (y & z);
}

/**
 * Big Sigma 0 (uppercase Σ0)
 * ROTR^2(x) XOR ROTR^13(x) XOR ROTR^22(x)
 */
function bigSigma0(x: number): number {
    return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
}

/**
 * Big Sigma 1 (uppercase Σ1)
 * ROTR^6(x) XOR ROTR^11(x) XOR ROTR^25(x)
 */
function bigSigma1(x: number): number {
    return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
}

/**
 * Small sigma 0 (lowercase σ0)
 * ROTR^7(x) XOR ROTR^18(x) XOR SHR^3(x)
 */
function smallSigma0(x: number): number {
    return rotr(x, 7) ^ rotr(x, 18) ^ shr(x, 3);
}

/**
 * Small sigma 1 (lowercase σ1)
 * ROTR^17(x) XOR ROTR^19(x) XOR SHR^10(x)
 */
function smallSigma1(x: number): number {
    return rotr(x, 17) ^ rotr(x, 19) ^ shr(x, 10);
}

// ── Message Padding ──────────────────────────────────────────────────────────

/**
 * Pad message to be a multiple of 512 bits (64 bytes)
 * Following FIPS 180-4 Section 5.1.1
 *
 * Padding format: [message bits] 1 [zeros*] [64-bit length]
 * where total after message and '1' bit must leave room for zeros + 64-bit length
 *
 * @param message - UTF-8 encoded message as byte array
 * @returns Padded message as byte array
 */
function padMessage(message: Uint8Array): Uint8Array {
    const originalLength = message.length;
    const originalBitLength = originalLength * 8;

    // Calculate padding
    // After message + '1' bit, we need zeros until the 64-bit length fits
    // Total padding bytes (including 0x80): 1 + zeros
    // Must satisfy: (L + 1 + zeros) % 64 = 64 - 8 = 56 (leaving room for 8-byte length)
    //
    // zeros = (56 - 1 - (L mod 64) + 64) % 64
    //       = (55 - (L mod 64) + 64) % 64
    const zerosAfterOne = ((55 - (originalLength % 64)) + 64) % 64;
    const totalPadding = 1 + zerosAfterOne; // 0x80 + zeros

    // Total padded length: original + padding + 8 (length field)
    const totalLength = originalLength + totalPadding + 8;
    const padded = new Uint8Array(totalLength);

    // Copy original message
    padded.set(message);

    // Append '1' bit (0x80)
    padded[originalLength] = 0x80;

    // Append original length as 64-bit big-endian integer
    // For messages up to 2^53 - 1 bits (which all JS strings are)
    const highBits = Math.floor(originalBitLength / 0x100000000);
    const lowBits = originalBitLength >>> 0;

    const lengthOffset = originalLength + totalPadding;
    padded[lengthOffset] = (highBits >>> 24) & 0xff;
    padded[lengthOffset + 1] = (highBits >>> 16) & 0xff;
    padded[lengthOffset + 2] = (highBits >>> 8) & 0xff;
    padded[lengthOffset + 3] = highBits & 0xff;
    padded[lengthOffset + 4] = (lowBits >>> 24) & 0xff;
    padded[lengthOffset + 5] = (lowBits >>> 16) & 0xff;
    padded[lengthOffset + 6] = (lowBits >>> 8) & 0xff;
    padded[lengthOffset + 7] = lowBits & 0xff;

    return padded;
}

// ── Main SHA-256 Functions ────────────────────────────────────────────────────

export interface Sha256RoundTrace {
    t: number;
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
    g: number;
    h: number;
    T1: number;
    T2: number;
}

export interface Sha256BlockTrace {
    blockIndex: number;
    W: number[];
    initial: number[];
    rounds: Sha256RoundTrace[];
    final: number[];
}

export interface Sha256Trace {
    message: string;
    paddedHex: string;
    blocks: Sha256BlockTrace[];
    digest: string;
}

/**
 * Compute SHA-256 hash of a string message
 *
 * @param message - Input string
 * @returns 64-character hexadecimal hash (uppercase)
 */
export function sha256(message: string): string {
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    const padded = padMessage(messageBytes);

    // Initialize hash values
    let H = [...H0];

    // Process each 512-bit (64-byte) block
    const numBlocks = padded.length / 64;

    for (let block = 0; block < numBlocks; block++) {
        // Prepare message schedule W[0..63]
        const W: number[] = [];

        // First 16 words are from the block (big-endian)
        for (let t = 0; t < 16; t++) {
            const offset = block * 64 + t * 4;
            W[t] = (padded[offset] << 24) | (padded[offset + 1] << 16) | (padded[offset + 2] << 8) | padded[offset + 3];
        }

        // Extend to 64 words
        for (let t = 16; t < 64; t++) {
            W[t] = (smallSigma1(W[t - 2]) + W[t - 7] + smallSigma0(W[t - 15]) + W[t - 16]) >>> 0;
        }

        // Initialize working variables
        let a = H[0];
        let b = H[1];
        let c = H[2];
        let d = H[3];
        let e = H[4];
        let f = H[5];
        let g = H[6];
        let h = H[7];

        // 64 rounds
        for (let t = 0; t < 64; t++) {
            const T1 = (h + bigSigma1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0;
            const T2 = (bigSigma0(a) + maj(a, b, c)) >>> 0;

            h = g;
            g = f;
            f = e;
            e = (d + T1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (T1 + T2) >>> 0;
        }

        // Update hash values
        H[0] = (H[0] + a) >>> 0;
        H[1] = (H[1] + b) >>> 0;
        H[2] = (H[2] + c) >>> 0;
        H[3] = (H[3] + d) >>> 0;
        H[4] = (H[4] + e) >>> 0;
        H[5] = (H[5] + f) >>> 0;
        H[6] = (H[6] + g) >>> 0;
        H[7] = (H[7] + h) >>> 0;
    }

    // Produce final hash
    return H.map((h) => h.toString(16).padStart(8, '0')).join('').toUpperCase();
}

/**
 * Compute SHA-256 hash with full round trace
 *
 * @param message - Input string
 * @returns Trace object with all intermediate values
 */
export function sha256Trace(message: string): Sha256Trace {
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    const padded = padMessage(messageBytes);

    // Initialize hash values
    let H = [...H0];
    const initialHash = [...H];

    const blocks: Sha256BlockTrace[] = [];
    const numBlocks = padded.length / 64;

    // Process each 512-bit (64-byte) block
    for (let block = 0; block < numBlocks; block++) {
        // Prepare message schedule W[0..63]
        const W: number[] = [];

        // First 16 words are from the block (big-endian)
        for (let t = 0; t < 16; t++) {
            const offset = block * 64 + t * 4;
            W[t] = (padded[offset] << 24) | (padded[offset + 1] << 16) | (padded[offset + 2] << 8) | padded[offset + 3];
        }

        // Extend to 64 words
        for (let t = 16; t < 64; t++) {
            W[t] = (smallSigma1(W[t - 2]) + W[t - 7] + smallSigma0(W[t - 15]) + W[t - 16]) >>> 0;
        }

        // Save initial hash for this block
        const blockInitial = [...H];

        // Initialize working variables
        let a = H[0];
        let b = H[1];
        let c = H[2];
        let d = H[3];
        let e = H[4];
        let f = H[5];
        let g = H[6];
        let h = H[7];

        const rounds: Sha256RoundTrace[] = [];

        // 64 rounds
        for (let t = 0; t < 64; t++) {
            const T1 = (h + bigSigma1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0;
            const T2 = (bigSigma0(a) + maj(a, b, c)) >>> 0;

            rounds.push({
                t,
                a,
                b,
                c,
                d,
                e,
                f,
                g,
                h,
                T1,
                T2,
            });

            h = g;
            g = f;
            f = e;
            e = (d + T1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (T1 + T2) >>> 0;
        }

        // Save final hash for this block
        const final = [a, b, c, d, e, f, g, h].map((v) => v >>> 0);

        blocks.push({
            blockIndex: block,
            W,
            initial: blockInitial,
            rounds,
            final,
        });

        // Update hash values
        H[0] = (H[0] + a) >>> 0;
        H[1] = (H[1] + b) >>> 0;
        H[2] = (H[2] + c) >>> 0;
        H[3] = (H[3] + d) >>> 0;
        H[4] = (H[4] + e) >>> 0;
        H[5] = (H[5] + f) >>> 0;
        H[6] = (H[6] + g) >>> 0;
        H[7] = (H[7] + h) >>> 0;
    }

    // Produce final hash
    const digest = H.map((h) => h.toString(16).padStart(8, '0')).join('').toUpperCase();

    // Create padded hex for display
    const paddedHex = Array.from(padded)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();

    return {
        message,
        paddedHex,
        blocks,
        digest,
    };
}
