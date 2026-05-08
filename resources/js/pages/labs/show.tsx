import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    ChevronDown,
    Pause,
    Play,
    RefreshCcw,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
    recommendedInputFormatByLab,
    recommendedOutputFormatByLab,
    runSimulation,
    validationErrorByLab,
    visualizationLensByLab,
} from '@/lib/lab-simulations';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as labsIndex, show as labsShow } from '@/routes/labs';
import type {
    FormatValue,
    LabShowProps,
    SimulationMode,
    SimulationResult,
} from '@/types/labs';

// ── Mobile-friendly collapsible card wrapper ──
function CollapsibleCard({
    title,
    description,
    defaultOpen = true,
    children,
}: {
    title: string;
    description: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer select-none lg:cursor-default">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{title}</CardTitle>
                            <ChevronDown
                                className={cn(
                                    'size-4 shrink-0 text-muted-foreground transition-transform duration-200 lg:hidden',
                                    open && 'rotate-180',
                                )}
                            />
                        </div>
                        <CardDescription>{description}</CardDescription>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent className="lg:block">
                    <CardContent>{children}</CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}

// ── Swipe hook for touch navigation ──
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
    const touchStartX = useRef<number | null>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            if (touchStartX.current === null) {
                return;
            }

            const diff = e.changedTouches[0].clientX - touchStartX.current;
            const threshold = 50;

            if (diff > threshold) {
                onSwipeRight();
            } else if (diff < -threshold) {
                onSwipeLeft();
            }

            touchStartX.current = null;
        },
        [onSwipeLeft, onSwipeRight],
    );

    return { handleTouchStart, handleTouchEnd };
}

// ── Lab Show Page ──
// Types extracted to @/types/labs
// Simulation engines & helpers extracted to @/lib/lab-simulations

