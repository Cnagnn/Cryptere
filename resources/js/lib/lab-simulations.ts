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

    if (labSlug === 'des-lab') {
        // DES key is always 8 ASCII characters (64-bit key).
        // DES plaintext is free ASCII text that will be split into 64-bit blocks.
        // DES decrypt expects hex ciphertext input.
        if (mode === 'decrypt') {
            const sanitized = rawInput.replace(/\s+/g, '');

            if (!/^[0-9a-fA-F]*$/.test(sanitized) || sanitized.length % 16 !== 0) {
                return {
                    value: null,
                    error: 'Masukan dekripsi DES harus berupa heksadesimal valid dengan panjang kelipatan 16 karakter (satu blok 64-bit).',
                };
            }

            return { value: sanitized.toUpperCase(), error: null };
        }

        // Encrypt: pass ASCII plaintext through as-is
        return { value: rawInput, error: null };
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

    if (slug === 'des-lab' && mode === 'decrypt') {
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

    if (slug === 'des-lab' && mode === 'encrypt') {
        return 'hex';
    }

    if (slug === 'rsa-lab' && mode === 'encrypt') {
        return 'decimal';
    }

    return 'ascii';
}

export function canFormatOutput(labSlug: string, mode?: SimulationMode): boolean {
    // DES encrypt produces hex output directly — no reformatting needed.
    if (labSlug === 'des-lab' && mode === 'encrypt') {
        return false;
    }

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
                    'Setiap huruf digeser maju sesuai angka kunci. Misal kunci 3: A jadi D, B jadi E.',
                    'Hanya ada 25 kemungkinan kunci, jadi sangat mudah ditebak.',
                    'Untuk membaca kembali, geser huruf mundur dengan angka yang sama.',
                ],
            };
        case 'vigenere-cipher-lab':
            return {
                title: 'Sandi Kata Kunci',
                points: [
                    'Setiap huruf kata kunci menentukan berapa jauh huruf pesan digeser.',
                    'Kata kunci diulang jika lebih pendek dari pesan, jadi pola bisa terlihat.',
                    'Untuk membaca kembali, gunakan kata kunci yang sama dengan geseran kebalikannya.',
                ],
            };
        case 'aes-lab':
            return {
                title: 'Sandi Blok Modern (AES-128)',
                points: [
                    'AES mengacak data dalam potongan 16 karakter, diulang 10 kali dengan operasi campuran.',
                    'Setiap putaran mengganti byte, menggeser baris, mencampur kolom, dan menambahkan kunci.',
                    'Hanya kunci yang benar bisa membalik semua 10 putaran untuk mengembalikan pesan asli.',
                ],
            };
        case 'des-lab':
            return {
                title: 'Sandi Blok Klasik',
                points: [
                    'DES mengacak data dalam potongan 8 karakter, diulang 16 kali dengan kunci yang sama.',
                    'Setiap putaran mengacak lebih dalam menggunakan tabel khusus (S-box) yang sulit dibalik tanpa kunci.',
                    'Proses enkripsi dan dekripsi mirip, hanya urutan kunci yang dibalik.',
                ],
            };
        case 'rsa-lab':
            return {
                title: 'Sandi Kunci Publik',
                points: [
                    'RSA pakai dua kunci: kunci publik untuk mengunci, kunci privat untuk membuka.',
                    'Keamanannya bergantung pada sulitnya memecah bilangan besar menjadi bilangan prima.',
                    'Siapa pun bisa mengunci pesan dengan kunci publik, tapi hanya pemilik kunci privat yang bisa membukanya.',
                ],
            };
        case 'digital-signature-lab':
            return {
                title: 'Tanda Tangan Digital',
                points: [
                    'Pengirim menandatangani pesan dengan kunci privatnya, seperti membubuhkan stempel unik.',
                    'Penerima mengecek tanda tangan dengan kunci publik pengirim untuk memastikan keaslian.',
                    'Jika tanda tangan cocok, pesan terbukti asli dan tidak diubah oleh siapa pun di tengah jalan.',
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

// ── Onboarding analogies ──

export function onboardingByLab(slug: string): string[] {
    switch (slug) {
        case 'caesar-cipher-lab':
            return [
                'Bayangkan huruf-huruf alfabet disusun melingkar. Kunci adalah berapa langkah Anda memutar lingkaran itu.',
                'Geser maju untuk mengunci, geser mundur dengan jumlah yang sama untuk membuka.',
            ];
        case 'vigenere-cipher-lab':
            return [
                'Seperti Caesar, tapi setiap huruf pesan digeser dengan jumlah berbeda sesuai huruf kata kunci.',
                'Kata kunci diulang terus sampai seluruh pesan terproses.',
            ];
        case 'aes-lab':
            return [
                'Bayangkan pesan Anda dipotong jadi potongan kecil 16 karakter, lalu setiap potongan diacak 10 kali.',
                'Kunci yang sama dipakai untuk mengacak dan mengembalikan — seperti kunci gembok yang sama untuk mengunci dan membuka.',
            ];
        case 'des-lab':
            return [
                'Bayangkan pesan Anda dipotong jadi potongan 8 karakter, lalu setiap potongan diacak 16 kali berturut-turut.',
                'Kunci yang sama dipakai untuk mengacak dan mengembalikan — seperti kunci gembok yang sama untuk mengunci dan membuka.',
            ];
        case 'rsa-lab':
            return [
                'Bayangkan sebuah gembok: semua orang bisa mengunci (kunci publik), tapi hanya Anda yang punya kunci untuk membukanya (kunci privat).',
                'Tidak perlu bertukar kunci rahasia sebelumnya — kunci publik boleh dibagikan ke siapa pun.',
            ];
        case 'digital-signature-lab':
            return [
                'Bayangkan tanda tangan di surat: hanya pemiliknya yang bisa membubuhkannya, tapi semua orang bisa memverifikasi keasliannya.',
                'Tanda tangan berubah jika pesan diubah sedikit pun, jadi pemalsuan terdeteksi.',
            ];
        default:
            return [
                'Mulai dengan mengetik pesan dan kunci, lalu amati hasilnya.',
                'Coba ganti kunci dan lihat bagaimana hasilnya berubah.',
            ];
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
                'Tampilan XOR byte untuk menjelaskan pencampuran yang dapat dibalik.',
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
        // Multi-block ECB encryption: split padded plaintext into 16-byte blocks
        const blockCount = Math.ceil(padded.length / 16);
        const ciphertextParts: string[] = [];
        const blockTraces: ReturnType<typeof aesEncryptBlock>[] = [];

        for (let i = 0; i < padded.length; i += 16) {
            const blockBytes = padded.slice(i, i + 16);
            const blockTrace = aesEncryptBlock(blockBytes, keyInput);

            blockTraces.push(blockTrace);
            ciphertextParts.push(aesBytesToHex(blockTrace.ciphertext));
        }

        const ciphertext = ciphertextParts.join('');
        // Use first block's trace for glass box visualization
        const trace = blockTraces[0];
        const steps = buildAesSteps(trace);

        if (blockCount > 1) {
            steps.push(`Enkripsi ${blockCount} blok secara independen (mode ECB).`);
        }

        steps.push(`Ciphertext: ${ciphertext}.`);

        return {
            outputLabel: 'Ciphertext (heksadesimal)',
            output: ciphertext,
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

    // decrypt: text is hex ciphertext — process ALL blocks (ECB mode)
    const hexClean = text.replace(/\s+/g, '').toUpperCase();

    if (hexClean.length < 32 || hexClean.length % 32 !== 0) {
        return {
            outputLabel: 'Plaintext',
            output: '',
            steps: ['Ciphertext harus kelipatan 16 byte (32 karakter heksadesimal) untuk dekripsi AES.'],
            trace: { aes: { plaintext: [], rounds: [], ciphertext: [] } },
        };
    }

    const allPlainBytes: number[] = [];
    const blockTraces: ReturnType<typeof aesDecryptBlock>[] = [];

    for (let i = 0; i < hexClean.length; i += 32) {
        const blockHex = hexClean.slice(i, i + 32);
        const blockBytes = aesHexToBytes(blockHex);
        const blockTrace = aesDecryptBlock(blockBytes, keyInput);

        blockTraces.push(blockTrace);
        allPlainBytes.push(...blockTrace.plaintext);
    }

    // Strip PKCS#7 padding from the last block
    const unpadLen = allPlainBytes[allPlainBytes.length - 1];
    const validPadding =
        unpadLen > 0 &&
        unpadLen <= 16 &&
        allPlainBytes.slice(allPlainBytes.length - unpadLen).every((b) => b === unpadLen);
    const plainBytes = validPadding
        ? allPlainBytes.slice(0, allPlainBytes.length - unpadLen)
        : allPlainBytes;

    // Use first block's trace for glass box visualization
    const firstTrace = blockTraces[0];
    const firstCipherBytes = aesHexToBytes(hexClean.slice(0, 32));
    const steps = buildAesDecryptSteps(firstTrace, plainBytes, validPadding, blockTraces.length);

    return {
        outputLabel: 'Plaintext',
        output: new TextDecoder().decode(Uint8Array.from(plainBytes)),
        steps,
        trace: {
            aes: {
                plaintext: firstTrace.plaintext,
                rounds: firstTrace.rounds.map((r) => ({
                    roundIndex: r.roundIndex,
                    stateBefore: r.stateBefore,
                    afterSubBytes: r.afterSubBytes,
                    afterShiftRows: r.afterShiftRows,
                    afterMixColumns: r.afterMixColumns,
                    afterAddRoundKey: r.afterAddRoundKey,
                    roundKey: r.roundKey,
                })),
                ciphertext: firstCipherBytes,
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

    return steps;
}

function buildAesDecryptSteps(
    trace: ReturnType<typeof aesDecryptBlock>,
    plainBytes: number[],
    validPadding: boolean,
    blockCount: number = 1,
): string[] {
    const steps: string[] = [
        `Uraikan ciphertext heksadesimal menjadi ${blockCount} blok 16-byte.`,
        `Mulai dengan AddRoundKey akhir (kunci putaran 10) — tidak ada IP pada AES.`,
        `Putaran 1-9 invers: InvShiftRows, InvSubBytes, InvAddRoundKey, InvMixColumns.`,
        `Putaran 10 invers: InvShiftRows, InvSubBytes, InvAddRoundKey (tanpa InvMixColumns).`,
    ];

    if (blockCount > 1) {
        steps.push(`Setiap blok didekripsi secara independen (mode ECB).`);
    }

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
    // DES key: auto-pad/truncate to 8 bytes (64-bit), same approach as AES
    const keyInput = Array.from(new TextEncoder().encode(key || 'password')).slice(0, 8);

    while (keyInput.length < 8) {
        keyInput.push(0);
    }

    const keyHex = toHex(keyInput);
    const keyBits = hexToBits(keyHex);

    if (mode === 'encrypt') {
        // Convert ASCII plaintext to bytes, apply PKCS#7 padding to 8-byte blocks
        const plainBytes = Array.from(new TextEncoder().encode(text));
        const padLen = 8 - (plainBytes.length % 8);
        const paddedBytes = [...plainBytes, ...Array(padLen).fill(padLen)];

        // Split into 8-byte (64-bit) blocks and encrypt each (ECB mode)
        const blocks: string[] = [];
        const blockTraces: ReturnType<typeof desEncryptBlock>[] = [];

        for (let i = 0; i < paddedBytes.length; i += 8) {
            const blockBytes = paddedBytes.slice(i, i + 8);
            const blockHex = toHex(blockBytes);
            const blockBits = hexToBits(blockHex);
            const trace = desEncryptBlock(blockBits, keyBits);

            blocks.push(bitsToHex(trace.ciphertext).toUpperCase());
            blockTraces.push(trace);
        }

        const ciphertext = blocks.join('');
        const blockCount = blocks.length;

        const steps = [
            `Plaintext: "${text}" (${plainBytes.length} byte ASCII).`,
            `Kunci: "${key}" → 8 byte → 0x${keyHex.toUpperCase()} (64-bit DES key).`,
            `Padding PKCS#7: tambah ${padLen} byte padding → total ${paddedBytes.length} byte (${blockCount} blok 64-bit).`,
            ...blockTraces.flatMap((trace, blockIdx) =>
                trace.rounds.map((r) =>
                    `Blok ${blockIdx + 1} / Putaran ${r.roundIndex}: perluas R, XOR dengan K${r.roundIndex}, substitusi S-box, permutasi P, tukar bagian.`,
                ),
            ),
            `Semua ${blockCount} blok ciphertext digabung: ${ciphertext}.`,
        ];

        // Use first block's trace for glass box visualization
        const firstTrace = blockTraces[0];

        return {
            outputLabel: 'Ciphertext (heksadesimal)',
            output: ciphertext,
            steps,
            trace: {
                des: {
                    plaintext: toHex(paddedBytes.slice(0, 8)).toUpperCase(),
                    key: keyHex.toUpperCase(),
                    afterIP: firstTrace.afterIP,
                    L0: firstTrace.L0,
                    R0: firstTrace.R0,
                    rounds: firstTrace.rounds.map((r) => ({
                        roundIndex: r.roundIndex,
                        L: r.L,
                        R: r.R,
                        expandedR: r.expandedR,
                        xoredWithKey: r.xoredWithKey,
                        sboxOutput: r.sboxOutput,
                        permutedOutput: r.permutedOutput,
                        newL: r.newL,
                        newR: r.newR,
                        roundKey: r.roundKey,
                    })),
                    ciphertext: blocks[0],
                },
            },
        };
    }

    // Decrypt: hex ciphertext → 64-bit blocks → decrypt each → strip PKCS#7 padding → ASCII
    const ctHex = text.replace(/\s+/g, '').toUpperCase();
    const blockTraces: ReturnType<typeof desDecryptBlock>[] = [];
    const decryptedBytes: number[] = [];

    for (let i = 0; i < ctHex.length; i += 16) {
        const blockHex = ctHex.slice(i, i + 16);
        const blockBits = hexToBits(blockHex);
        const trace = desDecryptBlock(blockBits, keyBits);

        blockTraces.push(trace);
        const plainHex = bitsToHex(trace.plaintext).toUpperCase();

        // Convert hex bytes back to decimal bytes
        for (let j = 0; j < plainHex.length; j += 2) {
            decryptedBytes.push(Number.parseInt(plainHex.slice(j, j + 2), 16));
        }
    }

    // Strip PKCS#7 padding
    const padLen = decryptedBytes[decryptedBytes.length - 1];
    const isValidPadding = padLen >= 1 && padLen <= 8 &&
        decryptedBytes.slice(decryptedBytes.length - padLen).every((b) => b === padLen);
    const unpaddedBytes = isValidPadding
        ? decryptedBytes.slice(0, decryptedBytes.length - padLen)
        : decryptedBytes;

    const plaintext = new TextDecoder().decode(Uint8Array.from(unpaddedBytes));
    const blockCount = blockTraces.length;

    const steps = [
        `Ciphertext: ${ctHex} (${ctHex.length / 2} byte = ${blockCount} blok 64-bit).`,
        `Kunci: "${key}" → 8 byte → 0x${keyHex.toUpperCase()} (64-bit DES key).`,
        `Gunakan 16 round key dalam urutan terbalik untuk tiap blok.`,
        ...blockTraces.flatMap((trace, blockIdx) =>
            trace.rounds.map((r) =>
                `Blok ${blockIdx + 1} / Putaran ${r.roundIndex}: Feistel terbalik dengan K${17 - r.roundIndex}.`,
            ),
        ),
        `Strip padding PKCS#7 (${isValidPadding ? padLen : 0} byte) → plaintext: "${plaintext}".`,
    ];

    // Use first block's trace for glass box visualization
    const firstTrace = blockTraces[0];

    return {
        outputLabel: 'Plaintext (ASCII)',
        output: plaintext,
        steps,
        trace: {
            des: {
                plaintext: bitsToHex(firstTrace.plaintext).toUpperCase(),
                key: keyHex.toUpperCase(),
                afterIP: firstTrace.afterIP,
                L0: firstTrace.L0,
                R0: firstTrace.R0,
                rounds: firstTrace.rounds.map((r) => ({
                    roundIndex: r.roundIndex,
                    L: r.L,
                    R: r.R,
                    expandedR: r.expandedR,
                    xoredWithKey: r.xoredWithKey,
                    sboxOutput: r.sboxOutput,
                    permutedOutput: r.permutedOutput,
                    newL: r.newL,
                    newR: r.newR,
                    roundKey: r.roundKey,
                })),
                ciphertext: ctHex.slice(0, 16),
            },
        },
    };
}

function runRsaConcept(mode: SimulationMode, text: string): SimulationResult {
    // Production-grade primes: two ~128-bit Mersenne-type primes give n ~256-bit,
    // large enough to encrypt multi-byte blocks and sign full SHA-256 digests.
    const p = 170141183460469231731687303715884105757n;
    const q = 170141183460469231731687303715884105773n;
    const e = 65537n;
    const keys = generateRsaKeys(p, q, e);

    if (mode === 'encrypt') {
        // Block-based encryption: convert text to bytes, split into blocks
        // that fit within n. n is ~256-bit (~32 bytes), use 28-byte blocks
        // to stay safely below n.
        const textBytes = Array.from(new TextEncoder().encode(text));
        const blockSize = 28;
        const encrypted: string[] = [];
        const steps: string[] = [
            `Pembangkitan kunci RSA:`,
            `p = ${keys.p}`,
            `q = ${keys.q}`,
            `n = p × q = ${keys.n}`,
            `φ(n) = (p-1)(q-1) = ${keys.phi}`,
            `e = ${keys.e} (gcd(e, φ(n)) = 1)`,
            `d = e⁻¹ mod φ(n) = ${keys.d} (melalui Euclidean yang diperluas)`,
            `Kunci publik: (e=${keys.e}, n=${keys.n})`,
            `Kunci privat: (d=${keys.d}, n=${keys.n})`,
            '',
            `Mengenkripsi "${text}" (${textBytes.length} byte) — dibagi menjadi blok ${blockSize} byte:`,
        ];

        const blockCount = Math.ceil(textBytes.length / blockSize) || 1;

        for (let bi = 0; bi < blockCount; bi++) {
            const blockBytes = textBytes.slice(bi * blockSize, (bi + 1) * blockSize);
            // Convert block bytes to a single bigint (big-endian)
            let m = 0n;

            for (const b of blockBytes) {
                m = (m << 8n) | BigInt(b);
            }

            const c = rsaModPow(m, keys.e, keys.n);
            encrypted.push(c.toString());

            if (bi < 4) {
                steps.push(
                    `Blok ${bi + 1} (${blockBytes.length} byte, m=${m.toString()}): ` +
                    `c = m^${keys.e} mod n = ${c}`,
                );
            }
        }

        if (blockCount > 4) {
            steps.push(`... dan ${blockCount - 4} blok lainnya dienkripsi dengan cara yang sama.`);
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
                        `p = ${keys.p}`,
                        `q = ${keys.q}`,
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
    const decryptedBytes: number[] = [];
    const steps: string[] = [
        `Gunakan kunci privat: d=${keys.d}, n=${keys.n}`,
        '',
        `Mendekripsi — setiap blok cipher c → m = c^d mod n:`,
    ];

    for (let i = 0; i < blocks.length; i++) {
        try {
            const c = BigInt(blocks[i]);
            const m = rsaModPow(c, keys.d, keys.n);

            // Convert bigint back to bytes (big-endian)
            const blockBytes: number[] = [];
            let tmp = m;

            if (tmp === 0n) {
                blockBytes.push(0);
            } else {
                while (tmp > 0n) {
                    blockBytes.unshift(Number(tmp & 0xffn));
                    tmp >>= 8n;
                }
            }

            decryptedBytes.push(...blockBytes);

            if (i < 4) {
                steps.push(`Blok ${i + 1}: m = c^${keys.d} mod n = ${m} (${blockBytes.length} byte)`);
            }
        } catch {
            steps.push(`Blok "${blocks[i]}": tidak dapat diuraikan sebagai bilangan bulat`);
        }
    }

    if (blocks.length > 4) {
        steps.push(`... dan ${blocks.length - 4} blok lainnya.`);
    }

    const plaintext = new TextDecoder().decode(Uint8Array.from(decryptedBytes));
    steps.push('');
    steps.push(`Teks yang didekripsi: ${plaintext}`);

    return {
        outputLabel: 'Plaintext',
        output: plaintext,
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
                    `p = ${keys.p}`,
                    `q = ${keys.q}`,
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
    // Production-grade RSA keys: same as RSA lab, large enough to sign full SHA-256 digest
    const toyKeys = generateRsaKeys(
        170141183460469231731687303715884105757n,
        170141183460469231731687303715884105773n,
        65537n,
    );

    if (mode === 'encrypt') {
        const sig = signMessage(text, toyKeys);

        return {
            outputLabel: 'Token tanda tangan',
            output: sig.signatureHex,
            steps: [
                `Hash pesan dengan SHA-256: ${sig.digestHex}`,
                `Konversi digest 256-bit menjadi bilangan bulat: ${sig.digestInt}`,
                `Tandatangani dengan kunci privat: digest^d mod n = ${sig.signatureInt}`,
                `Tanda tangan (heksa): ${sig.signatureHex}`,
                `Kirim: pesan + token_tanda_tangan ke penerima.`,
                `Hanya pemegang kunci privat yang dapat menandatangani.`,
            ],
            trace: {
                signature: {
                    digestHex: sig.digestHex,
                    digestPrefix: sig.digestHex,
                    signatureInt: sig.signatureInt.toString(),
                    explanationSteps: [
                        `Hash: SHA-256("${text}") = ${sig.digestHex}`,
                        `Digest sebagai bilangan bulat: ${sig.digestInt}`,
                        `Penandatanganan: digest^d mod n = ${sig.signatureInt}`,
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

    // Compute the expected digest hex from the original message
    const expectedDigestHex = sha256(_key);

    return {
        outputLabel: 'Hasil verifikasi',
        output: ver.isValid
            ? `VALID — digest dipulihkan: ${ver.recoveredDigestInt}, cocok dengan digest yang diharapkan.`
            : `TIDAK VALID — digest yang dipulihkan ${ver.recoveredDigestInt} ≠ digest yang diharapkan.`,
        steps: [
            `Penerima menghash pesan dengan SHA-256.`,
            `Pulihkan digest dari tanda tangan: sig^e mod n.`,
            `Bandingkan digest yang dipulihkan dengan digest yang dihitung.`,
            ver.isValid
                ? 'Digest cocok → tanda tangan VALID, pesan autentik.'
                : 'Digest tidak cocok → tanda tangan TIDAK VALID, pesan diubah atau kunci salah.',
            'Siapa pun dengan kunci publik dapat memverifikasi, hanya pemegang kunci privat yang dapat menandatangani.',
        ],
        trace: {
            signature: {
                digestHex: expectedDigestHex,
                digestPrefix: expectedDigestHex,
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

export function keyLabelByLab(slug: string, mode?: SimulationMode): string {
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
            return mode === 'decrypt'
                ? 'Pesan asli (untuk perbandingan)'
                : 'Kunci tanda tangan';
        default:
            return 'Parameter kunci';
    }
}

export function keyPlaceholderByLab(slug: string, mode?: SimulationMode): string {
    switch (slug) {
        case 'caesar-cipher-lab':
            return '3';
        case 'vigenere-cipher-lab':
            return 'CRYPTER';
        case 'aes-lab':
            return 'CRYPTER-LAB-KEY';
        case 'des-lab':
            return 'password';
        case 'digital-signature-lab':
            return mode === 'decrypt'
                ? 'Tempelkan pesan asli yang ditandatangani'
                : 'private-crypt-key';
        default:
            return 'Kunci opsional';
    }
}

export function defaultTextByLab(slug: string): string {
    switch (slug) {
        case 'rsa-lab':
            return 'HELLO';
        case 'des-lab':
            return 'Halo DES';
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
        return mode === 'encrypt' ? 'Pesan untuk ditandatangani' : 'Tanda tangan (heksadesimal)';
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
            ? 'Masukkan plaintext ASCII, contoh: Halo DES'
            : 'Masukkan ciphertext heksadesimal, contoh 85E813540F0AB405';
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
        return 'Gunakan huruf A-F dan angka 0-9 dengan jumlah karakter genap.';
    }

    if (labSlug === 'des-lab') {
        return mode === 'encrypt'
            ? 'Ketik teks apa pun, sistem otomatis memprosesnya menjadi ciphertext.'
            : 'Tempelkan hasil ciphertext (huruf A-F dan angka) untuk mengembalikan teks aslinya.';
    }

    if (labSlug === 'rsa-lab' && mode === 'decrypt') {
        return 'Masukkan angka-angka yang dipisahkan spasi (hasil dari enkripsi sebelumnya).';
    }

    return 'Coba ubah satu huruf dan lihat bagaimana hasilnya berubah.';
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
        if (mode === 'decrypt') {
            // Decrypt expects hex ciphertext (multiple of 16 hex chars = 64-bit blocks)
            const sanitized = text.replace(/\s+/g, '');

            if (!/^[0-9a-fA-F]+$/.test(sanitized) || sanitized.length % 16 !== 0 || sanitized.length === 0) {
                return 'Masukan dekripsi DES harus berupa heksadesimal valid dengan panjang kelipatan 16 karakter (satu blok 64-bit).';
            }
        } else {
            // Encrypt: plaintext must be non-empty ASCII
            if (text.trim().length === 0) {
                return 'Plaintext tidak boleh kosong. Masukkan teks ASCII untuk dienkripsi.';
            }
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
