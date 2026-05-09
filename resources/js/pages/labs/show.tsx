import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Eye,
    Lock,
    Pause,
    Play,
    RotateCcw,
    SlidersHorizontal,
    Unlock,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import {
    canFormatOutput,
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
import { index as labsIndex } from '@/routes/labs';
import type {
    FormatValue,
    LabShowProps,
    SimulationMode,
    SimulationResult,
} from '@/types/labs';

// ── Swipe hook ──
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
    const touchStartX = useRef<number | null>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    }, []);

    const handleTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            if (touchStartX.current === null) return;
            const diff = e.changedTouches[0].clientX - touchStartX.current;
            if (diff > 50) onSwipeRight();
            else if (diff < -50) onSwipeLeft();
            touchStartX.current = null;
        },
        [onSwipeLeft, onSwipeRight],
    );

    return { handleTouchStart, handleTouchEnd };
}

// ── Main Page ──
export default function LabsShow({ lab }: LabShowProps) {
    const [mode, setMode] = useState<SimulationMode>('encrypt');
    const [inputText, setInputText] = useState(defaultTextByLab(lab.slug));
    const [keyInput, setKeyInput] = useState(keyPlaceholderByLab(lab.slug));
    const [inputFormat, setInputFormat] = useState<FormatValue>('ascii');
    const [outputFormat, setOutputFormat] = useState<FormatValue>('ascii');
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [isWalkthroughPlaying, setIsWalkthroughPlaying] = useState(false);
    const [showConfig, setShowConfig] = useState(false);

    const normalizedInput = useMemo(
        () =>
            normalizeInputForSimulation(lab.slug, mode, inputText, inputFormat),
        [inputFormat, inputText, lab.slug, mode],
    );

    const validationError = useMemo(() => {
        if (normalizedInput.error !== null) return normalizedInput.error;
        if (normalizedInput.value === null)
            return 'Input could not be normalized for this algorithm mode.';
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
                error: 'Output ditampilkan apa adanya (format domain-specific).',
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
        if (!isWalkthroughPlaying || rawResult.steps.length <= 1) return;
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
        return () => clearInterval(intervalId);
    }, [isWalkthroughPlaying, rawResult.steps.length]);

    return (
        <>
            <Head title={`${lab.title} Lab`} />

            <div className="relative flex flex-col gap-4 px-4 pt-3 pb-6 lg:gap-6">
                {/* ── Header with inline mode toggle ── */}
                <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-0">
                        <TypographyH1>{lab.title}</TypographyH1>
                        <TypographyMuted>{lab.summary}</TypographyMuted>
                    </div>
                    <Tabs
                        value={mode}
                        onValueChange={(v) => setMode(v as SimulationMode)}
                    >
                        <TabsList className="h-9">
                            <TabsTrigger
                                value="encrypt"
                                className="gap-1.5 text-xs"
                            >
                                <Lock className="size-3" />
                                Enkripsi
                            </TabsTrigger>
                            <TabsTrigger
                                value="decrypt"
                                className="gap-1.5 text-xs"
                            >
                                <Unlock className="size-3" />
                                Dekripsi
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </section>

                {/* ── 2 Cards: Input (narrow) | Visualization (wide) ── */}
                <section className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                    {/* ━━ Card 1: Input & Output ━━ */}
                    <Card className="flex flex-col">
                        <CardHeader className="gap-1">
                            <CardTitle className="text-base">
                                Masukan & Keluaran
                            </CardTitle>
                            <CardDescription>
                                {modeDescription(lab.slug, mode)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col gap-4">
                            {/* Input */}
                            <div className="flex flex-col gap-1.5">
                                <Label
                                    htmlFor="lab-input"
                                    className="text-xs font-medium"
                                >
                                    {inputLabelByLab(lab.slug, mode)}
                                </Label>
                                <Textarea
                                    id="lab-input"
                                    value={inputText}
                                    onChange={(e) =>
                                        setInputText(e.target.value)
                                    }
                                    placeholder={inputPlaceholderByLab(
                                        lab.slug,
                                        mode,
                                    )}
                                    className="min-h-28 resize-none rounded-lg font-mono text-sm"
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    {inputHelperByLab(lab.slug, mode)}
                                </p>
                            </div>

                            {/* Key */}
                            {showKeyInput && (
                                <div className="flex flex-col gap-1.5">
                                    <Label
                                        htmlFor="lab-key"
                                        className="text-xs font-medium"
                                    >
                                        {keyLabelByLab(lab.slug)}
                                    </Label>
                                    <Input
                                        id="lab-key"
                                        value={keyInput}
                                        onChange={(e) =>
                                            setKeyInput(e.target.value)
                                        }
                                        placeholder={keyPlaceholderByLab(
                                            lab.slug,
                                        )}
                                        className="rounded-lg font-mono text-sm"
                                    />
                                </div>
                            )}

                            {/* Validation */}
                            {validationError && (
                                <Alert variant="destructive" className="py-2">
                                    <AlertCircle className="size-3.5" />
                                    <AlertDescription className="text-xs">
                                        {validationError}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Format toggle */}
                            {showConfig && (
                                <div className="flex animate-in flex-col gap-3 rounded-lg border p-3 duration-200 fade-in-0 slide-in-from-top-1">
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] text-muted-foreground">
                                            Format masukan
                                        </Label>
                                        <Select
                                            value={inputFormat}
                                            onValueChange={(v) =>
                                                setInputFormat(v as FormatValue)
                                            }
                                        >
                                            <SelectTrigger className="h-8 rounded-lg text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {formatOptions.map((opt) => (
                                                    <SelectItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                        className="rounded-lg"
                                                    >
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <span className="text-[10px] text-muted-foreground/60">
                                            Disarankan:{' '}
                                            {formatLabel(
                                                recommendedInputFormat,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-[11px] text-muted-foreground">
                                            Format keluaran
                                        </Label>
                                        <Select
                                            value={outputFormat}
                                            onValueChange={(v) =>
                                                setOutputFormat(
                                                    v as FormatValue,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="h-8 rounded-lg text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {formatOptions.map((opt) => (
                                                    <SelectItem
                                                        key={opt.value}
                                                        value={opt.value}
                                                        className="rounded-lg"
                                                    >
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <span className="text-[10px] text-muted-foreground/60">
                                            Disarankan:{' '}
                                            {formatLabel(
                                                recommendedOutputFormat,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Actions row */}
                            <div className="flex gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 gap-1 rounded-lg px-2 text-[11px]"
                                    onClick={() => setShowConfig((v) => !v)}
                                >
                                    <SlidersHorizontal className="size-3" />
                                    Format
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 gap-1 rounded-lg px-2 text-[11px]"
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
                                    <RotateCcw className="size-3" />
                                    Reset
                                </Button>
                            </div>

                            {/* ── Output section ── */}
                            <div className="mt-auto flex flex-col gap-2 rounded-lg border-t pt-4">
                                <div className="flex items-center gap-2">
                                    <ArrowRight className="size-3.5 text-primary" />
                                    <span className="text-xs font-semibold">
                                        {rawResult.outputLabel}
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className="ml-auto text-[10px]"
                                    >
                                        {formatLabel(outputFormat)}
                                    </Badge>
                                </div>
                                <div className="rounded-lg bg-muted/40 p-3 font-mono text-sm leading-relaxed break-all">
                                    {outputPresentation.value || (
                                        <span className="text-muted-foreground/40 italic">
                                            Menunggu input...
                                        </span>
                                    )}
                                </div>
                                {outputPresentation.error && (
                                    <p className="text-[11px] text-muted-foreground">
                                        {outputPresentation.error}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ━━ Card 2: Visualization & Steps ━━ */}
                    <Card className="flex flex-col">
                        <CardHeader className="gap-1">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <CardTitle className="flex items-center gap-1.5 text-base">
                                        <Eye className="size-4 text-primary/70" />
                                        {visualizationLens.title}
                                    </CardTitle>
                                    <CardDescription>
                                        {visualizationLens.description}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] tabular-nums"
                                    >
                                        {safeActiveStepIndex + 1}/
                                        {rawResult.steps.length}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-7 rounded-lg"
                                        disabled={rawResult.steps.length <= 1}
                                        onClick={() => {
                                            if (
                                                safeActiveStepIndex >=
                                                rawResult.steps.length - 1
                                            ) {
                                                setActiveStepIndex(0);
                                            }
                                            setIsWalkthroughPlaying((c) => !c);
                                        }}
                                    >
                                        {isWalkthroughPlaying ? (
                                            <Pause className="size-3" />
                                        ) : (
                                            <Play className="size-3" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-0">
                            {/* Step walkthrough */}
                            <div className="px-6">
                                {/* Clickable progress */}
                                <div className="flex gap-0.5">
                                    {Array.from(
                                        { length: rawResult.steps.length },
                                        (_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => {
                                                    setIsWalkthroughPlaying(
                                                        false,
                                                    );
                                                    setActiveStepIndex(i);
                                                }}
                                                className={cn(
                                                    'h-1 flex-1 rounded-full transition-all duration-300',
                                                    i <= safeActiveStepIndex
                                                        ? 'bg-primary'
                                                        : 'bg-muted hover:bg-muted-foreground/20',
                                                    i === safeActiveStepIndex &&
                                                        'scale-y-150',
                                                )}
                                            />
                                        ),
                                    )}
                                </div>

                                {/* Step text */}
                                {rawResult.steps.length > 0 && (
                                    <div
                                        key={`step-${safeActiveStepIndex}`}
                                        className="mt-3 animate-in rounded-lg bg-primary/5 px-3 py-2.5 duration-200 fade-in-0"
                                        {...swipeHandlers}
                                    >
                                        <p className="text-[13px] leading-relaxed">
                                            {
                                                rawResult.steps[
                                                    safeActiveStepIndex
                                                ]
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Table area — scrollable */}
                            <div className="min-h-0 flex-1 border-t">
                                {visualizationLens.rows.length > 0 ? (
                                    <ScrollArea className="h-full max-h-80">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 z-10 bg-card">
                                                <tr className="border-b text-xs text-muted-foreground">
                                                    <th className="px-6 py-2.5 text-left font-medium">
                                                        {
                                                            visualizationLens
                                                                .headers[0]
                                                        }
                                                    </th>
                                                    <th className="px-3 py-2.5 text-left font-medium">
                                                        {
                                                            visualizationLens
                                                                .headers[1]
                                                        }
                                                    </th>
                                                    <th className="px-6 py-2.5 text-left font-medium">
                                                        {
                                                            visualizationLens
                                                                .headers[2]
                                                        }
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {visualizationLens.rows.map(
                                                    (row, index) => (
                                                        <tr
                                                            key={`vis-${index}`}
                                                            className={cn(
                                                                'border-b transition-colors duration-150 last:border-0',
                                                                index ===
                                                                    safeActiveStepIndex
                                                                    ? 'bg-primary/5 font-medium'
                                                                    : 'hover:bg-muted/30',
                                                            )}
                                                        >
                                                            <td className="px-6 py-2 font-mono text-xs break-all">
                                                                {row.source}
                                                            </td>
                                                            <td className="px-3 py-2 text-xs break-all text-muted-foreground">
                                                                {row.operation}
                                                            </td>
                                                            <td className="px-6 py-2 font-mono text-xs break-all">
                                                                {row.result}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </ScrollArea>
                                ) : (
                                    <div className="flex h-full min-h-48 items-center justify-center">
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <div className="rounded-full bg-muted p-3">
                                                <Eye className="size-5 text-muted-foreground" />
                                            </div>
                                            <p className="max-w-48 text-xs text-muted-foreground">
                                                Masukkan input yang valid untuk
                                                melihat transformasi data.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation footer */}
                            <div className="flex items-center justify-between border-t px-6 py-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={safeActiveStepIndex === 0}
                                    onClick={() =>
                                        setActiveStepIndex((i) =>
                                            Math.max(i - 1, 0),
                                        )
                                    }
                                    className="h-7 gap-1 text-xs"
                                >
                                    <ChevronLeft className="size-3.5" />
                                    Sebelumnya
                                </Button>
                                <p className="text-[11px] text-muted-foreground/50 max-sm:hidden">
                                    Klik progress bar atau geser untuk navigasi
                                </p>
                                <Button
                                    variant="ghost"
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
                                    className="h-7 gap-1 text-xs"
                                >
                                    Selanjutnya
                                    <ChevronRight className="size-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
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
