import { Head, Link } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, ArrowRight, Pause, Play, RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as labsIndex, show as labsShow } from '@/routes/labs';

type Lab = {
    slug: string;
    title: string;
    summary: string;
    group: string;
};

type Props = {
    lab: Lab;
};

type SimulationMode = 'encrypt' | 'decrypt';
type FormatValue = 'ascii' | 'hex' | 'binary' | 'base64' | 'decimal';

type SimulationResult = {
    outputLabel: string;
    output: string;
    steps: string[];
};

type ConceptLens = {
    title: string;
    points: string[];
};

type VisualizationRow = {
    source: string;
    operation: string;
    result: string;
};

type VisualizationLens = {
    title: string;
    description: string;
    headers: [string, string, string];
    rows: VisualizationRow[];
};

const formatOptions: Array<{ value: FormatValue; label: string }> = [
    { value: 'ascii', label: 'ASCII / UTF-8' },
    { value: 'hex', label: 'Hex' },
    { value: 'binary', label: 'Binary' },
    { value: 'base64', label: 'Base64' },
    { value: 'decimal', label: 'Decimal Bytes' },
];

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

function normalizeInputToText(rawInput: string, format: FormatValue): { value: string | null; error: string | null } {
    if (format === 'ascii') {
        return { value: rawInput, error: null };
    }

    if (format === 'hex') {
        const sanitized = rawInput.replace(/\s+/g, '');

        if (!/^[0-9a-fA-F]*$/.test(sanitized) || sanitized.length % 2 !== 0) {
            return { value: null, error: 'Hex input must contain only 0-9, A-F with even length.' };
        }

        const bytes = sanitized.match(/.{1,2}/g)?.map((chunk) => Number.parseInt(chunk, 16)) ?? [];

        return { value: new TextDecoder().decode(Uint8Array.from(bytes)), error: null };
    }

    if (format === 'binary') {
        const chunks = rawInput.trim().split(/\s+/).filter(Boolean);

        if (chunks.length === 0 || chunks.some((chunk) => !/^[01]{8}$/.test(chunk))) {
            return { value: null, error: 'Binary input must be 8-bit groups separated by spaces.' };
        }

        const bytes = chunks.map((chunk) => Number.parseInt(chunk, 2));

        return { value: new TextDecoder().decode(Uint8Array.from(bytes)), error: null };
    }

    if (format === 'base64') {
        const bytes = decodeBase64Safe(rawInput);

        if (bytes === null) {
            return { value: null, error: 'Base64 input is invalid. Check padding and characters.' };
        }

        return { value: new TextDecoder().decode(Uint8Array.from(bytes)), error: null };
    }

    const chunks = rawInput.trim().split(/\s+/).filter(Boolean);

    if (chunks.length === 0 || chunks.some((chunk) => !/^\d+$/.test(chunk))) {
        return { value: null, error: 'Decimal bytes must be integer groups separated by spaces.' };
    }

    const bytes = chunks.map((chunk) => Number.parseInt(chunk, 10));

    if (bytes.some((value) => value < 0 || value > 255)) {
        return { value: null, error: 'Decimal byte values must be between 0 and 255.' };
    }

    return { value: new TextDecoder().decode(Uint8Array.from(bytes)), error: null };
}

