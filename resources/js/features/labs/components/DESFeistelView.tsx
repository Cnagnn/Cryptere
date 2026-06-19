/**
 * DES Feistel Network Visualization
 *
 * Displays the Feistel structure with L, R halves, F-function,
 * and round key for DES rounds.
 */

import { cn } from '@/lib/utils';

interface DESFeistelViewProps {
    L: number[];
    R: number[];
    expandedR?: number[];
    sboxOutput?: number[];
    roundKey?: number[];
    roundIndex?: number;
    title?: string;
}

function BitCell({
    bit,
    highlighted = false,
}: {
    bit: number;
    highlighted?: boolean;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center justify-center w-4 h-4 text-[9px] font-mono rounded-sm',
                highlighted
                    ? 'bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                    : 'bg-muted/50 text-muted-foreground',
            )}
        >
            {bit}
        </span>
    );
}

function BitGroup({
    bits,
    label,
    highlightIndices = [],
}: {
    bits: number[];
    label?: string;
    highlightIndices?: number[];
}) {
    return (
        <div className="space-y-1">
            {label && (
                <span className="text-[10px] text-muted-foreground font-medium">
                    {label}
                </span>
            )}
            <div className="flex flex-wrap gap-0.5">
                {bits.map((bit, idx) => (
                    <BitCell
                        key={idx}
                        bit={bit}
                        highlighted={highlightIndices.includes(idx)}
                    />
                ))}
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">
                {bits.length} bits
            </span>
        </div>
    );
}

function HexDisplay({
    bits,
    label,
}: {
    bits: number[];
    label?: string;
}) {
    // Convert bits to hex
    const hexChars: string[] = [];

    for (let i = 0; i < bits.length; i += 4) {
        const nibble = bits.slice(i, i + 4);

        if (nibble.length === 4) {
            const value =
                (nibble[0] << 3) |
                (nibble[1] << 2) |
                (nibble[2] << 1) |
                nibble[3];
            hexChars.push(value.toString(16).toUpperCase());
        }
    }

    return (
        <div className="space-y-1">
            {label && (
                <span className="text-[10px] text-muted-foreground font-medium">
                    {label}
                </span>
            )}
            <span className="font-mono text-sm text-foreground">
                0x{hexChars.join('')}
            </span>
        </div>
    );
}

export default function DESFeistelView({
    L,
    R,
    expandedR,
    sboxOutput,
    roundKey,
    roundIndex,
    title = 'DES Feistel Round',
}: DESFeistelViewProps) {
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                {title && (
                    <h4 className="text-sm font-medium text-muted-foreground">
                        {title}
                    </h4>
                )}
                {roundIndex !== undefined && (
                    <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        Round {roundIndex}
                    </span>
                )}
            </div>

            {/* Main Feistel structure */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
                {/* L half */}
                <div className="shrink-0">
                    <div className="text-center mb-2">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            L
                        </span>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                        <BitGroup bits={L} label="32 bits" />
                        <HexDisplay bits={L} label="= " />
                    </div>
                </div>

                {/* Arrow to F-function */}
                <div className="flex flex-col items-center gap-1">
                    <svg
                        className="w-6 h-6 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                    </svg>
                    <span className="text-[9px] text-muted-foreground">
                        F(R, K)
                    </span>
                </div>

                {/* F-function box */}
                <div className="shrink-0">
                    <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 border border-orange-200 dark:border-orange-800 space-y-3">
                        {/* R input */}
                        <BitGroup bits={R} label="R (32 bits)" />

                        {/* Expansion R → 48 bits */}
                        {expandedR && (
                            <div className="border-t border-dashed border-orange-200 dark:border-orange-800 pt-2">
                                <BitGroup
                                    bits={expandedR}
                                    label="E(R) = 48 bits"
                                />
                            </div>
                        )}

                        {/* XOR with round key */}
                        {roundKey && (
                            <div className="border-t border-dashed border-orange-200 dark:border-orange-800 pt-2">
                                <BitGroup bits={roundKey} label="K (48 bits)" />
                            </div>
                        )}

                        {/* S-box output */}
                        {sboxOutput && (
                            <div className="border-t border-dashed border-orange-200 dark:border-orange-800 pt-2">
                                <BitGroup
                                    bits={sboxOutput}
                                    label="S-box (32 bits)"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-1">
                    <svg
                        className="w-6 h-6 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                    </svg>
                    <span className="text-[9px] text-muted-foreground">
                        L⊕F(R,K)
                    </span>
                </div>

                {/* R half */}
                <div className="shrink-0">
                    <div className="text-center mb-2">
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            R<sub>new</sub>
                        </span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                        <BitGroup bits={R} label="= L (32 bits)" />
                    </div>
                </div>
            </div>

            {/* Swap indicator */}
            <div className="text-center text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted">
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                    </svg>
                    Swap L and R for next round
                </span>
            </div>

            {/* L → R_new equation */}
            <div className="text-center">
                <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                    R<sub>new</sub> = L ⊕ F(R, K)
                </span>
            </div>
        </div>
    );
}