export default function LabsShow({ lab }: LabShowProps) {
    const [mode, setMode] = useState<SimulationMode>('encrypt');
    const [inputText, setInputText] = useState(defaultTextByLab(lab.slug));
    const [keyInput, setKeyInput] = useState(keyPlaceholderByLab(lab.slug));
    const [inputFormat, setInputFormat] = useState<FormatValue>('ascii');
    const [outputFormat, setOutputFormat] = useState<FormatValue>('ascii');
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [isWalkthroughPlaying, setIsWalkthroughPlaying] = useState(false);

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
            return 'Input could not be normalized for this algorithm mode.';
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
                outputLabel: 'Validation required',
                output: 'Fix the input format to see simulation output.',
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
        if (!canFormatOutput(lab.slug)) {
            return {
                value: rawResult.output,
                error: 'This output is already in a domain-specific format and is shown as-is.',
            };
        }

        return formatOutputValue(rawResult.output, outputFormat);
    }, [lab.slug, outputFormat, rawResult.output]);

    const showKeyInput = lab.slug !== 'rsa-lab';
    const recommendedInputFormat = recommendedInputFormatByLab(lab.slug, mode);
    const recommendedOutputFormat = recommendedOutputFormatByLab(
        lab.slug,
        mode,
    );
    const conceptLens = conceptLensByLab(lab.slug, mode);
    const visualizationLens = visualizationLensByLab(
        lab.slug,
        mode,
        normalizedInput.value ?? '',
        keyInput,
        rawResult,
    );

    const safeActiveStepIndex = Math.min(
        activeStepIndex,
        Math.max(0, rawResult.steps.length - 1),
    );

    const swipeHandlers = useSwipe(
        () =>
            setActiveStepIndex((i) =>
                Math.min(i + 1, rawResult.steps.length - 1),
            ),
        () => setActiveStepIndex((i) => Math.max(i - 1, 0)),
    );

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
        }, 1100);

        return () => {
            clearInterval(intervalId);
        };
    }, [isWalkthroughPlaying, rawResult.steps.length]);

    return (
        <>
            <Head title={`${lab.title} Lab`} />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            Laboratorium Simulasi {lab.title}
                        </h1>
                        <p className="max-w-3xl text-sm text-muted-foreground">
                            {lab.summary}
                        </p>
                    </div>
                </div>

                <section className="grid items-start gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
                    <div className="flex flex-col gap-4">
                        <CollapsibleCard
                            title="Area Masukan"
                            description="Beralih antara alur enkripsi dan dekripsi, sesuaikan masukan, lalu periksa setiap langkah yang dihasilkan."
                            defaultOpen={true}
                        >
                            <div className="flex flex-col gap-4">
                                <Tabs
                                    value={mode}
                                    onValueChange={(value) =>
                                        setMode(value as SimulationMode)
                                    }
                                >
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="encrypt">
                                            Alur Enkripsi
                                        </TabsTrigger>
                                        <TabsTrigger value="decrypt">
                                            Alur Dekripsi
                                        </TabsTrigger>
                                    </TabsList>
                                    <TabsContent
                                        value="encrypt"
                                        className="pt-3 text-sm text-muted-foreground"
                                    >
                                        {modeDescription(lab.slug, 'encrypt')}
                                    </TabsContent>
                                    <TabsContent
                                        value="decrypt"
                                        className="pt-3 text-sm text-muted-foreground"
                                    >
                                        {modeDescription(lab.slug, 'decrypt')}
                                    </TabsContent>
                                </Tabs>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="lab-input">
                                        {inputLabelByLab(lab.slug, mode)}
                                    </Label>
                                    <Textarea
                                        id="lab-input"
                                        value={inputText}
                                        onChange={(event) =>
                                            setInputText(event.target.value)
                                        }
                                        placeholder={inputPlaceholderByLab(
                                            lab.slug,
                                            mode,
                                        )}
                                        className="min-h-28"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        {inputHelperByLab(lab.slug, mode)}
                                    </p>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="flex min-w-0 flex-col gap-2">
                                        <Label>Format masukan</Label>
                                        <Select
                                            value={inputFormat}
                                            onValueChange={(value) =>
                                                setInputFormat(
                                                    value as FormatValue,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full min-w-0">
                                                <SelectValue placeholder="Pilih format masukan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formatOptions.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground">
                                            {formatLabel(
                                                recommendedInputFormat,
                                            )}{' '}
                                            (disarankan)
                                        </p>
                                    </div>

                                    <div className="flex min-w-0 flex-col gap-2">
                                        <Label>Format keluaran</Label>
                                        <Select
                                            value={outputFormat}
                                            onValueChange={(value) =>
                                                setOutputFormat(
                                                    value as FormatValue,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full min-w-0">
                                                <SelectValue placeholder="Pilih format keluaran" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {formatOptions.map((option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground">
                                            {formatLabel(
                                                recommendedOutputFormat,
                                            )}{' '}
                                            (disarankan)
                                        </p>
                                    </div>
                                </div>

                                {showKeyInput ? (
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="lab-key">
                                            {keyLabelByLab(lab.slug)}
                                        </Label>
                                        <Input
                                            id="lab-key"
                                            value={keyInput}
                                            onChange={(event) =>
                                                setKeyInput(event.target.value)
                                            }
                                            placeholder={keyPlaceholderByLab(
                                                lab.slug,
                                            )}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Jaga konsistensi kunci antara alur
                                            enkripsi dan dekripsi untuk
                                            membandingkan perilaku yang dapat
                                            dibalik.
                                        </p>
                                    </div>
                                ) : null}

                                {validationError ? (
                                    <Alert variant="destructive">
                                        <AlertCircle className="size-4" />
                                        <AlertTitle>
                                            Masukan simulasi tidak valid
                                        </AlertTitle>
                                        <AlertDescription>
                                            {validationError}
                                        </AlertDescription>
                                    </Alert>
                                ) : null}

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setMode((currentMode) =>
                                                currentMode === 'encrypt'
                                                    ? 'decrypt'
                                                    : 'encrypt',
                                            );
                                        }}
                                    >
                                        <RefreshCcw className="size-4" />
                                        Balik Mode
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setInputText(
                                                defaultTextByLab(lab.slug),
                                            );
                                            setKeyInput(
                                                keyPlaceholderByLab(lab.slug),
                                            );
                                            setInputFormat('ascii');
                                            setOutputFormat('ascii');
                                            setMode('encrypt');
                                        }}
                                    >
                                        Atur Ulang Contoh
                                    </Button>
                                </div>
                            </div>
                        </CollapsibleCard>

                        <CollapsibleCard
                            title="Visualisasi Langsung"
                            description={visualizationLens.description}
                            defaultOpen={true}
                        >
                            <div className="flex flex-col gap-2 overflow-x-auto">
                                <div className="rounded-md border bg-muted/10 p-2 text-sm font-medium text-muted-foreground">
                                    {visualizationLens.title}
                                </div>
                                <div className="grid grid-cols-3 rounded-md border bg-muted/10 p-2 text-sm font-medium text-muted-foreground">
                                    <p>{visualizationLens.headers[0]}</p>
                                    <p>{visualizationLens.headers[1]}</p>
                                    <p>{visualizationLens.headers[2]}</p>
                                </div>

                                {visualizationLens.rows.length > 0 ? (
                                    visualizationLens.rows.map((row, index) => (
                                        <div
                                            key={`${lab.slug}-visual-row-${index}-${safeActiveStepIndex}`}
                                            className={cn(
                                                'grid grid-cols-3 gap-2 rounded-md border p-2 text-sm leading-relaxed',
                                                'animate-in duration-200 fade-in-0 slide-in-from-bottom-1',
                                                'transition-all duration-200 ease-out hover:bg-muted/30',
                                                index === safeActiveStepIndex
                                                    ? 'border-primary/30 bg-primary/10 shadow-sm'
                                                    : 'bg-muted/20',
                                            )}
                                            style={{
                                                animationDelay: `${Math.min(index * 35, 220)}ms`,
                                            }}
                                        >
                                            <p className="break-all">
                                                {row.source}
                                            </p>
                                            <p className="break-all text-muted-foreground">
                                                {row.operation}
                                            </p>
                                            <p className="break-all">
                                                {row.result}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                                        Masukkan input yang valid untuk
                                        menampilkan visualisasi.
                                    </p>
                                )}
                            </div>
                        </CollapsibleCard>
                    </div>

                    <div className="flex flex-col gap-4">
                        <CollapsibleCard
                            title="Keluaran"
                            description={rawResult.outputLabel}
                            defaultOpen={true}
                        >
                            <div className="rounded-md border bg-muted/30 p-3 font-mono text-sm break-all">
                                {outputPresentation.value ||
                                    '(keluaran kosong)'}
                            </div>
                            {outputPresentation.error ? (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {outputPresentation.error}
                                </p>
                            ) : null}
                        </CollapsibleCard>

                        <CollapsibleCard
                            title="Rincian Langkah demi Langkah"
                            description="Pilih langkah untuk fokus pada penjelasan dan ikuti jalur transformasi lengkap."
                            defaultOpen={true}
                        >
                            <div
                                className="flex flex-col gap-2"
                                {...swipeHandlers}
                            >
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={rawResult.steps.length <= 1}
                                        onClick={() => {
                                            if (
                                                safeActiveStepIndex >=
                                                rawResult.steps.length - 1
                                            ) {
                                                setActiveStepIndex(0);
                                            }

                                            setIsWalkthroughPlaying(
                                                (current) => !current,
                                            );
                                        }}
                                    >
                                        {isWalkthroughPlaying ? (
                                            <Pause className="size-4" />
                                        ) : (
                                            <Play className="size-4" />
                                        )}
                                        {isWalkthroughPlaying
                                            ? 'Jeda panduan'
                                            : 'Putar panduan'}
                                    </Button>

                                    <p className="self-center text-sm text-muted-foreground">
                                        Langkah otomatis setiap 1,1 detik untuk
                                        mode panduan terpandu.
                                    </p>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                    {rawResult.steps.map((_, index) => (
                                        <Button
                                            key={`${lab.slug}-step-button-${index}`}
                                            type="button"
                                            variant={
                                                index === safeActiveStepIndex
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className={cn(
                                                'justify-start transition-all duration-200 ease-out',
                                                index === safeActiveStepIndex
                                                    ? 'scale-[1.01] border-primary/40 shadow-sm'
                                                    : 'opacity-90 hover:opacity-100',
                                            )}
                                            onClick={() => {
                                                setIsWalkthroughPlaying(false);
                                                setActiveStepIndex(index);
                                            }}
                                        >
                                            Langkah {index + 1}
                                        </Button>
                                    ))}
                                </div>

                                {rawResult.steps.length > 0 ? (
                                    <div
                                        key={`${lab.slug}-active-step-${safeActiveStepIndex}`}
                                        className="animate-in rounded-md border bg-muted/20 p-3 duration-200 fade-in-0 slide-in-from-bottom-1"
                                    >
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Langkah aktif
                                        </p>
                                        <p className="mt-1 text-sm leading-relaxed">
                                            {
                                                rawResult.steps[
                                                    safeActiveStepIndex
                                                ]
                                            }
                                        </p>
                                    </div>
                                ) : null}

                                {/* Mobile step navigation arrows */}
                                <div className="flex items-center justify-between lg:hidden">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={safeActiveStepIndex === 0}
                                        onClick={() =>
                                            setActiveStepIndex((i) =>
                                                Math.max(i - 1, 0),
                                            )
                                        }
                                    >
                                        <ArrowLeft
                                            className="size-4"
                                            data-icon
                                        />
                                        Sebelumnya
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                        Geser untuk navigasi langkah
                                    </span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                            safeActiveStepIndex >=
                                            rawResult.steps.length - 1
                                        }
                                        onClick={() =>
                                            setActiveStepIndex((i) =>
                                                Math.min(
                                                    i + 1,
                                                    rawResult.steps.length - 1,
                                                ),
                                            )
                                        }
                                    >
                                        Selanjutnya
                                        <ArrowRight
                                            className="size-4"
                                            data-icon
                                        />
                                    </Button>
                                </div>
                            </div>
                        </CollapsibleCard>

                        <CollapsibleCard
                            title="Lensa Konsep"
                            description={conceptLens.title}
                            defaultOpen={false}
                        >
                            <div className="flex flex-col gap-2">
                                {conceptLens.points.map((point, index) => (
                                    <div
                                        key={`${lab.slug}-concept-${index}`}
                                        className="rounded-md border bg-muted/20 p-3 text-sm leading-relaxed"
                                    >
                                        {point}
                                    </div>
                                ))}
                            </div>
                        </CollapsibleCard>

                        <CollapsibleCard
                            title="Jelajahi Laboratorium Lain"
                            description="Berpindah antar laboratorium algoritma untuk membandingkan bagaimana setiap alur enkripsi dan dekripsi berperilaku."
                            defaultOpen={false}
                        >
                            <div className="grid gap-2 sm:grid-cols-2">
                                {[
                                    {
                                        slug: 'caesar-cipher-lab',
                                        title: 'Caesar',
                                    },
                                    {
                                        slug: 'vigenere-cipher-lab',
                                        title: 'Vigenere',
                                    },
                                    { slug: 'aes-lab', title: 'AES' },
                                    { slug: 'rsa-lab', title: 'RSA' },
                                    {
                                        slug: 'digital-signature-lab',
                                        title: 'Digital Signature',
                                    },
                                ].map((item) =>
                                    item.slug === lab.slug ? (
                                        <Button
                                            key={item.slug}
                                            type="button"
                                            variant="secondary"
                                            disabled
                                            className="justify-between"
                                        >
                                            {item.title}
                                            <ArrowRight className="size-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            key={item.slug}
                                            asChild
                                            variant="outline"
                                            className="justify-between"
                                        >
                                            <Link
                                                href={labsShow({
                                                    lab: item.slug,
                                                })}
                                                prefetch
                                            >
                                                {item.title}
                                                <ArrowRight className="size-4" />
                                            </Link>
                                        </Button>
                                    ),
                                )}
                            </div>
                        </CollapsibleCard>
                    </div>
                </section>
            </div>
        </>
    );
}

LabsShow.layout = {
    breadcrumbs: [
        {
            title: 'Beranda',
            href: dashboard(),
        },
        {
            title: 'Laboratorium',
            href: labsIndex(),
        },
    ],
};
