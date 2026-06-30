/**
 * AesPanel — shared-shell AES visualizer.
 */
import { Button } from '@/components/ui/button';
import VisualizerShell from '@/features/labs/visualizers/VisualizerShell';
import { cn } from '@/lib/utils';

interface AesRound {
    roundIndex: number;
    stateBefore: number[];
    afterSubBytes: number[];
    afterShiftRows: number[];
    afterMixColumns: number[];
    afterAddRoundKey: number[];
    roundKey?: number[];
}

interface Props {
    trace: { plaintext: number[]; rounds: AesRound[]; ciphertext: number[] };
    steps: string[];
    learnerMode: string;
    activeStep: number;
    onStepChange: (n: number) => void;
}

function toHex(byte: number): string {
    return byte.toString(16).padStart(2, '0').toUpperCase();
}

function Matrix({ bytes }: { bytes: number[] }) {
    const order = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15];

    return (
        <span className="inline-grid grid-cols-4 gap-1">
            {order.map((index) => (
                <span
                    key={index}
                    className="flex h-9 w-12 items-center justify-center rounded-md border bg-background font-mono text-xs font-bold shadow-sm"
                >
                    {toHex(bytes[index])}
                </span>
            ))}
        </span>
    );
}

function StepMarker({ value }: { value: number }) {
    return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border bg-background text-[11px] font-bold text-foreground">
            {value}
        </span>
    );
}

function ResultCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-muted/20 px-3 py-2">
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-1 font-mono text-[11px] text-foreground">
                {value}
            </p>
        </div>
    );
}

export default function AesPanel({ trace, activeStep, onStepChange }: Props) {
    const rounds = trace.rounds ?? [];
    const round = rounds[activeStep];
    const ciphertext = trace.ciphertext ?? [];

    if (!round) {
        return null;
    }

    const operations = [
        { step: 1, label: 'Input', bytes: round.stateBefore },
        { step: 2, label: 'SubBytes', bytes: round.afterSubBytes },
        { step: 3, label: 'ShiftRows', bytes: round.afterShiftRows },
        { step: 4, label: 'MixColumns', bytes: round.afterMixColumns },
        { step: 5, label: 'AddRoundKey', bytes: round.afterAddRoundKey },
    ];

    const stage = (
        <div className="flex w-full max-w-6xl flex-col items-center gap-5">
            <div className="flex flex-wrap justify-center gap-2">
                {rounds.map((_, index) => (
                    <Button
                        key={index}
                        size="sm"
                        variant={activeStep === index ? 'default' : 'outline'}
                        className={cn(
                            'h-7 px-3 text-[11px]',
                            activeStep === index && 'ring-2 ring-foreground/15',
                        )}
                        onClick={() => onStepChange(index)}
                    >
                        R{index + 1}
                    </Button>
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-5">
                {operations.map((operation, index) => (
                    <div key={operation.label} className="contents">
                        {index > 0 && (
                            <span className="text-2xl text-muted-foreground/20">
                                -&gt;
                            </span>
                        )}
                        <div className="flex flex-col items-center gap-2">
                            <StepMarker value={operation.step} />
                            <span className="text-[10px] font-semibold text-foreground">
                                {operation.label}
                            </span>
                            <Matrix bytes={operation.bytes} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const detail = (
        <div className="flex flex-col gap-3 text-xs">
            <ResultCard
                label="Putaran"
                value={`${activeStep + 1} / ${rounds.length}${activeStep === rounds.length - 1 ? ' · final' : ''}`}
            />
            {round.roundKey && (
                <ResultCard
                    label="Round Key"
                    value={round.roundKey.map(toHex).join(' ')}
                />
            )}
            <ResultCard
                label="Ciphertext"
                value={ciphertext.map(toHex).join(' ')}
            />
        </div>
    );

    return (
        <VisualizerShell
            step={activeStep}
            caption="AES divisualisasikan sebagai alur state per putaran agar transformasi byte lebih mudah diikuti."
            stage={stage}
            detail={detail}
        />
    );
}
