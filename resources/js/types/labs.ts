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

// Extended types for algorithm traces (Glass Box)
export type AesRoundStep = {
    id: string;
    title: string;
    description: string;
    kind: 'state-matrix';
    roundIndex: number;
    stateBefore: string[]; // 16 bytes as hex
    afterSubBytes: string[];
    afterShiftRows: string[];
    afterMixColumns: string[];
    afterAddRoundKey: string[];
};

export type DesRoundStep = {
    id: string;
    title: string;
    description: string;
    kind: 'feistel-round';
    roundIndex: number;
    L: string; // hex
    R: string; // hex
    expandedR: string;
    sboxOutput: string;
    permutedOutput: string;
};

export type Sha256RoundStep = {
    id: string;
    title: string;
    description: string;
    kind: 'sha256-round';
    roundIndex: number;
    a: string;
    b: string;
    c: string;
    d: string;
    e: string;
    f: string;
    g: string;
    h: string;
    W_t: string;
    K_t: string;
};

// Glass Box trace types for SimulationResult
export type AesTrace = {
    plaintext: number[];
    rounds: Array<{
        roundIndex: number;
        stateBefore: string[];
        afterSubBytes: string[];
        afterShiftRows: string[];
        afterMixColumns: string[];
        afterAddRoundKey: string[];
    }>;
    ciphertext: string;
};

export type DesTrace = {
    plaintext: string;
    rounds: Array<{
        roundIndex: number;
        L: string;
        R: string;
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
