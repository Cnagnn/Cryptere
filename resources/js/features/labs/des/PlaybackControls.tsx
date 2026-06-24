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
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Step {currentStep + 1} / {totalSteps}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
            </div>

            <div className="flex items-center gap-2">
                <Button onClick={onReset} variant="outline" size="sm" className="h-8 w-8 p-0" title="Reset">
                    <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                <Button
                    onClick={onPrev}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentStep === 0}
                    title="Previous step"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button onClick={onPlayPause} size="sm" className="h-8 flex-1 text-xs" title={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? (
                        <><Pause className="w-3.5 h-3.5 mr-1.5" /> Pause</>
                    ) : (
                        <><Play className="w-3.5 h-3.5 mr-1.5" /> Play</>
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
                    <ChevronRight className="w-3.5 h-3.5" />
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground font-medium">Speed</span>
                <Slider
                    value={[playSpeed]}
                    onValueChange={(v) => onSpeedChange(v[0])}
                    min={0.5}
                    max={2}
                    step={0.5}
                    className="flex-1"
                />
                <span className="text-[10px] text-muted-foreground min-w-[2rem] text-right">{playSpeed.toFixed(1)}x</span>
            </div>
        </div>
    );
}
