/**
 * RoundSelector — Navigate between 16 DES rounds
 */

import { cn } from '@/lib/utils';

interface RoundSelectorProps {
    totalRounds: number;
    currentRound: number; // -1 for IP, 0-15 for rounds 1-16, 16 for FP
    onRoundSelect: (roundIndex: number) => void;
}

export default function RoundSelector({
    totalRounds,
    currentRound,
    onRoundSelect,
}: RoundSelectorProps) {
    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Pilih Round</p>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {/* IP Button */}
                <button
                    onClick={() => onRoundSelect(0)}
                    className={cn(
                        'flex size-8 items-center justify-center rounded-md text-[10px] font-medium transition-all',
                        currentRound === -1
                            ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                    title="Initial Permutation"
                >
                    IP
                </button>

                {/* Round Buttons */}
                {Array.from({ length: totalRounds }, (_, i) => (
                    <button
                        key={i}
                        onClick={() => onRoundSelect(i + 1)}
                        className={cn(
                            'flex size-8 items-center justify-center rounded-md text-[10px] font-medium transition-all',
                            currentRound === i
                                ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                                : currentRound > i
                                  ? 'bg-primary/15 text-primary hover:bg-primary/25'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                        title={`Round ${i + 1}`}
                    >
                        {i + 1}
                    </button>
                ))}

                {/* FP Button */}
                <button
                    onClick={() => onRoundSelect(17)}
                    className={cn(
                        'flex size-8 items-center justify-center rounded-md text-[10px] font-medium transition-all',
                        currentRound === 16
                            ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                    title="Final Permutation"
                >
                    FP
                </button>
            </div>
        </div>
    );
}
