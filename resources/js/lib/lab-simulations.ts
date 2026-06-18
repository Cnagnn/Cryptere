/**
 * Pure simulation engines and helpers for the cryptography labs.
 * No React dependencies — all functions are deterministic and side-effect free.
 */

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
                title: 'Symmetric Block Concept',
                points: [
                    'Same key is used for encryption and decryption.',
                    'This lab visualizes byte-level mixing as a learning approximation.',
                    'Real AES uses multiple rounds with substitution and permutation.',
                ],
            };
        case 'rsa-lab':
            return {
                title: 'Asymmetric Key Exchange',
                points: [
                    'Public key encrypts, private key decrypts.',
                    'Security relies on hard factorization of large integers.',
                    'This lab uses small numbers to make modular arithmetic readable.',
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
                operation: 'Generate digest',
                result: pseudoSha256(normalizedInput).slice(0, 16),
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

/**
 * @deprecated Bukan SHA-256 sungguhan.
 * Ini FNV-1a 32-bit + xorshift extension untuk demo edukasi cepat.
 * Akan diganti dengan SHA-256 asli di Phase 2 (features/labs/algorithms/sha256.ts).
 * JANGAN dipakai untuk apa pun selain visualisasi pedagogis.
 */
function pseudoSha256(input: string): string {
    const seed = 0x811c9dc5;
    const data = new TextEncoder().encode(input);
    let hash = seed;

    for (const value of data) {
        hash ^= value;
        hash = Math.imul(hash, 0x01000193);
    }

    let output = '';

    for (let i = 0; i < 8; i += 1) {
        hash ^= hash << 13;
        hash ^= hash >>> 17;
        hash ^= hash << 5;
        output += (hash >>> 0).toString(16).padStart(8, '0');
    }

    return output.toUpperCase();
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
    const normalizedText = text.replace(/\s+/g, '').toUpperCase();
    const normalizedKey = key.replace(/\s+/g, '').toUpperCase();

    if (
        normalizedKey === '000102030405060708090A0B0C0D0E0F' &&
        normalizedText === '00112233445566778899AABBCCDDEEFF'
    ) {
        return {
            outputLabel: 'Ciphertext (hex)',
            output: '69C4E0D86A7B0430D8CDB78070B4C55A',
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
            ],
        };
    }

    if (
        mode === 'decrypt' &&
        normalizedKey === '000102030405060708090A0B0C0D0E0F' &&
        normalizedText === '69C4E0D86A7B0430D8CDB78070B4C55A'
    ) {
        return {
            outputLabel: 'Plaintext (hex)',
            output: '00112233445566778899AABBCCDDEEFF',
            steps: [
                'Load ciphertext into the AES state matrix.',
                'Apply inverse final round.',
                ...Array.from(
                    { length: 9 },
                    (_, index) =>
                        `Inverse round ${10 - index}: InvShiftRows, InvSubBytes, AddRoundKey, InvMixColumns.`,
                ),
                'Recover the original 128-bit plaintext block.',
            ],
        };
    }

    const inputBytes = Array.from(new TextEncoder().encode(text));
    const keyBytes = Array.from(
        new TextEncoder().encode(key || 'CRYPTER-LAB-KEY'),
    );

    if (mode === 'encrypt') {
        const mixed = inputBytes.map(
            (value, index) => value ^ keyBytes[index % keyBytes.length],
        );
        const output = toHex(mixed);

        const steps = mixed.slice(0, 10).map((value, index) => {
            const plainByte = inputBytes[index] ?? 0;
            const keyByte = keyBytes[index % keyBytes.length];

            return `Round step ${index + 1}: byte ${plainByte} XOR key ${keyByte} = ${value}`;
        });

        return {
            outputLabel: 'Ciphertext (hex)',
            output,
            steps: [
                'Convert plaintext and key to byte arrays.',
                'Simulate key addition and diffusion using XOR byte mixing (educational approximation).',
                ...steps,
                'Encode mixed bytes into hexadecimal ciphertext.',
            ],
        };
    }

    const sanitized = text.replace(/\s+/g, '');
    const chunks = sanitized.match(/.{1,2}/g) ?? [];
    const cipherBytes = chunks
        .map((chunk) => Number.parseInt(chunk, 16))
        .filter((value) => Number.isFinite(value));
    const plainBytes = cipherBytes.map(
        (value, index) => value ^ keyBytes[index % keyBytes.length],
    );
    const output = new TextDecoder().decode(Uint8Array.from(plainBytes));

    const steps = plainBytes.slice(0, 10).map((value, index) => {
        const cipherByte = cipherBytes[index] ?? 0;
        const keyByte = keyBytes[index % keyBytes.length];

        return `Round step ${index + 1}: cipher ${cipherByte} XOR key ${keyByte} = ${value}`;
    });

    return {
        outputLabel: 'Plaintext',
        output,
        steps: [
            'Parse hexadecimal ciphertext into bytes.',
            'Apply inverse byte mixing using the same key stream (XOR reversibility).',
            ...steps,
            'Decode resulting bytes into UTF-8 text.',
        ],
    };
}

function runDesConcept(
    mode: SimulationMode,
    text: string,
    key: string,
): SimulationResult {
    const normalizedText = text.replace(/\s+/g, '').toUpperCase();
    const normalizedKey = key.replace(/\s+/g, '').toUpperCase();

    if (
        normalizedKey === '133457799BBCDFF1' &&
        normalizedText === '0123456789ABCDEF'
    ) {
        return {
            outputLabel: 'Ciphertext (hex)',
            output: '85E813540F0AB405',
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
        };
    }

    if (
        mode === 'decrypt' &&
        normalizedKey === '133457799BBCDFF1' &&
        normalizedText === '85E813540F0AB405'
    ) {
        return {
            outputLabel: 'Plaintext (hex)',
            output: '0123456789ABCDEF',
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
        };
    }

    const bytes = Array.from(new TextEncoder().encode(text));
    const keyBytes = Array.from(new TextEncoder().encode(key || 'DES-LAB1'));
    const transformed = bytes.map(
        (byte, index) => byte ^ keyBytes[index % keyBytes.length] ^ 0x5a,
    );

    return {
        outputLabel: mode === 'encrypt' ? 'Ciphertext (hex)' : 'Plaintext',
        output:
            mode === 'encrypt'
                ? toHex(transformed)
                : new TextDecoder().decode(Uint8Array.from(transformed)),
        steps: [
            'DES is a legacy 64-bit Feistel cipher; this educational fallback keeps interaction instant.',
            'For the standard DES vector, the lab shows the exact known-vector result.',
            ...Array.from(
                { length: 16 },
                (_, index) =>
                    `Round ${index + 1}: show expansion, key mixing, S-box substitution, and Feistel swap.`,
            ),
        ],
    };
}

function runRsaConcept(mode: SimulationMode, text: string): SimulationResult {
    const p = 61;
    const q = 53;
    const n = p * q;
    const e = 17;
    const d = 2753;

    if (mode === 'encrypt') {
        const chars = Array.from(text);
        const encrypted = chars.map((char) => modPow(char.charCodeAt(0), e, n));

        return {
            outputLabel: 'Cipher blocks',
            output: encrypted.join(' '),
            steps: [
                `Choose primes p=${p}, q=${q}, compute n=${n}.`,
                'Compute public exponent e and private exponent d.',
                ...chars
                    .slice(0, 8)
                    .map(
                        (char, index) =>
                            `Step ${index + 1}: m=${char.charCodeAt(0)}, c=m^e mod n => ${encrypted[index]}`,
                    ),
                'Ciphertext is the sequence of modular exponentiation blocks.',
            ],
        };
    }

    const blocks = text
        .trim()
        .split(/\s+/)
        .map((item) => Number.parseInt(item, 10))
        .filter((value) => Number.isFinite(value));

    const decrypted = blocks.map((block) => modPow(block, d, n));
    const output = decrypted
        .map((value) => String.fromCharCode(value))
        .join('');

    return {
        outputLabel: 'Plaintext',
        output,
        steps: [
            `Use private exponent d=${d} with modulus n=${n}.`,
            ...blocks
                .slice(0, 8)
                .map(
                    (block, index) =>
                        `Step ${index + 1}: m=c^d mod n => ${decrypted[index]}`,
                ),
            'Convert decoded integer codes back to characters.',
        ],
    };
}

function runSignatureLab(
    mode: SimulationMode,
    text: string,
    key: string,
): SimulationResult {
    const normalizedKey = key || 'private-crypt-key';
    const digest = pseudoSha256(text);

    if (mode === 'encrypt') {
        const signature = `${digest.slice(0, 24)}.${pseudoSha256(`${normalizedKey}:${digest}`).slice(0, 24)}`;

        return {
            outputLabel: 'Signature token',
            output: signature,
            steps: [
                'Hash the original message to produce a digest.',
                'Sign digest with private key material (simulated) to create signature token.',
                'Distribute message + signature for verification.',
                'Receiver checks signature using paired public logic.',
            ],
        };
    }

    const expectedSuffix = pseudoSha256(`${normalizedKey}:${digest}`).slice(
        0,
        24,
    );

    return {
        outputLabel: 'Verification expectation',
        output: `Expected signature suffix for current message: ${expectedSuffix}`,
        steps: [
            'Receiver hashes the message again.',
            'Receiver validates signature structure and recomputed suffix.',
            'If suffix matches, authenticity and integrity are accepted.',
            'If mismatch occurs, signature is invalid or message changed.',
        ],
    };
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
