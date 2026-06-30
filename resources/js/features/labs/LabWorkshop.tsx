/**
 * LabWorkshop — visualizer card (right panel) with step narration + playback.
 */
import type { SimulationMode } from '@/types/labs';
import type { LabTraces } from './LabVisualizer';
import LabVisualizerShell from './LabVisualizerShell';
import type { PlaybackSpeed } from './useStepPlayer';

interface Props {
    slug: string;
    mode: SimulationMode;
    steps: string[];
    step: number;
    total: number;
    progress: number;
    playing: boolean;
    speed: PlaybackSpeed;
    traces: LabTraces;
    hasResult: boolean;
    onStep: (n: number) => void;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSpeedChange: (s: PlaybackSpeed) => void;
}

export default function LabWorkshop({
    slug,
    mode,
    steps,
    step,
    total,
    progress,
    playing,
    speed,
    traces,
    hasResult,
    onStep,
    onTogglePlay,
    onNext,
    onPrev,
    onSpeedChange,
}: Props) {
    return (
        <main className="min-w-0">
            <div className="relative flex h-full flex-col rounded-2xl border pt-0">
                <LabVisualizerShell
                    slug={slug}
                    mode={mode}
                    steps={steps}
                    step={step}
                    total={total}
                    progress={progress}
                    playing={playing}
                    speed={speed}
                    traces={traces}
                    hasResult={hasResult}
                    onStep={onStep}
                    onTogglePlay={onTogglePlay}
                    onNext={onNext}
                    onPrev={onPrev}
                    onSpeedChange={onSpeedChange}
                />
            </div>
        </main>
    );
}