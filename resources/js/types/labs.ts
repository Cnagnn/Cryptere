// ── Lab Show Page Types ──

export type Lab = {
    slug: string;
    title: string;
    summary: string;
    group: string;
};

export type LabShowProps = {
    lab: Lab;
};

export type SimulationMode = 'encrypt' | 'decrypt';

export type FormatValue = 'ascii' | 'hex' | 'binary' | 'base64' | 'decimal';

export type SimulationResult = {
    outputLabel: string;
    output: string;
    steps: string[];
    trace?: LabSimulationTrace;
};

export type ConceptLens = {
    title: string;
    points: string[];
};

export type VisualizationRow = {
    source: string;
    operation: string;
    result: string;
};

export type VisualizationLens = {
    title: string;
    description: string;
    headers: [string, string, string];
    rows: VisualizationRow[];
};

// Glass Box trace types for SimulationResult
// All byte/bit arrays stay as number[] — conversion to display strings
// happens at the visualizer panel level only.
export type AesTrace = {
    plaintext: number[];
    rounds: Array<{
        roundIndex: number;
        stateBefore: number[];
        afterSubBytes: number[];
        afterShiftRows: number[];
        afterMixColumns: number[];
        afterAddRoundKey: number[];
        roundKey?: number[];
    }>;
    ciphertext: number[];
};

export type DesTrace = {
    plaintext: string;
    key: string;
    afterIP: number[];
    L0: number[];
    R0: number[];
    rounds: Array<{
        roundIndex: number;
        L: number[];
        R: number[];
        expandedR: number[];
        xoredWithKey: number[];
        sboxOutput: number[];
        permutedOutput: number[];
        newL: number[];
        newR: number[];
        roundKey: number[];
    }>;
    ciphertext: string;
};

export type LabSimulationTrace = {
    aes?: AesTrace;
    des?: DesTrace;
    rsa?: RsaKeyGenTraceData;
    signature?: RsaSignatureTraceData;
};

export type RsaKeyGenTraceData = {
    p: string;
    q: string;
    n: string;
    phi: string;
    e: string;
    d: string;
    keyGenSteps: string[];
};

export type RsaSignatureTraceData = {
    digestHex: string;
    digestPrefix: string;
    signatureInt?: string;
    isValid?: boolean;
    explanationSteps: string[];
};