function normalizeInputForSimulation(
    labSlug: string,
    mode: SimulationMode,
    rawInput: string,
    inputFormat: FormatValue,
): { value: string | null; error: string | null } {
    if (labSlug === 'aes-lab' && mode === 'decrypt') {
        if (inputFormat === 'hex') {
            const sanitized = rawInput.replace(/\s+/g, '');

            if (!/^[0-9a-fA-F]*$/.test(sanitized) || sanitized.length % 2 !== 0) {
                return { value: null, error: 'AES decrypt input must be valid hex with even length, for example 4A6F686E.' };
            }

            return { value: sanitized, error: null };
        }

        const normalized = normalizeInputToText(rawInput, inputFormat);

        if (normalized.value === null) {
            return normalized;
        }

        return { value: toHex(Array.from(new TextEncoder().encode(normalized.value))), error: null };
    }

    if (labSlug === 'rsa-lab' && mode === 'decrypt') {
        if (inputFormat === 'decimal') {
            const trimmed = rawInput.trim();

            if (!/^\d+(\s+\d+)*$/.test(trimmed)) {
                return { value: null, error: 'RSA decrypt input must contain numeric cipher blocks separated by spaces.' };
            }

            return { value: trimmed, error: null };
        }

        const normalized = normalizeInputToText(rawInput, inputFormat);

        if (normalized.value === null) {
            return normalized;
        }

        const trimmed = normalized.value.trim();

        if (!/^\d+(\s+\d+)*$/.test(trimmed)) {
            return { value: null, error: 'For RSA decrypt, decoded content must resolve to numeric cipher blocks.' };
        }

        return { value: trimmed, error: null };
    }

    return normalizeInputToText(rawInput, inputFormat);
}

