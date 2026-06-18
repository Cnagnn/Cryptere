/**
 * Glass-Box Lab — Structured Types
 *
 * Setiap lab kriptografi menghasilkan jejak (trace) layer-by-layer yang
 * bisa dirender UI sebagai visualisasi bertahap. Tipe ini adalah kontrak
 * antara algorithm modules dan UI renderer.
 */

// ── Format I/O ──

export type LabFormat =
    | 'text'
    | 'ascii'
    | 'utf8'
    | 'hex'
    | 'binary'
    | 'base64'
    | 'decimal-bytes'
    | 'integer-blocks';

export type ParsedLabInput = {
    bytes: number[];
    text?: string;
    integers?: number[];
    error: string | null;
};

export type RenderedLabOutput = {
    value: string;
    error: string | null;
};

// ── Step visualisation ──

export type LabStepKind =
    | 'narrative'
    | 'state-matrix'
    | 'feistel-round'
    | 'sha-round'
    | 'modpow'
    | 'keygen'
    | 'shift-table'
    | 'avalanche'
    | 'brute-force';

export type LabStep = {
    id: string;
    title: string;
    description?: string;
    kind: LabStepKind;
    matrix?: string[][];
    halves?: { left: string; right: string };
    workingVars?: Record<string, string>;
    expression?: string;
    highlight?: number[];
    extra?: Record<string, unknown>;
};

// ── Trace & result ──

export type LabOutput = {
    label: string;
    bytes: number[];
    text?: string;
    preferredFormat: LabFormat;
};

export type LabSimulationResult = {
    output: LabOutput;
    steps: LabStep[];
    warnings: string[];
};

// ── Misc ──

export type LabMode = 'encrypt' | 'decrypt' | 'sign' | 'verify';

export type GlossaryEntry = {
    key: string;
    term: string;
    definition: string;
    example?: string;
};

export type LearnerMode = 'pemula' | 'mahir';
