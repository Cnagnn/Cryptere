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
    { value: 'hex', label: 'Heksadesimal' },
    { value: 'binary', label: 'Biner' },
    { value: 'base64', label: 'Base64' },
    { value: 'decimal', label: 'Byte Desimal' },
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
                error: 'Masukan heksadesimal hanya boleh berisi 0-9, A-F dengan panjang genap.',
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
                error: 'Masukan biner harus berupa kelompok 8-bit dipisahkan spasi.',
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
                error: 'Masukan base64 tidak valid. Periksa padding dan karakter.',
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
            error: 'Byte desimal harus berupa kelompok bilangan bulat dipisahkan spasi.',
        };
    }

    const bytes = chunks.map((chunk) => Number.parseInt(chunk, 10));

    if (bytes.some((value) => value < 0 || value > 255)) {
        return {
            value: null,
            error: 'Nilai byte desimal harus antara 0 dan 255.',
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
                    error: 'Masukan dekripsi AES harus berupa heksadesimal valid dengan panjang genap, contoh 4A6F686E.',
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
                    error: 'Masukan dekripsi RSA harus berisi blok cipher numerik dipisahkan spasi.',
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
                error: 'Untuk dekripsi RSA, konten yang didekode harus berupa blok cipher numerik.',
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
                title: 'Sandi Geser Klasik',
                points: [
                    'Setiap huruf digeser dengan kunci numerik yang konstan.',
                    'Keamanan rendah karena hanya ada 25 kunci pergeseran yang berarti.',
                    'Dekripsi cukup menerapkan pergeseran kebalikannya.',
                ],
            };
        case 'vigenere-cipher-lab':
            return {
                title: 'Substitusi Polialfabetik',
                points: [
                    'Huruf kata kunci menentukan pergeseran yang berubah pada setiap posisi.',
                    'Pola kata kunci yang berulang masih dapat membocorkan struktur.',
                    'Dekripsi menggunakan kata kunci yang sama dengan pergeseran berlawanan.',
                ],
            };
        case 'aes-lab':
            return {
                title: 'Sandi Blok Simetris (AES-128)',
                points: [
                    'AES-128 mengenkripsi blok 16-byte menggunakan kunci 128-bit selama 10 putaran.',
                    'Setiap putaran menerapkan SubBytes (lookup S-box), ShiftRows (rotasi byte), MixColumns (perkalian GF), dan AddRoundKey (XOR dengan round key).',
                    'Hanya kunci yang benar dapat membalik semua 10 putaran untuk memulihkan plaintext.',
                ],
            };
        case 'des-lab':
            return {
                title: 'Sandi Blok Feistel',
                points: [
                    'DES mengenkripsi blok 64-bit menggunakan kunci 64-bit selama 16 putaran Feistel.',
                    'Fungsi f memperluas R dari 32→48 bit, melakukan XOR dengan round key, menerapkan 8 S-box, dan mempermutasi.',
                    'Struktur Feistel membuat enkripsi dan dekripsi menggunakan algoritma yang sama dengan round key terbalik.',
                ],
            };
        case 'rsa-lab':
            return {
                title: 'Pertukaran Kunci Asimetris',
                points: [
                    'RSA menggunakan kunci publik (e, n) untuk enkripsi dan kunci privat (d, n) untuk dekripsi.',
                    'Keamanan bergantung pada kesulitan praktis memfaktorkan bilangan besar menjadi prima.',
                    'Pembangkitan kunci menggunakan algoritma Euclidean yang diperluas untuk mencari d di mana e × d ≡ 1 (mod φ(n)).',
                ],
            };
        case 'digital-signature-lab':
            return {
                title: 'Tanda Tangan Digital RSA',
                points: [
                    'Pengirim menghash pesan dengan SHA-256 dan menandatangani digest dengan kunci privatnya.',
                    'Siapa pun dengan kunci publik dapat memverifikasi tanda tangan dan memulihkan digest.',
                    'Jika digest yang dipulihkan cocok dengan hash yang dihitung ulang, pesan bersifat autentik dan tidak diubah.',
                ],
            };
        default:
            return {
                title: 'Alur Tanda Tangan Digital',
                points: [
                    'Pengirim menandatangani digest pesan dengan logika kunci privat.',
                    'Penerima memverifikasi tanda tangan menggunakan logika verifikasi publik.',
                    'Tujuan: autentisitas, integritas, dan non-repudiasi.',
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
            title: 'Tabel Pergeseran Karakter',
            description: 'Amati setiap huruf bergeser dengan offset yang sama.',
            headers: ['Sumber', 'Operasi', 'Hasil'],
            rows: normalized.split('').map((char) => ({
                source: char,
                operation: `geser ${appliedShift >= 0 ? '+' : ''}${appliedShift}`,
                result: shiftCharacter(char, appliedShift),
            })),
        };
    }

    if (slug === 'vigenere-cipher-lab') {
        const text = normalizeLetters(normalizedInput).slice(0, 10);
        const keyword = normalizeLetters(keyInput) || 'KEY';

        return {
            title: 'Peta Pergeseran Berbasis Kata Kunci',
            description:
                'Setiap posisi menggunakan pergeseran berbeda dari urutan kata kunci.',
            headers: ['Sumber', 'Operasi', 'Hasil'],
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
            title: 'Tampilan Pencampuran Byte',
            description:
                'Tampilan XOR byte edukatif untuk menjelaskan pencampuran yang dapat dibalik.',
            headers: ['Sumber', 'Operasi', 'Hasil'],
            rows: bytes.map((byte, index) => {
                const keyByte = keyBytes[index % keyBytes.length];
                const mixed = byte ^ keyByte;

                return {
                    source: `${byte} (0x${byte.toString(16).padStart(2, '0')})`,
                    operation: `Kunci XOR ${keyByte}`,
                    result: `${mixed} (0x${mixed.toString(16).padStart(2, '0')})`,
                };
            }),
        };
    }

    if (slug === 'des-lab') {
        const rounds = Array.from({ length: 16 }, (_, i) => i + 1);

        return {
            title: 'Struktur Putaran Feistel',
            description:
                'Setiap putaran memperluas R, mencampur dengan round key, menerapkan S-box, lalu menukar bagian.',
            headers: ['Putaran', 'Operasi', 'Hasil'],
            rows: rounds.map((round) => ({
                source: `Putaran ${round}`,
                operation: `L${round} = R${round - 1}; R${round} = L${round - 1} XOR f(R${round - 1}, K${round})`,
                result: `K${round} diturunkan dari jadwal kunci`,
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
            title: 'Blok Aritmetika Modular',
            description:
                'Lacak setiap blok saat eksponensiasi modular diterapkan.',
            headers: ['Sumber', 'Operasi', 'Hasil'],
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
        title: 'Lensa Penandatanganan dan Verifikasi',
        description: 'Amati hubungan antara digest dan token tanda tangan.',
        headers: ['Sumber', 'Operasi', 'Hasil'],
        rows: [
            {
                source: normalizedInput.slice(0, 24) || '(kosong)',
                operation: 'Hasilkan digest (SHA-256)',
                result: sha256(normalizedInput).slice(0, 16),
            },
            {
                source: 'Digest + material kunci',
                operation:
                    mode === 'encrypt' ? 'Tandatangani' : 'Verifikasi akhiran yang diharapkan',
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

            return `Langkah ${index + 1}: ${char} -> ${to} (geser ${appliedShift >= 0 ? '+' : ''}${appliedShift})`;
        });

    return {
        outputLabel: mode === 'encrypt' ? 'Ciphertext' : 'Plaintext',
        output: transformed,
        steps: [
            `Normalkan masukan menjadi aliran alfabet huruf besar: ${normalized || '(kosong)'}`,
            `Atur kunci pergeseran = ${safeShift} dan pergeseran yang diterapkan = ${appliedShift}.`,
            ...previewSteps,
            `Gabungkan huruf yang ditransformasi menjadi ${mode === 'encrypt' ? 'ciphertext' : 'plaintext'} akhir.`,
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

            return `Langkah ${index + 1}: teks ${char}, kunci ${keyChar} (${keyShift}) -> ${to}`;
        });

    return {
        outputLabel: mode === 'encrypt' ? 'Ciphertext' : 'Plaintext',
        output: transformed,
        steps: [
            `Normalkan teks: ${normalizedText || '(kosong)'}`,
            `Normalkan kata kunci dan ulang urutannya: ${normalizedKey}`,
            `Terapkan pergeseran ${mode === 'encrypt' ? 'maju' : 'mundur'} berdasarkan setiap huruf kata kunci.`,
            ...previewSteps,
            `Gabungkan setiap karakter yang ditransformasi untuk menghasilkan keluaran akhir.`,
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
            outputLabel: 'Ciphertext (heksadesimal)',
            output: aesBytesToHex(trace.ciphertext),
            steps: [
                'Muat plaintext 128-bit ke dalam matriks state AES.',
                'Ekspansi kunci 128-bit menjadi 11 round key.',
                'AddRoundKey awal.',
                ...Array.from(
                    { length: 9 },
                    (_, index) =>
                        `Putaran ${index + 1}: SubBytes, ShiftRows, MixColumns, AddRoundKey.`,
                ),
                'Putaran akhir 10: SubBytes, ShiftRows, AddRoundKey.',
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
            outputLabel: 'Plaintext (heksadesimal)',
            output: aesBytesToHex(trace.plaintext),
            steps: [
                'Muat ciphertext ke dalam matriks state AES.',
                'Terapkan putaran akhir invers.',
                ...Array.from(
                    { length: 9 },
                    (_, index) =>
                        `Putaran invers ${10 - index}: InvShiftRows, InvSubBytes, AddRoundKey, InvMixColumns.`,
                ),
                `Pulihkan blok plaintext 128-bit asli: ${aesBytesToHex(trace.plaintext)}.`,
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
            outputLabel: 'Ciphertext (heksadesimal)',
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
            steps: ['Ciphertext harus minimal 16 byte (32 karakter heksadesimal) untuk dekripsi blok AES.'],
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
        `Normalkan plaintext menjadi ${trace.plaintext.length} byte.`,
        `Padding ke blok 16-byte menggunakan PKCS#7.`,
        `Ekspansi kunci 16-byte menjadi 11 round key.`,
        `State awal: muat plaintext ke matriks 4×4.`,
        `AddRoundKey awal: XOR state dengan round key 0.`,
    ];

    for (let i = 0; i < 10; i++) {
        if (i < 9) {
            steps.push(
                `Putaran ${i + 1}: SubBytes → ShiftRows → MixColumns → AddRoundKey. ` +
                `Substitusi S-box pada setiap byte, pergeseran baris, pencampuran kolom, XOR kunci.`,
            );
        } else {
            steps.push(
                `Putaran 10: SubBytes → ShiftRows → AddRoundKey (tanpa MixColumns pada putaran akhir).`,
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
        `Uraikan ciphertext heksadesimal menjadi blok 16-byte.`,
        `Mulai dengan AddRoundKey akhir (kunci putaran 10) — tidak ada IP pada AES.`,
        `Putaran 1-9 invers: InvShiftRows, InvSubBytes, InvAddRoundKey, InvMixColumns.`,
        `Putaran 10 invers: InvShiftRows, InvSubBytes, InvAddRoundKey (tanpa InvMixColumns).`,
    ];

    if (validPadding) {
        steps.push(`Hapus padding PKCS#7 (${plainBytes.length} byte plaintext).`);
    } else {
        steps.push(`Catatan: validasi padding dilewati (dekripsi non-standar atau mentah).`);
    }

    steps.push(`Plaintext yang didekripsi: ${aesBytesToHex(plainBytes).toUpperCase()}.`);

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
            outputLabel: 'Ciphertext (heksadesimal)',
            output: bitsToHex(trace.ciphertext).toUpperCase(),
            steps: [
                'Terapkan permutasi awal DES pada blok plaintext 64-bit.',
                'Bagi blok yang sudah dipermutasi menjadi bagian L0 dan R0.',
                ...Array.from(
                    { length: 16 },
                    (_, index) =>
                        `Putaran ${index + 1}: perluas R, XOR dengan round key, lewatkan S-box, permutasi, lalu tukar bagian.`,
                ),
                'Terapkan permutasi akhir untuk menghasilkan blok ciphertext.',
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
            outputLabel: 'Plaintext (heksadesimal)',
            output: bitsToHex(trace.plaintext).toUpperCase(),
            steps: [
                'Terapkan permutasi awal DES pada blok ciphertext.',
                'Gunakan 16 round key dalam urutan terbalik.',
                ...Array.from(
                    { length: 16 },
                    (_, index) =>
                        `Putaran ${index + 1}: alur Feistel terbalik dengan K${16 - index}.`,
                ),
                'Terapkan permutasi akhir untuk memulihkan blok plaintext.',
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
            outputLabel: mode === 'encrypt' ? 'Ciphertext (heksadesimal)' : 'Plaintext',
            output: '',
            steps: [
                'DES memerlukan tepat 16 karakter heksadesimal (64 bit) untuk masukan.',
                'Untuk vektor uji DES standar, lab menampilkan hasil yang tepat.',
            ],
            trace: { des: { plaintext: normalizedText, rounds: [], ciphertext: '' } },
        };
    }

    const ptBits = hexToBits(normalizedText);
    const keyBits = hexToBits(normalizedKey);

    if (mode === 'encrypt') {
        const trace = desEncryptBlock(ptBits, keyBits);
        const steps = [
            `Plaintext 64-bit: ${normalizedText}.`,
            `Kunci 64-bit: ${normalizedKey}.`,
            `Terapkan Permutasi Awal (IP).`,
            `Bagi menjadi bagian L0 dan R0 (masing-masing 32 bit).`,
            ...trace.rounds.map((r) =>
                `Putaran ${r.roundIndex}: perluas R${r.roundIndex - 1}, XOR dengan K${r.roundIndex}, substitusi S-box, permutasi P, tukar bagian.`,
            ),
            `Tukar bagian akhir, terapkan Permutasi Akhir (FP).`,
            `Ciphertext: ${bitsToHex(trace.ciphertext).toUpperCase()}.`,
        ];

        return {
            outputLabel: 'Ciphertext (heksadesimal)',
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
        `Ciphertext 64-bit: ${normalizedText}.`,
        `Terapkan Permutasi Awal (IP).`,
        `Gunakan 16 round key dalam urutan terbalik.`,
        ...trace.rounds.map((r) =>
            `Putaran ${r.roundIndex}: Feistel terbalik dengan K${17 - r.roundIndex}.`,
        ),
        `Tukar bagian, terapkan Permutasi Akhir (FP).`,
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
            `Pembangkitan kunci dengan prima kecil untuk edukasi:`,
            `p = ${keys.p}, q = ${keys.q}`,
            `n = p × q = ${keys.n}`,
            `φ(n) = (p-1)(q-1) = ${keys.phi}`,
            `e = ${keys.e} (dipilih, gcd(e, φ(n)) = 1)`,
            `d = e⁻¹ mod φ(n) = ${keys.d} (melalui Euclidean yang diperluas)`,
            `Kunci publik: (e=${keys.e}, n=${keys.n})`,
            `Kunci privat: (d=${keys.d}, n=${keys.n})`,
            '',
            `Mengenkripsi "${text}" — setiap karakter m → c = m^e mod n:`,
        ];

        for (let i = 0; i < chars.length; i++) {
            const m = BigInt(chars[i].charCodeAt(0));
            // c = m^e mod n using bigint
            const c = rsaModPow(m, keys.e, keys.n);
            encrypted.push(c.toString());

            if (i < 8) {
                steps.push(`Karakter '${chars[i]}' (m=${m.toString()}): c = ${m}^${keys.e} mod ${keys.n} = ${c}`);
            }
        }

        if (chars.length > 8) {
            steps.push(`... dan ${chars.length - 8} karakter lainnya dienkripsi dengan cara yang sama.`);
        }

        steps.push('');
        steps.push(`Blok ciphertext: ${encrypted.join(' ')}`);

        return {
            outputLabel: 'Blok cipher',
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
        `Gunakan kunci privat: d=${keys.d}, n=${keys.n}`,
        '',
        `Mendekripsi — setiap blok cipher c → m = c^d mod n:`,
    ];

    for (let i = 0; i < blocks.length; i++) {
        try {
            const c = BigInt(blocks[i]);
            const m = rsaModPow(c, keys.d, keys.n);
            const code = Number(m);
            const char = String.fromCharCode(code);
            decrypted.push(char);

            if (i < 8) {
                steps.push(`Blok ${c}: m = ${c}^${keys.d} mod ${keys.n} = ${code} ('${char}')`);
            }
        } catch {
            steps.push(`Blok "${blocks[i]}": tidak dapat diuraikan sebagai bilangan bulat`);
            decrypted.push('�');
        }
    }

    if (blocks.length > 8) {
        steps.push(`... dan ${blocks.length - 8} blok lainnya.`);
    }

    steps.push('');
    steps.push(`Teks yang didekripsi: ${decrypted.join('')}`);

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
            outputLabel: 'Token tanda tangan',
            output: sig.signatureHex,
            steps: [
                `Hash pesan dengan SHA-256: ${sig.digestHex.slice(0, 32)}...`,
                `Ambil awalan digest (${sig.digestPrefix.length} karakter heksa): ${sig.digestPrefix}`,
                `Uraikan menjadi bilangan bulat: ${sig.digestInt.toString()}`,
                `Tandatangani dengan kunci privat: ${sig.digestInt.toString()}^${toyKeys.d} mod ${toyKeys.n} = ${sig.signatureInt.toString()}`,
                `Tanda tangan (heksa): ${sig.signatureHex}`,
                `Kirim: pesan + token_tanda_tangan ke penerima.`,
                `Ini menunjukkan: hanya pemegang kunci privat yang dapat menandatangani.`,
            ],
            trace: {
                signature: {
                    digestHex: sig.digestHex,
                    digestPrefix: sig.digestPrefix,
                    signatureInt: sig.signatureInt.toString(),
                    explanationSteps: [
                        `Hash: SHA-256("${text}") = ${sig.digestHex}`,
                        `Awalan digest: ${sig.digestPrefix}`,
                        `Penandatanganan: ${sig.digestInt.toString()}^${toyKeys.d} mod ${toyKeys.n} = ${sig.signatureInt.toString()}`,
                    ],
                },
            },
        };
    }

    // verify mode: user provides signature as hex
    const sigInt = tryParseSignatureHex(text);

    if (sigInt === null) {
        return {
            outputLabel: 'Verifikasi',
            output: 'Tidak dapat menguraikan tanda tangan. Berikan tanda tangan sebagai string heksadesimal.',
            steps: ['Masukkan tanda tangan heksadesimal yang valid (misalnya dari keluaran Tandatangani) untuk verifikasi.'],
        };
    }

    const ver = verifySignature(_key, sigInt, toyKeys);

    // Compute the expected digest hex and prefix from the original message
    const expectedDigestHex = sha256(_key);
    const maxHexChars = toyKeys.n.toString(16).length - 1;
    const numChars = Math.min(4, maxHexChars);
    const expectedDigestPrefix = expectedDigestHex.substring(0, numChars);

    return {
        outputLabel: 'Hasil verifikasi',
        output: ver.isValid
            ? `VALID — digest dipulihkan: ${ver.recoveredDigestInt.toString()}, cocok dengan awalan yang diharapkan.`
            : `TIDAK VALID — digest yang dipulihkan ${ver.recoveredDigestInt.toString()} ≠ awalan digest yang diharapkan.`,
        steps: [
            `Penerima menghash pesan dengan SHA-256.`,
            `Pulihkan digest dari tanda tangan: sig^e mod n = ${sigInt}^${toyKeys.e} mod ${toyKeys.n} = ${ver.recoveredDigestInt.toString()}.`,
            `Bandingkan digest yang dipulihkan dengan awalan digest yang dihitung.`,
            ver.isValid
                ? 'Digest cocok → tanda tangan VALID, pesan autentik.'
                : 'Digest tidak cocok → tanda tangan TIDAK VALID, pesan diubah atau kunci salah.',
            'Ini menunjukkan: siapa pun dengan kunci publik dapat memverifikasi, hanya pemegang kunci privat yang dapat menandatangani.',
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
                outputLabel: 'Hasil',
                output: '',
                steps: ['Algoritma tidak didukung.'],
            };
    }
}

// ── Lab metadata helpers ──

export function keyLabelByLab(slug: string): string {
    switch (slug) {
        case 'caesar-cipher-lab':
            return 'Kunci pergeseran (angka)';
        case 'vigenere-cipher-lab':
            return 'Kata kunci';
        case 'aes-lab':
            return 'Kunci simetris';
        case 'des-lab':
            return 'Kunci DES';
        case 'digital-signature-lab':
            return 'Kunci tanda tangan';
        default:
            return 'Parameter kunci';
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
            return 'Kunci opsional';
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
            ? 'Buat token tanda tangan dari digest pesan.'
            : 'Verifikasi autentisitas dengan menghitung ulang data tanda tangan yang diharapkan.';
    }

    return mode === 'encrypt'
        ? 'Transformasikan plaintext menjadi representasi terlindungi.'
        : 'Balikkan representasi terlindungi kembali menjadi teks yang dapat dibaca.';
}

export function inputLabelByLab(labSlug: string, mode: SimulationMode): string {
    if (labSlug === 'digital-signature-lab') {
        return mode === 'encrypt' ? 'Pesan untuk ditandatangani' : 'Pesan untuk diverifikasi';
    }

    return mode === 'encrypt' ? 'Masukan plaintext' : 'Masukan ciphertext';
}

export function inputPlaceholderByLab(
    labSlug: string,
    mode: SimulationMode,
): string {
    if (labSlug === 'aes-lab' && mode === 'decrypt') {
        return 'Masukkan ciphertext heksadesimal, contoh 4A6F686E...';
    }

    if (labSlug === 'des-lab') {
        return mode === 'encrypt'
            ? 'Masukkan blok plaintext 64-bit sebagai heksadesimal, contoh 0123456789ABCDEF'
            : 'Masukkan blok ciphertext 64-bit sebagai heksadesimal, contoh 85E813540F0AB405';
    }

    if (labSlug === 'rsa-lab' && mode === 'decrypt') {
        return 'Masukkan blok cipher, contoh 3000 28 2726';
    }

    return mode === 'encrypt'
        ? 'Masukkan plaintext untuk dienkripsi...'
        : 'Masukkan ciphertext untuk didekripsi...';
}

export function inputHelperByLab(
    labSlug: string,
    mode: SimulationMode,
): string {
    if (labSlug === 'aes-lab' && mode === 'decrypt') {
        return 'Gunakan hanya karakter heksadesimal (0-9, A-F) dengan jumlah karakter genap.';
    }

    if (labSlug === 'des-lab') {
        return 'DES adalah sandi warisan. Gunakan lab ini untuk visualisasi putaran edukatif, bukan keamanan nyata.';
    }

    if (labSlug === 'rsa-lab' && mode === 'decrypt') {
        return 'Gunakan blok cipher bilangan bulat dipisahkan spasi.';
    }

    return 'Coba ubah satu karakter dan bandingkan perbedaan keluarannya.';
}

export function validationErrorByLab(
    labSlug: string,
    mode: SimulationMode,
    text: string,
    key: string,
): string | null {
    if (text.trim().length === 0) {
        return 'Masukan tidak boleh kosong. Berikan nilai untuk menjalankan simulasi.';
    }

    if (labSlug === 'caesar-cipher-lab') {
        const parsed = Number.parseInt(key, 10);

        if (!Number.isFinite(parsed)) {
            return 'Kunci Caesar harus berupa nilai pergeseran bilangan bulat yang valid.';
        }
    }

    if (labSlug === 'vigenere-cipher-lab') {
        if (normalizeLetters(key).length === 0) {
            return 'Kata kunci Vigenère harus mengandung minimal satu huruf (A-Z).';
        }
    }

    if (labSlug === 'aes-lab' && mode === 'decrypt') {
        const sanitized = text.replace(/\s+/g, '');

        if (!/^[0-9a-fA-F]+$/.test(sanitized) || sanitized.length % 2 !== 0) {
            return 'Masukan dekripsi AES harus berupa heksadesimal valid dengan panjang genap, contoh 4A6F686E.';
        }
    }

    if (labSlug === 'des-lab') {
        const sanitized = text.replace(/\s+/g, '');
        const sanitizedKey = key.replace(/\s+/g, '');

        if (!/^[0-9a-fA-F]+$/.test(sanitized) || sanitized.length !== 16) {
            return 'Masukan DES harus tepat satu blok 64-bit: 16 karakter heksadesimal.';
        }

        if (
            !/^[0-9a-fA-F]+$/.test(sanitizedKey) ||
            sanitizedKey.length !== 16
        ) {
            return 'Kunci DES harus tepat 16 karakter heksadesimal termasuk bit paritas.';
        }
    }

    if (labSlug === 'rsa-lab' && mode === 'decrypt') {
        const trimmed = text.trim();

        if (!/^\d+(\s+\d+)*$/.test(trimmed)) {
            return 'Masukan dekripsi RSA harus berisi blok cipher numerik dipisahkan spasi.';
        }
    }

    return null;
}
