/**
 * RSA Implementation
 *
 * Pure TypeScript RSA key generation and encryption/decryption.
 * Includes extended Euclidean algorithm for modular inverse.
 */

import { sha256 } from './sha256';

// ── Utility Functions ────────────────────────────────────────────────────────

/**
 * Modular exponentiation using square-and-multiply
 * Computes (base^exp) mod mod efficiently
 *
 * @param base - Base (bigint)
 * @param exp - Exponent (bigint)
 * @param mod - Modulus (bigint)
 * @returns (base^exp) mod mod
 */
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    if (mod === 1n) {
        return 0n;
    }

    let result = 1n;
    let b = base % mod;
    let e = exp;

    while (e > 0n) {
        if (e % 2n === 1n) {
            result = (result * b) % mod;
        }
        e = e / 2n;
        b = (b * b) % mod;
    }

    return result;
}

/**
 * Extended Euclidean Algorithm
 * Computes gcd(a, b) and coefficients x, y such that ax + by = gcd(a, b)
 *
 * @param a - First integer
 * @param b - Second integer
 * @returns Object containing gcd, x, y, and step-by-step computation
 */
export function extGcd(
    a: bigint,
    b: bigint
): {
    gcd: bigint;
    x: bigint;
    y: bigint;
    steps: Array<{
        a: bigint;
        b: bigint;
        q: bigint;
        r: bigint;
        s: bigint;
        t: bigint;
    }>;
} {
    const steps: Array<{
        a: bigint;
        b: bigint;
        q: bigint;
        r: bigint;
        s: bigint;
        t: bigint;
    }> = [];

    let old_r = a;
    let r = b;
    let old_s = 1n;
    let s = 0n;
    let old_t = 0n;
    let t = 1n;

    while (r !== 0n) {
        const quotient = old_r / r;

        steps.push({
            a: old_r,
            b: r,
            q: quotient,
            r: old_r % r,
            s: old_s - quotient * s,
            t: old_t - quotient * t,
        });

        const temp_r = old_r;
        old_r = r;
        r = temp_r % r;

        const temp_s = old_s;
        old_s = s;
        s = temp_s - quotient * s;

        const temp_t = old_t;
        old_t = t;
        t = temp_t - quotient * t;
    }

    return {
        gcd: old_r,
        x: old_s,
        y: old_t,
        steps,
    };
}

/**
 * Calculate modular multiplicative inverse
 * Finds x such that (a * x) mod m = 1
 *
 * @param a - The number to find inverse of
 * @param m - The modulus
 * @returns The modular inverse, or null if it doesn't exist
 */
export function modInverse(a: bigint, m: bigint): bigint | null {
    const result = extGcd(a, m);

    if (result.gcd !== 1n) {
        // Inverse doesn't exist
        return null;
    }

    // Make result positive
    let inverse = result.x % m;
    if (inverse < 0n) {
        inverse += m;
    }

    return inverse;
}

/**
 * Check if a number is prime
 */
function isPrime(n: bigint): boolean {
    if (n < 2n) return false;
    if (n === 2n) return true;
    if (n % 2n === 0n) return false;

    for (let i = 3n; i * i <= n; i += 2n) {
        if (n % i === 0n) return false;
    }
    return true;
}

// ── Key Generation ───────────────────────────────────────────────────────────

export interface RsaKeyGenTrace {
    p: bigint;
    q: bigint;
    n: bigint;
    phi: bigint;
    e: bigint;
    d: bigint;
    publicKey: {
        e: bigint;
        n: bigint;
    };
    privateKey: {
        d: bigint;
        n: bigint;
    };
    keyGenSteps: string[];
    extGcdSteps: Array<{
        a: bigint;
        b: bigint;
        q: bigint;
        r: bigint;
        s: bigint;
        t: bigint;
    }>;
}

/**
 * Generate RSA key pair
 *
 * @param p - First prime
 * @param q - Second prime
 * @param e - Public exponent (typically 65537 or 17)
 * @returns Key generation trace with all intermediate values
 */