function formatOutputValue(value: string, format: FormatValue): { value: string; error: string | null } {
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

function recommendedInputFormatByLab(slug: string, mode: SimulationMode): FormatValue {
    if (slug === 'aes-lab' && mode === 'decrypt') {
        return 'hex';
    }

    if (slug === 'rsa-lab' && mode === 'decrypt') {
        return 'decimal';
    }

    return 'ascii';
}

function recommendedOutputFormatByLab(slug: string, mode: SimulationMode): FormatValue {
    if (slug === 'aes-lab' && mode === 'encrypt') {
        return 'hex';
    }

    if (slug === 'rsa-lab' && mode === 'encrypt') {
        return 'decimal';
    }

    if (slug === 'sha-lab') {
        return 'hex';
    }

    return 'ascii';
}

function canFormatOutput(labSlug: string): boolean {
    return !['rsa-lab', 'sha-lab', 'digital-signature-lab'].includes(labSlug);
}

function conceptLensByLab(slug: string, mode: SimulationMode): ConceptLens {
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
        case 'sha-lab':
            return {
                title: mode === 'encrypt' ? 'One-Way Hashing' : 'Integrity Verification',
                points: [
                    'Hashing maps variable-length input to fixed-length digest.',
                    'Digest comparison is used for integrity, not decryption.',
                    'Small input changes should produce large digest differences.',
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

function visualizationLensByLab(
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
            description: 'Each position uses a different shift from the keyword sequence.',
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
        const bytes = Array.from(new TextEncoder().encode(normalizedInput)).slice(0, 10);
        const keyBytes = Array.from(new TextEncoder().encode(keyInput || 'CRYPTER-LAB-KEY'));

        return {
            title: 'Byte Mixing View',
            description: 'Educational byte XOR view to explain reversible mixing.',
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
        const parts = mode === 'encrypt'
            ? Array.from(normalizedInput).slice(0, 8).map((char) => char.charCodeAt(0))
            : normalizedInput.trim().split(/\s+/).filter(Boolean).slice(0, 8).map((value) => Number.parseInt(value, 10));

        return {
            title: 'Modular Arithmetic Blocks',
            description: 'Track each block as modular exponentiation is applied.',
            headers: ['Source', 'Operation', 'Result'],
            rows: parts.map((value) => ({
                source: String(value),
                operation: mode === 'encrypt' ? 'c = m^e mod n' : 'm = c^d mod n',
                result: String(mode === 'encrypt' ? modPow(value, 17, 61 * 53) : modPow(value, 2753, 61 * 53)),
            })),
        };
    }

    if (slug === 'sha-lab') {
        return {
            title: 'Digest Evolution',
            description: 'Preview digest chunks to illustrate deterministic one-way output.',
            headers: ['Source', 'Operation', 'Result'],
            rows: [
                {
                    source: normalizedInput.slice(0, 20) || '(empty)',
                    operation: 'Pseudo SHA compression',
                    result: rawResult.output.slice(0, 16),
                },
                {
                    source: `${normalizedInput.slice(0, 19)}*`,
                    operation: 'Single character change',
                    result: pseudoSha256(`${normalizedInput.slice(0, 19)}*`).slice(0, 16),
                },
            ],
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
                operation: mode === 'encrypt' ? 'Sign' : 'Verify expected suffix',
                result: rawResult.output.slice(0, 24),
            },
        ],
    };
}

function formatLabel(value: FormatValue): string {
    return formatOptions.find((option) => option.value === value)?.label ?? value;
}

function normalizeLetters(input: string): string {
    return input.toUpperCase().replace(/[^A-Z]/g, '');
}

function shiftCharacter(char: string, shift: number): string {
    const base = 'A'.charCodeAt(0);
    const code = char.charCodeAt(0) - base;
    const shifted = ((code + shift) % 26 + 26) % 26;

    return String.fromCharCode(base + shifted);
}

function runCaesar(mode: SimulationMode, text: string, rawKey: string): SimulationResult {
    const normalized = normalizeLetters(text);
    const shift = Number.parseInt(rawKey, 10);
    const safeShift = Number.isFinite(shift) ? shift : 3;
    const appliedShift = mode === 'encrypt' ? safeShift : -safeShift;

    const transformed = normalized
        .split('')
        .map((char) => shiftCharacter(char, appliedShift))
        .join('');

    const previewSteps = normalized.slice(0, 12).split('').map((char, index) => {
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

function runVigenere(mode: SimulationMode, text: string, keyword: string): SimulationResult {
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

    const previewSteps = normalizedText.slice(0, 12).split('').map((char, index) => {
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

function toHex(bytes: number[]): string {
    return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function runAesConcept(mode: SimulationMode, text: string, key: string): SimulationResult {
    const inputBytes = Array.from(new TextEncoder().encode(text));
    const keyBytes = Array.from(new TextEncoder().encode(key || 'CRYPTER-LAB-KEY'));

    if (mode === 'encrypt') {
        const mixed = inputBytes.map((value, index) => value ^ keyBytes[index % keyBytes.length]);
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
    const cipherBytes = chunks.map((chunk) => Number.parseInt(chunk, 16)).filter((value) => Number.isFinite(value));
    const plainBytes = cipherBytes.map((value, index) => value ^ keyBytes[index % keyBytes.length]);
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
                ...chars.slice(0, 8).map((char, index) => `Step ${index + 1}: m=${char.charCodeAt(0)}, c=m^e mod n => ${encrypted[index]}`),
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
    const output = decrypted.map((value) => String.fromCharCode(value)).join('');

    return {
        outputLabel: 'Plaintext',
        output,
        steps: [
            `Use private exponent d=${d} with modulus n=${n}.`,
            ...blocks.slice(0, 8).map((block, index) => `Step ${index + 1}: m=c^d mod n => ${decrypted[index]}`),
            'Convert decoded integer codes back to characters.',
        ],
    };
}

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

function runShaLab(mode: SimulationMode, text: string): SimulationResult {
    const digest = pseudoSha256(text);

    if (mode === 'encrypt') {
        return {
            outputLabel: 'Digest',
            output: digest,
            steps: [
                'Absorb message bytes into compression state.',
                'Mix internal state repeatedly to maximize diffusion.',
                'Emit fixed-length digest for integrity comparison.',
                'Change one character to observe avalanche effect in the digest.',
            ],
        };
    }

    return {
        outputLabel: 'Verification note',
        output: 'Hash functions are one-way. Use digest comparison instead of decryption.',
        steps: [
            'SHA is not reversible by design.',
            `Compute digest for received message: ${digest}`,
            'Compare with trusted digest to verify integrity.',
            'If digests differ, the message was modified.',
        ],
    };
}

function runSignatureLab(mode: SimulationMode, text: string, key: string): SimulationResult {
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

    const expectedSuffix = pseudoSha256(`${normalizedKey}:${digest}`).slice(0, 24);

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

function runSimulation(labSlug: string, mode: SimulationMode, text: string, key: string): SimulationResult {
    switch (labSlug) {
        case 'caesar-cipher-lab':
            return runCaesar(mode, text, key);
        case 'vigenere-cipher-lab':
            return runVigenere(mode, text, key);
        case 'aes-lab':
            return runAesConcept(mode, text, key);
        case 'rsa-lab':
            return runRsaConcept(mode, text);
        case 'sha-lab':
            return runShaLab(mode, text);
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

function keyLabelByLab(slug: string): string {
    switch (slug) {
        case 'caesar-cipher-lab':
            return 'Shift key (number)';
        case 'vigenere-cipher-lab':
            return 'Keyword';
        case 'aes-lab':
            return 'Symmetric key';
        case 'digital-signature-lab':
            return 'Signing key';
        default:
            return 'Key parameter';
    }
}

function keyPlaceholderByLab(slug: string): string {
    switch (slug) {
        case 'caesar-cipher-lab':
            return '3';
        case 'vigenere-cipher-lab':
            return 'CRYPTER';
        case 'aes-lab':
            return 'CRYPTER-LAB-KEY';
        case 'digital-signature-lab':
            return 'private-crypt-key';
        default:
            return 'Optional key';
    }
}

function defaultTextByLab(slug: string): string {
    switch (slug) {
        case 'rsa-lab':
            return 'HELLO';
        case 'sha-lab':
            return 'Integrity is everything.';
        default:
            return 'CRYPTER LAB';
    }
}

function modeDescription(labSlug: string, mode: SimulationMode): string {
    if (labSlug === 'sha-lab' && mode === 'decrypt') {
        return 'SHA is one-way; this tab explains verification flow instead of decryption.';
    }

    if (labSlug === 'digital-signature-lab') {
        return mode === 'encrypt'
            ? 'Create signature tokens from message digests.'
            : 'Verify authenticity by recomputing expected signature data.';
    }

    return mode === 'encrypt'
        ? 'Transform plaintext into protected representation.'
        : 'Reverse protected representation back into readable text.';
}

function inputLabelByLab(labSlug: string, mode: SimulationMode): string {
    if (labSlug === 'sha-lab') {
        return mode === 'encrypt' ? 'Message input' : 'Message to verify';
    }

    if (labSlug === 'digital-signature-lab') {
        return mode === 'encrypt' ? 'Message to sign' : 'Message to verify';
    }

    return mode === 'encrypt' ? 'Plain input' : 'Cipher input';
}

function inputPlaceholderByLab(labSlug: string, mode: SimulationMode): string {
    if (labSlug === 'aes-lab' && mode === 'decrypt') {
        return 'Enter hex ciphertext, for example 4A6F686E...';
    }

    if (labSlug === 'rsa-lab' && mode === 'decrypt') {
        return 'Enter cipher blocks, for example 3000 28 2726';
    }

    if (labSlug === 'sha-lab') {
        return mode === 'encrypt' ? 'Enter message to hash...' : 'Enter message to verify against digest...';
    }

    return mode === 'encrypt' ? 'Enter plaintext to encrypt...' : 'Enter ciphertext to decrypt...';
}

function inputHelperByLab(labSlug: string, mode: SimulationMode): string {
    if (labSlug === 'aes-lab' && mode === 'decrypt') {
        return 'Use only hexadecimal characters (0-9, A-F) with an even number of characters.';
    }

    if (labSlug === 'rsa-lab' && mode === 'decrypt') {
        return 'Use integer cipher blocks separated by spaces.';
    }

    if (labSlug === 'sha-lab') {
        return mode === 'encrypt'
            ? 'SHA produces a one-way digest for integrity checks.'
            : 'Verification recomputes digest from message and compares with trusted digest.';
    }

    return 'Try changing a single character and compare output differences.';
}

function validationErrorByLab(labSlug: string, mode: SimulationMode, text: string, key: string): string | null {
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

    if (labSlug === 'rsa-lab' && mode === 'decrypt') {
        const trimmed = text.trim();

        if (!/^\d+(\s+\d+)*$/.test(trimmed)) {
            return 'RSA decrypt input must contain numeric cipher blocks separated by spaces.';
        }
    }

    return null;
}

export default function LabsShow({ lab }: Props) {
    const [mode, setMode] = useState<SimulationMode>('encrypt');
    const [inputText, setInputText] = useState(defaultTextByLab(lab.slug));
    const [keyInput, setKeyInput] = useState(keyPlaceholderByLab(lab.slug));
    const [inputFormat, setInputFormat] = useState<FormatValue>('ascii');
    const [outputFormat, setOutputFormat] = useState<FormatValue>('ascii');
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [isWalkthroughPlaying, setIsWalkthroughPlaying] = useState(false);

    const normalizedInput = useMemo(
        () => normalizeInputForSimulation(lab.slug, mode, inputText, inputFormat),
        [inputFormat, inputText, lab.slug, mode],
    );

    const validationError = useMemo(
        () => {
            if (normalizedInput.error !== null) {
                return normalizedInput.error;
            }

            if (normalizedInput.value === null) {
                return 'Input could not be normalized for this algorithm mode.';
            }

            return validationErrorByLab(lab.slug, mode, normalizedInput.value, keyInput);
        },
        [keyInput, lab.slug, mode, normalizedInput.error, normalizedInput.value],
    );

    const rawResult = useMemo(
        () => {
            if (validationError !== null) {
                return {
                    outputLabel: 'Validation required',
                    output: 'Fix the input format to see simulation output.',
                    steps: [validationError],
                } as SimulationResult;
            }

            return runSimulation(lab.slug, mode, normalizedInput.value ?? '', keyInput);
        },
        [keyInput, lab.slug, mode, normalizedInput.value, validationError],
    );

    const outputPresentation = useMemo(() => {
        if (!canFormatOutput(lab.slug)) {
            return {
                value: rawResult.output,
                error: 'This output is already in a domain-specific format and is shown as-is.',
            };
        }

        return formatOutputValue(rawResult.output, outputFormat);
    }, [lab.slug, outputFormat, rawResult.output]);

    const showKeyInput = !['rsa-lab', 'sha-lab'].includes(lab.slug);
    const recommendedInputFormat = recommendedInputFormatByLab(lab.slug, mode);
    const recommendedOutputFormat = recommendedOutputFormatByLab(lab.slug, mode);
    const conceptLens = conceptLensByLab(lab.slug, mode);
    const visualizationLens = visualizationLensByLab(lab.slug, mode, normalizedInput.value ?? '', keyInput, rawResult);

    const safeActiveStepIndex = Math.min(activeStepIndex, Math.max(0, rawResult.steps.length - 1));

    useEffect(() => {
        if (!isWalkthroughPlaying || rawResult.steps.length <= 1) {
            return;
        }

        const intervalId = setInterval(() => {
            setActiveStepIndex((currentIndex) => {
                const lastStepIndex = Math.max(0, rawResult.steps.length - 1);

                if (currentIndex >= lastStepIndex) {
                    setIsWalkthroughPlaying(false);

                    return currentIndex;
                }

                return currentIndex + 1;
            });
        }, 1100);

        return () => {
            clearInterval(intervalId);
        };
    }, [isWalkthroughPlaying, rawResult.steps.length]);

    return (
        <>
            <Head title={`${lab.title} Lab`} />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-2">
                        <Button variant="ghost" size="sm" asChild className="-ml-2">
                            <Link href={labsIndex()} prefetch>
                                <ArrowLeft className="size-4" />
                                Back to catalog
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-semibold tracking-tight">{lab.title} Simulation Lab</h1>
                        <p className="max-w-3xl text-sm text-muted-foreground">{lab.summary}</p>
                    </div>
                </div>

                <section className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="flex flex-col gap-4">
                        <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="text-base">Input Playground</CardTitle>
                            <CardDescription>
                                Switch between encrypt and decrypt flows, adjust input, then inspect each generated step.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <Tabs value={mode} onValueChange={(value) => setMode(value as SimulationMode)}>
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="encrypt">Encrypt Flow</TabsTrigger>
                                    <TabsTrigger value="decrypt">{lab.slug === 'sha-lab' ? 'Verify Flow' : 'Decrypt Flow'}</TabsTrigger>
                                </TabsList>
                                <TabsContent value="encrypt" className="pt-3 text-sm text-muted-foreground">
                                    {modeDescription(lab.slug, 'encrypt')}
                                </TabsContent>
                                <TabsContent value="decrypt" className="pt-3 text-sm text-muted-foreground">
                                    {modeDescription(lab.slug, 'decrypt')}
                                </TabsContent>
                            </Tabs>

                            <div className="flex flex-col gap-2">
                                <Label htmlFor="lab-input">{inputLabelByLab(lab.slug, mode)}</Label>
                                <Textarea
                                    id="lab-input"
                                    value={inputText}
                                    onChange={(event) => setInputText(event.target.value)}
                                    placeholder={inputPlaceholderByLab(lab.slug, mode)}
                                    className="min-h-28"
                                />
                                <p className="text-sm text-muted-foreground">{inputHelperByLab(lab.slug, mode)}</p>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="min-w-0 flex flex-col gap-2">
                                    <Label>Input format</Label>
                                    <Select value={inputFormat} onValueChange={(value) => setInputFormat(value as FormatValue)}>
                                        <SelectTrigger className="w-full min-w-0">
                                            <SelectValue placeholder="Select input format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formatOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        {formatLabel(recommendedInputFormat)} (recommended)
                                    </p>
                                </div>

                                <div className="min-w-0 flex flex-col gap-2">
                                    <Label>Output format</Label>
                                    <Select value={outputFormat} onValueChange={(value) => setOutputFormat(value as FormatValue)}>
                                        <SelectTrigger className="w-full min-w-0">
                                            <SelectValue placeholder="Select output format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formatOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        {formatLabel(recommendedOutputFormat)} (recommended)
                                    </p>
                                </div>
                            </div>

                            {showKeyInput ? (
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="lab-key">{keyLabelByLab(lab.slug)}</Label>
                                    <Input
                                        id="lab-key"
                                        value={keyInput}
                                        onChange={(event) => setKeyInput(event.target.value)}
                                        placeholder={keyPlaceholderByLab(lab.slug)}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Keep key consistent between encrypt and decrypt flows to compare reversible behavior.
                                    </p>
                                </div>
                            ) : null}

                            {validationError ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="size-4" />
                                    <AlertTitle>Invalid simulation input</AlertTitle>
                                    <AlertDescription>{validationError}</AlertDescription>
                                </Alert>
                            ) : null}

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setMode((currentMode) => (currentMode === 'encrypt' ? 'decrypt' : 'encrypt'));
                                    }}
                                >
                                    <RefreshCcw className="size-4" />
                                    Flip Mode
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setInputText(defaultTextByLab(lab.slug));
                                        setKeyInput(keyPlaceholderByLab(lab.slug));
                                        setInputFormat('ascii');
                                        setOutputFormat('ascii');
                                        setMode('encrypt');
                                    }}
                                >
                                    Reset Example
                                </Button>
                            </div>
                        </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Live Visualization</CardTitle>
                                <CardDescription>{visualizationLens.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <div className="rounded-md border bg-muted/10 p-2 text-sm font-medium text-muted-foreground">
                                    {visualizationLens.title}
                                </div>
                                <div className="grid grid-cols-3 rounded-md border bg-muted/10 p-2 text-sm font-medium text-muted-foreground">
                                    <p>{visualizationLens.headers[0]}</p>
                                    <p>{visualizationLens.headers[1]}</p>
                                    <p>{visualizationLens.headers[2]}</p>
                                </div>

                                {visualizationLens.rows.length > 0 ? visualizationLens.rows.map((row, index) => (
                                    <div
                                        key={`${lab.slug}-visual-row-${index}-${safeActiveStepIndex}`}
                                        className={cn(
                                            'grid grid-cols-3 gap-2 rounded-md border p-2 text-sm leading-relaxed',
                                            'animate-in fade-in-0 slide-in-from-bottom-1 duration-200',
                                            'transition-all duration-200 ease-out hover:bg-muted/30',
                                            index === safeActiveStepIndex ? 'bg-primary/10 border-primary/30 shadow-sm' : 'bg-muted/20',
                                        )}
                                        style={{ animationDelay: `${Math.min(index * 35, 220)}ms` }}
                                    >
                                        <p className="break-all">{row.source}</p>
                                        <p className="break-all text-muted-foreground">{row.operation}</p>
                                        <p className="break-all">{row.result}</p>
                                    </div>
                                )) : (
                                    <p className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                                        Enter valid input to render visualization.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Output</CardTitle>
                                <CardDescription>
                                    {rawResult.outputLabel}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border bg-muted/30 p-3 font-mono text-sm break-all">
                                    {outputPresentation.value || '(empty output)'}
                                </div>
                                {outputPresentation.error ? (
                                    <p className="mt-2 text-sm text-muted-foreground">{outputPresentation.error}</p>
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Step-by-Step Breakdown</CardTitle>
                                <CardDescription>
                                    Select a step to focus the explanation and follow the full transformation path.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={rawResult.steps.length <= 1}
                                        onClick={() => {
                                            if (safeActiveStepIndex >= rawResult.steps.length - 1) {
                                                setActiveStepIndex(0);
                                            }

                                            setIsWalkthroughPlaying((current) => !current);
                                        }}
                                    >
                                        {isWalkthroughPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                                        {isWalkthroughPlaying ? 'Pause walkthrough' : 'Play walkthrough'}
                                    </Button>

                                    <p className="self-center text-sm text-muted-foreground">
                                        Auto-step every 1.1s for guided walkthrough mode.
                                    </p>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {rawResult.steps.map((_, index) => (
                                        <Button
                                            key={`${lab.slug}-step-button-${index}`}
                                            type="button"
                                            variant={index === safeActiveStepIndex ? 'secondary' : 'outline'}
                                            className={cn(
                                                'justify-start transition-all duration-200 ease-out',
                                                index === safeActiveStepIndex
                                                    ? 'border-primary/40 shadow-sm scale-[1.01]'
                                                    : 'opacity-90 hover:opacity-100',
                                            )}
                                            onClick={() => {
                                                setIsWalkthroughPlaying(false);
                                                setActiveStepIndex(index);
                                            }}
                                        >
                                            Step {index + 1}
                                        </Button>
                                    ))}
                                </div>

                                {rawResult.steps.length > 0 ? (
                                    <div
                                        key={`${lab.slug}-active-step-${safeActiveStepIndex}`}
                                        className="animate-in fade-in-0 slide-in-from-bottom-1 duration-200 rounded-md border bg-muted/20 p-3"
                                    >
                                        <p className="text-sm font-medium text-muted-foreground">Active step</p>
                                        <p className="mt-1 text-sm leading-relaxed">{rawResult.steps[safeActiveStepIndex]}</p>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Concept Lens</CardTitle>
                                <CardDescription>{conceptLens.title}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                {conceptLens.points.map((point, index) => (
                                    <div key={`${lab.slug}-concept-${index}`} className="rounded-md border bg-muted/20 p-3 text-sm leading-relaxed">
                                        {point}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Explore Other Labs</CardTitle>
                                <CardDescription>
                                    Move between algorithm labs to compare how each encryption and decryption flow behaves.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-2 sm:grid-cols-2">
                                {[
                                    { slug: 'caesar-cipher-lab', title: 'Caesar' },
                                    { slug: 'vigenere-cipher-lab', title: 'Vigenere' },
                                    { slug: 'aes-lab', title: 'AES' },
                                    { slug: 'rsa-lab', title: 'RSA' },
                                    { slug: 'sha-lab', title: 'SHA' },
                                    { slug: 'digital-signature-lab', title: 'Digital Signature' },
                                ].map((item) => (
                                    item.slug === lab.slug ? (
                                        <Button key={item.slug} type="button" variant="secondary" disabled className="justify-between">
                                            {item.title}
                                            <ArrowRight className="size-4" />
                                        </Button>
                                    ) : (
                                        <Button key={item.slug} asChild variant="outline" className="justify-between">
                                            <Link href={labsShow({ lab: item.slug })} prefetch>
                                                {item.title}
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </Button>
                                    )
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </div>
        </>
    );
}

LabsShow.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: dashboard(),
        },
        {
            title: 'Labs',
            href: labsIndex(),
        },
    ],
};
