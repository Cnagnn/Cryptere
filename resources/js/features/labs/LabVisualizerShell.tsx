/**
 * LabVisualizerShell — wraps the visualizer + step narration + playback.
 * No nested ScrollArea — parent LabWorkshop container handles overflow.
 */
import FadeIn from '@/components/fade-in';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import type { SimulationMode } from '@/types/labs';
import LabPlayback from './LabPlayback';
import LabVisualizer from './LabVisualizer';
import type { LabTraces } from './LabVisualizer';
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
    const stepLabel = total > 0 ? `${step + 1} / ${total}` : 'Belum mulai';

    return (
        <div className="flex min-h-[520px] flex-col">
            <div className="border-b px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold">Visualisasi langkah</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Ikuti proses algoritma per tahap, bukan sekadar melihat hasil akhir.
                        </p>
                    </div>
                    <Badge variant={hasResult ? 'default' : 'secondary'} className="shrink-0 font-mono text-[11px]">
                        {stepLabel}
                    </Badge>
                </div>
                {hasResult && total > 1 && <Progress value={progress} className="mt-3 h-1.5" />}
            </div>

            {hasResult && current && (
                <div className="border-b bg-muted/20 px-4 py-3 sm:px-5">
                    <FadeIn flushKey={step} y={4} duration={0.15}>
                        <div className="flex gap-3">
                            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {step + 1}
                            </span>
                            <p className="text-sm leading-relaxed">{current}</p>
                        </div>
                    </FadeIn>
                </div>
            )}

            <div className="flex min-h-0 flex-1 items-center px-4 py-4 sm:px-5">
                {hasResult ? (
                    <FadeIn flushKey={`${slug}-${step}`} y={8} duration={0.15}>
                        <LabVisualizer
                            slug={slug} steps={steps} step={step}
                            onStep={onStep} mode={mode} traces={traces}
                        />
                    </FadeIn>
                ) : (
                    <div className="flex min-h-80 w-full items-center justify-center rounded-xl border border-dashed bg-muted/10">
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>Siap divisualisasikan</EmptyTitle>
                                <EmptyDescription>
                                    Pilih contoh atau masukkan input sendiri untuk memulai alur step-by-step.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    </div>
                )}
            </div>

            <div className="border-t bg-muted/20 px-4 py-3 sm:px-5">
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
