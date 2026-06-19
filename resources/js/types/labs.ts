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
