import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { runSimulation } from '@/lib/lab-simulations';
import type { DesTrace } from '@/types/labs';

import PlaybackControls from './PlaybackControls';
import { FeistelRoundSlide, FinalPermutationSlide, InitialPermutationSlide } from './slides';
import StepBar from './StepBar';
import TimelineView from './TimelineView';

export default function DesLabPage() {
    const [plaintext, setPlaintext] = useState('');
    const [key, setKey] = useState('');
    const [trace, setTrace] = useState<DesTrace | null>(null);
    const [error, setError] = useState('');

    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);
    const totalSteps = 18;

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
        }, 1200);

        return () => clearInterval(interval);
    }, [isPlaying, trace, totalSteps]);

    useEffect(() => {
        setCurrentStep(0);
        setIsPlaying(false);
    }, [trace]);

    const handleEncrypt = () => {
        setError('');

        if (!plaintext.trim() || !key.trim()) {
            setError('Plaintext dan key tidak boleh kosong');

            return;
        }

        try {
            const result = runSimulation('des-lab', 'encrypt', plaintext, key);

            if (result.trace?.des) {
                setTrace(result.trace.des);
            } else {
                setError('Simulasi gagal');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        }
    };

    const handleReset = () => {
        setPlaintext('');
        setKey('');
        setTrace(null);
        setError('');
        setCurrentStep(0);
        setIsPlaying(false);
    };

    const handleNext = () => setCurrentStep((p) => Math.min(p + 1, totalSteps - 1));
    const handlePrev = () => setCurrentStep((p) => Math.max(p - 1, 0));

    const renderSlide = () => {
        if (!trace) {
return null;
}

        if (currentStep === 0) {
return <InitialPermutationSlide trace={trace} />;
}

        if (currentStep >= 1 && currentStep <= 16) {
return <FeistelRoundSlide trace={trace} roundIndex={currentStep - 1} />;
}

        if (currentStep === 17) {
return <FinalPermutationSlide trace={trace} />;
}

        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 min-h-[calc(100vh-8rem)]">
            <div className="space-y-3">
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">INPUT</Badge>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] uppercase tracking-wider">Plaintext</Label>
                            <Input
                                value={plaintext}
                                onChange={(e) => setPlaintext(e.target.value)}
                                placeholder="8 karakter / 64-bit"
                                className="h-9 text-xs font-mono"
                            />
                            <p className="text-[9px] text-muted-foreground">{plaintext.length} karakter</p>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[11px] uppercase tracking-wider">Key</Label>
                            <Input
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="8 karakter / 64-bit"
                                className="h-9 text-xs font-mono"
                            />
                            <p className="text-[9px] text-muted-foreground">{key.length} karakter</p>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="py-2">
                                <AlertDescription className="text-xs">{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-2">
                            <Button onClick={handleEncrypt} size="sm" className="flex-1 h-8 text-xs">
                                Enkripsi
                            </Button>
                            <Button onClick={handleReset} variant="outline" size="sm" className="h-8 text-xs">
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {trace && (
                    <Card>
                        <CardContent className="p-4">
                            <Badge variant="outline" className="text-[10px] text-muted-foreground mb-2">OUTPUT</Badge>
                            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                                <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Ciphertext</p>
                                <p className="font-mono text-xs break-all text-foreground">{trace.ciphertext}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {trace && (
                    <>
                        <Separator />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTimeline(!showTimeline)}
                            className="w-full h-8 text-xs text-muted-foreground"
                        >
                            {showTimeline ? '⌃ Sembunyikan timeline' : '⌄ Lihat semua langkah'}
                        </Button>
                        {showTimeline && (
                            <TimelineView trace={trace} currentStep={currentStep} onStepSelect={setCurrentStep} />
                        )}
                    </>
                )}
            </div>

            <div className="flex flex-col min-h-0">
                <Card className="flex-1 flex flex-col overflow-hidden">
                    {trace && (
                        <div className="px-4 pt-3 border-b border-border/30">
                            <StepBar
                                currentStep={currentStep}
                                totalSteps={totalSteps}
                                onStepSelect={setCurrentStep}
                            />
                        </div>
                    )}

                    <ScrollArea className="flex-1">
                        <div className="p-4">
                            {trace ? (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {renderSlide()}
                                    </motion.div>
                                </AnimatePresence>
                            ) : (
                                <div className="flex items-center justify-center h-64 text-muted-foreground">
                                    <p className="text-sm">Masukkan plaintext dan key, lalu klik Enkripsi</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {trace && (
                        <div className="p-4 border-t border-border/30">
                            <PlaybackControls
                                isPlaying={isPlaying}
                                onPlayPause={() => setIsPlaying(!isPlaying)}
                                onNext={handleNext}
                                onPrev={handlePrev}
                                onReset={() => setCurrentStep(0)}
                                currentStep={currentStep}
                                totalSteps={totalSteps}
                            />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