export function generateRsaKeys(p: bigint, q: bigint, e: bigint): RsaKeyGenTrace {
    const keyGenSteps: string[] = [];

    // Step 1: Validate primes
    if (!isPrime(p)) {
        throw new Error(`p (${p}) is not prime`);
    }
    if (!isPrime(q)) {
        throw new Error(`q (${q}) is not prime`);
    }
    keyGenSteps.push(`p = ${p} (prime: verified)`);
    keyGenSteps.push(`q = ${q} (prime: verified)`);

    // Step 2: Calculate n = p × q
    const n = p * q;
    keyGenSteps.push(`n = p × q = ${p} × ${q} = ${n}`);

    // Step 3: Calculate φ(n) = (p-1)(q-1)
    const phi = (p - 1n) * (q - 1n);
    keyGenSteps.push(`φ(n) = (p-1)(q-1) = (${p}-1)(${q}-1) = ${phi}`);

    // Step 4: Find d such that e × d ≡ 1 (mod φ(n))
    // d = e^(-1) mod φ(n)
    keyGenSteps.push(`e = ${e} (public exponent)`);

    // Use extended Euclidean algorithm to find d
    // We need d where e × d = 1 + k × φ(n)
    // This means e × d ≡ 1 (mod φ(n))
    const extGcdResult = extGcd(e, phi);
    keyGenSteps.push(`Using Extended Euclidean Algorithm to find d:`);
    keyGenSteps.push(`gcd(${e}, ${phi}) = ${extGcdResult.gcd}`);

    // The x coefficient is the modular inverse if gcd = 1
    if (extGcdResult.gcd !== 1n) {
        throw new Error(`e and φ(n) are not coprime. gcd(${e}, ${phi}) = ${extGcdResult.gcd}`);
    }

    let d = extGcdResult.x % phi;
    if (d < 0n) {
        d += phi;
    }
    keyGenSteps.push(`d = e⁻¹ mod φ(n) = ${d}`);

    // Verify
    const verify = (e * d) % phi;
    keyGenSteps.push(`Verification: e × d mod φ(n) = ${e} × ${d} mod ${phi} = ${verify}`);

    if (verify !== 1n) {
        throw new Error('Key generation failed: e × d mod φ(n) ≠ 1');
    }

    return {
        p,
        q,
        n,
        phi,
        e,
        d,
        publicKey: { e, n },
        privateKey: { d, n },
        keyGenSteps,
        extGcdSteps: extGcdResult.steps,
    };
}

// ── Text Encryption/Decryption ───────────────────────────────────────────────

export interface RsaTextEncryptResult {
    keys: RsaKeyGenTrace;
    blocks: Array<{
        char: string;
        m: bigint;
        c: bigint;
    }>;
    ciphertext: string;
}

export interface RsaTextDecryptResult {
    keys: RsaKeyGenTrace;
    decrypted: string;
    blocks: Array<{
        c: bigint;
        m: bigint;
        char: string;
    }>;
}

/**
 * Encrypt text using RSA
 *
 * @param text - Plaintext string
 * @param keys - RSA key pair
 * @returns Encryption result with all blocks
 */
export function rsaEncryptText(text: string, keys: RsaKeyGenTrace): RsaTextEncryptResult {
    const blocks: Array<{
        char: string;
        m: bigint;
        c: bigint;
    }> = [];

    const ciphertextValues: string[] = [];

    for (const char of text) {
        // Convert character to integer (using char code)
        const m = BigInt(char.charCodeAt(0));

        // Encrypt: c = m^e mod n
        const c = modPow(m, keys.e, keys.n);

        blocks.push({ char, m, c });
        ciphertextValues.push(c.toString());
    }

    return {
        keys,
        blocks,
        ciphertext: ciphertextValues.join(' '),
    };
}

/**
 * Decrypt RSA ciphertext back to text
 *
 * @param ciphertext - Space-separated decimal ciphertext values
 * @param keys - RSA key pair
 * @returns Decryption result with all blocks
 */
export function rsaDecryptBlocks(ciphertext: string, keys: RsaKeyGenTrace): RsaTextDecryptResult {
    const cValues = ciphertext.split(' ').filter((s) => s.length > 0).map(BigInt);
    const blocks: Array<{
        c: bigint;
        m: bigint;
        char: string;
    }> = [];

    const decryptedChars: string[] = [];

    for (const c of cValues) {
        // Decrypt: m = c^d mod n
        const m = modPow(c, keys.d, keys.n);

        // Convert integer back to character
        const charCode = Number(m);
        const char = String.fromCharCode(charCode);

        blocks.push({ c, m, char });
        decryptedChars.push(char);
    }

    return {
        keys,
        decrypted: decryptedChars.join(''),
        blocks,
    };
}

// ── Hash-based Signature (using SHA-256) ─────────────────────────────────────

export interface RsaSignatureResult {
    message: string;
    digestHex: string;
    digestPrefix: string;
    digestInt: bigint;
    signatureInt: bigint;
    signatureHex: string;
    explanationSteps: string[];
}

export interface RsaVerifyResult {
    isValid: boolean;
    recoveredDigestInt: bigint;
    explanationSteps: string[];
}

