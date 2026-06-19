/**
 * GlassBoxLab - Main Orchestrator for Algorithm Visualization
 *
 * This component orchestrates the visualization of cryptographic algorithm labs.
 * It provides:
 * - Learner mode toggle (pemula/mahir)
 * - Searchable glossary sheet
 * - Step navigation (prev/next)
 * - Algorithm-specific visualizers (AES, DES, RSA, Signature)
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
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
import type { AesTrace, DesTrace, SimulationMode } from '@/types/labs';
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
    // Optional traces
    aesTrace?: AesTrace;
    desTrace?: DesTrace;
    rsaTrace?: {
        p: string;
        q: string;
        n: string;
        phi: string;
        e: string;
        d: string;
        keyGenSteps: string[];
    };
    sigTrace?: {
        digestHex: string;
        digestPrefix: string;
        signatureInt?: string;
        isValid?: boolean;
        explanationSteps: string[];
    };
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
        aesTrace,
        desTrace,
        rsaTrace,
        sigTrace,
    } = props;

    const currentGlossary = (glossary as Record<string, Record<string, GlossaryEntry>>)[slug] ?? {};
    const total = steps.length;
    const progress = total <= 1 ? 100 : ((activeStep + 1) / total) * 100;

    const goPrev = () => {
        if (activeStep > 0) {
            onStepChange(activeStep - 1);
        }
    };

    const goNext = () => {
        if (activeStep < total - 1) {
            onStepChange(activeStep + 1);
        }
    };

    const toggleMode = () => {
        onModeChange(learnerMode === 'pemula' ? 'mahir' : 'pemula');
    };

    return (
        <Card className="lg:col-span-8 flex min-h-96 flex-col">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                    {/* Learner mode toggle */}
                    <Button
                        variant={learnerMode === 'mahir' ? 'default' : 'outline'}
                        size="sm"
                        onClick={toggleMode}
                    >
                        {learnerMode === 'pemula' ? '📘 Pemula' : '⚙️ Mahir'}
                    </Button>

                    {/* Glossary sheet */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="sm">
                                📖 Istilah
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-80">
                            <SheetHeader>
                                <SheetTitle>Istilah Kriptografi</SheetTitle>
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
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-3 min-h-0">
                {/* Progress bar */}
                <Progress value={progress} />

                {/* Step narration */}
                <div className="rounded-lg border bg-muted/30 p-4 min-h-16">
                    <p className="text-sm leading-relaxed">
                        {steps[activeStep]}
                    </p>
                </div>

                {/* Algorithm visualization */}
                <div className="flex-1 min-h-0 overflow-auto">
                    {slug === 'aes-lab' && aesTrace && (
                        <AesPanel
                            trace={aesTrace}
                            steps={steps}
                            learnerMode={learnerMode}
                            activeStep={activeStep}
                        />
                    )}
                    {slug === 'des-lab' && desTrace && (
                        <DesPanel
                            trace={desTrace}
                            steps={steps}
                            learnerMode={learnerMode}
                            activeStep={activeStep}
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
                <div className="flex items-center justify-between gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={activeStep === 0}
                        onClick={goPrev}
                    >
                        ← Sebelumnya
                    </Button>
                    <Badge variant="outline" className="tabular-nums">
                        {activeStep + 1}/{total}
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={activeStep >= total - 1}
                        onClick={goNext}
                    >
                        Selanjutnya →
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
