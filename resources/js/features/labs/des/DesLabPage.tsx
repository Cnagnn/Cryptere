import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { runSimulation } from '@/lib/lab-simulations';
import { cn } from '@/lib/utils';
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

    const bentoCardClass =
        'h-full overflow-hidden border-border/70 bg-card/95 shadow-sm';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4 min-h-[calc(100vh-8rem)]">
            <div className="space-y-3">
                <Card className={cn(bentoCardClass)}>
                    <CardHeader className="gap-1">
                        <CardTitle>Input</CardTitle>
                        <CardDescription>
                            Masukkan plaintext dan kunci untuk memulai enkripsi
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="plaintext">Plaintext</Label>
                            <Input
                                id="plaintext"
                                value={plaintext}
                                onChange={(e) => setPlaintext(e.target.value)}
                                placeholder="8 karakter / 64-bit"
                                className="font-mono"
                            />
                            <p className="text-sm text-muted-foreground">
                                {plaintext.length} karakter
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="key">Key</Label>
                            <Input
                                id="key"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="8 karakter / 64-bit"
                                className="font-mono"
                            />
                            <p className="text-sm text-muted-foreground">
                                {key.length} karakter
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="py-3">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-2">
                            <Button onClick={handleEncrypt} className="flex-1">
                                Enkripsi
                            </Button>
                            <Button onClick={handleReset} variant="outline">
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {trace && (
                    <Card className={cn(bentoCardClass)}>
                        <CardHeader className="gap-1">
                            <CardTitle>Output</CardTitle>
                            <CardDescription>
                                Hasil ciphertext dari enkripsi DES
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex items-end justify-between gap-3">
                                <div>
                                    <p className="font-mono text-sm break-all">
                                        {trace.ciphertext}
                                    </p>
                                </div>
                                <Badge variant="outline">
                                    64 bit
                                </Badge>
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
