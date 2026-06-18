/**
 * Glass-Box Lab — Codec Layer
 *
 * Parser/renderer untuk 8 format I/O. Pure functions, deterministic.
 * Round-trip guarantee: bytes → render → parse → bytes untuk semua format.
 */

import type { ParsedLabInput, RenderedLabOutput, LabFormat } from './types';

// ── Parser ──────────────────────────────────────────────────────────────────

export function parseLabInput(
    raw: string,
    format: LabFormat,
): ParsedLabInput {
    switch (format) {
        case 'text':
        case 'ascii':
            return parseAscii(raw);
        case 'utf8':
            return parseUtf8(raw);
        case 'hex':
            return parseHex(raw);
        case 'binary':
            return parseBinary(raw);
        case 'base64':
            return parseBase64(raw);
        case 'decimal-bytes':
            return parseDecimalBytes(raw);
        case 'integer-blocks':
            return parseIntegerBlocks(raw);
    }
}

// ── Render ──────────────────────────────────────────────────────────────────

export function renderLabOutput(
    data: { bytes?: number[]; text?: string; integers?: number[] },
    format: LabFormat,
): RenderedLabOutput {
    switch (format) {
        case 'text':
            return { value: data.text ?? '', error: null };
        case 'ascii':
        case 'utf8':
            return { value: renderUtf8(data.bytes ?? []), error: null };
        case 'hex':
            return { value: renderHex(data.bytes ?? []), error: null };
        case 'binary':
            return { value: renderBinary(data.bytes ?? []), error: null };
        case 'base64':
            return renderBase64(data.bytes ?? []);
        case 'decimal-bytes':
            return { value: renderDecimalBytes(data.bytes ?? []), error: null };
        case 'integer-blocks':
            return { value: (data.integers ?? []).join(' '), error: null };
    }
}

// ── Format labels ───────────────────────────────────────────────────────────

export function formatLabel(value: LabFormat): string {
    return LAB_FORMATS.find((f) => f.value === value)?.label ?? value;
}

export const LAB_FORMATS: { value: LabFormat; label: string }[] = [
    { value: 'text', label: 'Teks' },
    { value: 'ascii', label: 'ASCII' },
    { value: 'utf8', label: 'UTF-8' },
    { value: 'hex', label: 'Heksadesimal' },
    { value: 'binary', label: 'Biner' },
    { value: 'base64', label: 'Base64' },
    { value: 'decimal-bytes', label: 'Byte Desimal' },
    { value: 'integer-blocks', label: 'Blok Integer' },
];

// ── Internal parser helpers ─────────────────────────────────────────────────

function parseAscii(raw: string): ParsedLabInput {
    const bytes: number[] = [];

    for (const char of raw) {
        const code = char.charCodeAt(0);

        if (code > 127) {
            return { bytes: [], error: 'Karakter non-ASCII terdeteksi.' };
        }

        bytes.push(code);
    }

    return { bytes, text: raw, error: null };
}

function parseUtf8(raw: string): ParsedLabInput {
    const encoded = new TextEncoder().encode(raw);

    return { bytes: Array.from(encoded), text: raw, error: null };
}

function parseHex(raw: string): ParsedLabInput {
    const sanitized = raw.replace(/\s+/g, '');

    if (!/^[0-9a-fA-F]*$/.test(sanitized)) {
        return { bytes: [], error: 'Input heksadesimal hanya boleh berisi 0-9, A-F, a-f.' };
    }

    if (sanitized.length % 2 !== 0) {
        return { bytes: [], error: 'Panjang heksadesimal harus genap (per pasangan byte).' };
    }

    const bytes: number[] = [];

    for (let i = 0; i < sanitized.length; i += 2) {
        bytes.push(Number.parseInt(sanitized.substring(i, i + 2), 16));
    }

    return { bytes, text: raw, error: null };
}

function parseBinary(raw: string): ParsedLabInput {
    const chunks = raw.trim().split(/\s+/).filter(Boolean);

    if (chunks.length === 0) {
        return { bytes: [], error: 'Input biner tidak boleh kosong.' };
    }

    const bytes: number[] = [];

    for (const chunk of chunks) {
        if (!/^[01]{8}$/.test(chunk)) {
            return { bytes: [], error: 'Input biner harus berupa grup 8-bit (contoh: 01000001).' };
        }

        bytes.push(Number.parseInt(chunk, 2));
    }

    return { bytes, text: raw, error: null };
}

function parseBase64(raw: string): ParsedLabInput {
    const normalized = raw.replace(/\s+/g, '');

    try {
        const binary = atob(normalized);
        const bytes = Array.from(binary, (char) => char.charCodeAt(0));

        return { bytes, text: raw, error: null };
    } catch {
        return { bytes: [], error: 'Input Base64 tidak valid. Periksa padding dan karakter.' };
    }
}

function parseDecimalBytes(raw: string): ParsedLabInput {
    const chunks = raw.trim().split(/\s+/).filter(Boolean);

    if (chunks.length === 0) {
        return { bytes: [], error: 'Input tidak boleh kosong.' };
    }

    const bytes: number[] = [];

    for (const chunk of chunks) {
        if (!/^\d+$/.test(chunk)) {
            return { bytes: [], error: 'Input harus berupa bilangan bulat positif.' };
        }

        const value = Number.parseInt(chunk, 10);

        if (value < 0 || value > 255) {
            return { bytes: [], error: 'Nilai byte harus antara 0 dan 255.' };
        }

        bytes.push(value);
    }

    return { bytes, text: raw, error: null };
}

function parseIntegerBlocks(raw: string): ParsedLabInput {
    const chunks = raw.trim().split(/\s+/).filter(Boolean);

    if (chunks.length === 0) {
        return { bytes: [], text: raw, integers: [], error: null };
    }

    const integers: number[] = [];

    for (const chunk of chunks) {
        if (!/^\d+$/.test(chunk)) {
            return { bytes: [], integers: [], error: 'Blok integer hanya boleh berisi angka.' };
        }

        integers.push(Number.parseInt(chunk, 10));
    }

    return { bytes: [], text: raw, integers, error: null };
}

// ── Internal render helpers ─────────────────────────────────────────────────

function renderUtf8(bytes: number[]): string {
    return new TextDecoder().decode(Uint8Array.from(bytes));
}

function renderHex(bytes: number[]): string {
    return bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ').toUpperCase();
}

function renderBinary(bytes: number[]): string {
    return bytes.map((b) => b.toString(2).padStart(8, '0')).join(' ');
}

function renderDecimalBytes(bytes: number[]): string {
    return bytes.map(String).join(' ');
}

function renderBase64(bytes: number[]): RenderedLabOutput {
    const binary = String.fromCharCode(...bytes);

    try {
        return { value: btoa(binary), error: null };
    } catch {
        return { value: '', error: 'Gagal mengkodekan ke Base64.' };
    }
}
