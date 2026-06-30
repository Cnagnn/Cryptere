/**
 * labs/show.tsx — lab detail with course-detail-style layout.
 */
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import LabIO from '@/features/labs/LabIO';
import LabWorkshop from '@/features/labs/LabWorkshop';
import { useStepPlayer } from '@/features/labs/useStepPlayer';
import {
    canFormatOutput,
    formatOutputValue,
    inputHelperByLab,
    inputLabelByLab,
    inputPlaceholderByLab,
    keyLabelByLab,
    keyPlaceholderByLab,
    normalizeInputForSimulation,
    recommendedInputFormatByLab,
    recommendedOutputFormatByLab,
    runSimulation,
    validationErrorByLab,
} from '@/lib/lab-simulations';
import { index as labsIndex } from '@/routes/labs';
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

// ── Debounce hook ──
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        timerRef.current = setTimeout(() => setDebounced(value), delay);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [value, delay]);

    return debounced;
}

// ── Simulation compute ──
interface ResultBundle {
    output: string;
    outputLabel: string;
    steps: string[];
    traces: {
        aes?: AesTrace;
        des?: DesTrace;
        rsa?: RsaKeyGenTraceData;
        signature?: RsaSignatureTraceData;
    };
    error: string | null;
}

function computeResult(
    slug: string,
    mode: SimulationMode,
    rawInput: string,
    keyValue: string,
    inputFormat: FormatValue,
): ResultBundle {
    if (!rawInput.trim() && !keyValue.trim()) {
        return {
            output: '',
            outputLabel: 'Hasil',
            steps: [],
            traces: {},
            error: null,
        };
    }

    const normalized = normalizeInputForSimulation(
        slug,
        mode,
        rawInput,
        inputFormat,
    );

    if (normalized.error) {
        return {
            output: '',
            outputLabel: 'Hasil',
            steps: [],
            traces: {},
            error: normalized.error,
        };
    }

    const text = normalized.value ?? '';
    const validation = validationErrorByLab(slug, mode, text, keyValue);

    if (validation) {
        return {
            output: '',
            outputLabel: 'Hasil',
            steps: [],
            traces: {},
            error: validation,
        };
    }

    const r: SimulationResult & { trace?: ResultBundle['traces'] } =
        runSimulation(slug, mode, text, keyValue);

    return {
        output: r.output,
        outputLabel: r.outputLabel,
        steps: r.steps,
        traces: r.trace ?? {},
        error: null,
    };
}

export default function LabsShow({ lab }: LabShowProps) {
    const [mode, setMode] = useState<SimulationMode>('encrypt');
    const [keyValue, setKeyValue] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [inputFormat, setInputFormat] = useState<FormatValue>(
        recommendedInputFormatByLab(lab.slug, 'encrypt'),
    );
    const [outputFormat, setOutputFormat] = useState<FormatValue>(
        recommendedOutputFormatByLab(lab.slug, 'encrypt'),
    );

    const debouncedInput = useDebouncedValue(
        { inputValue, keyValue, mode, inputFormat },
        300,
    );

    const result = useMemo(
        () =>
            computeResult(
                lab.slug,
                debouncedInput.mode,
                debouncedInput.inputValue,
                debouncedInput.keyValue,
                debouncedInput.inputFormat,
            ),
        [lab.slug, debouncedInput],
    );

    const player = useStepPlayer(result.steps.length);
    const hasResult = result.steps.length > 0 && !!result.output;
    const canChangeOutputFormat = canFormatOutput(lab.slug, mode);
    const displayedOutput = useMemo(() => {
        if (!result.output) {
            return '';
        }

        if (!canChangeOutputFormat) {
            return result.output;
        }

        return formatOutputValue(result.output, outputFormat).value;
    }, [canChangeOutputFormat, outputFormat, result.output]);

    const hideKey = lab.slug === 'rsa-lab' && mode === 'encrypt';
    const isSignature = lab.slug === 'digital-signature-lab';

    const handleModeChange = (newMode: SimulationMode) => {
        setMode(newMode);
        setInputFormat(recommendedInputFormatByLab(lab.slug, newMode));
        setOutputFormat(recommendedOutputFormatByLab(lab.slug, newMode));
    };

    return (
        <>
            <Head title={`${lab.title} Lab`} />

            <div className="relative flex flex-col gap-4 px-4 pt-3 pb-4 lg:gap-6 lg:pt-3 lg:pb-4">
                {/* Header — back button sejajar dengan height title + desc */}
                <header className="animate-fade-in-up flex flex-col gap-3 sm:flex-row sm:items-start">
                    <Link
                        href={labsIndex.url()}
                        className="self-start sm:self-stretch"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-11 shrink-0 rounded-lg sm:h-full"
                        >
                            <ChevronLeft className="size-5" />
                        </Button>
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <TypographyH1 className="text-2xl/none sm:text-3xl/none">
                            {lab.title}
                        </TypographyH1>
                        <TypographyMuted>{lab.summary}</TypographyMuted>
                    </div>
                    <Tabs
                        value={mode}
                        onValueChange={(v) =>
                            handleModeChange(v as SimulationMode)
                        }
                        className="shrink-0 self-start sm:ml-auto sm:self-end"
                    >
                        <TabsList className="grid h-9 w-auto grid-cols-2">
                            <TabsTrigger
                                value="encrypt"
                                className="px-3 text-xs"
                            >
                                {isSignature ? 'Tandatangani' : 'Enkripsi'}
                            </TabsTrigger>
                            <TabsTrigger
                                value="decrypt"
                                className="px-3 text-xs"
                            >
                                {isSignature ? 'Verifikasi' : 'Dekripsi'}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </header>

                <section
                    className="animate-fade-in-up grid gap-3 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start"
                    style={{ animationDelay: '100ms' }}
                >
                    <LabIO
                        keyValue={keyValue}
                        onKeyChange={setKeyValue}
                        keyLabel={keyLabelByLab(lab.slug, mode)}
                        keyPlaceholder={keyPlaceholderByLab(lab.slug, mode)}
                        hideKey={hideKey}
                        inputValue={inputValue}
                        onInputChange={setInputValue}
                        inputLabel={inputLabelByLab(lab.slug, mode)}
                        inputPlaceholder={inputPlaceholderByLab(lab.slug, mode)}
                        inputHelper={inputHelperByLab(lab.slug, mode)}
                        inputFormat={inputFormat}
                        onInputFormatChange={setInputFormat}
                        output={displayedOutput}
                        outputLabel={result.outputLabel}
                        outputFormat={outputFormat}
                        onOutputFormatChange={setOutputFormat}
                        canChangeOutputFormat={canChangeOutputFormat}
                        error={result.error}
                        step={player.step}
                        total={player.total}
                        progress={player.progress}
                    />

                    {/* Right: visualizer + playback */}
                    <LabWorkshop
                        slug={lab.slug}
                        mode={mode}
                        steps={result.steps}
                        step={player.step}
                        total={player.total}
                        progress={player.progress}
                        playing={player.playing}
                        speed={player.speed}
                        traces={result.traces}
                        hasResult={hasResult}
                        onStep={player.setStep}
                        onTogglePlay={() => player.setPlaying(!player.playing)}
                        onNext={player.next}
                        onPrev={player.prev}
                        onSpeedChange={player.setSpeed}
                    />
                </section>
            </div>
        </>
    );
}
