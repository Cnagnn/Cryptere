/**
 * Pure simulation engines and helpers for the cryptography labs.
 * No React dependencies — all functions are deterministic and side-effect free.
 */


import {
    aesEncryptBlock,
    aesDecryptBlock,
    hexToBytes as aesHexToBytes,
    bytesToHex as aesBytesToHex,
} from '@/features/labs/algorithms/aes';

import {
    desEncryptBlock,
    desDecryptBlock,
    hexToBits,
    bitsToHex,
} from '@/features/labs/algorithms/des';

import { generateRsaKeys, modPow as rsaModPow } from '@/features/labs/algorithms/rsa';
import { signMessage, verifySignature } from '@/features/labs/algorithms/rsa';
import { sha256 } from '@/features/labs/algorithms/sha256';
import type {
    ConceptLens,
    FormatValue,
    SimulationMode,
    SimulationResult,
    VisualizationLens,
} from '@/types/labs';

// ── Format options ──

export const formatOptions: Array<{ value: FormatValue; label: string }> = [
    { value: 'ascii', label: 'ASCII / UTF-8' },
    { value: 'hex', label: 'Hex' },
    { value: 'binary', label: 'Binary' },
    { value: 'base64', label: 'Base64' },
    { value: 'decimal', label: 'Decimal Bytes' },
];

// ── Byte conversion helpers ──

function bytesToBinary(bytes: number[]): string {
    return bytes.map((byte) => byte.toString(2).padStart(8, '0')).join(' ');
}

function bytesToDecimal(bytes: number[]): string {
    return bytes.join(' ');
}

function decodeBase64Safe(value: string): number[] | null {
    const normalized = value.replace(/\s+/g, '');

    if (normalized.length === 0 || normalized.length % 4 !== 0) {
        return null;
    }

    try {
        const binary = atob(normalized);

        return Array.from(binary, (char) => char.charCodeAt(0));
    } catch {
        return null;
    }
}

function encodeBase64Safe(bytes: number[]): string {
    const binary = String.fromCharCode(...bytes);

    return btoa(binary);
}

// ── Input normalization ──

export function normalizeInputToText(
    rawInput: string,
    format: FormatValue,
): { value: string | null; error: string | null } {
    if (format === 'ascii') {
        return { value: rawInput, error: null };
    }

    if (format === 'hex') {
        const sanitized = rawInput.replace(/\s+/g, '');

        if (!/^[0-9a-fA-F]*$/.test(sanitized) || sanitized.length % 2 !== 0) {
            return {
                value: null,
                error: 'Hex input must contain only 0-9, A-F with even length.',
            };
        }

        const bytes =
            sanitized
                .match(/.{1,2}/g)
                ?.map((chunk) => Number.parseInt(chunk, 16)) ?? [];

        return {
            value: new TextDecoder().decode(Uint8Array.from(bytes)),
            error: null,
        };
    }

    if (format === 'binary') {
        const chunks = rawInput.trim().split(/\s+/).filter(Boolean);

        if (
            chunks.length === 0 ||
            chunks.some((chunk) => !/^[01]{8}$/.test(chunk))
        ) {
            return {
                value: null,
                error: 'Binary input must be 8-bit groups separated by spaces.',
            };
        }

        const bytes = chunks.map((chunk) => Number.parseInt(chunk, 2));

        return {
            value: new TextDecoder().decode(Uint8Array.from(bytes)),
            error: null,
        };
    }

    if (format === 'base64') {
        const bytes = decodeBase64Safe(rawInput);

        if (bytes === null) {
            return {
                value: null,
                error: 'Base64 input is invalid. Check padding and characters.',
            };
        }

        return {
            value: new TextDecoder().decode(Uint8Array.from(bytes)),
            error: null,
        };
    }

    const chunks = rawInput.trim().split(/\s+/).filter(Boolean);

    if (chunks.length === 0 || chunks.some((chunk) => !/^\d+$/.test(chunk))) {
        return {
            value: null,
            error: 'Decimal bytes must be integer groups separated by spaces.',
        };
    }

    const bytes = chunks.map((chunk) => Number.parseInt(chunk, 10));

    if (bytes.some((value) => value < 0 || value > 255)) {
        return {
            value: null,
            error: 'Decimal byte values must be between 0 and 255.',
        };
    }

    return {
        value: new TextDecoder().decode(Uint8Array.from(bytes)),
        error: null,
    };
}

export function normalizeInputForSimulation(
    labSlug: string,
    mode: SimulationMode,
    rawInput: string,
    inputFormat: FormatValue,
): { value: string | null; error: string | null } {
    if (labSlug === 'aes-lab' && mode === 'decrypt') {
        if (inputFormat === 'hex') {
            const sanitized = rawInput.replace(/\s+/g, '');

            if (
                !/^[0-9a-fA-F]*$/.test(sanitized) ||
                sanitized.length % 2 !== 0
            ) {
                return {
                    value: null,
                    error: 'AES decrypt input must be valid hex with even length, for example 4A6F686E.',
                };
            }

            return { value: sanitized, error: null };
        }

        const normalized = normalizeInputToText(rawInput, inputFormat);

        if (normalized.value === null) {
            return normalized;
        }

        return {
            value: toHex(
                Array.from(new TextEncoder().encode(normalized.value)),
            ),
            error: null,
        };
    }

    if (labSlug === 'rsa-lab' && mode === 'decrypt') {
        if (inputFormat === 'decimal') {
            const trimmed = rawInput.trim();

            if (!/^\d+(\s+\d+)*$/.test(trimmed)) {
                return {
                    value: null,
                    error: 'RSA decrypt input must contain numeric cipher blocks separated by spaces.',
                };
            }

            return { value: trimmed, error: null };
        }

        const normalized = normalizeInputToText(rawInput, inputFormat);

        if (normalized.value === null) {
            return normalized;
        }

        const trimmed = normalized.value.trim();

        if (!/^\d+(\s+\d+)*$/.test(trimmed)) {
            return {
                value: null,
                error: 'For RSA decrypt, decoded content must resolve to numeric cipher blocks.',
            };
        }

        return { value: trimmed, error: null };
    }

    return normalizeInputToText(rawInput, inputFormat);
}

