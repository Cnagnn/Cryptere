/**
 * DesLabPage — Complete DES glass box redesign
 *
 * Layout: Side-by-side with input section (left) and visualization pipeline (right)
 * Features: Hybrid playback (auto-play + manual control), mode toggle (pemula/mahir)
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { DesTrace } from '@/types/labs';

import InputSection from './des/InputSection';
import PlaybackControls from './des/PlaybackControls';
import RoundSelector from './des/RoundSelector';
import VisualizationPipeline from './des/VisualizationPipeline';

export interface DesLabPageProps {
    trace?: DesTrace;
    onTraceUpdate?: (trace: DesTrace) => void;
}

export default function DesLabPage({ trace, onTraceUpdate }: DesLabPageProps) {
    const [learnerMode, setLearnerMode] = useState<'pemula' | 'mahir'>('pemula');
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playSpeed, setPlaySpeed] = useState(1);
    const [output, setOutput] = useState('');
    const [outputFormat, setOutputFormat] = useState<'hex' | 'binary' | 'ascii'>('hex');

    // Total steps: 0 (IP) + 16 (rounds) + 1 (FP) = 18 steps (0-17)
    const totalSteps = 18;

    // Auto-play logic
    useEffect(() => {
        if (!isPlaying || !trace) {
return;
}

        const interval = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev >= totalSteps - 1) {
                    setIsPlaying(false);

                    return prev;
                }

                return prev + 1;
            });
        }, 1000 / playSpeed);

        return () => clearInterval(interval);
    }, [isPlaying, playSpeed, trace, totalSteps]);

    // Update output when trace changes
    useEffect(() => {
        if (trace) {
            setOutput(trace.ciphertext);
        }
    }, [trace]);

    const handleNext = () => {
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    };

    const handlePrev = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const handleRoundJump = (roundIndex: number) => {
        // Round 0 = step 0 (IP), Round 1-16 = steps 1-16, Round 17 = step 17 (FP)
        setCurrentStep(roundIndex);
    };

    const handleReset = () => {
        setCurrentStep(0);
        setIsPlaying(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-screen">
            {/* Left Sidebar: Input Section */}
            <motion.div
                className="lg:col-span-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <InputSection
                    trace={trace}
                    output={output}
                    outputFormat={outputFormat}
                    onOutputFormatChange={setOutputFormat}
                    onTraceUpdate={onTraceUpdate}
                />
            </motion.div>

            {/* Right Main Area: Visualization Pipeline */}
            <motion.div
                className="lg:col-span-9"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <Card className="h-full flex flex-col border-border/70 bg-card/95 shadow-sm">
                    {/* Header with Mode Toggle */}
                    <div className="p-4 border-b border-border/50">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-semibold">Visualisasi DES</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {currentStep === 0
                                        ? 'Initial Permutation (IP)'
                                        : currentStep === totalSteps - 1
                                          ? 'Final Permutation (FP)'
                                          : `Round ${currentStep}`}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setLearnerMode(learnerMode === 'pemula' ? 'mahir' : 'pemula')}
                                    className={cn(
                                        'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                                        learnerMode === 'pemula'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80',
                                    )}
                                >
                                    {learnerMode === 'pemula' ? 'Pemula' : 'Mahir'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Visualization Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {trace ? (
                            <VisualizationPipeline
                                trace={trace}
                                currentStep={currentStep}
                                learnerMode={learnerMode}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p className="text-sm">Jalankan enkripsi untuk melihat visualisasi</p>
                            </div>
                        )}
                    </div>

                    {/* Round Selector */}
                    {trace && (
                        <>
                            <Separator />
                            <div className="p-4 border-t border-border/50">
                                <RoundSelector
                                    totalRounds={16}
                                    currentRound={currentStep === 0 ? -1 : currentStep === totalSteps - 1 ? 16 : currentStep - 1}
                                    onRoundSelect={handleRoundJump}
                                />
                            </div>
                        </>
                    )}

                    {/* Playback Controls */}
                    {trace && (
                        <>
                            <Separator />
                            <div className="p-4 border-t border-border/50">
                                <PlaybackControls
                                    isPlaying={isPlaying}
                                    onPlayPause={() => setIsPlaying(!isPlaying)}
                                    onNext={handleNext}
                                    onPrev={handlePrev}
                                    onReset={handleReset}
                                    playSpeed={playSpeed}
                                    onSpeedChange={setPlaySpeed}
                                    currentStep={currentStep}
                                    totalSteps={totalSteps}
                                />
                            </div>
                        </>
                    )}
                </Card>
            </motion.div>
        </div>
    );
}
