import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface PlaybackControlsProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onReset: () => void;
    currentStep: number;
    totalSteps: number;
}

export default function PlaybackControls({
    isPlaying,
    onPlayPause,
    onNext,
    onPrev,
    onReset,
    currentStep,
    totalSteps,
}: PlaybackControlsProps) {
    const progress = (currentStep / (totalSteps - 1)) * 100;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Step {currentStep + 1} / {totalSteps}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
            </div>

            <div className="flex items-center gap-2">
                <Button onClick={onReset} variant="outline" size="icon" title="Reset">
                    <RotateCcw data-icon="inline-start" />
                </Button>
                <Button
                    onClick={onPrev}
                    variant="outline"
                    size="icon"
                    disabled={currentStep === 0}
                    title="Previous step"
                >
                    <ChevronLeft data-icon="inline-start" />
                </Button>
                <Button onClick={onPlayPause} className="flex-1" title={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? (
                        <>
                            <Pause data-icon="inline-start" />
                            Pause
                        </>
                    ) : (
                        <>
                            <Play data-icon="inline-start" />
                            Play
                        </>
                    )}
                </Button>
                <Button
                    onClick={onNext}
                    variant="outline"
                    size="icon"
                    disabled={currentStep === totalSteps - 1}
                    title="Next step"
                >
                    <ChevronRight data-icon="inline-start" />
                </Button>
            </div>
        </div>
    );
}
