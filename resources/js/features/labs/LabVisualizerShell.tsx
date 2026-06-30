/**
 * LabVisualizerShell — wraps the visualizer + step narration + playback.
 * No nested ScrollArea — parent LabWorkshop container handles overflow.
 */
import FadeIn from '@/components/fade-in';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import type { SimulationMode } from '@/types/labs';
import LabPlayback from './LabPlayback';
import LabVisualizer from './LabVisualizer';
import type {LabTraces} from './LabVisualizer';
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

export default function LabVisualizerShell({
    slug, mode, steps, step, total, progress, playing, speed,
    traces, hasResult, onStep, onTogglePlay, onNext, onPrev, onSpeedChange,
}: Props) {
    const current = steps[step] ?? '';

    return (
        <div className="flex flex-col">
            {/* Narration */}
            {hasResult && current && (
                <div className="border-y px-4 py-2.5 sm:px-5">
                    <FadeIn flushKey={step} y={4} duration={0.15}>
                        <p className="text-sm leading-relaxed">{current}</p>
                    </FadeIn>
                </div>
            )}

            {/* Visualizer — no nested scroll, no wrapper overflow */}
            <div className="min-h-0 px-4 py-3 sm:px-5 sm:py-4">
                {hasResult ? (
                    <FadeIn flushKey={`${slug}-${step}`} y={8} duration={0.15}>
                        <LabVisualizer
                            slug={slug} steps={steps} step={step}
                            onStep={onStep} mode={mode} traces={traces}
                        />
                    </FadeIn>
                ) : (
                    <div className="flex h-40 items-center justify-center">
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>Belum ada visualisasi</EmptyTitle>
                                <EmptyDescription>
                                    Masukkan kunci dan input untuk memulai simulasi.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    </div>
                )}
            </div>

            {/* Playback */}
            <div className="border-t px-4 py-2.5 sm:px-5">
                <LabPlayback
                    step={step} total={total} progress={progress}
                    playing={playing} speed={speed}
                    onStep={onStep} onTogglePlay={onTogglePlay}
                    onNext={onNext} onPrev={onPrev} onSpeedChange={onSpeedChange}
                />
            </div>
        </div>
    );
}