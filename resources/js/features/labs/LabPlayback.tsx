/**
 * LabPlayback — step slider + speed control + prev/play/next.
 */
import { ChevronLeft, ChevronRight, Gauge, Pause, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import type { PlaybackSpeed } from './useStepPlayer';

const SPEED_LABELS: Record<string, string> = {
    '0.5': '0.5x',
    '1': '1x',
    '1.5': '1.5x',
    '2': '2x',
};

interface Props {
    step: number;
    total: number;
    progress: number;
    playing: boolean;
    speed: PlaybackSpeed;
    onStep: (n: number) => void;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSpeedChange: (s: PlaybackSpeed) => void;
}

export default function LabPlayback({
    step,
    total,
    progress,
    playing,
    speed,
    onStep,
    onTogglePlay,
    onNext,
    onPrev,
    onSpeedChange,
}: Props) {
    if (total <= 1) {
        return null;
    }

    return (
        <div className="space-y-2">
            <Slider
                value={[step]}
                min={0}
                max={total - 1}
                step={1}
                onValueChange={([v]) => onStep(v!)}
                className="h-4"
            />
            <div className="flex items-center justify-between">
                <span className="text-[10px] tabular-nums text-muted-foreground">
                    {step + 1} / {total}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={onPrev}
                        disabled={step === 0}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="size-8" onClick={onTogglePlay}>
                        {playing ? (
                            <Pause className="size-3.5" />
                        ) : (
                            <Play className="size-3.5" />
                        )}
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        onClick={onNext}
                        disabled={step >= total - 1}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="size-8">
                                <Gauge className="size-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-24">
                            <DropdownMenuRadioGroup
                                value={String(speed)}
                                onValueChange={(v) => onSpeedChange(Number(v) as PlaybackSpeed)}
                            >
                                {Object.entries(SPEED_LABELS).map(([val, label]) => (
                                    <DropdownMenuRadioItem key={val} value={val} className="text-xs">
                                        {label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}