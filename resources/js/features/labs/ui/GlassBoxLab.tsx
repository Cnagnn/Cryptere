/**
 * GlassBoxLab - Main Orchestrator for Algorithm Visualization
 *
 * Shell for all algorithm glass box labs. Provides:
 * - Learner mode toggle (pemula/mahir) via segmented control
 * - Searchable glossary sheet
 * - Progress + step narration with contextual highlight
 * - Algorithm-specific visualizer dispatch (AES, DES, RSA, Signature)
 * - Step navigation with play/pause auto-walkthrough
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Pause,
    Play,
    Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type {
    AesTrace,
    DesTrace,
    RsaKeyGenTraceData,
    RsaSignatureTraceData,
    SimulationMode,
} from '@/types/labs';
import { glossary } from './glossary-content';
import AesPanel from './visualizers/AesPanel';
import DesPanel from './visualizers/DesPanel';
import RsaPanel from './visualizers/RsaPanel';
import SignaturePanel from './visualizers/SignaturePanel';

export interface GlassBoxLabProps {
    slug: string;
    steps: string[];
    activeStep: number;
    onStepChange: (n: number) => void;
    learnerMode: 'pemula' | 'mahir';
    onModeChange: (m: 'pemula' | 'mahir') => void;
    mode: SimulationMode;
    isPlaying?: boolean;
    onPlayingChange?: (playing: boolean) => void;
    aesTrace?: AesTrace;
    desTrace?: DesTrace;
    rsaTrace?: RsaKeyGenTraceData;
    sigTrace?: RsaSignatureTraceData;
}

type GlossaryEntry = {
    term: string;
    definition: string;
};

export default function GlassBoxLab(props: GlassBoxLabProps) {
    const {
        slug,
        steps,
        activeStep,
        onStepChange,
        learnerMode,
        onModeChange,
        mode,
        isPlaying = false,
        onPlayingChange,
        aesTrace,
        desTrace,
        rsaTrace,
        sigTrace,
    } = props;

    const currentGlossary =
        (glossary as Record<string, Record<string, GlossaryEntry>>)[slug] ??
        {};
    const total = steps.length;
    const progress = total <= 1 ? 100 : ((activeStep + 1) / total) * 100;

    const goPrev = () => activeStep > 0 && onStepChange(activeStep - 1);
    const goNext = () =>
        activeStep < total - 1 && onStepChange(activeStep + 1);

    return (
        <Card
            className={cn(
                'lg:col-span-8 flex min-h-96 flex-col border-border/70 bg-card/95 shadow-sm',
            )}
        >
            <CardContent className="flex flex-1 flex-col gap-3 p-4 min-h-0">
                {/* Top bar: mode toggle (all labs except DES) + glossary */}
                <div className="flex items-center justify-between gap-3">
                    {slug !== 'des-lab' && (
                        <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
                        <button
                            onClick={() => onModeChange('pemula')}
                            className={cn(
                                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                                learnerMode === 'pemula'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <Sparkles className="size-3" />
                            Pemula
                        </button>
                        <button
                            onClick={() => onModeChange('mahir')}
                            className={cn(
                                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                                learnerMode === 'mahir'
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <BookOpen className="size-3" />
                            Mahir
                        </button>
                    </div>
                    )}

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-xs"
                                aria-label="Buka glossary istilah kriptografi"
                            >
                                <BookOpen className="size-3.5" />
                                Istilah
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-80">
                            <SheetHeader>
                                <SheetTitle>
                                    Istilah Kriptografi
                                </SheetTitle>
                            </SheetHeader>
                            <ScrollArea className="h-[calc(100vh-8rem)]">
                                <Command className="rounded-lg border">
                                    <CommandInput placeholder="Cari istilah..." />
                                    <CommandList>
                                        <CommandEmpty>
                                            Tidak ditemukan.
                                        </CommandEmpty>
                                        {Object.entries(currentGlossary).map(
                                            ([key, item]) => (
                                                <CommandItem
                                                    key={key}
                                                    value={key}
                                                >
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-sm">
                                                            {item.term}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {item.definition}
                                                        </div>
                                                    </div>
                                                </CommandItem>
                                            ),
                                        )}
                                    </CommandList>
                                </Command>
                            </ScrollArea>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Progress bar */}
                <div>
                    <Progress value={progress} className="h-1.5" />
                </div>

                {/* Step narration */}
                <div className="rounded-lg border bg-muted/30 p-3 min-h-16">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={activeStep}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            transition={{ duration: 0.15 }}
                            className="text-sm leading-relaxed"
                        >
                            {steps[activeStep]}
                        </motion.p>
                    </AnimatePresence>
                </div>

                {/* Algorithm visualization */}
                <div className="flex-1 min-h-0 overflow-auto rounded-lg">
                    {slug === 'aes-lab' && aesTrace && (
                        <AesPanel
                            trace={aesTrace}
                            steps={steps}
                            learnerMode={learnerMode}
                            activeStep={activeStep}
                            onStepChange={onStepChange}
                        />
                    )}
                    {slug === 'des-lab' && desTrace && (
                        <DesPanel
                            trace={desTrace}
                            steps={steps}
                            activeStep={activeStep}
                            onStepChange={onStepChange}
                        />
                    )}
                    {slug === 'rsa-lab' && rsaTrace && (
                        <RsaPanel
                            trace={rsaTrace}
                            steps={steps}
                            learnerMode={learnerMode}
                        />
                    )}
                    {slug === 'digital-signature-lab' && sigTrace && (
                        <SignaturePanel
                            trace={sigTrace}
                            steps={steps}
                            learnerMode={learnerMode}
                            mode={mode}
                        />
                    )}
                </div>

                {/* Navigation controls */}
                <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goPrev}
                        disabled={activeStep === 0}
                        className="gap-1"
                    >
                        <ChevronLeft className="size-4" />
                        Sebelumnya
                    </Button>

                    <div className="flex items-center gap-2">
                        {onPlayingChange && total > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() =>
                                    onPlayingChange(!isPlaying)
                                }
                                aria-label={
                                    isPlaying
                                        ? 'Jeda walkthrough'
                                        : 'Putar walkthrough'
                                }
                            >
                                {isPlaying ? (
                                    <Pause className="size-4" />
                                ) : (
                                    <Play className="size-4" />
                                )}
                            </Button>
                        )}
                        <Badge variant="outline" className="tabular-nums">
                            {activeStep + 1} / {total}
                        </Badge>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goNext}
                        disabled={activeStep >= total - 1}
                        className="gap-1"
                    >
                        Selanjutnya
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
