/**
 * LabVisualizer — dispatch. Caesar/Vigenere: centered char arrow diagram.
 */
import { cn } from '@/lib/utils';
import type { AesTrace, DesTrace, RsaKeyGenTraceData, RsaSignatureTraceData, SimulationMode } from '@/types/labs';
import AesPanel from './ui/visualizers/AesPanel';
import DesPanel from './ui/visualizers/DesPanel';
import RsaPanel from './ui/visualizers/RsaPanel';
import SignaturePanel from './ui/visualizers/SignaturePanel';

export interface LabTraces {
    aes?: AesTrace; des?: DesTrace; rsa?: RsaKeyGenTraceData; signature?: RsaSignatureTraceData;
}

interface Props {
    slug: string; steps: string[]; step: number;
    onStep: (n: number) => void; mode: SimulationMode; traces: LabTraces;
}

interface CharShift { from: string; to: string; shift: string; }

function parse(s: string): CharShift | null {
    const m = s.match(/([A-Z])\s*->\s*([A-Z])\s*\((.+?)\)/);

    if (m) {
return { from: m[1], to: m[2], shift: m[3] };
}

    const v = s.match(/teks\s+([A-Z]),\s*kunci\s+([A-Z])\s*\((\d+)\)\s*->\s*([A-Z])/);

    if (v) {
return { from: v[1], to: v[4], shift: `k${v[2]}(${v[3]})` };
}

    return null;
}

function GenericStepView({ steps, step }: { steps: string[]; step: number }) {
    const chars = steps.map(s => parse(s)).filter(Boolean) as CharShift[];

    if (chars.length === 0) {
        // fallback: just show the narrative step
        const current = steps[step] ?? (steps.length > 0 ? steps[steps.length - 1] : '');

        if (!current) {
return null;
}

        return (
            <div className="flex justify-center">
                <div className="rounded-xl border bg-muted/10 px-5 py-3 text-center">
                    <p className="text-sm font-medium">{current}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-semibold text-muted-foreground">
                Langkah {step + 1} / {chars.length}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
                {chars.map((ch, i) => {
                    const active = i === step;
                    const past = i < step;

                    return (
                        <div
                            key={i}
                            className={cn(
                                'flex flex-col items-center gap-[3px]',
                                !active && !past && 'opacity-15',
                            )}
                        >
                            {/* Step number */}
                            <span className={cn(
                                'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold',
                                active ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground',
                            )}>
                                {i + 1}
                            </span>
                            {/* Source char */}
                            <span className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg border text-base font-bold',
                                active
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                    : past
                                        ? 'border-border bg-muted/30 text-muted-foreground'
                                        : 'border-dashed border-border/50 text-muted-foreground/30',
                            )}>
                                {ch.from}
                            </span>
                            {/* Arrow + shift */}
                            <span className={cn(
                                'rounded bg-muted/40 px-1.5 py-0.5 text-[9px] font-mono font-medium',
                                active && 'bg-primary/20 text-primary',
                            )}>
                                {ch.shift}
                            </span>
                            {/* Result char */}
                            <span className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg border text-base font-bold',
                                active
                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm'
                                    : past
                                        ? 'border-border bg-muted/30 text-muted-foreground'
                                        : 'border-dashed border-border/50 text-muted-foreground/30',
                            )}>
                                {ch.to}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function LabVisualizer({ slug, steps, step, onStep, mode, traces }: Props) {
    if (slug === 'aes-lab' && traces.aes) {
return <AesPanel trace={traces.aes} steps={steps} learnerMode="mahir" activeStep={step} onStepChange={onStep} />;
}

    if (slug === 'des-lab' && traces.des) {
return <DesPanel trace={traces.des} steps={steps} activeStep={step} onStepChange={onStep} />;
}

    if (slug === 'rsa-lab' && traces.rsa) {
return <RsaPanel trace={traces.rsa} steps={steps} learnerMode="mahir" />;
}

    if (slug === 'digital-signature-lab' && traces.signature) {
return <SignaturePanel trace={traces.signature} steps={steps} learnerMode="mahir" mode={mode} />;
}

    return <GenericStepView steps={steps} step={step} />;
}