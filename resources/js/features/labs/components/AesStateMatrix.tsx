/**
 * AES State Matrix Visualization
 *
 * Displays the 4x4 AES state matrix in column-major order with
 * byte values, hex, and binary representations.
 */

import { cn } from '@/lib/utils';

interface AesStateMatrixProps {
    state: number[];
    highlightBytes?: number[];
    title?: string;
}

export default function AesStateMatrix({
    state,
    highlightBytes = [],
    title = 'AES State Matrix (4×4)',
}: AesStateMatrixProps) {
    // Build 4x4 grid (column-major: state[0-3]=col0, state[4-7]=col1, etc.)
    const cols = [
        state.slice(0, 4),
        state.slice(4, 8),
        state.slice(8, 12),
        state.slice(12, 16),
    ];

    return (
        <div className="space-y-2">
            {title && <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>}

            <div className="grid grid-cols-4 gap-1">
                {cols.map((col, colIdx) =>
                    col.map((byte, rowIdx) => {
                        const idx = colIdx * 4 + rowIdx;
                        const isHighlight = highlightBytes.includes(idx);
                        const hex = byte.toString(16).padStart(2, '0').toUpperCase();
                        const binary = byte.toString(2).padStart(8, '0');

                        return (
                            <div
                                key={`${colIdx}-${rowIdx}`}
                                className={cn(
                                    'flex flex-col items-center justify-center rounded border p-1.5 text-xs',
                                    'min-w-14 min-h-14',
                                    isHighlight
                                        ? 'border-red-400 bg-red-50 dark:bg-red-950/50 ring-2 ring-red-400/50'
                                        : 'border-muted bg-muted/30',
                                )}
                            >
                                <span className="font-mono font-semibold text-foreground">
                                    {byte}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                    0x{hex}
                                </span>
                                <span className="font-mono text-[9px] text-muted-foreground/70">
                                    {binary}
                                </span>
                            </div>
                        );
                    }),
                )}
            </div>

            {/* Column labels */}
            <div className="grid grid-cols-4 gap-1">
                {[0, 1, 2, 3].map((col) => (
                    <div
                        key={col}
                        className="flex justify-center text-[10px] text-muted-foreground font-medium"
                    >
                        Col {col}
                    </div>
                ))}
            </div>
        </div>
    );
}
