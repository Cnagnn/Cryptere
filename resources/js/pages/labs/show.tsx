import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import GlassBoxLab from '@/features/labs/ui/GlassBoxLab';
import { ChevronDown, Info, Key, RotateCcw } from 'lucide-react';
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
    recommendedInputFormatByLab,
    recommendedOutputFormatByLab,
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

const bentoCardClass = 'h-full overflow-hidden border-border/70 bg-card/95 shadow-sm';

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

// ── DES-specific layout ──────────────────────────────────────────────────────

function DesLayout({
    lab,
    mode,
    setMode,
    inputText,
    setInputText,
    keyInput,
    setKeyInput,
    validationError,
    rawResult,
    outputPresentation,
    translatedSteps,
    translatedOutputLabel,
    outputFormat,
    safeActiveStepIndex,
    setActiveStepIndex,
    isWalkthroughPlaying,
    setIsWalkthroughPlaying,
    algoTrace,
}: {
    lab: LabShowProps['lab'];
    mode: SimulationMode;
    setMode: (m: SimulationMode) => void;
    inputText: string;
    setInputText: (s: string) => void;
    keyInput: string;
    setKeyInput: (s: string) => void;
    validationError: string | null;
    rawResult: SimulationResult;
    outputPresentation: { value: string; error?: string };
    translatedSteps: string[];
    translatedOutputLabel: string;
    outputFormat: FormatValue;
    safeActiveStepIndex: number;
    setActiveStepIndex: (n: number) => void;
    isWalkthroughPlaying: boolean;
    setIsWalkthroughPlaying: (b: boolean) => void;
    algoTrace: {
        aes?: AesTrace;
        des?: DesTrace;
        rsa?: RsaKeyGenTraceData;
        signature?: RsaSignatureTraceData;
    };
}) {
    return (
        <div className="relative flex flex-col gap-4 px-4 pt-3 pb-4 lg:gap-5 lg:pt-3 lg:pb-4">
            <Head title={`${lab.title} Lab`} />

            {/* Header — compact */}
            <header className="animate-fade-in-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <TypographyH1 className="text-2xl">{lab.title}</TypographyH1>
                    <TypographyMuted className="text-sm">
                        {labSummaryBySlug(lab.slug, lab.summary)}
                    </TypographyMuted>
                </div>
                <Tabs
                    value={mode}
                    onValueChange={(v) => setMode(v as SimulationMode)}
                >
                    <TabsList className="grid h-9 w-full grid-cols-2 sm:w-64">
                        <TabsTrigger value="encrypt" className="text-xs">Enkripsi</TabsTrigger>
                        <TabsTrigger value="decrypt" className="text-xs">Dekripsi</TabsTrigger>
                    </TabsList>
                </Tabs>
            </header>

            {/* Input + Output — side by side, compact */}
            <section className="animate-fade-in-up grid grid-cols-1 gap-3 lg:grid-cols-2" style={{ animationDelay: '50ms' }}>
                {/* Input card */}
                <Card className={cn(bentoCardClass)}>
                    <CardHeader className="gap-1 pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Key className="size-3.5 text-muted-foreground" />
                            Input
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="lab-input" className="text-xs">
                                {inputLabelByLab(lab.slug, mode)}
                            </Label>
                            <Textarea
                                id="lab-input"
                                aria-describedby={validationError ? 'validation-error-message' : undefined}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={inputPlaceholderByLab(lab.slug, mode)}
                                className="min-h-16 resize-none text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="lab-key" className="text-xs">
                                {keyLabelByLab(lab.slug, mode)}
                            </Label>
                            <Input
                                id="lab-key"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                placeholder={keyPlaceholderByLab(lab.slug, mode)}
                                className="font-mono text-sm"
                            />
                        </div>
                        {validationError && (
                            <Alert variant="destructive" className="py-2" role="alert">
                                <AlertDescription id="validation-error-message" className="text-xs">
                                    {validationError}
                                </AlertDescription>
                            </Alert>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs"
                            onClick={() => {
                                setInputText(defaultTextByLab(lab.slug));
                                setKeyInput(keyPlaceholderByLab(lab.slug, 'encrypt'));
                                setMode('encrypt');
                            }}
                        >
                            <RotateCcw className="size-3" />
                            Atur ulang
                        </Button>
                    </CardContent>
                </Card>

                {/* Output card */}
                <Card className={cn(bentoCardClass)}>
                    <CardHeader className="gap-1 pb-2">
                        <CardTitle className="text-sm">Hasil</CardTitle>
                        <CardDescription className="text-xs">
                            {translatedOutputLabel}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="min-h-32 rounded-lg bg-muted/40 p-3 text-sm leading-relaxed break-all font-mono">
                            {outputPresentation.value || (
                                <span className="text-muted-foreground italic font-sans">
                                    Menunggu input...
                                </span>
                            )}
                        </div>
                        {outputPresentation.error && (
                            <p className="text-xs text-muted-foreground mt-2">
                                {outputPresentation.error}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* Visualization — full width, dominant */}
            <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <GlassBoxLab
                    slug={lab.slug}
                    steps={translatedSteps}
                    activeStep={safeActiveStepIndex}
                    onStepChange={setActiveStepIndex}
                    learnerMode="mahir"
                    onModeChange={() => {}}
                    mode={mode}
                    isPlaying={isWalkthroughPlaying}
                    onPlayingChange={setIsWalkthroughPlaying}
                    aesTrace={algoTrace.aes}
                    desTrace={algoTrace.des}
                    rsaTrace={algoTrace.rsa}
                    sigTrace={algoTrace.signature}
                />
            </section>
        </div>
    );
}

// ── Default layout (all other labs) ──────────────────────────────────────────

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

    const conceptLens = useMemo(
        () => conceptLensByLab(lab.slug, mode),
        [lab.slug, mode],
    );
    const keySetupSteps = useMemo(() => keySetupByLab(lab.slug), [lab.slug]);
    const onboardingSteps = useMemo(() => onboardingByLab(lab.slug), [lab.slug]);

    const normalizedInput = useMemo(
        () =>
            normalizeInputForSimulation(lab.slug, mode, inputText, inputFormat),
        [inputFormat, inputText, lab.slug, mode],
    );

    const validationError = useMemo(() => {
        if (normalizedInput.error !== null) {
            return normalizedInput.error;
        }

        if (normalizedInput.value === null) {
            return 'Input tidak dapat disesuaikan dengan mode algoritma ini.';
        }

        return validationErrorByLab(
            lab.slug,
            mode,
            normalizedInput.value,
            keyInput,
        );
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

    const recommendedInputFormat = recommendedInputFormatByLab(lab.slug, mode);
    const recommendedOutputFormat = recommendedOutputFormatByLab(
        lab.slug,
        mode,
    );
    const pageSummary = labSummaryBySlug(lab.slug, lab.summary);
    const translatedSteps = rawResult.steps;
    const translatedOutputLabel = rawResult.outputLabel;

    const safeActiveStepIndex = Math.min(
        activeStepIndex,
        Math.max(0, rawResult.steps.length - 1),
    );
    const showKeyInput = lab.slug !== 'rsa-lab';

    // Extract trace data for GlassBoxLab
    const rawTrace = (rawResult as { trace?: { aes?: AesTrace; des?: DesTrace; rsa?: RsaKeyGenTraceData; signature?: RsaSignatureTraceData } }).trace;
    const algoTrace = {
        aes: rawTrace?.aes,
        des: rawTrace?.des,
        rsa: rawTrace?.rsa,
        signature: rawTrace?.signature,
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
        if (!isWalkthroughPlaying || rawResult.steps.length <= 1) {
            return;
        }

        const intervalId = setInterval(() => {
            setActiveStepIndex((currentIndex) => {
                const lastStepIndex = Math.max(0, rawResult.steps.length - 1);

                if (currentIndex >= lastStepIndex) {
                    setIsWalkthroughPlaying(false);

                    return currentIndex;
                }

                return currentIndex + 1;
            });
        }, 1200);

        return () => clearInterval(intervalId);
    }, [isWalkthroughPlaying, rawResult.steps.length]);

    // ── DES uses its own layout ──────────────────────────────────────────────
    if (lab.slug === 'des-lab') {
        return (
            <DesLayout
                lab={lab}
                mode={mode}
                setMode={setMode}
                inputText={inputText}
                setInputText={setInputText}
                keyInput={keyInput}
                setKeyInput={setKeyInput}
                validationError={validationError}
                rawResult={rawResult}
                outputPresentation={outputPresentation}
                translatedSteps={translatedSteps}
                translatedOutputLabel={translatedOutputLabel}
                outputFormat={outputFormat}
                safeActiveStepIndex={safeActiveStepIndex}
                setActiveStepIndex={setActiveStepIndex}
                isWalkthroughPlaying={isWalkthroughPlaying}
                setIsWalkthroughPlaying={setIsWalkthroughPlaying}
                algoTrace={algoTrace}
            />
        );
    }

    // ── Default layout for all other labs ────────────────────────────────────
    return (
        <>
            <Head title={`${lab.title} Lab`} />

            <div className="relative flex flex-col gap-4 px-4 pt-3 pb-4 lg:gap-6 lg:pt-3 lg:pb-4">
                {/* Header */}
                <header className="animate-fade-in-up relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                        <TypographyH1>{lab.title}</TypographyH1>
                        <TypographyMuted>{pageSummary}</TypographyMuted>
                    </div>
                    <div className="flex w-full items-center justify-start gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                        <Tabs
                            value={mode}
                            onValueChange={(value) =>
                                setMode(value as SimulationMode)
                            }
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

                {/* Onboarding (pemula only) */}
                {learnerMode === 'pemula' && (
                    <div
                        className="animate-fade-in-up rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4"
                        style={{ animationDelay: '50ms' }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">🎯</span>
                            <span className="text-sm font-semibold">
                                Mulai dari sini
                            </span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {onboardingSteps.map((step, index) => (
                                <div
                                    key={index}
                                    className="flex gap-2 text-sm"
                                >
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

                {/* Input + Config row */}
                <section
                    className="animate-fade-in-up grid grid-cols-1 gap-3 lg:grid-cols-12"
                    style={{ animationDelay: '100ms' }}
                >
                    {/* Main input card */}
                    <Card className={cn(bentoCardClass, 'lg:col-span-8')}>
                        <CardHeader className="gap-1 pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Key className="size-4 text-muted-foreground" />
                                Data dan Kunci
                            </CardTitle>
                            <CardDescription className="text-sm/6">
                                Masukkan pesan dan kunci untuk memulai
                                simulasi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
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
                                        onChange={(event) =>
                                            setInputText(event.target.value)
                                        }
                                        placeholder={inputPlaceholderByLab(
                                            lab.slug,
                                            mode,
                                        )}
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
                                            onChange={(event) =>
                                                setKeyInput(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={keyPlaceholderByLab(
                                                lab.slug,
                                                mode,
                                            )}
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
                            </div>

                            {validationError && (
                                <Alert
                                    variant="destructive"
                                    className="py-3"
                                    role="alert"
                                >
                                    <AlertDescription id="validation-error-message">
                                        {validationError}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Format selectors + reset */}
                            <div className="flex flex-wrap items-end gap-3">
                                {learnerMode === 'mahir' && (
                                    <>
                                        <div className="space-y-2 min-w-32">
                                            <Label className="text-xs">
                                                Format masukan
                                            </Label>
                                            <Select
                                                value={inputFormat}
                                                onValueChange={(value) =>
                                                    setInputFormat(
                                                        value as FormatValue,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {formatOptions.map(
                                                        (option) => (
                                                            <SelectItem
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {formatLabelInIndonesian(
                                                                    option.value,
                                                                )}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 min-w-32">
                                            <Label className="text-xs">
                                                Format keluaran
                                            </Label>
                                            <Select
                                                value={outputFormat}
                                                onValueChange={(value) =>
                                                    setOutputFormat(
                                                        value as FormatValue,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {formatOptions.map(
                                                        (option) => (
                                                            <SelectItem
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {formatLabelInIndonesian(
                                                                    option.value,
                                                                )}
                                                            </SelectItem>
                                                        ),
                                                    )}
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
                                    onClick={() => {
                                        setInputText(defaultTextByLab(lab.slug));
                                        setKeyInput(
                                            keyPlaceholderByLab(
                                                lab.slug,
                                                'encrypt',
                                            ),
                                        );
                                        setInputFormat('ascii');
                                        setOutputFormat('ascii');
                                        setMode('encrypt');
                                    }}
                                >
                                    <RotateCcw className="size-3.5" />
                                    Atur ulang
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Concept card (compact) */}
                    <Card className={cn(bentoCardClass, 'lg:col-span-4')}>
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
                            <Collapsible
                                open={showDetails}
                                onOpenChange={setShowDetails}
                            >
                                <div className="space-y-2">
                                    {conceptLens.points
                                        .slice(0, showDetails ? undefined : 2)
                                        .map((point, index) => (
                                            <div
                                                key={point}
                                                className="flex gap-2 text-sm"
                                            >
                                                <Badge
                                                    variant="secondary"
                                                    className="mt-0.5 size-5 shrink-0 justify-center rounded-full p-0 text-[10px]"
                                                >
                                                    {index + 1}
                                                </Badge>
                                                <span className="leading-relaxed">
                                                    {point}
                                                </span>
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
                                                    showDetails &&
                                                        'rotate-180',
                                                )}
                                            />
                                        </Button>
                                    </CollapsibleTrigger>
                                )}
                            </Collapsible>
                        </CardContent>
                    </Card>
                </section>

                {/* Visualizer + Result */}
                <section
                    className="animate-fade-in-up grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12"
                    style={{ animationDelay: '200ms' }}
                >
                    <GlassBoxLab
                        slug={lab.slug}
                        steps={translatedSteps}
                        activeStep={safeActiveStepIndex}
                        onStepChange={setActiveStepIndex}
                        learnerMode={learnerMode}
                        onModeChange={setLearnerMode}
                        mode={mode}
                        isPlaying={isWalkthroughPlaying}
                        onPlayingChange={setIsWalkthroughPlaying}
                        aesTrace={algoTrace.aes}
                        desTrace={algoTrace.des}
                        rsaTrace={algoTrace.rsa}
                        sigTrace={algoTrace.signature}
                    />

                    <Card className={cn(bentoCardClass, 'lg:col-span-4')}>
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
                </section>
            </div>
        </>
    );
}
