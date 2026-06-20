/**
 * DesPanel — DES Feistel round visualization
 *
 * Shows the Feistel structure with L/R halves and F-function details
 * for each of the 16 DES rounds.
 */

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { bitsToHex } from '@/features/labs/algorithms/des';
import { cn } from '@/lib/utils';
import type { DesTrace } from '@/types/labs';

interface DesPanelProps {
    trace: DesTrace;
    steps: string[];
    learnerMode: 'pemula' | 'mahir';
    activeStep: number;
    onStepChange?: (n: number) => void;
}

function BitCell({ bit, highlighted = false }: { bit: number; highlighted?: boolean }) {
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
    variant = 'default',
}: {
    bits: number[];
    label?: string;
    variant?: 'default' | 'blue' | 'orange' | 'green' | 'purple';
}) {
    const styles = {
        default: 'bg-muted/30 border-muted',
        blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
        orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
        green: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
        purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    };

    return (
        <div className={cn('rounded-lg p-2 border space-y-1', styles[variant])}>
            {label && (
                <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
            )}
            <div className="flex flex-wrap gap-0.5">
                {bits.map((bit, idx) => (
                    <BitCell key={idx} bit={bit} />
                ))}
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">
                = 0x{bitsToHex(bits)} ({bits.length} bit)
            </span>
        </div>
    );
}

function FeistelRoundViz({
    expandedR,
    sboxOutput,
    permutedOutput,
}: {
    expandedR?: number[];
    sboxOutput?: number[];
    permutedOutput?: number[];
}) {
    return (
        <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
                {/* R before expansion */}
                <div className="text-center text-xs text-muted-foreground">
                    R<sub>before</sub>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                    F(R, K)
                </div>
                <div className="text-center text-xs text-muted-foreground">
                    R<sub>new</sub> = L ⊕ F
                </div>
            </div>

            {expandedR && (
                <div className="grid grid-cols-3 gap-2">
                    <div />
                    <BitGroup bits={expandedR} label="E(R) = 48 bit" variant="orange" />
                    <div />
                </div>
            )}

            {sboxOutput && (
                <div className="grid grid-cols-3 gap-2">
                    <div />
                    <BitGroup bits={sboxOutput} label="S-box = 32 bit" variant="purple" />
                    <div />
                </div>
            )}

            {permutedOutput && (
                <div className="grid grid-cols-3 gap-2">
                    <div />
                    <BitGroup bits={permutedOutput} label="P(output) = 32 bit" variant="orange" />
                    <div />
                </div>
            )}
        </div>
    );
}

export default function DesPanel({
    trace,
    learnerMode,
    activeStep,
    onStepChange,
}: DesPanelProps) {
    const rounds = trace.rounds;

    // Map active step to round index
    let currentRoundIndex = -1;

    if (activeStep === 0) {
        currentRoundIndex = -1; // show initial state
    } else if (activeStep <= 16) {
        currentRoundIndex = activeStep - 1;
    } else {
        currentRoundIndex = -2; // show final state
    }

    const showInitial = currentRoundIndex === -1;
    const showFinal = currentRoundIndex === -2;
    const currentRound = currentRoundIndex >= 0 ? rounds[currentRoundIndex] : null;

    return (
        <div className="space-y-3 overflow-auto">
            {/* Overview */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                        DES Feistel
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        16 putaran
                    </span>
                </div>
                {currentRound && (
                    <Badge variant="secondary" className="text-xs">
                        Putaran {currentRound.roundIndex}
                    </Badge>
                )}
            </div>

            {/* Initial state */}
            {showInitial && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">State Awal DES</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="rounded bg-muted/40 p-2 text-xs font-mono break-all">
                            <span className="text-muted-foreground">Plaintext: </span>
                            {trace.plaintext}
                        </div>
                        {learnerMode === 'mahir' && (
                            <p className="text-xs text-muted-foreground italic">
                                DES menerapkan Permutasi Awal (IP) pada masukan 64-bit,
                                lalu membagi menjadi L₀ dan R₀ (masing-masing 32 bit) sebelum putaran Feistel.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Round visualization */}
            {currentRound && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                            Putaran {currentRound.roundIndex} — Struktur Feistel
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* L and R halves */}
                        <div className="grid grid-cols-2 gap-3">
                            <BitGroup bits={currentRound.L} label="L (32 bit)" variant="blue" />
                            <BitGroup bits={currentRound.R} label="R (32 bit)" variant="green" />
                        </div>

                        {/* F-function */}
                        <FeistelRoundViz
                            expandedR={currentRound.expandedR}
                            sboxOutput={currentRound.sboxOutput}
                            permutedOutput={currentRound.permutedOutput}
                        />

                        {/* Round navigation */}
                        <div className="flex justify-center gap-1 flex-wrap">
                            {rounds.map((r, i) => (
                                <button
                                    key={r.roundIndex}
                                    onClick={() => onStepChange?.(i + 1)}
                                    className={cn(
                                        'size-2 rounded-full text-[8px] flex items-center justify-center transition-colors',
                                        r.roundIndex === currentRound.roundIndex
                                            ? 'bg-primary'
                                            : 'bg-muted hover:bg-muted-foreground/30',
                                    )}
                                    title={`Putaran ${r.roundIndex}`}
                                />
                            ))}
                        </div>

                        {learnerMode === 'mahir' && (
                            <div className="border-t pt-2 space-y-1">
                                <p className="text-xs font-medium">Rincian fungsi F:</p>
                                <ul className="text-xs text-muted-foreground space-y-0.5">
                                    <li>• Ekspansi E: 32 bit → 48 bit (menduplikasi beberapa bit)</li>
                                    <li>• XOR dengan round key K<sub>{currentRound.roundIndex}</sub> (48 bit)</li>
                                    <li>• Substitusi S-box: 8 × 6-bit → 8 × 4-bit = 32 bit</li>
                                    <li>• Permutasi P: 32 bit diatur ulang</li>
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Final state */}
            {showFinal && (
                <Card className="border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">State Akhir DES</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded bg-green-50 dark:bg-green-950/30 p-3 text-sm space-y-1">
                            <div>
                                <span className="text-muted-foreground">Ciphertext: </span>
                                <span className="font-mono font-medium">{trace.ciphertext}</span>
                            </div>
                        </div>
                        {learnerMode === 'mahir' && (
                            <p className="mt-2 text-xs text-muted-foreground italic">
                                L dan R akhir ditukar (R₁₆L₁₆), lalu Permutasi Akhir (FP)
                                diterapkan untuk menghasilkan ciphertext 64-bit.
                                Dekripsi menggunakan proses yang sama dengan round key terbalik.
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Round list (pemula mode) */}
            {learnerMode === 'pemula' && !showInitial && !showFinal && (
                <div className="grid grid-cols-4 gap-1">
                    {rounds.map((r) => (
                        <div
                            key={r.roundIndex}
                            className={cn(
                                'rounded p-1 text-center text-[10px]',
                                r.roundIndex === currentRound?.roundIndex
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted/50 text-muted-foreground',
                            )}
                        >
                            R{r.roundIndex}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
