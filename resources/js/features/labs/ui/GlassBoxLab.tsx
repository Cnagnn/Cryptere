/**
 * GlassBoxLab — Bare visualizer dispatch.
 *
 * All orchestration (mode toggle, glossary, progress, step narration,
 * nav controls) lives in labs/show.tsx. This component only renders
 * the algorithm-specific panel.
 */

import type {
    AesTrace,
    DesTrace,
    RsaKeyGenTraceData,
    RsaSignatureTraceData,
    SimulationMode,
} from '@/types/labs';
import AesPanel from './visualizers/AesPanel';
import DesPanel from './visualizers/DesPanel';
import RsaPanel from './visualizers/RsaPanel';
import SignaturePanel from './visualizers/SignaturePanel';

export interface GlassBoxLabProps {
    slug: string;
    steps: string[];
    activeStep: number;
    onStepChange: (n: number) => void;
    learnerMode: 'pemula' | 'mahir';
    mode: SimulationMode;
    aesTrace?: AesTrace;
    desTrace?: DesTrace;
    rsaTrace?: RsaKeyGenTraceData;
    sigTrace?: RsaSignatureTraceData;
}

export default function GlassBoxLab({
    slug,
    steps,
    activeStep,
    onStepChange,
    learnerMode,
    mode,
    aesTrace,
    desTrace,
    rsaTrace,
    sigTrace,
}: GlassBoxLabProps) {
    if (slug === 'aes-lab' && aesTrace) {
        return (
            <AesPanel
                trace={aesTrace}
                steps={steps}
                learnerMode={learnerMode}
                activeStep={activeStep}
                onStepChange={onStepChange}
            />
        );
    }

    if (slug === 'des-lab' && desTrace) {
        return (
            <DesPanel
                trace={desTrace}
                steps={steps}
                activeStep={activeStep}
                onStepChange={onStepChange}
            />
        );
    }

    if (slug === 'rsa-lab' && rsaTrace) {
        return (
            <RsaPanel
                trace={rsaTrace}
                steps={steps}
                learnerMode={learnerMode}
            />
        );
    }

    if (slug === 'digital-signature-lab' && sigTrace) {
        return (
            <SignaturePanel
                trace={sigTrace}
                steps={steps}
                learnerMode={learnerMode}
                mode={mode}
            />
        );
    }

    return null;
}
