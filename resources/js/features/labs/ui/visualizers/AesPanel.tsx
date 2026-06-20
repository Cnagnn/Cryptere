/**
 * AesPanel — AES round-by-round visualization
 *
 * Shows the 4×4 state matrix evolution across AES rounds,
 * with SubBytes, ShiftRows, MixColumns, AddRoundKey details.
 */

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AesTrace } from '@/types/labs';

interface AesPanelProps {
    trace: AesTrace;
    steps: string[];
    learnerMode: 'pemula' | 'mahir';
    activeStep: number;
    onStepChange?: (n: number) => void;
}

function hexValue(value: number): string {
    return value.toString(16).padStart(2, '0').toUpperCase();
}

function StateMatrix({
    state,
    highlightIndices = [],
    title,
}: {
    state: number[];
    highlightIndices?: number[];
    title?: string;
}) {
    // Column-major: state[0-3]=col0, state[4-7]=col1, etc.
    const cols = [
        state.slice(0, 4),
        state.slice(4, 8),
        state.slice(8, 12),
        state.slice(12, 16),
    ];

    return (
        <div className="space-y-1">
            {title && (
                <h5 className="text-xs font-medium text-muted-foreground">{title}</h5>
            )}
            <div className="grid grid-cols-4 gap-0.5">
                {cols.map((col, colIdx) =>
                    col.map((byte, rowIdx) => {
                        const idx = colIdx * 4 + rowIdx;
                        const isHighlight = highlightIndices.includes(idx);

                        return (
                            <div
                                key={`${colIdx}-${rowIdx}`}
                                className={cn(
                                    'flex flex-col items-center justify-center rounded border p-1 text-[10px]',
                                    'min-w-10 min-h-10',
                                    isHighlight
                                        ? 'border-red-400 bg-red-50 dark:bg-red-950/50 ring-1 ring-red-400/50'
                                        : 'border-muted bg-muted/20',
                                )}
                            >
                                <span className="font-mono font-semibold text-foreground text-xs">
                                    {byte}
                                </span>
                                <span className="font-mono text-[8px] text-muted-foreground">
                                    0x{hexValue(byte)}
                                </span>
                            </div>
                        );
                    }),
                )}
            </div>
            <div className="grid grid-cols-4 gap-0.5">
                {[0, 1, 2, 3].map((col) => (
                    <div key={col} className="flex justify-center text-[8px] text-muted-foreground">
                        col {col}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AesPanel({
    trace,
    learnerMode,
    activeStep,
    onStepChange,
}: AesPanelProps) {
    const rounds = trace.rounds;
    const totalRounds = rounds.length;

    // Map active step to a round index
    // Step 0: initial state
    // Steps 1-10: rounds 1-10
    // Steps 11+: final state
    let currentRoundIndex = -1;
    let phase: 'initial' | 'round' | 'final' = 'initial';

    if (activeStep === 0) {
        phase = 'initial';
    } else if (activeStep <= totalRounds) {
        phase = 'round';
        currentRoundIndex = activeStep - 1;
    } else {
        phase = 'final';
    }

    const currentRound = currentRoundIndex >= 0 ? rounds[currentRoundIndex] : null;

    return (
        <div className="space-y-3 overflow-auto">
            {/* Overview */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                        AES-128
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        {totalRounds} rounds
                    </span>
                </div>
                {currentRound && (
                    <Badge variant="secondary" className="text-xs">
                        Round {currentRound.roundIndex + 1}
                    </Badge>
                )}
            </div>

            {/* State matrix visualization */}
            {phase === 'initial' && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Initial State Matrix</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StateMatrix state={trace.plaintext} title="Plaintext (before AddRoundKey)" />
                        {learnerMode === 'mahir' && (
                            <p className="mt-2 text-xs text-muted-foreground italic">
                                16 bytes loaded column-major into a 4×4 matrix.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {phase === 'round' && currentRound && (
                <div className="space-y-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                Round {currentRound.roundIndex + 1} — State Evolution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <StateMatrix
                                state={currentRound.stateBefore}
                                title="Before Round"
                            />

                            <div className="text-center text-xs text-muted-foreground">↓</div>

                            <StateMatrix
                                state={currentRound.afterSubBytes}
                                title="After SubBytes (S-box)"
                                highlightIndices={[]}
                            />

                            <div className="text-center text-xs text-muted-foreground">↓</div>

                            <StateMatrix
                                state={currentRound.afterShiftRows}
                                title="After ShiftRows"
                            />

                            {currentRound.roundIndex < 9 && (
                                <>
                                    <div className="text-center text-xs text-muted-foreground">↓</div>
                                    <StateMatrix
                                        state={currentRound.afterMixColumns}
                                        title="After MixColumns (GF(2^8) × 4)"
                                    />
                                </>
                            )}

                            <div className="text-center text-xs text-muted-foreground">↓</div>

                            <StateMatrix
                                state={currentRound.afterAddRoundKey}
                                title={
                                    currentRound.roundIndex < 9
                                        ? 'After AddRoundKey (round key mixed)'
                                        : 'After AddRoundKey (final round — no MixColumns)'
                                }
                            />
                        </CardContent>
                    </Card>

                    {/* Operation summary for mahir */}
                    {learnerMode === 'mahir' && (
                        <Card className="border-blue-200 dark:border-blue-800">
                            <CardContent className="p-3 space-y-1">
                                <p className="text-xs font-medium">Round Operations:</p>
                                <ul className="text-xs text-muted-foreground space-y-0.5">
                                    <li>• SubBytes: Each byte replaced via S-box (non-linear substitution)</li>
                                    <li>• ShiftRows: Rows rotated left (row 0: 0, row 1: 1, row 2: 2, row 3: 3)</li>
                                    {currentRound.roundIndex < 9 && (
                                        <li>• MixColumns: Each column multiplied in GF(2^8) (column mixing)</li>
                                    )}
                                    <li>• AddRoundKey: XOR with round key (key-dependent mixing)</li>
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Round navigation dots */}
                    <div className="flex justify-center gap-1 flex-wrap">
                        {rounds.map((r, i) => (
                            <button
                                key={r.roundIndex}
                                onClick={() => onStepChange?.(i + 1)}
                                className={cn(
                                    'size-2 rounded-full text-[8px] flex items-center justify-center transition-colors',
                                    i === currentRoundIndex
                                        ? 'bg-primary'
                                        : 'bg-muted hover:bg-muted-foreground/30',
                                )}
                                title={`Round ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {phase === 'final' && (
                <Card className="border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Ciphertext (Final State)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StateMatrix state={trace.ciphertext} title="After all rounds" />
                        <div className="mt-2 rounded bg-green-50 dark:bg-green-950/30 p-2 text-xs">
                            <span className="text-muted-foreground">Hex: </span>
                            <span className="font-mono font-medium">
                                {trace.ciphertext.map(hexValue).join('')}
                            </span>
                        </div>
                        {learnerMode === 'mahir' && (
                            <p className="mt-2 text-xs text-muted-foreground italic">
                                AES decryption reverses all 10 rounds using inverse operations
                                (InvShiftRows, InvSubBytes, InvAddRoundKey, InvMixColumns).
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