// ── Output formatting ──

export function formatOutputValue(
    value: string,
    format: FormatValue,
): { value: string; error: string | null } {
    if (format === 'ascii') {
        return { value, error: null };
    }

    const bytes = Array.from(new TextEncoder().encode(value));

    if (format === 'hex') {
        return { value: toHex(bytes), error: null };
    }

    if (format === 'binary') {
        return { value: bytesToBinary(bytes), error: null };
    }

    if (format === 'base64') {
        return { value: encodeBase64Safe(bytes), error: null };
    }

    return { value: bytesToDecimal(bytes), error: null };
}

// ── Format recommendation ──

export function recommendedInputFormatByLab(
    slug: string,
    mode: SimulationMode,
): FormatValue {
    if (slug === 'aes-lab' && mode === 'decrypt') {
        return 'hex';
    }

    if (slug === 'rsa-lab' && mode === 'decrypt') {
        return 'decimal';
    }

    return 'ascii';
}

export function recommendedOutputFormatByLab(
    slug: string,
    mode: SimulationMode,
): FormatValue {
    if (slug === 'aes-lab' && mode === 'encrypt') {
        return 'hex';
    }

    if (slug === 'rsa-lab' && mode === 'encrypt') {
        return 'decimal';
    }

    return 'ascii';
}

export function canFormatOutput(labSlug: string): boolean {
    // All currently configured labs render output as bytes or structured text
    // that the shared formatter can present. Kept as a feature flag so future
    // labs can opt out by slug without changing call sites.
    void labSlug;

    return true;
}

export function formatLabel(value: FormatValue): string {
    return (
        formatOptions.find((option) => option.value === value)?.label ?? value
    );
}

// ── Concept lens ──

export function conceptLensByLab(
    slug: string,
    mode: SimulationMode,
): ConceptLens {
    // mode is currently unused but kept in the signature so future labs can
    // present mode-specific concept summaries without changing call sites.
    void mode;

    switch (slug) {
        case 'caesar-cipher-lab':
            return {
                title: 'Classical Shift Cipher',
                points: [
                    'Each letter is shifted by a constant numeric key.',
                    'Security is low because only 25 meaningful shift keys exist.',
                    'Decryption simply applies the inverse shift.',
                ],
            };
        case 'vigenere-cipher-lab':
            return {
                title: 'Polyalphabetic Substitution',
                points: [
                    'Keyword letters define changing shifts across positions.',
                    'Repeated keyword patterns can still leak structure.',
                    'Decryption uses the same keyword with opposite shifts.',
                ],
            };
        case 'aes-lab':
            return {
                title: 'Symmetric Block Cipher (AES-128)',
                points: [
                    'AES-128 encrypts 16-byte blocks using a 128-bit key across 10 rounds.',
                    'Each round applies SubBytes (S-box lookup), ShiftRows (byte rotation), MixColumns (GF multiplication), and AddRoundKey (XOR with round key).',
                    'Only the correct key can reverse all 10 rounds to recover the plaintext.',
                ],
            };
        case 'des-lab':
            return {
                title: 'Feistel Block Cipher',
                points: [
                    'DES encrypts 64-bit blocks using a 64-bit key across 16 Feistel rounds.',
                    'The f-function expands R from 32→48 bits, XORs with round key, applies 8 S-boxes, and permutes.',
                    'The Feistel structure makes encryption and decryption use the same algorithm with reversed round keys.',
                ],
            };
        case 'rsa-lab':
            return {
                title: 'Asymmetric Key Exchange',
                points: [
                    'RSA uses a public key (e, n) to encrypt and a private key (d, n) to decrypt.',
                    'Security relies on the practical difficulty of factoring large numbers into primes.',
                    'Key generation uses extended Euclidean algorithm to find d where e × d ≡ 1 (mod φ(n)).',
                ],
            };
        case 'digital-signature-lab':
            return {
                title: 'RSA Digital Signature',
                points: [
                    'A sender hashes the message with SHA-256 and signs the digest with their private key.',
                    'Anyone with the public key can verify the signature and recover the digest.',
                    'If the recovered digest matches the recomputed hash, the message is authentic and unaltered.',
                ],
            };
        default:
            return {
                title: 'Digital Signature Flow',
                points: [
                    'A sender signs message digest with private key logic.',
                    'Receiver verifies signature using public verification logic.',
                    'Goal: authenticity, integrity, and non-repudiation.',
                ],
            };
    }
}

// ── Visualization lens ──

