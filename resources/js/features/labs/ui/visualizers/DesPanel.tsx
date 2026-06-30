/**
 * DesPanel — shared-shell DES visualizer.
 */
import { Button } from '@/components/ui/button';
import VisualizerShell from '@/features/labs/visualizers/VisualizerShell';
import { cn } from '@/lib/utils';

interface DesRound {
    roundIndex: number;
    L: number[];
    R: number[];
    expandedR: number[];
    xoredWithKey: number[];
    sboxOutput: number[];
    permutedOutput: number[];
    newL: number[];
    newR: number[];
    roundKey: number[];
}

interface Props {
    trace: {
        afterIP: number[];
        L0: number[];
        R0: number[];
        rounds: DesRound[];
        ciphertext: string;
    };
    steps: string[];
    activeStep: number;
    onStepChange: (n: number) => void;
}

function bitsToHex(bits: number[]): string {
    const parts: string[] = [];

    for (let index = 0; index < bits.length; index += 4) {
        parts.push(
            (
                (bits[index] << 3) |
                (bits[index + 1] << 2) |
                (bits[index + 2] << 1) |
                bits[index + 3]
            )
                .toString(16)
                .toUpperCase(),
        );
    }

    return parts.join('');
}

function StepMarker({ value }: { value: number }) {
    return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border bg-background text-[11px] font-bold text-foreground">
            {value}
        </span>
    );
}

function FlowCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-[170px] rounded-xl border bg-background px-5 py-4 text-center">
            <p className="text-[10px] font-bold text-muted-foreground">
                {label}
            </p>
            <p className="mt-1 font-mono text-[11px] leading-tight font-semibold break-all">
                {value}
            </p>
        </div>
    );
}

function DetailCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-muted/20 px-3 py-2">
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-1 font-mono text-[11px] break-all text-foreground">
                {value}
            </p>
        </div>
    );
}

export default function DesPanel({ trace, activeStep, onStepChange }: Props) {
    const rounds = trace.rounds ?? [];
    const round = rounds[activeStep];

    if (!round) {
        return null;
    }

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

            <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-2">
                    <StepMarker value={1} />
                    <FlowCard
                        label={`L${activeStep}`}
                        value={bitsToHex(round.L)}
                    />
                </div>
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <div className="flex flex-col items-center gap-2">
                    <StepMarker value={2} />
                    <FlowCard
                        label={`R${activeStep}`}
                        value={bitsToHex(round.R)}
                    />
                </div>
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <div className="flex flex-col items-center gap-2">
                    <StepMarker value={3} />
                    <FlowCard
                        label="f(R, K)"
                        value={bitsToHex(round.permutedOutput)}
                    />
                </div>
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <div className="flex flex-col items-center gap-2">
                    <StepMarker value={4} />
                    <FlowCard
                        label={`L${activeStep + 1}`}
                        value={bitsToHex(round.newL)}
                    />
                </div>
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <div className="flex flex-col items-center gap-2">
                    <StepMarker value={5} />
                    <FlowCard
                        label={`R${activeStep + 1}`}
                        value={bitsToHex(round.newR)}
                    />
                </div>
            </div>
        </div>
    );

    const detail = (
        <div className="flex flex-col gap-3 text-xs">
            <DetailCard
                label="Putaran"
                value={`${activeStep + 1} / ${rounds.length}`}
            />
            <DetailCard label="Ekspansi" value={bitsToHex(round.expandedR)} />
            <DetailCard
                label="XOR dengan K"
                value={bitsToHex(round.xoredWithKey)}
            />
            <DetailCard label="Ciphertext" value={trace.ciphertext} />
        </div>
    );

    return (
        <VisualizerShell
            step={activeStep}
            caption="DES divisualisasikan sebagai alur Feistel: pasangan L/R masuk, diproses lewat f(R, K), lalu ditukar ke pasangan baru."
            stage={stage}
            detail={detail}
        />
    );
}
