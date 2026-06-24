/**
 * FinalPermutationStep — Step 17: FP transformation
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { bitsToHex } from '@/features/labs/algorithms/des';
import { cn } from '@/lib/utils';
import type { DesTrace } from '@/types/labs';

interface FinalPermutationStepProps {
    trace: DesTrace;
}

function HexBox({
    label,
    bits,
    color,
}: {
    label: string;
    bits: number[];
    color: 'blue' | 'green' | 'amber';
}) {
    const colors = {
        blue: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30',
        green: 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30',
        amber: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30',
    };
    const labelColors = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-green-600 dark:text-green-400',
        amber: 'text-amber-600 dark:text-amber-400',
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

export default function FinalPermutationStep({ trace }: FinalPermutationStepProps) {
    const lastRound = trace.rounds[15]; // Round 16 (index 15)

    if (!lastRound) {
return null;
}

    return (
        <Card className="border-border/70 bg-card/95 border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                    Step 17: Final Permutation (FP)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Input: R16 L16 (swapped) */}
                <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Input (R16 L16 — swapped)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <HexBox
                            label="R16 (32-bit)"
                            bits={lastRound.newR}
                            color="green"
                        />
                        <HexBox
                            label="L16 (32-bit)"
                            bits={lastRound.newL}
                            color="blue"
                        />
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                    <div className="text-xs text-muted-foreground">↓ FP Permutation</div>
                </div>

                {/* Output: Ciphertext */}
                <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Output (64-bit Ciphertext)
                    </p>
                    <div className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 px-3 py-2">
                        <div className="text-[10px] font-semibold text-green-600 dark:text-green-400 mb-1">
                            Ciphertext
                        </div>
                        <div className="font-mono text-xs font-medium break-all">
                            {trace.ciphertext}
                        </div>
                        <div className="text-[8px] text-muted-foreground mt-0.5">64 bit</div>
                    </div>
                </div>

                {/* Explanation */}
                <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-3">
                    <p className="text-xs text-muted-foreground">
                        <strong>Final Permutation</strong> adalah langkah terakhir DES. Setelah 16 putaran Feistel, L16 dan R16 ditukar (menjadi R16 L16), kemudian dipermutasi untuk menghasilkan 64-bit ciphertext final.
                    </p>
                </div>

                {/* Summary */}
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                        ✓ Enkripsi Selesai
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Plaintext telah dienkripsi menjadi ciphertext melalui 16 putaran Feistel dengan kunci {trace.key}.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
