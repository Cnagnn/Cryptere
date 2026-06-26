/**
 * LabVisualizerCard — sisi kanan lab detail. Step header + GSAP-faded narasi
 * step + panel algoritma + footer playback (prev/play/next + progress).
 */
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

import FadeIn from '@/components/fade-in';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { SimulationMode } from '@/types/labs';
import LabVisualizer from './LabVisualizer';
import type {LabTraces} from './LabVisualizer';

interface Props {
    slug: string;
    mode: SimulationMode;
    steps: string[];
    step: number;
    onStep: (n: number) => void;
    playing: boolean;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    traces: LabTraces;
    hasResult: boolean;
}

export default function LabVisualizerCard({
    slug,
    mode,
    steps,
    step,
    onStep,
    playing,
    onTogglePlay,
    onNext,
    onPrev,
    traces,
    hasResult,
}: Props) {
    const total = steps.length;
    const progress = total <= 1 ? 100 : ((step + 1) / total) * 100;
    const current = steps[step] ?? '';

    return (
        <Card className="flex h-full flex-col overflow-hidden border-border/70 bg-card/95 shadow-sm">
            {/* Header: step badge + progress */}
            <div className="border-b px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                    <Badge variant="secondary" className="tabular-nums">
                        Step {Math.min(step + 1, Math.max(total, 1))} / {Math.max(total, 1)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="mt-2 h-1.5" />
            </div>

            {/* Narration */}
            {hasResult && current && (
                <div className="border-b px-4 py-3">
                    <FadeIn flushKey={step} y={4} duration={0.18}>
                        <p className="text-sm leading-relaxed">{current}</p>
                    </FadeIn>
                </div>
            )}

            {/* Visualizer */}
            <ScrollArea className="flex-1">
                <div className="p-4">
                    {hasResult ? (
                        <FadeIn flushKey={`${slug}-${step}`} y={8} duration={0.2}>
                            <LabVisualizer
                                slug={slug}
                                steps={steps}
                                step={step}
                                onStep={onStep}
                                mode={mode}
                                traces={traces}
                            />
                        </FadeIn>
                    ) : (
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>Belum ada visualisasi</EmptyTitle>
                                <EmptyDescription>
                                    Isi kunci dan input di kiri untuk memulai simulasi.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                    )}
                </div>
            </ScrollArea>

            {/* Footer: playback */}
            {hasResult && total > 1 && (
                <>
                    <Separator />
                    <div className="flex items-center gap-2 p-3">
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={onPrev}
                            disabled={step === 0}
                            title="Step sebelumnya"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button onClick={onTogglePlay} className="flex-1">
                            {playing ? (
                                <>
                                    <Pause className="size-4" />
                                    Pause
                                </>
                            ) : (
                                <>
                                    <Play className="size-4" />
                                    Play
                                </>
                            )}
                        </Button>
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={onNext}
                            disabled={step >= total - 1}
                            title="Step berikutnya"
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </>
            )}
        </Card>
    );
}