/**
 * Sign a message using RSA with SHA-256
 *
 * @param message - Message to sign
 * @param keys - RSA key pair
 * @returns Signature result with explanation
 */
export function signMessage(message: string, keys: RsaKeyGenTrace): RsaSignatureResult {
    const explanationSteps: string[] = [];

    // Step 1: Hash the message with SHA-256
    explanationSteps.push(`Step 1: Hash message with SHA-256`);
    const digestHex = sha256(message);
    explanationSteps.push(`SHA-256("${message}") = ${digestHex}`);
    explanationSteps.push(`Digest length: ${digestHex.length} hex chars = ${digestHex.length * 4} bits`);

    // Step 2: Take first few hex chars to get an integer < n
    // For toy example, we use first 4 hex chars (16 bits)
    // We need to ensure the digest value is less than n
    const maxHexChars = keys.n.toString(16).length - 1; // Leave buffer for safety
    const numChars = Math.min(4, maxHexChars); // Use 4 chars or less if n is small
    const digestPrefix = digestHex.substring(0, numChars);

    explanationSteps.push(`Step 2: Extract prefix for RSA signing`);
    explanationSteps.push(`n has ${keys.n.toString(16).length} hex chars`);
    explanationSteps.push(`Using first ${numChars} chars: ${digestPrefix}`);

    // Step 3: Convert hex prefix to bigint
    const digestInt = BigInt('0x' + digestPrefix);
    explanationSteps.push(`Step 3: Convert to integer`);
    explanationSteps.push(`${digestPrefix} (hex) = ${digestInt} (decimal)`);

    // Verify digestInt < n
    if (digestInt >= keys.n) {
        explanationSteps.push(`WARNING: digestInt (${digestInt}) >= n (${keys.n})`);
        explanationSteps.push(`This would not be invertible. Consider using fewer hex chars.`);
    }

    // Step 4: Sign = digestInt^d mod n (private key operation)
    explanationSteps.push(`Step 4: Create signature`);
    explanationSteps.push(`signature = digest^d mod n`);
    explanationSteps.push(`signature = ${digestInt}^${keys.d} mod ${keys.n}`);

    const signatureInt = modPow(digestInt, keys.d, keys.n);

    explanationSteps.push(`signature = ${signatureInt}`);

    // Step 5: Convert signature to hex
    const signatureHex = signatureInt.toString(16).toUpperCase();
    explanationSteps.push(`Step 5: Signature in hex: ${signatureHex}`);

    return {
        message,
        digestHex,
        digestPrefix,
        digestInt,
        signatureInt,
        signatureHex,
        explanationSteps,
    };
}

/**
 * Verify an RSA signature
 *
 * @param message - Original message
 * @param signatureInt - Signature as bigint
 * @param keys - RSA key pair
 * @returns Verification result
 */
export function verifySignature(
    message: string,
    signatureInt: bigint,
    keys: RsaKeyGenTrace
): RsaVerifyResult {
    const explanationSteps: string[] = [];

    // Step 1: Recompute hash of message
    explanationSteps.push(`Step 1: Recompute SHA-256 hash of message`);
    const digestHex = sha256(message);
    explanationSteps.push(`SHA-256("${message}") = ${digestHex}`);

    // Step 2: Extract same prefix
    const maxHexChars = keys.n.toString(16).length - 1;
    const numChars = Math.min(4, maxHexChars);
    const digestPrefix = digestHex.substring(0, numChars);

    explanationSteps.push(`Step 2: Extract same ${numChars} hex chars: ${digestPrefix}`);

    // Step 3: Convert prefix to integer
    const digestInt = BigInt('0x' + digestPrefix);
    explanationSteps.push(`Step 3: digestInt = ${digestInt}`);

    // Step 4: Verify = signature^e mod n (public key operation)
    explanationSteps.push(`Step 4: Verify signature`);
    explanationSteps.push(`recoveredDigest = signature^e mod n`);
    explanationSteps.push(`recoveredDigest = ${signatureInt}^${keys.e} mod ${keys.n}`);

    const recoveredDigestInt = modPow(signatureInt, keys.e, keys.n);

    explanationSteps.push(`recoveredDigest = ${recoveredDigestInt}`);

    // Step 5: Compare
    const isValid = recoveredDigestInt === digestInt;
    explanationSteps.push(`Step 5: Compare`);
    explanationSteps.push(`recoveredDigest (${recoveredDigestInt}) === digestInt (${digestInt})`);
    explanationSteps.push(`Signature is ${isValid ? 'VALID' : 'INVALID'}`);

    return {
        isValid,
        recoveredDigestInt,
        explanationSteps,
    };
}
