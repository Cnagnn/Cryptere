/**
 * DesPanel — centered Feistel diagram. Numbered steps.
 */
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DesRound {
    roundIndex: number; L: number[]; R: number[];
    expandedR: number[]; xoredWithKey: number[]; sboxOutput: number[];
    permutedOutput: number[]; newL: number[]; newR: number[]; roundKey: number[];
}

interface Props {
    trace: { afterIP: number[]; L0: number[]; R0: number[]; rounds: DesRound[]; ciphertext: string };
    steps: string[]; activeStep: number; onStepChange: (n: number) => void;
}

function b2h(bits: number[]): string {
    const s: string[] = [];

    for (let i = 0; i < bits.length; i += 4) {
s.push(((bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3]).toString(16).toUpperCase());
}

    return s.join('');
}

function Box({ L, V, c }: { L: string; V: string; c: string }) {
    return (
        <div className={cn('rounded-xl border px-4 py-3 text-center min-w-[140px]', c)}>
            <p className="text-[10px] font-bold text-muted-foreground">{L}</p>
            <p className="font-mono text-[11px] font-semibold break-all leading-tight mt-1">{V}</p>
        </div>
    );
}

function StepNum({ n }: { n: number }) {
    return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
            {n}
        </span>
    );
}

function Down() {
 return <span className="text-xl text-muted-foreground/20">↓</span>; 
}

export default function DesPanel({ trace, activeStep, onStepChange }: Props) {
    const rounds = trace.rounds ?? [];
    const round = rounds[activeStep];

    if (rounds.length === 0) {
return null;
}

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-center gap-1">
                {rounds.map((_, i) => (
                    <Button key={i} size="sm" variant={activeStep === i ? 'default' : 'outline'}
                        className={cn('h-6 px-2 text-[10px]', activeStep === i && 'ring-2 ring-violet-400/50')}
                        onClick={() => onStepChange(i)}>R{i + 1}</Button>
                ))}
            </div>

            {round && (
                <div className="flex flex-col items-center gap-4">
                    <p className="text-xs font-semibold text-muted-foreground">
                        Putaran {activeStep + 1} / {rounds.length}
                    </p>

                    {/* ① Input pair */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <div className="flex flex-col items-center gap-1">
                            <StepNum n={1} />
                            <Box L={`L${activeStep}`} V={b2h(round.L)} c="bg-sky-50 border-sky-200 dark:bg-sky-950/20" />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <StepNum n={2} />
                            <Box L={`R${activeStep}`} V={b2h(round.R)} c="bg-rose-50 border-rose-200 dark:bg-rose-950/20" />
                        </div>
                    </div>

                    <Down />

                    {/* ③ f(R, K) function — centered */}
                    <div className="flex flex-col items-center gap-1">
                        <StepNum n={3} />
                        <span className="text-[9px] font-semibold text-muted-foreground">f(R, K)</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/20 px-4 py-3 w-full sm:max-w-md">
                        <div className="text-center">
                            <p className="text-[9px] font-medium">① Ekspansi 32→48</p>
                            <p className="font-mono text-[10px] break-all text-muted-foreground">{b2h(round.expandedR)}</p>
                        </div>
                        <Down />
                        <div className="text-center">
                            <p className="text-[9px] font-medium">② XOR K{activeStep + 1}</p>
                            <p className="font-mono text-[10px] break-all text-muted-foreground">{b2h(round.xoredWithKey)}</p>
                        </div>
                        <Down />
                        <div className="text-center">
                            <p className="text-[9px] font-medium">③ S-Box</p>
                            <p className="font-mono text-[10px] break-all text-muted-foreground">{
                                Array.from({ length: 8 }, (_, i) => {
                                    const nib = (round.sboxOutput[i * 4] << 3) | (round.sboxOutput[i * 4 + 1] << 2) | (round.sboxOutput[i * 4 + 2] << 1) | round.sboxOutput[i * 4 + 3];

                                    return nib.toString(16).toUpperCase();
                                }).join(' ')
                            }</p>
                        </div>
                        <Down />
                        <div className="text-center">
                            <p className="text-[9px] font-medium">④ Permutasi P</p>
                            <p className="font-mono text-[10px] break-all text-muted-foreground">{b2h(round.permutedOutput)}</p>
                        </div>
                    </div>

                    <Down />

                    {/* ④ Output — swap */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <div className="flex flex-col items-center gap-1">
                            <StepNum n={4} />
                            <Box L={`L${activeStep + 1} = R${activeStep}`} V={b2h(round.newL)} c="bg-sky-50 border-sky-200 dark:bg-sky-950/20" />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <StepNum n={5} />
                            <Box L={`R${activeStep + 1} = L ⊕ f`} V={b2h(round.newR)} c="bg-rose-50 border-rose-200 dark:bg-rose-950/20" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}