export function visualizationLensByLab(
    slug: string,
    mode: SimulationMode,
    normalizedInput: string,
    keyInput: string,
    rawResult: SimulationResult,
): VisualizationLens {
    if (slug === 'caesar-cipher-lab') {
        const normalized = normalizeLetters(normalizedInput).slice(0, 10);
        const shift = Number.parseInt(keyInput, 10);
        const safeShift = Number.isFinite(shift) ? shift : 3;
        const appliedShift = mode === 'encrypt' ? safeShift : -safeShift;

        return {
            title: 'Character Shift Table',
            description: 'Observe each letter move by the same offset.',
            headers: ['Source', 'Operation', 'Result'],
            rows: normalized.split('').map((char) => ({
                source: char,
                operation: `shift ${appliedShift >= 0 ? '+' : ''}${appliedShift}`,
                result: shiftCharacter(char, appliedShift),
            })),
        };
    }

    if (slug === 'vigenere-cipher-lab') {
        const text = normalizeLetters(normalizedInput).slice(0, 10);
        const keyword = normalizeLetters(keyInput) || 'KEY';

        return {
            title: 'Keyword-Driven Shift Map',
            description:
                'Each position uses a different shift from the keyword sequence.',
            headers: ['Source', 'Operation', 'Result'],
            rows: text.split('').map((char, index) => {
                const keyChar = keyword[index % keyword.length];
                const keyShift = keyChar.charCodeAt(0) - 65;
                const appliedShift = mode === 'encrypt' ? keyShift : -keyShift;

                return {
                    source: `${char} (${index + 1})`,
                    operation: `${keyChar} => ${appliedShift >= 0 ? '+' : ''}${appliedShift}`,
                    result: shiftCharacter(char, appliedShift),
                };
            }),
        };
    }

    if (slug === 'aes-lab') {
        const bytes = Array.from(
            new TextEncoder().encode(normalizedInput),
        ).slice(0, 10);
        const keyBytes = Array.from(
            new TextEncoder().encode(keyInput || 'CRYPTER-LAB-KEY'),
        );

        return {
            title: 'Byte Mixing View',
            description:
                'Educational byte XOR view to explain reversible mixing.',
            headers: ['Source', 'Operation', 'Result'],
            rows: bytes.map((byte, index) => {
                const keyByte = keyBytes[index % keyBytes.length];
                const mixed = byte ^ keyByte;

                return {
                    source: `${byte} (0x${byte.toString(16).padStart(2, '0')})`,
                    operation: `XOR key ${keyByte}`,
                    result: `${mixed} (0x${mixed.toString(16).padStart(2, '0')})`,
                };
            }),
        };
    }

    if (slug === 'des-lab') {
        const rounds = Array.from({ length: 16 }, (_, i) => i + 1);

        return {
            title: 'Feistel Round Structure',
            description:
                'Each round expands R, mixes with a round key, applies S-boxes, then swaps halves.',
            headers: ['Round', 'Operation', 'Result'],
            rows: rounds.map((round) => ({
                source: `Round ${round}`,
                operation: `L${round} = R${round - 1}; R${round} = L${round - 1} XOR f(R${round - 1}, K${round})`,
                result: `K${round} derived from key schedule`,
            })),
        };
    }

    if (slug === 'rsa-lab') {
        const parts =
            mode === 'encrypt'
                ? Array.from(normalizedInput)
                      .slice(0, 8)
                      .map((char) => char.charCodeAt(0))
                : normalizedInput
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 8)
                      .map((value) => Number.parseInt(value, 10));

        return {
            title: 'Modular Arithmetic Blocks',
            description:
                'Track each block as modular exponentiation is applied.',
            headers: ['Source', 'Operation', 'Result'],
            rows: parts.map((value) => ({
                source: String(value),
                operation:
                    mode === 'encrypt' ? 'c = m^e mod n' : 'm = c^d mod n',
                result: String(
                    mode === 'encrypt'
                        ? modPow(value, 17, 61 * 53)
                        : modPow(value, 2753, 61 * 53),
                ),
            })),
        };
    }

    return {
        title: 'Signing and Verification Lens',
        description: 'Observe how digest and signature token are related.',
        headers: ['Source', 'Operation', 'Result'],
        rows: [
            {
                source: normalizedInput.slice(0, 24) || '(empty)',
                operation: 'Generate digest (SHA-256)',
                result: sha256(normalizedInput).slice(0, 16),
            },
            {
                source: 'Digest + key material',
                operation:
                    mode === 'encrypt' ? 'Sign' : 'Verify expected suffix',
                result: rawResult.output.slice(0, 24),
            },
        ],
    };
}

// ── Character helpers ──

function normalizeLetters(input: string): string {
    return input.toUpperCase().replace(/[^A-Z]/g, '');
}

function shiftCharacter(char: string, shift: number): string {
    const base = 'A'.charCodeAt(0);
    const code = char.charCodeAt(0) - base;
    const shifted = (((code + shift) % 26) + 26) % 26;

    return String.fromCharCode(base + shifted);
}

