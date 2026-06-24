/**
 * FeistelRoundStep — Steps 1-16: Feistel rounds
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { bitsToHex } from '@/features/labs/algorithms/des';
import { cn } from '@/lib/utils';
import type { DesTrace } from '@/types/labs';

interface FeistelRoundStepProps {
    trace: DesTrace;
    roundIndex: number; // 0-15 (maps to round 1-16)
    learnerMode: 'pemula' | 'mahir';
}

function HexBox({
    label,
    bits,
    color,
}: {
    label: string;
    bits: number[];
    color: 'blue' | 'green' | 'orange' | 'amber' | 'purple' | 'violet';
}) {
    const colors = {
        blue: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30',
        green: 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30',
        orange: 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30',
        amber: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30',
        purple: 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30',
        violet: 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30',
    };
    const labelColors = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-green-600 dark:text-green-400',
        orange: 'text-orange-600 dark:text-orange-400',
        amber: 'text-amber-600 dark:text-amber-400',
        purple: 'text-purple-600 dark:text-purple-400',
        violet: 'text-violet-600 dark:text-violet-400',
    };

    return (
        <div className={cn('rounded-lg border px-3 py-2', colors[color])}>
            <div className={cn('text-[10px] font-semibold mb-1', labelColors[color])}>
                {label}
            </div>
            <div className="font-mono text-xs font-medium break-all">{bitsToHex(bits)}</div>
            <div className="text-[8px] text-muted-foreground mt-0.5">{bits.length} bit</div>
        </div>
    );
}

export default function FeistelRoundStep({
    trace,
    roundIndex,
    learnerMode,
}: FeistelRoundStepProps) {
    const round = trace.rounds[roundIndex];

    if (!round) {
return null;
}

    const roundNum = roundIndex + 1;

    return (
        <Card className="border-border/70 bg-card/95">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                    Step {roundNum}: Feistel Round {roundNum}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Input L/R */}
                <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Input</p>
                    <div className="grid grid-cols-2 gap-2">
                        <HexBox
                            label={`L${roundIndex} (32-bit)`}
                            bits={round.L}
                            color="blue"
                        />
                        <HexBox
                            label={`R${roundIndex} (32-bit)`}
                            bits={round.R}
                            color="green"
                        />
                    </div>
                </div>

                {learnerMode === 'pemula' ? (
                    <>
                        {/* Simplified: F-function as black box */}
                        <div className="flex justify-center">
                            <div className="text-xs text-muted-foreground">↓ F-function</div>
                        </div>

                        <div className="rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30 px-3 py-2">
                            <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 mb-1">
                                F(R, K{roundNum})
                            </div>
                            <div className="font-mono text-xs font-medium break-all">
                                {bitsToHex(round.permutedOutput)}
                            </div>
                            <div className="text-[8px] text-muted-foreground mt-0.5">32 bit</div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Detailed: F-function pipeline */}
                        <Separator className="my-2" />
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">
                                F-function Pipeline
                            </p>

                            {/* E: Expansion */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span>1. Expansion (E)</span>
                                </div>
                                <HexBox
                                    label="E(R) — 32→48 bit"
                                    bits={round.expandedR}
                                    color="orange"
                                />
                            </div>

                            {/* XOR with Key */}
                            <div className="space-y-2 mt-2">
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span>2. XOR dengan Round Key K{roundNum}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <HexBox
                                        label={`K${roundNum} (48-bit)`}
                                        bits={round.roundKey}
                                        color="violet"
                                    />
                                    <HexBox
                                        label="E(R) ⊕ K (48-bit)"
                                        bits={round.xoredWithKey}
                                        color="amber"
                                    />
                                </div>
                            </div>

                            {/* S-box */}
                            <div className="space-y-2 mt-2">
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span>3. S-box Substitution (48→32 bit)</span>
                                </div>
                                <HexBox
                                    label="S-box output (32-bit)"
                                    bits={round.sboxOutput}
                                    color="purple"
                                />
                            </div>

                            {/* P: Permutation */}
                            <div className="space-y-2 mt-2">
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <span>4. Permutation (P)</span>
                                </div>
                                <HexBox
                                    label="P(S-box) — Final F output (32-bit)"
                                    bits={round.permutedOutput}
                                    color="orange"
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Output L/R */}
                <div>
                    <div className="flex justify-center">
                        <div className="text-xs text-muted-foreground">↓ Feistel Swap</div>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 mt-2">Output</p>
                    <div className="grid grid-cols-2 gap-2">
                        <HexBox
                            label={`L${roundNum} = R${roundIndex} (32-bit)`}
                            bits={round.newL}
                            color="blue"
                        />
                        <HexBox
                            label={`R${roundNum} = L${roundIndex} ⊕ F (32-bit)`}
                            bits={round.newR}
                            color="green"
                        />
                    </div>
                </div>

                {/* Explanation */}
                <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                    <p className="text-xs text-muted-foreground">
                        <strong>Feistel Round {roundNum}:</strong> Struktur Feistel menggunakan L dan R dari round sebelumnya. L baru = R lama, R baru = L lama ⊕ F(R lama, K{roundNum}). Ini diulang 16 kali.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
