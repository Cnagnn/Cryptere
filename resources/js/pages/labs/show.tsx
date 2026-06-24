import { Head } from '@inertiajs/react';

import { AnimatePresence, motion } from 'framer-motion';
import {
    BookOpen,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Info,
    Key,
    Menu,
    Pause,
    Play,
    RotateCcw,
    Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Command,
    CommandEmpty,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import DesLabPage from '@/features/labs/pages/DesLabPage';
import GlassBoxLab from '@/features/labs/ui/GlassBoxLab';
import { glossary } from '@/features/labs/ui/glossary-content';
import {
    canFormatOutput,
    conceptLensByLab,
    defaultTextByLab,
    formatLabel,
    formatOptions,
    formatOutputValue,
    inputHelperByLab,
    inputLabelByLab,
    inputPlaceholderByLab,
    keyLabelByLab,
    keyPlaceholderByLab,
    modeDescription,
    normalizeInputForSimulation,
    onboardingByLab,
    runSimulation,
    validationErrorByLab,
} from '@/lib/lab-simulations';
import { cn } from '@/lib/utils';
import type {
    AesTrace,
    DesTrace,
    FormatValue,
    LabShowProps,
    RsaKeyGenTraceData,
    RsaSignatureTraceData,
    SimulationMode,
    SimulationResult,
} from '@/types/labs';

// ── Helpers ──────────────────────────────────────────────────────────────────

const bentoCardClass = 'h-full overflow-hidden border-border/70 bg-card/95 shadow-sm';

type GlossaryEntry = { term: string; definition: string };

function keySetupByLab(slug: string): string[] {
    switch (slug) {
        case 'caesar-cipher-lab':
            return [
                'Pilih angka pergeseran sebagai kunci.',
                'Angka yang sama dipakai untuk membalik pergeseran saat dekripsi.',
            ];
        case 'vigenere-cipher-lab':
            return [
                'Tentukan kata kunci berisi huruf A-Z.',
                'Setiap huruf kata kunci berubah menjadi nilai pergeseran posisi.',
            ];
        case 'aes-lab':
            return [
                'Siapkan satu kunci simetris bersama.',
                'Kunci yang sama digunakan untuk proses enkripsi dan dekripsi.',
            ];
        case 'des-lab':
            return [
                'Gunakan kunci 64-bit dalam 16 karakter hex.',
                'Kunci putaran diturunkan dari kunci utama untuk tiap putaran Feistel.',
            ];
        case 'rsa-lab':
            return [
                'Buat dua bilangan prima kecil untuk simulasi: p=61 dan q=53.',
                'Turunkan kunci publik (e, n) untuk enkripsi dan kunci privat (d, n) untuk dekripsi.',
            ];
        case 'digital-signature-lab':
            return [
                'Siapkan kunci tanda tangan sebagai representasi kunci privat.',
                'Kunci dipakai untuk membuat atau memverifikasi token tanda tangan.',
            ];
        default:
            return [
                'Tentukan parameter kunci yang dibutuhkan algoritma.',
                'Gunakan parameter yang sama atau pasangannya saat proses dibalik.',
            ];
    }
}

function labSummaryBySlug(slug: string, fallback: string): string {
    switch (slug) {
        case 'caesar-cipher-lab':
            return 'Pelajari pergeseran alfabet klasik dan bagaimana kunci angka mengubah setiap huruf.';
        case 'vigenere-cipher-lab':
            return 'Pelajari sandi berbasis kata kunci yang memakai pergeseran berbeda di tiap posisi.';
        case 'aes-lab':
            return 'Pelajari konsep kunci simetris dan pencampuran byte pada sandi blok modern.';
        case 'des-lab':
            return 'Pelajari alur Feistel dan putaran kunci pada sandi blok klasik.';
        case 'rsa-lab':
            return 'Pelajari dasar kunci publik, kunci privat, dan aritmetika modular RSA.';
        case 'digital-signature-lab':
            return 'Pelajari bagaimana pesan diringkas, ditandatangani, lalu diverifikasi.';
        default:
            return fallback;
    }
}

function formatLabelInIndonesian(value: FormatValue): string {
    if (value === 'decimal') {
        return 'Byte desimal';
    }

    return formatLabel(value);
}

// ── Sidebar content ──────────────────────────────────────────────────────────

function LabSidebar({
    lab,
    mode,
    inputText,
    setInputText,
    keyInput,
    setKeyInput,
    inputFormat,
    setInputFormat,
    outputFormat,
    setOutputFormat,
    validationError,
    learnerMode,
    showDetails,
    setShowDetails,
    conceptLens,
    keySetupSteps,
    onboardingSteps,
    showKeyInput,
    onReset,
}: {
    lab: LabShowProps['lab'];
    mode: SimulationMode;
    inputText: string;
    setInputText: (s: string) => void;
    keyInput: string;
    setKeyInput: (s: string) => void;
    inputFormat: FormatValue;
    setInputFormat: (f: FormatValue) => void;
    outputFormat: FormatValue;
    setOutputFormat: (f: FormatValue) => void;
    validationError: string | null;
    learnerMode: 'pemula' | 'mahir';
    showDetails: boolean;
    setShowDetails: (b: boolean) => void;
    conceptLens: { title: string; points: string[] };
    keySetupSteps: string[];
    onboardingSteps: string[];
    showKeyInput: boolean;
    onReset: () => void;
}) {
    return (
        <div className="flex flex-col gap-4">
            {/* Input + Key */}
            <Card className={cn(bentoCardClass)}>
                <CardHeader className="gap-1 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Key className="size-4 text-muted-foreground" />
                        Data dan Kunci
                    </CardTitle>
                    <CardDescription className="text-sm/6">
                        Masukkan pesan dan kunci untuk memulai simulasi.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="lab-input">
                            {inputLabelByLab(lab.slug, mode)}
                        </Label>
                        <Textarea
                            id="lab-input"
                            aria-describedby={
                                validationError
                                    ? 'validation-error-message'
                                    : undefined
                            }
                            value={inputText}
                            onChange={(event) => setInputText(event.target.value)}
                            placeholder={inputPlaceholderByLab(lab.slug, mode)}
                            className="min-h-20 resize-none text-sm font-mono"
                        />
                        <p className="text-sm/6 text-muted-foreground">
                            {inputHelperByLab(lab.slug, mode)}
                        </p>
                    </div>

                    {showKeyInput ? (
                        <div className="space-y-2">
                            <Label htmlFor="lab-key">
                                {keyLabelByLab(lab.slug, mode)}
                            </Label>
                            <Input
                                id="lab-key"
                                value={keyInput}
                                onChange={(event) => setKeyInput(event.target.value)}
                                placeholder={keyPlaceholderByLab(lab.slug, mode)}
                                className="font-mono"
                            />
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {keySetupSteps[0]}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {keySetupSteps[1]}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Kunci RSA</Label>
                            <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
                                <p className="font-medium">
                                    Kunci publik: (e=17, n=3233)
                                </p>
                                <p className="text-muted-foreground">
                                    Kunci privat: (d=2753, n=3233)
                                </p>
                            </div>
                        </div>
                    )}

                    {validationError && (
                        <Alert variant="destructive" className="py-3" role="alert">
                            <AlertDescription id="validation-error-message">
                                {validationError}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Format selectors (mahir only) + reset */}
                    <div className="flex flex-wrap items-end gap-3">
                        {learnerMode === 'mahir' && (
                            <>
                                <div className="space-y-2 min-w-32">
                                    <Label className="text-xs">Format masukan</Label>
                                    <Select
                                        value={inputFormat}
                                        onValueChange={(value) =>
                                            setInputFormat(value as FormatValue)
                                        }
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formatOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {formatLabelInIndonesian(option.value)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 min-w-32">
                                    <Label className="text-xs">Format keluaran</Label>
                                    <Select
                                        value={outputFormat}
                                        onValueChange={(value) =>
                                            setOutputFormat(value as FormatValue)
                                        }
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formatOptions.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {formatLabelInIndonesian(option.value)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5 ml-auto"
                            onClick={onReset}
                        >
                            <RotateCcw className="size-3.5" />
                            Atur ulang
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Onboarding (pemula only) */}
            {learnerMode === 'pemula' && (
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">🎯</span>
                        <span className="text-sm font-semibold">Mulai dari sini</span>
                    </div>
                    <div className="grid gap-2">
                        {onboardingSteps.map((step, index) => (
                            <div key={index} className="flex gap-2 text-sm">
                                <Badge
                                    variant="secondary"
                                    className="mt-0.5 size-5 shrink-0 justify-center rounded-full p-0 text-[10px] bg-blue-100 dark:bg-blue-900"
                                >
                                    {index + 1}
                                </Badge>
                                <span className="leading-relaxed text-muted-foreground">
                                    {step}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Concept card */}
            <Card className={cn(bentoCardClass)}>
                <CardHeader className="gap-1 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Info className="size-4 text-muted-foreground" />
                        {conceptLens.title}
                    </CardTitle>
                    <CardDescription className="text-sm/6">
                        {modeDescription(lab.slug, mode)}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                        <div className="space-y-2">
                            {conceptLens.points
                                .slice(0, showDetails ? undefined : 2)
                                .map((point, index) => (
                                    <div key={point} className="flex gap-2 text-sm">
                                        <Badge
                                            variant="secondary"
                                            className="mt-0.5 size-5 shrink-0 justify-center rounded-full p-0 text-[10px]"
                                        >
                                            {index + 1}
                                        </Badge>
                                        <span className="leading-relaxed">{point}</span>
                                    </div>
                                ))}
                        </div>
                        {conceptLens.points.length > 2 && (
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-2 text-xs gap-1"
                                >
                                    {showDetails
                                        ? 'Sembunyikan'
                                        : `+${conceptLens.points.length - 2} lainnya`}
                                    <ChevronDown
                                        className={cn(
                                            'size-3.5 transition-transform',
                                            showDetails && 'rotate-180',
                                        )}
                                    />
                                </Button>
                            </CollapsibleTrigger>
                        )}
                    </Collapsible>
                </CardContent>
            </Card>
        </div>
    );
}

// ── Glossary sheet (shared) ──────────────────────────────────────────────────

function GlossarySheet({ slug }: { slug: string }) {
    const currentGlossary =
        (glossary as Record<string, Record<string, GlossaryEntry>>)[slug] ?? {};

    return (
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
                    <SheetTitle>Istilah Kriptografi</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)]">
                    <Command className="rounded-lg border">
                        <CommandInput placeholder="Cari istilah..." />
                        <CommandList>
                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                            {Object.entries(currentGlossary).map(([key, item]) => (
                                <CommandItem key={key} value={key}>
                                    <div className="space-y-1">
                                        <div className="font-medium text-sm">
                                            {item.term}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.definition}
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

// ── Learner mode toggle ──────────────────────────────────────────────────────

function LearnerModeToggle({
    learnerMode,
    onModeChange,
}: {
    learnerMode: 'pemula' | 'mahir';
    onModeChange: (m: 'pemula' | 'mahir') => void;
}) {
    return (
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
    );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function LabsShow({ lab }: LabShowProps) {
    const [mode, setMode] = useState<SimulationMode>('encrypt');
    const [inputText, setInputText] = useState(defaultTextByLab(lab.slug));
    const [keyInput, setKeyInput] = useState(keyPlaceholderByLab(lab.slug, mode));
    const [inputFormat, setInputFormat] = useState<FormatValue>('ascii');
    const [outputFormat, setOutputFormat] = useState<FormatValue>('ascii');
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [isWalkthroughPlaying, setIsWalkthroughPlaying] = useState(false);
    const [learnerMode, setLearnerMode] = useState<'pemula' | 'mahir'>('pemula');
    const [showDetails, setShowDetails] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const conceptLens = useMemo(
        () => conceptLensByLab(lab.slug, mode),
        [lab.slug, mode],
    );
    const keySetupSteps = useMemo(() => keySetupByLab(lab.slug), [lab.slug]);
    const onboardingSteps = useMemo(() => onboardingByLab(lab.slug), [lab.slug]);

    const normalizedInput = useMemo(
        () => normalizeInputForSimulation(lab.slug, mode, inputText, inputFormat),
        [inputFormat, inputText, lab.slug, mode],
    );

    const validationError = useMemo(() => {
        if (normalizedInput.error !== null) {
            return normalizedInput.error;
        }

        if (normalizedInput.value === null) {
            return 'Input tidak dapat disesuaikan dengan mode algoritma ini.';
        }

        return validationErrorByLab(lab.slug, mode, normalizedInput.value, keyInput);
    }, [
        keyInput,
        lab.slug,
        mode,
        normalizedInput.error,
        normalizedInput.value,
    ]);

    const rawResult = useMemo(() => {
        if (validationError !== null) {
            return {
                outputLabel: 'Validasi diperlukan',
                output: 'Perbaiki input atau kunci untuk melihat hasil simulasi.',
                steps: [validationError],
            } as SimulationResult;
        }

        return runSimulation(
            lab.slug,
            mode,
            normalizedInput.value ?? '',
            keyInput,
        );
    }, [keyInput, lab.slug, mode, normalizedInput.value, validationError]);

    const outputPresentation = useMemo(() => {
        if (!canFormatOutput(lab.slug, mode)) {
            return {
                value: rawResult.output,
                error: 'Output ditampilkan apa adanya karena formatnya khusus untuk lab ini.',
            };
        }

        return formatOutputValue(rawResult.output, outputFormat);
    }, [lab.slug, mode, outputFormat, rawResult.output]);

    const pageSummary = labSummaryBySlug(lab.slug, lab.summary);
    const translatedSteps = rawResult.steps;
    const translatedOutputLabel = rawResult.outputLabel;

    const total = translatedSteps.length;
    const progress = total <= 1 ? 100 : ((activeStepIndex + 1) / total) * 100;
    const safeActiveStepIndex = Math.min(activeStepIndex, Math.max(0, total - 1));
    const showKeyInput = lab.slug !== 'rsa-lab';

    // Extract trace data
    const rawTrace = (rawResult as { trace?: { aes?: AesTrace; des?: DesTrace; rsa?: RsaKeyGenTraceData; signature?: RsaSignatureTraceData } }).trace;
    const algoTrace = {
        aes: rawTrace?.aes,
        des: rawTrace?.des,
        rsa: rawTrace?.rsa,
        signature: rawTrace?.signature,
    };

    const goPrev = () =>
        safeActiveStepIndex > 0 && setActiveStepIndex(safeActiveStepIndex - 1);
    const goNext = () =>
        safeActiveStepIndex < total - 1 &&
        setActiveStepIndex(safeActiveStepIndex + 1);

    const handleReset = () => {
        setInputText(defaultTextByLab(lab.slug));
        setKeyInput(keyPlaceholderByLab(lab.slug, 'encrypt'));
        setInputFormat('ascii');
        setOutputFormat('ascii');
        setMode('encrypt');
    };

    useEffect(() => {
        setActiveStepIndex(0);
        setIsWalkthroughPlaying(false);
        setLearnerMode('pemula');
    }, [inputFormat, inputText, keyInput, mode, outputFormat]);

    useEffect(() => {
        if (lab.slug === 'digital-signature-lab') {
            setKeyInput(keyPlaceholderByLab(lab.slug, mode));
        }
    }, [lab.slug, mode]);

    useEffect(() => {
        if (!isWalkthroughPlaying || total <= 1) {
            return;
        }

        const intervalId = setInterval(() => {
            setActiveStepIndex((currentIndex) => {
                const lastStepIndex = Math.max(0, total - 1);

                if (currentIndex >= lastStepIndex) {
                    setIsWalkthroughPlaying(false);

                    return currentIndex;
                }

                return currentIndex + 1;
            });
        }, 1200);

        return () => clearInterval(intervalId);
    }, [isWalkthroughPlaying, total]);

    // Keyboard shortcuts: ← → for step navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement)?.tagName;

            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
                return;
            }

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goPrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safeActiveStepIndex, total]);

    const sidebarProps = {
        lab,
        mode,
        inputText,
        setInputText,
        keyInput,
        setKeyInput,
        inputFormat,
        setInputFormat,
        outputFormat,
        setOutputFormat,
        validationError,
        learnerMode,
        showDetails,
        setShowDetails,
        conceptLens,
        keySetupSteps,
        onboardingSteps,
        showKeyInput,
        onReset: handleReset,
    };

    // Special handling for DES lab with new redesigned page
    if (lab.slug === 'des-lab') {
        return (
            <>
                <Head title={`${lab.title} Lab`} />
                <div className="relative flex flex-col gap-4 px-4 pt-3 pb-4 lg:gap-6 lg:pt-3 lg:pb-4">
                    {/* Header */}
                    <header className="animate-fade-in-up flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex min-w-0 flex-col gap-1">
                            <TypographyH1>{lab.title}</TypographyH1>
                            <TypographyMuted>{pageSummary}</TypographyMuted>
                        </div>
                    </header>

                    {/* DES Lab Page */}
                    <DesLabPage trace={algoTrace.des} onTraceUpdate={() => {}} />
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`${lab.title} Lab`} />

            <div className="relative flex flex-col gap-4 px-4 pt-3 pb-4 lg:gap-6 lg:pt-3 lg:pb-4">
                {/* Header */}
                <header className="animate-fade-in-up flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                        <TypographyH1>{lab.title}</TypographyH1>
                        <TypographyMuted>{pageSummary}</TypographyMuted>
                    </div>
                    <div className="flex w-full items-center justify-start gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                        <Tabs
                            value={mode}
                            onValueChange={(value) => setMode(value as SimulationMode)}
                            className="w-full sm:w-auto"
                        >
                            <TabsList className="grid h-10 w-full grid-cols-2 sm:w-80">
                                <TabsTrigger value="encrypt" className="gap-2">
                                    Enkripsi
                                </TabsTrigger>
                                <TabsTrigger value="decrypt" className="gap-2">
                                    Dekripsi
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </header>

                {/* Mobile sidebar trigger */}
                <div className="lg:hidden">
                    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Menu className="mr-2 size-4" />
                                Konfigurasi Lab
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-85 p-0 overflow-y-auto">
                            <SheetHeader className="border-b px-4 py-3">
                                <SheetTitle>Konfigurasi Lab</SheetTitle>
                            </SheetHeader>
                            <div className="p-3">
                                <LabSidebar {...sidebarProps} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Sidebar + Main content */}
                <section
                    className="animate-fade-in-up grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start"
                    style={{ animationDelay: '100ms' }}
                >
                    {/* Desktop sidebar */}
                    <div className="hidden lg:block">
                        <LabSidebar {...sidebarProps} />
                    </div>

                    {/* Main content */}
                    <main className="min-w-0 space-y-4">
                        {/* Visualizer container */}
                        <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border pt-0">
                            {/* Container header: mode toggle + glossary + progress */}
                            <div className="border-b px-4 py-3 sm:px-5">
                                <div className="flex items-center justify-between gap-3">
                                    <LearnerModeToggle
                                        learnerMode={learnerMode}
                                        onModeChange={setLearnerMode}
                                    />
                                    <GlossarySheet slug={lab.slug} />
                                </div>
                                <div className="mt-3">
                                    <Progress value={progress} className="h-1.5" />
                                </div>
                            </div>

                            {/* Step narration */}
                            <div className="px-4 pt-3 sm:px-5">
                                <div className="rounded-lg border bg-muted/30 p-3 min-h-16">
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={safeActiveStepIndex}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 8 }}
                                            transition={{ duration: 0.15 }}
                                            className="text-sm leading-relaxed"
                                        >
                                            {translatedSteps[safeActiveStepIndex]}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Visualizer */}
                            <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-5">
                                <GlassBoxLab
                                    slug={lab.slug}
                                    steps={translatedSteps}
                                    activeStep={safeActiveStepIndex}
                                    onStepChange={setActiveStepIndex}
                                    learnerMode={learnerMode}
                                    mode={mode}
                                    aesTrace={algoTrace.aes}
                                    desTrace={algoTrace.des}
                                    rsaTrace={algoTrace.rsa}
                                    sigTrace={algoTrace.signature}
                                />
                            </div>

                            {/* Footer nav: prev/next + step indicator */}
                            <div className="border-t bg-muted/20 p-4 sm:p-5">
                                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goPrev}
                                        disabled={safeActiveStepIndex === 0}
                                        className="gap-1"
                                    >
                                        <ChevronLeft className="size-4" />
                                        Sebelumnya
                                    </Button>

                                    <div className="flex items-center gap-2">
                                        {total > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                onClick={() =>
                                                    setIsWalkthroughPlaying(!isWalkthroughPlaying)
                                                }
                                                aria-label={
                                                    isWalkthroughPlaying
                                                        ? 'Jeda walkthrough'
                                                        : 'Putar walkthrough'
                                                }
                                            >
                                                {isWalkthroughPlaying ? (
                                                    <Pause className="size-4" />
                                                ) : (
                                                    <Play className="size-4" />
                                                )}
                                            </Button>
                                        )}
                                        <Badge variant="outline" className="tabular-nums">
                                            {safeActiveStepIndex + 1} / {total}
                                        </Badge>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goNext}
                                        disabled={safeActiveStepIndex >= total - 1}
                                        className="gap-1"
                                    >
                                        Selanjutnya
                                        <ChevronRight className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Result card */}
                        <Card className={cn(bentoCardClass)}>
                            <CardHeader className="gap-1 pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    Hasil Akhir
                                </CardTitle>
                                <CardDescription className="text-sm/6">
                                    {translatedOutputLabel} dalam format{' '}
                                    {formatLabelInIndonesian(outputFormat)}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="min-h-40 rounded-lg bg-muted/40 p-3 text-sm leading-relaxed break-all font-mono">
                                    {outputPresentation.value || (
                                        <span className="text-muted-foreground italic font-sans">
                                            Menunggu input...
                                        </span>
                                    )}
                                </div>
                                {outputPresentation.error && (
                                    <p className="text-sm/6 text-muted-foreground">
                                        {outputPresentation.error}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </main>
                </section>
            </div>
        </>
    );
}