function toHex(bytes: number[]): string {
    return bytes
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

function modPow(base: number, exponent: number, modulus: number): number {
    if (modulus === 1) {
        return 0;
    }

    let result = 1;
    let value = base % modulus;
    let power = exponent;

    while (power > 0) {
        if (power % 2 === 1) {
            result = (result * value) % modulus;
        }

        power = Math.floor(power / 2);
        value = (value * value) % modulus;
    }

    return result;
}

// ── Simulation engines ──

function runCaesar(
    mode: SimulationMode,
    text: string,
    rawKey: string,
): SimulationResult {
    const normalized = normalizeLetters(text);
    const shift = Number.parseInt(rawKey, 10);
    const safeShift = Number.isFinite(shift) ? shift : 3;
    const appliedShift = mode === 'encrypt' ? safeShift : -safeShift;

    const transformed = normalized
        .split('')
        .map((char) => shiftCharacter(char, appliedShift))
        .join('');

    const previewSteps = normalized
        .slice(0, 12)
        .split('')
        .map((char, index) => {
            const to = shiftCharacter(char, appliedShift);

            return `Step ${index + 1}: ${char} -> ${to} (shift ${appliedShift >= 0 ? '+' : ''}${appliedShift})`;
        });

    return {
        outputLabel: mode === 'encrypt' ? 'Ciphertext' : 'Plaintext',
        output: transformed,
        steps: [
            `Normalize input into uppercase alphabetic stream: ${normalized || '(empty)'}`,
            `Set shift key = ${safeShift} and applied shift = ${appliedShift}.`,
            ...previewSteps,
            `Combine transformed letters into final ${mode === 'encrypt' ? 'ciphertext' : 'plaintext'}.`,
        ],
    };
}

function runVigenere(
    mode: SimulationMode,
    text: string,
    keyword: string,
): SimulationResult {
    const normalizedText = normalizeLetters(text);
    const normalizedKey = normalizeLetters(keyword) || 'KEY';

    const transformed = normalizedText
        .split('')
        .map((char, index) => {
            const keyChar = normalizedKey[index % normalizedKey.length];
            const keyShift = keyChar.charCodeAt(0) - 65;
            const appliedShift = mode === 'encrypt' ? keyShift : -keyShift;

            return shiftCharacter(char, appliedShift);
        })
        .join('');

    const previewSteps = normalizedText
        .slice(0, 12)
        .split('')
        .map((char, index) => {
            const keyChar = normalizedKey[index % normalizedKey.length];
            const keyShift = keyChar.charCodeAt(0) - 65;
            const appliedShift = mode === 'encrypt' ? keyShift : -keyShift;
            const to = shiftCharacter(char, appliedShift);

            return `Step ${index + 1}: text ${char}, key ${keyChar} (${keyShift}) -> ${to}`;
        });

    return {
        outputLabel: mode === 'encrypt' ? 'Ciphertext' : 'Plaintext',
        output: transformed,
        steps: [
            `Normalize text: ${normalizedText || '(empty)'}`,
            `Normalize keyword and repeat sequence: ${normalizedKey}`,
            `Apply ${mode === 'encrypt' ? 'forward' : 'backward'} shift based on each keyword letter.`,
            ...previewSteps,
            `Join every transformed character to produce the final output.`,
        ],
    };
}

function runAesConcept(
    mode: SimulationMode,
    text: string,
    key: string,
): SimulationResult {
    // Check for known vector (hex input)
    const normalizedText = text.replace(/\s+/g, '').toUpperCase();
    const normalizedKey = key.replace(/\s+/g, '').toUpperCase();

    // Known vector test case from FIPS-197
    if (
        normalizedKey === '000102030405060708090A0B0C0D0E0F' &&
        normalizedText === '00112233445566778899AABBCCDDEEFF'
    ) {
        const ptBytes = aesHexToBytes(normalizedText);
        const keyBytes = aesHexToBytes(normalizedKey);
        const trace = aesEncryptBlock(ptBytes, keyBytes);

        return {
            outputLabel: 'Ciphertext (hex)',
            output: aesBytesToHex(trace.ciphertext),
            steps: [
                'Load 128-bit plaintext into the AES state matrix.',
                'Expand the 128-bit key into 11 round keys.',
                'Initial AddRoundKey.',
                ...Array.from(
                    { length: 9 },
                    (_, index) =>
                        `Round ${index + 1}: SubBytes, ShiftRows, MixColumns, AddRoundKey.`,
                ),
                'Final round 10: SubBytes, ShiftRows, AddRoundKey.',
                `Ciphertext: ${aesBytesToHex(trace.ciphertext)}.`,
            ],
            trace: {
                aes: {
                    plaintext: trace.plaintext,
                    rounds: trace.rounds.map((r) => ({
                        roundIndex: r.roundIndex,
                        stateBefore: r.stateBefore,
                        afterSubBytes: r.afterSubBytes,
                        afterShiftRows: r.afterShiftRows,
                        afterMixColumns: r.afterMixColumns,
                        afterAddRoundKey: r.afterAddRoundKey,
                        roundKey: r.roundKey,
                    })),
                    ciphertext: trace.ciphertext,
                },
            },
        };
    }

    // Known vector decrypt
    if (
        mode === 'decrypt' &&
        normalizedKey === '000102030405060708090A0B0C0D0E0F' &&
        normalizedText === '69C4E0D86A7B0430D8CDB78070B4C55A'
    ) {
        const ctBytes = aesHexToBytes(normalizedText);
        const keyBytes = aesHexToBytes(normalizedKey);
        const trace = aesDecryptBlock(ctBytes, keyBytes);

        return {
            outputLabel: 'Plaintext (hex)',
            output: aesBytesToHex(trace.plaintext),
            steps: [
                'Load ciphertext into the AES state matrix.',
                'Apply inverse final round.',
                ...Array.from(
                    { length: 9 },
                    (_, index) =>
                        `Inverse round ${10 - index}: InvShiftRows, InvSubBytes, AddRoundKey, InvMixColumns.`,
                ),
                `Recover the original 128-bit plaintext block: ${aesBytesToHex(trace.plaintext)}.`,
            ],
            trace: {
                aes: {
                    plaintext: trace.plaintext,
                    rounds: trace.rounds.map((r) => ({
                        roundIndex: r.roundIndex,
                        stateBefore: r.stateBefore,
                        afterSubBytes: r.afterSubBytes,
                        afterShiftRows: r.afterShiftRows,
                        afterMixColumns: r.afterMixColumns,
                        afterAddRoundKey: r.afterAddRoundKey,
                        roundKey: r.roundKey,
                    })),
                    ciphertext: ctBytes,
                },
            },
        };
    }

    // Convert input to 16-byte block (PKCS#7 padding)
    const textBytes = Array.from(new TextEncoder().encode(text));
    const padded = pkcs7Pad(textBytes, 16);

    // Convert key to 16 bytes
    const keyInput = Array.from(new TextEncoder().encode(key || 'CRYPTER-LAB-KEY')).slice(0, 16);

    while (keyInput.length < 16) {
        keyInput.push(0);
    }

    if (mode === 'encrypt') {
        const trace = aesEncryptBlock(padded, keyInput);
        const steps = buildAesSteps(trace);

        return {
            outputLabel: 'Ciphertext (hex)',
            output: aesBytesToHex(trace.ciphertext),
            steps,
            trace: {
                aes: {
                    plaintext: trace.plaintext,
                    rounds: trace.rounds.map((r) => ({
                        roundIndex: r.roundIndex,
                        stateBefore: r.stateBefore,
                        afterSubBytes: r.afterSubBytes,
                        afterShiftRows: r.afterShiftRows,
                        afterMixColumns: r.afterMixColumns,
                        afterAddRoundKey: r.afterAddRoundKey,
                        roundKey: r.roundKey,
                    })),
                    ciphertext: trace.ciphertext,
                },
            },
        };
    }

    // decrypt: text is hex ciphertext
    const hexClean = text.replace(/\s+/g, '').toUpperCase();
    const cipherBytes = aesHexToBytes(hexClean);

    // Ensure we have at least 16 bytes for a block
    if (cipherBytes.length < 16) {
        return {
            outputLabel: 'Plaintext',
            output: '',
            steps: ['Ciphertext must be at least 16 bytes (32 hex characters) for AES block decryption.'],
            trace: { aes: { plaintext: [], rounds: [], ciphertext: [] } },
        };
    }

    // PKCS#7 unpad after decryption
    const trace = aesDecryptBlock(cipherBytes.slice(0, 16), keyInput);
    const unpadLen = trace.plaintext[15];
    const validPadding =
        unpadLen > 0 &&
        unpadLen <= 16 &&
        trace.plaintext.slice(16 - unpadLen).every((b) => b === unpadLen);
    const plainBytes = validPadding
        ? trace.plaintext.slice(0, 16 - unpadLen)
        : trace.plaintext;
    const steps = buildAesDecryptSteps(trace, plainBytes, validPadding);

    return {
        outputLabel: 'Plaintext',
        output: new TextDecoder().decode(Uint8Array.from(plainBytes)),
        steps,
        trace: {
            aes: {
                plaintext: trace.plaintext,
                rounds: trace.rounds.map((r) => ({
                    roundIndex: r.roundIndex,
                    stateBefore: r.stateBefore,
                    afterSubBytes: r.afterSubBytes,
                    afterShiftRows: r.afterShiftRows,
                    afterMixColumns: r.afterMixColumns,
                    afterAddRoundKey: r.afterAddRoundKey,
                    roundKey: r.roundKey,
                })),
                ciphertext: cipherBytes.slice(0, 16),
            },
        },
    };
}

function pkcs7Pad(data: number[], blockSize: number): number[] {
    const padLen = blockSize - (data.length % blockSize);

    return [...data, ...Array(padLen).fill(padLen)];
}

function buildAesSteps(trace: ReturnType<typeof aesEncryptBlock>): string[] {
    const steps: string[] = [
        `Normalize plaintext into ${trace.plaintext.length} bytes.`,
        `Pad to 16-byte block using PKCS#7.`,
        `Expand 16-byte key into 11 round keys.`,
        `Initial state: load plaintext into 4×4 matrix.`,
        `Initial AddRoundKey: XOR state with round key 0.`,
    ];

    for (let i = 0; i < 10; i++) {
        if (i < 9) {
            steps.push(
                `Round ${i + 1}: SubBytes → ShiftRows → MixColumns → AddRoundKey. ` +
                `S-box substitution on each byte, row shifts, column mixing, key XOR.`,
            );
        } else {
            steps.push(
                `Round 10: SubBytes → ShiftRows → AddRoundKey (no MixColumns in final round).`,
            );
        }
    }

    steps.push(`Ciphertext: ${aesBytesToHex(trace.ciphertext).toUpperCase()}.`);

    return steps;
}

function buildAesDecryptSteps(
    trace: ReturnType<typeof aesDecryptBlock>,
    plainBytes: number[],
    validPadding: boolean,
): string[] {
    const steps: string[] = [
        `Parse hex ciphertext into 16-byte block.`,
        `Begin with final AddRoundKey (round 10 key) — no IP in AES.`,
        `Round 1-9 inverse: InvShiftRows, InvSubBytes, InvAddRoundKey, InvMixColumns.`,
        `Round 10 inverse: InvShiftRows, InvSubBytes, InvAddRoundKey (no InvMixColumns).`,
    ];

    if (validPadding) {
        steps.push(`Remove PKCS#7 padding (${plainBytes.length} bytes of plaintext).`);
    } else {
        steps.push(`Note: padding validation skipped (non-standard or raw decryption).`);
    }

    steps.push(`Decrypted plaintext: ${aesBytesToHex(plainBytes).toUpperCase()}.`);

    return steps;
}

function runDesConcept(
    mode: SimulationMode,
    text: string,
    key: string,
): SimulationResult {
    const normalizedText = text.replace(/\s+/g, '').toUpperCase();
    const normalizedKey = key.replace(/\s+/g, '').toUpperCase();

    // Known vector from FIPS-46-3
    if (
        normalizedKey === '133457799BBCDFF1' &&
        normalizedText === '0123456789ABCDEF'
    ) {
        const ptBits = hexToBits(normalizedText);
        const keyBits = hexToBits(normalizedKey);
        const trace = desEncryptBlock(ptBits, keyBits);

        return {
            outputLabel: 'Ciphertext (hex)',
            output: bitsToHex(trace.ciphertext).toUpperCase(),
            steps: [
                'Apply the DES initial permutation to the 64-bit plaintext block.',
                'Split the permuted block into L0 and R0 halves.',
                ...Array.from(
                    { length: 16 },
                    (_, index) =>
                        `Round ${index + 1}: expand R, XOR round key, pass through S-boxes, permute, then swap halves.`,
                ),
                'Apply the final permutation to produce the ciphertext block.',
            ],
            trace: {
                des: {
                    plaintext: normalizedText,
                    rounds: trace.rounds.map((r) => ({
                        roundIndex: r.roundIndex,
                        L: r.L,
                        R: r.R,
                        expandedR: r.expandedR,
                        sboxOutput: r.sboxOutput,
                        permutedOutput: r.permutedOutput,
                    })),
                    ciphertext: bitsToHex(trace.ciphertext).toUpperCase(),
                },
            },
        };
    }

    // Known vector decrypt
    if (
        mode === 'decrypt' &&
        normalizedKey === '133457799BBCDFF1' &&
        normalizedText === '85E813540F0AB405'
    ) {
        const ctBits = hexToBits(normalizedText);
        const keyBits = hexToBits(normalizedKey);
        const trace = desDecryptBlock(ctBits, keyBits);

        return {
            outputLabel: 'Plaintext (hex)',
            output: bitsToHex(trace.plaintext).toUpperCase(),
            steps: [
                'Apply the DES initial permutation to the ciphertext block.',
                'Use the 16 round keys in reverse order.',
                ...Array.from(
                    { length: 16 },
                    (_, index) =>
                        `Round ${index + 1}: reverse Feistel flow with K${16 - index}.`,
                ),
                'Apply the final permutation to recover the plaintext block.',
            ],
            trace: {
                des: {
                    plaintext: bitsToHex(trace.plaintext).toUpperCase(),
                    rounds: trace.rounds.map((r) => ({
                        roundIndex: r.roundIndex,
                        L: r.L,
                        R: r.R,
                        expandedR: r.expandedR,
                        sboxOutput: r.sboxOutput,
                        permutedOutput: r.permutedOutput,
                    })),
                    ciphertext: normalizedText,
                },
            },
        };
    }

    // For non-standard inputs, require exact 16 hex chars (64 bits)
    if (normalizedText.length !== 16 || normalizedKey.length !== 16) {
        return {
            outputLabel: mode === 'encrypt' ? 'Ciphertext (hex)' : 'Plaintext',
            output: '',
            steps: [
                'DES requires exactly 16 hexadecimal characters (64 bits) for input.',
                'For the standard DES known vector, the lab shows the exact result.',
            ],
            trace: { des: { plaintext: normalizedText, rounds: [], ciphertext: '' } },
        };
    }

    const ptBits = hexToBits(normalizedText);
    const keyBits = hexToBits(normalizedKey);

    if (mode === 'encrypt') {
        const trace = desEncryptBlock(ptBits, keyBits);
        const steps = [
            `64-bit plaintext: ${normalizedText}.`,
            `64-bit key: ${normalizedKey}.`,
            `Apply Initial Permutation (IP).`,
            `Split into L0 and R0 halves (32 bits each).`,
            ...trace.rounds.map((r) =>
                `Round ${r.roundIndex}: expand R${r.roundIndex - 1}, XOR with K${r.roundIndex}, S-box substitution, permutation P, swap halves.`,
            ),
            `Swap final halves, apply Final Permutation (FP).`,
            `Ciphertext: ${bitsToHex(trace.ciphertext).toUpperCase()}.`,
        ];

        return {
            outputLabel: 'Ciphertext (hex)',
            output: bitsToHex(trace.ciphertext).toUpperCase(),
            steps,
            trace: {
                des: {
                    plaintext: normalizedText,
                    rounds: trace.rounds.map((r) => ({
                        roundIndex: r.roundIndex,
                        L: r.L,
                        R: r.R,
                        expandedR: r.expandedR,
                        sboxOutput: r.sboxOutput,
                        permutedOutput: r.permutedOutput,
                    })),
                    ciphertext: bitsToHex(trace.ciphertext).toUpperCase(),
                },
            },
        };
    }

    // decrypt
    const ctBits = hexToBits(normalizedText);
    const trace = desDecryptBlock(ctBits, keyBits);
    const steps = [
        `64-bit ciphertext: ${normalizedText}.`,
        `Apply Initial Permutation (IP).`,
        `Use 16 round keys in reverse order.`,
        ...trace.rounds.map((r) =>
            `Round ${r.roundIndex}: reverse Feistel with K${17 - r.roundIndex}.`,
        ),
        `Swap halves, apply Final Permutation (FP).`,
        `Plaintext: ${bitsToHex(trace.plaintext).toUpperCase()}.`,
    ];

    return {
        outputLabel: 'Plaintext',
        output: bitsToHex(trace.plaintext).toUpperCase(),
        steps,
        trace: {
            des: {
                plaintext: bitsToHex(trace.plaintext).toUpperCase(),
                rounds: trace.rounds.map((r) => ({
                    roundIndex: r.roundIndex,
                    L: r.L,
                    R: r.R,
                    expandedR: r.expandedR,
                    sboxOutput: r.sboxOutput,
                    permutedOutput: r.permutedOutput,
                })),
                ciphertext: normalizedText,
            },
        },
    };
}

function runRsaConcept(mode: SimulationMode, text: string): SimulationResult {
    // Use small primes for educational readability: p=61, q=53, e=17
    // This gives n=3233 which is small enough to show individual char encryption
    const p = 61n;
    const q = 53n;
    const e = 17n;
    const keys = generateRsaKeys(p, q, e);

    if (mode === 'encrypt') {
        const chars = Array.from(text);
        const encrypted: string[] = [];
        const steps: string[] = [
            `Key generation with small primes for education:`,
            `p = ${keys.p}, q = ${keys.q}`,
            `n = p × q = ${keys.n}`,
            `φ(n) = (p-1)(q-1) = ${keys.phi}`,
            `e = ${keys.e} (chosen, gcd(e, φ(n)) = 1)`,
            `d = e⁻¹ mod φ(n) = ${keys.d} (via extended Euclidean)`,
            `Public key: (e=${keys.e}, n=${keys.n})`,
            `Private key: (d=${keys.d}, n=${keys.n})`,
            '',
            `Encrypting "${text}" — each character m → c = m^e mod n:`,
        ];

        for (let i = 0; i < chars.length; i++) {
            const m = BigInt(chars[i].charCodeAt(0));
            // c = m^e mod n using bigint
            const c = rsaModPow(m, keys.e, keys.n);
            encrypted.push(c.toString());

            if (i < 8) {
                steps.push(`Char '${chars[i]}' (m=${m.toString()}): c = ${m}^${keys.e} mod ${keys.n} = ${c}`);
            }
        }

        if (chars.length > 8) {
            steps.push(`... and ${chars.length - 8} more characters encrypted similarly.`);
        }

        steps.push('');
        steps.push(`Ciphertext blocks: ${encrypted.join(' ')}`);

        return {
            outputLabel: 'Cipher blocks',
            output: encrypted.join(' '),
            steps,
            trace: {
                rsa: {
                    p: keys.p.toString(),
                    q: keys.q.toString(),
                    n: keys.n.toString(),
                    phi: keys.phi.toString(),
                    e: keys.e.toString(),
                    d: keys.d.toString(),
                    keyGenSteps: [
                        `p = ${keys.p}, q = ${keys.q}`,
                        `n = p × q = ${keys.n}`,
                        `φ(n) = (p-1)(q-1) = ${keys.phi}`,
                        `e = ${keys.e}`,
                        `d = e⁻¹ mod φ(n) = ${keys.d}`,
                    ],
                },
            },
        };
    }

    // decrypt mode
    const blocks = text.trim().split(/\s+/).filter(Boolean);
    const decrypted: string[] = [];
    const steps: string[] = [
        `Use private key: d=${keys.d}, n=${keys.n}`,
        '',
        `Decrypting — each cipher block c → m = c^d mod n:`,
    ];

    for (let i = 0; i < blocks.length; i++) {
        try {
            const c = BigInt(blocks[i]);
            const m = rsaModPow(c, keys.d, keys.n);
            const code = Number(m);
            const char = String.fromCharCode(code);
            decrypted.push(char);

            if (i < 8) {
                steps.push(`Block ${c}: m = ${c}^${keys.d} mod ${keys.n} = ${code} ('${char}')`);
            }
        } catch {
            steps.push(`Block "${blocks[i]}": could not parse as integer`);
            decrypted.push('�');
        }
    }

    if (blocks.length > 8) {
        steps.push(`... and ${blocks.length - 8} more blocks.`);
    }

    steps.push('');
    steps.push(`Decrypted text: ${decrypted.join('')}`);

    return {
        outputLabel: 'Plaintext',
        output: decrypted.join(''),
        steps,
        trace: {
            rsa: {
                p: keys.p.toString(),
                q: keys.q.toString(),
                n: keys.n.toString(),
                phi: keys.phi.toString(),
                e: keys.e.toString(),
                d: keys.d.toString(),
                keyGenSteps: [
                    `p = ${keys.p}, q = ${keys.q}`,
                    `n = p × q = ${keys.n}`,
                    `φ(n) = (p-1)(q-1) = ${keys.phi}`,
                    `e = ${keys.e}`,
                    `d = e⁻¹ mod φ(n) = ${keys.d}`,
                ],
            },
        },
    };
}

function runSignatureLab(
    mode: SimulationMode,
    text: string,
    _key: string,
): SimulationResult {
    // Use small primes where e=17 is coprime with φ(n)
    // p=61, q=53 gives φ(n) = 60*52 = 3120, gcd(17, 3120) = 1 ✓
    const toyKeys = generateRsaKeys(61n, 53n, 17n);

    if (mode === 'encrypt') {
        const sig = signMessage(text, toyKeys);

        return {
            outputLabel: 'Signature token',
            output: sig.signatureHex,
            steps: [
                `Hash message with SHA-256: ${sig.digestHex.slice(0, 32)}...`,
                `Take digest prefix (${sig.digestPrefix.length} hex chars): ${sig.digestPrefix}`,
                `Parse to integer: ${sig.digestInt.toString()}`,
                `Sign with private key: ${sig.digestInt.toString()}^${toyKeys.d} mod ${toyKeys.n} = ${sig.signatureInt.toString()}`,
                `Signature hex: ${sig.signatureHex}`,
                `Send: message + signature_token to receiver.`,
                `This demonstrates: only the private key holder can sign.`,
            ],
            trace: {
                signature: {
                    digestHex: sig.digestHex,
                    digestPrefix: sig.digestPrefix,
                    signatureInt: sig.signatureInt.toString(),
                    explanationSteps: [
                        `Hash: SHA-256("${text}") = ${sig.digestHex}`,
                        `Digest prefix: ${sig.digestPrefix}`,
                        `Signing: ${sig.digestInt.toString()}^${toyKeys.d} mod ${toyKeys.n} = ${sig.signatureInt.toString()}`,
                    ],
                },
            },
        };
    }

    // verify mode: user provides signature as hex
    const sigInt = tryParseSignatureHex(text);

    if (sigInt === null) {
        return {
            outputLabel: 'Verification',
            output: 'Could not parse signature. Provide signature as hex string.',
            steps: ['Enter a valid signature hex (e.g., from the Sign output) to verify.'],
        };
    }

    const ver = verifySignature(_key, sigInt, toyKeys);

    // Compute the expected digest hex and prefix from the original message
    const expectedDigestHex = sha256(_key);
    const maxHexChars = toyKeys.n.toString(16).length - 1;
    const numChars = Math.min(4, maxHexChars);
    const expectedDigestPrefix = expectedDigestHex.substring(0, numChars);

    return {
        outputLabel: 'Verification result',
        output: ver.isValid
            ? `VALID — digest recovered: ${ver.recoveredDigestInt.toString()}, matches expected prefix.`
            : `INVALID — recovered digest ${ver.recoveredDigestInt.toString()} != expected digest prefix.`,
        steps: [
            `Receiver hashes message with SHA-256.`,
            `Recover digest from signature: sig^e mod n = ${sigInt}^${toyKeys.e} mod ${toyKeys.n} = ${ver.recoveredDigestInt.toString()}.`,
            `Compare recovered digest with computed digest prefix.`,
            ver.isValid
                ? 'Digest matches → signature VALID, message authentic.'
                : 'Digest mismatch → signature INVALID, message tampered or wrong key.',
            'This demonstrates: anyone with public key can verify, only holder of private key can sign.',
        ],
        trace: {
            signature: {
                digestHex: expectedDigestHex,
                digestPrefix: expectedDigestPrefix,
                isValid: ver.isValid,
                explanationSteps: ver.explanationSteps,
            },
        },
    };
}

function tryParseSignatureHex(hex: string): bigint | null {
    try {
        const clean = hex.replace(/\s+/g, '');

        return BigInt('0x' + clean);
    } catch {
        return null;
    }
}

// ── Simulation router ──

export function runSimulation(
    labSlug: string,
    mode: SimulationMode,
    text: string,
    key: string,
): SimulationResult {
    switch (labSlug) {
        case 'caesar-cipher-lab':
            return runCaesar(mode, text, key);
        case 'vigenere-cipher-lab':
            return runVigenere(mode, text, key);
        case 'aes-lab':
            return runAesConcept(mode, text, key);
        case 'des-lab':
            return runDesConcept(mode, text, key);
        case 'rsa-lab':
            return runRsaConcept(mode, text);
        case 'digital-signature-lab':
            return runSignatureLab(mode, text, key);
        default:
            return {
                outputLabel: 'Result',
                output: '',
                steps: ['Unsupported algorithm.'],
            };
    }
}

// ── Lab metadata helpers ──

export function keyLabelByLab(slug: string): string {
    switch (slug) {
        case 'caesar-cipher-lab':
            return 'Shift key (number)';
        case 'vigenere-cipher-lab':
            return 'Keyword';
        case 'aes-lab':
            return 'Symmetric key';
        case 'des-lab':
            return 'DES key';
        case 'digital-signature-lab':
            return 'Signing key';
        default:
            return 'Key parameter';
    }
}

export function keyPlaceholderByLab(slug: string): string {
    switch (slug) {
        case 'caesar-cipher-lab':
            return '3';
        case 'vigenere-cipher-lab':
            return 'CRYPTER';
        case 'aes-lab':
            return 'CRYPTER-LAB-KEY';
        case 'des-lab':
            return '133457799BBCDFF1';
        case 'digital-signature-lab':
            return 'private-crypt-key';
        default:
            return 'Optional key';
    }
}

export function defaultTextByLab(slug: string): string {
    switch (slug) {
        case 'rsa-lab':
            return 'HELLO';
        case 'des-lab':
            return '0123456789ABCDEF';
        default:
            return 'CRYPTER LAB';
    }
}

export function modeDescription(labSlug: string, mode: SimulationMode): string {
    if (labSlug === 'digital-signature-lab') {
        return mode === 'encrypt'
            ? 'Create signature tokens from message digests.'
            : 'Verify authenticity by recomputing expected signature data.';
    }

    return mode === 'encrypt'
        ? 'Transform plaintext into protected representation.'
        : 'Reverse protected representation back into readable text.';
}

export function inputLabelByLab(labSlug: string, mode: SimulationMode): string {
    if (labSlug === 'digital-signature-lab') {
        return mode === 'encrypt' ? 'Message to sign' : 'Message to verify';
    }

    return mode === 'encrypt' ? 'Plain input' : 'Cipher input';
}

export function inputPlaceholderByLab(
    labSlug: string,
    mode: SimulationMode,
): string {
    if (labSlug === 'aes-lab' && mode === 'decrypt') {
        return 'Enter hex ciphertext, for example 4A6F686E...';
    }

    if (labSlug === 'des-lab') {
        return mode === 'encrypt'
            ? 'Enter a 64-bit plaintext block as hex, for example 0123456789ABCDEF'
            : 'Enter a 64-bit ciphertext block as hex, for example 85E813540F0AB405';
    }

    if (labSlug === 'rsa-lab' && mode === 'decrypt') {
        return 'Enter cipher blocks, for example 3000 28 2726';
    }

    return mode === 'encrypt'
        ? 'Enter plaintext to encrypt...'
        : 'Enter ciphertext to decrypt...';
}

export function inputHelperByLab(
    labSlug: string,
    mode: SimulationMode,
): string {
    if (labSlug === 'aes-lab' && mode === 'decrypt') {
        return 'Use only hexadecimal characters (0-9, A-F) with an even number of characters.';
    }

    if (labSlug === 'des-lab') {
        return 'DES is a legacy cipher. Use this lab for educational round visualization, not real security.';
    }

    if (labSlug === 'rsa-lab' && mode === 'decrypt') {
        return 'Use integer cipher blocks separated by spaces.';
    }

    return 'Try changing a single character and compare output differences.';
}

export function validationErrorByLab(
    labSlug: string,
    mode: SimulationMode,
    text: string,
    key: string,
): string | null {
    if (text.trim().length === 0) {
        return 'Input cannot be empty. Provide a value to run the simulation.';
    }

    if (labSlug === 'caesar-cipher-lab') {
        const parsed = Number.parseInt(key, 10);

        if (!Number.isFinite(parsed)) {
            return 'Caesar key must be a valid integer shift value.';
        }
    }

    if (labSlug === 'vigenere-cipher-lab') {
        if (normalizeLetters(key).length === 0) {
            return 'Vigenere keyword must include at least one letter (A-Z).';
        }
    }

    if (labSlug === 'aes-lab' && mode === 'decrypt') {
        const sanitized = text.replace(/\s+/g, '');

        if (!/^[0-9a-fA-F]+$/.test(sanitized) || sanitized.length % 2 !== 0) {
            return 'AES decrypt input must be valid hex with even length, for example 4A6F686E.';
        }
    }

    if (labSlug === 'des-lab') {
        const sanitized = text.replace(/\s+/g, '');
        const sanitizedKey = key.replace(/\s+/g, '');

        if (!/^[0-9a-fA-F]+$/.test(sanitized) || sanitized.length !== 16) {
            return 'DES input must be exactly one 64-bit block: 16 hexadecimal characters.';
        }

        if (
            !/^[0-9a-fA-F]+$/.test(sanitizedKey) ||
            sanitizedKey.length !== 16
        ) {
            return 'DES key must be exactly 16 hexadecimal characters including parity bits.';
        }
    }

    if (labSlug === 'rsa-lab' && mode === 'decrypt') {
        const trimmed = text.trim();

        if (!/^\d+(\s+\d+)*$/.test(trimmed)) {
            return 'RSA decrypt input must contain numeric cipher blocks separated by spaces.';
        }
    }

    return null;
}
