/**
 * AesPanel — centered pipeline: plaintext → [4 ops] → ciphertext.
 */
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AesRound {
    roundIndex: number; stateBefore: number[]; afterSubBytes: number[];
    afterShiftRows: number[]; afterMixColumns: number[]; afterAddRoundKey: number[];
    roundKey?: number[];
}

interface Props {
    trace: { plaintext: number[]; rounds: AesRound[]; ciphertext: number[] };
    steps: string[]; learnerMode: string; activeStep: number; onStepChange: (n: number) => void;
}

function H(b: number) {
 return b.toString(16).padStart(2, '0').toUpperCase(); 
}

function Mat({ bytes }: { bytes: number[] }) {
    const idx = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];

    return (
        <span className="inline-grid grid-cols-4 gap-[2px]">
            {idx.map((i) => (
                <span key={i} className="flex h-7 w-10 items-center justify-center rounded border bg-background font-mono text-[11px] font-bold shadow-sm">
                    {H(bytes[i])}
                </span>
            ))}
        </span>
    );
}

function StepNum({ n }: { n: number }) {
    return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {n}
        </span>
    );
}

export default function AesPanel({ trace, activeStep, onStepChange }: Props) {
    const rounds = trace.rounds ?? [];
    const round = rounds[activeStep];
    const ctext = trace.ciphertext ?? [];

    return (
        <div className="space-y-4">
            {/* Round selector — centered */}
            <div className="flex flex-wrap justify-center gap-1">
                {rounds.map((_, i) => (
                    <Button key={i} size="sm" variant={activeStep === i ? 'default' : 'outline'}
                        className={cn('h-6 px-2 text-[10px]', activeStep === i && 'ring-2 ring-primary/30')}
                        onClick={() => onStepChange(i)}>
                        R{i + 1}
                    </Button>
                ))}
            </div>

            {round && (
                <div className="flex flex-col items-center gap-4">
                    {/* Title */}
                    <p className="text-xs font-semibold text-muted-foreground">
                        Putaran {activeStep + 1} / {rounds.length}
                        {activeStep === rounds.length - 1 ? ' · Final' : ''}
                    </p>

                    {/* Pipeline: horizontal flow */}
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
                        {/* ① Plaintext */}
                        <div className="flex flex-col items-center gap-1">
                            <StepNum n={1} />
                            <span className="text-[9px] text-muted-foreground">input state</span>
                            <Mat bytes={round.stateBefore} />
                        </div>

                        <span className="text-2xl text-muted-foreground/20 shrink-0 self-center">→</span>

                        {/* ② SubBytes */}
                        <div className="flex flex-col items-center gap-1">
                            <StepNum n={2} />
                            <span className="text-[9px] text-amber-600 font-semibold">SubBytes</span>
                            <Mat bytes={round.afterSubBytes} />
                        </div>

                        <span className="text-2xl text-muted-foreground/20 shrink-0 self-center">→</span>

                        {/* ③ ShiftRows */}
                        <div className="flex flex-col items-center gap-1">
                            <StepNum n={3} />
                            <span className="text-[9px] text-sky-600 font-semibold">ShiftRows</span>
                            <Mat bytes={round.afterShiftRows} />
                        </div>

                        <span className="text-2xl text-muted-foreground/20 shrink-0 self-center">→</span>

                        {/* ④ MixColumns */}
                        <div className="flex flex-col items-center gap-1">
                            <StepNum n={4} />
                            <span className="text-[9px] text-emerald-600 font-semibold">MixColumns</span>
                            <Mat bytes={round.afterMixColumns} />
                        </div>

                        <span className="text-2xl text-muted-foreground/20 shrink-0 self-center">→</span>

                        {/* ⑤ AddRoundKey */}
                        <div className="flex flex-col items-center gap-1">
                            <StepNum n={5} />
                            <span className="text-[9px] text-rose-600 font-semibold">AddRoundKey</span>
                            <Mat bytes={round.afterAddRoundKey} />
                        </div>
                    </div>

                    {/* Round key display */}
                    {round.roundKey && (
                        <div className="flex flex-col items-center gap-1 rounded-xl border bg-muted/10 px-4 py-2">
                            <span className="text-[9px] font-medium text-muted-foreground">
                                Round Key {activeStep + 1}
                            </span>
                            <span className="font-mono text-[11px] tracking-wide">
                                {round.roundKey.map(H).join(' ')}
                            </span>
                        </div>
                    )}

                    {/* Last round → ciphertext */}
                    {activeStep === rounds.length - 1 && (
                        <div className="flex flex-col items-center gap-1 rounded-xl border-2 border-primary/20 bg-primary/5 px-6 py-3">
                            <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Ciphertext</span>
                            <span className="font-mono text-sm font-bold text-primary">{ctext.map(H).join(' ')}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}