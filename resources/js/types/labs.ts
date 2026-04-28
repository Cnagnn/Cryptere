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
