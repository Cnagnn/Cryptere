/**
 * InitialPermutationStep — Step 0: IP transformation
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { bitsToHex } from '@/features/labs/algorithms/des';
import { cn } from '@/lib/utils';
import type { DesTrace } from '@/types/labs';

interface InitialPermutationStepProps {
    trace: DesTrace;
}

function HexBox({
    label,
    bits,
    color,
}: {
    label: string;
    bits: number[];
    color: 'blue' | 'green';
}) {
    const colors = {
        blue: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30',
        green: 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30',
    };
    const labelColors = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-green-600 dark:text-green-400',
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

export default function InitialPermutationStep({ trace }: InitialPermutationStepProps) {
    return (
        <Card className="border-border/70 bg-card/95">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                    Step 0: Initial Permutation (IP)
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Input */}
                <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Input (64-bit)</p>
                    <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
                        <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-1">
                            Plaintext
                        </div>
                        <div className="font-mono text-xs font-medium break-all">
                            {bitsToHex(trace.afterIP)}
                        </div>
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                    <div className="text-xs text-muted-foreground">↓ IP Permutation</div>
                </div>

                {/* Output */}
                <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Output (L0, R0)</p>
                    <div className="grid grid-cols-2 gap-2">
                        <HexBox label="L0 (32-bit)" bits={trace.L0} color="blue" />
                        <HexBox label="R0 (32-bit)" bits={trace.R0} color="green" />
                    </div>
                </div>

                {/* Explanation */}
                <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                    <p className="text-xs text-muted-foreground">
                        <strong>Initial Permutation</strong> mengatur ulang 64 bit input menjadi dua bagian 32-bit: L0 (left) dan R0 (right). Ini adalah langkah pertama sebelum 16 putaran Feistel.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
