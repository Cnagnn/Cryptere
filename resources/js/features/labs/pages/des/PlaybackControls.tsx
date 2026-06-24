/**
 * PlaybackControls — Hybrid playback controls (auto-play + manual)
 */

import { Pause, Play, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';

interface PlaybackControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onReset: () => void;
    playSpeed: number;
    onSpeedChange: (speed: number) => void;
    currentStep: number;
    totalSteps: number;
}

export default function PlaybackControls({
    isPlaying,
    onPlayPause,
    onNext,
    onPrev,
    onReset,
    playSpeed,
    onSpeedChange,
    currentStep,
    totalSteps,
}: PlaybackControlsProps) {
    const progress = (currentStep / (totalSteps - 1)) * 100;

    return (
        <div className="space-y-3">
            {/* Progress Bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                        Step {currentStep + 1} / {totalSteps}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {Math.round(progress)}%
                    </span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Playback Buttons */}
            <div className="flex items-center gap-2">
                <Button
                    onClick={onReset}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Reset"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>

                <Button
                    onClick={onPrev}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentStep === 0}
                    title="Previous step"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                <Button
                    onClick={onPlayPause}
                    size="sm"
                    className="h-8 flex-1"
                    title={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? (
                        <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 mr-2" />
                            Play
                        </>
                    )}
                </Button>

                <Button
                    onClick={onNext}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentStep === totalSteps - 1}
                    title="Next step"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Speed Control */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">
                        Kecepatan
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {playSpeed.toFixed(1)}x
                    </span>
                </div>
                <Slider
                    value={[playSpeed]}
                    onValueChange={(v) => onSpeedChange(v[0])}
                    min={0.5}
                    max={2}
                    step={0.5}
                    className="w-full"
                />
            </div>

            {/* Keyboard Shortcuts */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-2">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                    Keyboard Shortcuts
                </p>
                <div className="space-y-0.5 text-[9px] text-muted-foreground">
                    <div>
                        <span className="font-mono bg-muted px-1 rounded">Space</span> — Play/Pause
                    </div>
                    <div>
                        <span className="font-mono bg-muted px-1 rounded">→</span> — Next
                    </div>
                    <div>
                        <span className="font-mono bg-muted px-1 rounded">←</span> — Previous
                    </div>
                </div>
            </div>
        </div>
    );
}
