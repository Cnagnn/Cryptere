/**
 * Avalanche Effect Demo
 *
 * Visualizes the avalanche effect by comparing two byte sequences
 * that differ by exactly one bit.
 */

import { cn } from '@/lib/utils';
import type { AesTrace } from '../algorithms/aes';
import AesStateMatrix from './AesStateMatrix';

interface AvalancheDemoProps {
    originalBytes: number[];
    flippedBytes: number[];
    aesTrace?: AesTrace;
    label?: string;
}

function countBitDifferences(a: number[], b: number[]): number {
    let diffCount = 0;

    for (let i = 0; i < a.length; i++) {
        const xor = a[i] ^ b[i];
        // Count set bits in xor
        let bits = xor;

        while (bits) {
            diffCount += bits & 1;
            bits >>= 1;
        }
    }

    return diffCount;
}

function findDifferentBytes(a: number[], b: number[]): number[] {
    const different: number[] = [];

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            different.push(i);
        }
    }

    return different;
}

export default function AvalancheDemo({
    originalBytes,
    flippedBytes,
    aesTrace,
    label = 'Avalanche Effect',
}: AvalancheDemoProps) {
    const totalBits = originalBytes.length * 8;
    const differentBits = countBitDifferences(originalBytes, flippedBytes);
    const differentBytes = findDifferentBytes(originalBytes, flippedBytes);
    const avalanchePercentage = (differentBits / totalBits) * 100;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
                <span className="text-xs font-mono text-muted-foreground">
                    {differentBits}/{totalBits} bits ({avalanchePercentage.toFixed(1)}%)
                </span>
            </div>

            {/* Bit difference bar */}
            <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-500"
                    style={{ width: `${avalanchePercentage}%` }}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Original */}
                <div className="space-y-2">
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        Original
                    </span>
                    <div className="font-mono text-xs bg-muted/30 rounded p-2 space-y-1">
                        <div className="flex flex-wrap gap-1">
                            {originalBytes.map((byte, idx) => (
                                <span
                                    key={idx}
                                    className={cn(
                                        'px-1.5 py-0.5 rounded',
                                        differentBytes.includes(idx)
                                            ? 'bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                                            : 'bg-muted',
                                    )}
                                >
                                    {byte.toString(16).padStart(2, '0').toUpperCase()}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Flipped */}
                <div className="space-y-2">
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                        Flipped (1 bit difference)
                    </span>
                    <div className="font-mono text-xs bg-muted/30 rounded p-2 space-y-1">
                        <div className="flex flex-wrap gap-1">
                            {flippedBytes.map((byte, idx) => (
                                <span
                                    key={idx}
                                    className={cn(
                                        'px-1.5 py-0.5 rounded',
                                        differentBytes.includes(idx)
                                            ? 'bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                                            : 'bg-muted',
                                    )}
                                >
                                    {byte.toString(16).padStart(2, '0').toUpperCase()}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Byte-level comparison */}
            {differentBytes.length > 0 && (
                <div className="text-xs text-muted-foreground">
                    Different bytes at indices: {differentBytes.join(', ')}
                </div>
            )}

            {/* AES trace comparison */}
            {aesTrace && (
                <div className="space-y-4 pt-2 border-t">
                    <h5 className="text-xs font-medium text-muted-foreground">
                        AES Round-by-Round Comparison
                    </h5>

                    {aesTrace.rounds.slice(0, 4).map((round, idx) => {
                        return (
                            <div key={idx} className="space-y-2">
                                <span className="text-xs font-medium">
                                    {round.label}
                                </span>
                                <AesStateMatrix
                                    state={round.stateBefore}
                                    highlightBytes={differentBytes.filter((b) => b < 16)}
                                    title=""
                                />
                            </div>
                        );
                    })}

                    {aesTrace.rounds.length > 4 && (
                        <span className="text-xs text-muted-foreground">
                            ... and {aesTrace.rounds.length - 4} more rounds
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
