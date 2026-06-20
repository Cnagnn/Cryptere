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
                        Kol {col}
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
                        {totalRounds} putaran
                    </span>
                </div>
                {currentRound && (
                    <Badge variant="secondary" className="text-xs">
                        Putaran {currentRound.roundIndex + 1}
                    </Badge>
                )}
            </div>

            {/* State matrix visualization */}
            {phase === 'initial' && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Matriks State Awal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StateMatrix state={trace.plaintext} title="Plaintext (sebelum AddRoundKey)" />
                        {learnerMode === 'mahir' && (
                            <p className="mt-2 text-xs text-muted-foreground italic">
                                16 byte dimuat secara kolom-utama ke matriks 4×4.
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
                                Putaran {currentRound.roundIndex + 1} — Evolusi State
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <StateMatrix
                                state={currentRound.stateBefore}
                                title="Sebelum Putaran"
                            />

                            <div className="text-center text-xs text-muted-foreground">↓</div>

                            <StateMatrix
                                state={currentRound.afterSubBytes}
                                title="Setelah SubBytes (S-box)"
                                highlightIndices={[]}
                            />

                            <div className="text-center text-xs text-muted-foreground">↓</div>

                            <StateMatrix
                                state={currentRound.afterShiftRows}
                                title="Setelah ShiftRows"
                            />

                            {currentRound.roundIndex < 9 && (
                                <>
                                    <div className="text-center text-xs text-muted-foreground">↓</div>
                                    <StateMatrix
                                        state={currentRound.afterMixColumns}
                                        title="Setelah MixColumns (GF(2^8) × 4)"
                                    />
                                </>
                            )}

                            <div className="text-center text-xs text-muted-foreground">↓</div>

                            <StateMatrix
                                state={currentRound.afterAddRoundKey}
                                title={
                                    currentRound.roundIndex < 9
                                        ? 'Setelah AddRoundKey (round key dicampur)'
                                        : 'Setelah AddRoundKey (putaran akhir — tanpa MixColumns)'
                                }
                            />
                        </CardContent>
                    </Card>

                    {/* Operation summary for mahir */}
                    {learnerMode === 'mahir' && (
                        <Card className="border-blue-200 dark:border-blue-800">
                            <CardContent className="p-3 space-y-1">
                                <p className="text-xs font-medium">Operasi Putaran:</p>
                                <ul className="text-xs text-muted-foreground space-y-0.5">
                                    <li>• SubBytes: Setiap byte diganti melalui S-box (substitusi non-linear)</li>
                                    <li>• ShiftRows: Baris dirotasi ke kiri (baris 0: 0, baris 1: 1, baris 2: 2, baris 3: 3)</li>
                                    {currentRound.roundIndex < 9 && (
                                        <li>• MixColumns: Setiap kolom dikalikan dalam GF(2^8) (pencampuran kolom)</li>
                                    )}
                                    <li>• AddRoundKey: XOR dengan round key (pencampuran bergantung kunci)</li>
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
                                title={`Putaran ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {phase === 'final' && (
                <Card className="border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Ciphertext (State Akhir)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StateMatrix state={trace.ciphertext} title="Setelah semua putaran" />
                        <div className="mt-2 rounded bg-green-50 dark:bg-green-950/30 p-2 text-xs">
                            <span className="text-muted-foreground">Heksa: </span>
                            <span className="font-mono font-medium">
                                {trace.ciphertext.map(hexValue).join('')}
                            </span>
                        </div>
                        {learnerMode === 'mahir' && (
                            <p className="mt-2 text-xs text-muted-foreground italic">
                                Dekripsi AES membalik semua 10 putaran menggunakan operasi invers
                                (InvShiftRows, InvSubBytes, InvAddRoundKey, InvMixColumns).
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
