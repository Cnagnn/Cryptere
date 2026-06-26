/**
 * LabVisualizer — dispatch ke panel algoritma. Fallback: list step generik
 * untuk lab tanpa trace panel (caesar/vigenere).
 */
import type {
    AesTrace,
    DesTrace,
    RsaKeyGenTraceData,
    RsaSignatureTraceData,
    SimulationMode,
} from '@/types/labs';
import AesPanel from './ui/visualizers/AesPanel';
import DesPanel from './ui/visualizers/DesPanel';
import RsaPanel from './ui/visualizers/RsaPanel';
import SignaturePanel from './ui/visualizers/SignaturePanel';

export interface LabTraces {
    aes?: AesTrace;
    des?: DesTrace;
    rsa?: RsaKeyGenTraceData;
    signature?: RsaSignatureTraceData;
}

interface Props {
    slug: string;
    steps: string[];
    step: number;
    onStep: (n: number) => void;
    mode: SimulationMode;
    traces: LabTraces;
}

function GenericStepView({ steps, step }: { steps: string[]; step: number }) {
    if (steps.length === 0) {
        return null;
    }

    return (
        <ol className="space-y-2">
            {steps.map((s, i) => (
                <li
                    key={i}
                    className={
                        i === step
                            ? 'rounded-md border border-primary/40 bg-primary/5 p-3 text-sm'
                            : i < step
                              ? 'rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground'
                              : 'rounded-md border border-dashed p-3 text-sm text-muted-foreground/60'
                    }
                >
                    <span className="mr-2 font-mono text-xs">{i + 1}.</span>
                    {s}
                </li>
            ))}
        </ol>
    );
}

export default function LabVisualizer({ slug, steps, step, onStep, mode, traces }: Props) {
    if (slug === 'aes-lab' && traces.aes) {
        return (
            <AesPanel
                trace={traces.aes}
                steps={steps}
                learnerMode="mahir"
                activeStep={step}
                onStepChange={onStep}
            />
        );
    }

    if (slug === 'des-lab' && traces.des) {
        return (
            <DesPanel trace={traces.des} steps={steps} activeStep={step} onStepChange={onStep} />
        );
    }

    if (slug === 'rsa-lab' && traces.rsa) {
        return <RsaPanel trace={traces.rsa} steps={steps} learnerMode="mahir" />;
    }

    if (slug === 'digital-signature-lab' && traces.signature) {
        return (
            <SignaturePanel
                trace={traces.signature}
                steps={steps}
                learnerMode="mahir"
                mode={mode}
            />
        );
    }

    return <GenericStepView steps={steps} step={step} />;
}
