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
    conceptLensByLab,
    formatOutputValue,
    inputHelperByLab,
    inputLabelByLab,
    inputPlaceholderByLab,
    keyLabelByLab,
    keyPlaceholderByLab,
    normalizeInputForSimulation,
    onboardingByLab,
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
        return { output: '', outputLabel: 'Hasil', steps: [], traces: {}, error: null };
    }

    const normalized = normalizeInputForSimulation(slug, mode, rawInput, inputFormat);

    if (normalized.error) {
        return { output: '', outputLabel: 'Hasil', steps: [], traces: {}, error: normalized.error };
    }

    const text = normalized.value ?? '';
    const validation = validationErrorByLab(slug, mode, text, keyValue);

    if (validation) {
        return { output: '', outputLabel: 'Hasil', steps: [], traces: {}, error: validation };
    }

    const r: SimulationResult & { trace?: ResultBundle['traces'] } = runSimulation(
        slug,
        mode,
        text,
        keyValue,
    );

    return {
        output: r.output,
        outputLabel: r.outputLabel,
        steps: r.steps,
        traces: r.trace ?? {},
        error: null,
    };
}

// ── Examples ──
interface LabExample {
    label: string;
    key: string;
    input: string;
    inputFormat: string;
}

function examplesByLab(slug: string): LabExample[] {
    switch (slug) {
        case 'caesar-cipher-lab':
            return [
                { label: 'HELLO WORLD (k=3)', key: '3', input: 'HELLO WORLD', inputFormat: 'ascii' },
                { label: 'CRYPTER (k=7)', key: '7', input: 'CRYPTER', inputFormat: 'ascii' },
            ];
        case 'vigenere-cipher-lab':
            return [
                { label: 'ATTACK AT DAWN / LEMON', key: 'LEMON', input: 'ATTACK AT DAWN', inputFormat: 'ascii' },
                { label: 'HELLO / KEY', key: 'KEY', input: 'HELLO', inputFormat: 'ascii' },
            ];
        case 'aes-lab':
            return [
                { label: 'CRYPTER LAB', key: 'CRYPTER-LAB-KEY', input: 'CRYPTER LAB', inputFormat: 'ascii' },
                { label: 'Vektor FIPS-197', key: '000102030405060708090A0B0C0D0E0F', input: '00112233445566778899AABBCCDDEEFF', inputFormat: 'hex' },
            ];
        case 'des-lab':
            return [
                { label: 'Halo DES', key: 'password', input: 'Halo DES', inputFormat: 'ascii' },
                { label: 'Vektor NIST DES', key: '133457799BBCDFF1', input: '0123456789ABCDEF', inputFormat: 'hex' },
            ];
        case 'rsa-lab':
            return [
                { label: 'HELLO', key: '', input: 'HELLO', inputFormat: 'ascii' },
                { label: 'Crypter Lab', key: '', input: 'Crypter Lab', inputFormat: 'ascii' },
            ];
        case 'digital-signature-lab':
            return [
                { label: 'Crypter Lab', key: '', input: 'Crypter Lab', inputFormat: 'ascii' },
            ];
        default:
            return [];
    }
}

function keyInfoByLab(slug: string): { label: string; value: string }[] {
    switch (slug) {
        case 'caesar-cipher-lab':
            return [
                { label: 'Ruang kunci', value: '25' },
                { label: 'Jenis', value: 'Monoalfabetik' },
            ];
        case 'vigenere-cipher-lab':
            return [
                { label: 'Ruang kunci', value: '26^k' },
                { label: 'Jenis', value: 'Polialfabetik' },
            ];
        case 'aes-lab':
            return [
                { label: 'Blok', value: '128-bit' },
                { label: 'Kunci', value: '128-bit' },
                { label: 'Putaran', value: '10' },
                { label: 'Mode', value: 'ECB' },
            ];
        case 'des-lab':
            return [
                { label: 'Blok', value: '64-bit' },
                { label: 'Kunci', value: '56-bit efektif' },
                { label: 'Putaran', value: '16 Feistel' },
                { label: 'Status', value: 'Warisan' },
            ];
        case 'rsa-lab':
            return [
                { label: 'Kunci', value: '~256-bit' },
                { label: 'e', value: '65537' },
                { label: 'Padding', value: 'Tidak ada' },
            ];
        case 'digital-signature-lab':
            return [
                { label: 'Hash', value: 'SHA-256' },
                { label: 'Skema', value: 'RSA+SHA-256' },
                { label: 'Status', value: 'Edukatif' },
            ];
        default:
            return [];
    }
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

    const debouncedInput = useDebouncedValue({ inputValue, keyValue, mode, inputFormat }, 300);

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

    const concept = useMemo(() => conceptLensByLab(lab.slug, mode), [lab.slug, mode]);
    const onboarding = useMemo(() => onboardingByLab(lab.slug), [lab.slug]);
    const examples = useMemo(() => examplesByLab(lab.slug), [lab.slug]);
    const keyInfo = useMemo(() => keyInfoByLab(lab.slug), [lab.slug]);

    const handleReset = () => {
        setKeyValue('');
        setInputValue('');
        setMode('encrypt');
        setInputFormat(recommendedInputFormatByLab(lab.slug, 'encrypt'));
        setOutputFormat(recommendedOutputFormatByLab(lab.slug, 'encrypt'));
        player.reset();
    };

    const handleModeChange = (newMode: SimulationMode) => {
        setMode(newMode);
        setInputFormat(recommendedInputFormatByLab(lab.slug, newMode));
        setOutputFormat(recommendedOutputFormatByLab(lab.slug, newMode));
    };

    const handleExampleSelect = (ex: LabExample) => {
        setKeyValue(ex.key);
        setInputValue(ex.input);
        setInputFormat(ex.inputFormat as FormatValue);
    };

    return (
        <>
            <Head title={`${lab.title} Lab`} />

            <div className="relative flex flex-col gap-4 px-4 pt-3 pb-4 lg:gap-6 lg:pt-3 lg:pb-4">
                {/* Header — back button sejajar dengan height title + desc */}
                <header className="animate-fade-in-up flex flex-col gap-3 sm:flex-row sm:items-start">
                    <Link href={labsIndex.url()} className="self-start sm:self-stretch">
                        <Button variant="ghost" size="icon" className="h-10 w-11 shrink-0 rounded-lg sm:h-full">
                            <ChevronLeft className="size-5" />
                        </Button>
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <TypographyH1 className="text-2xl/none sm:text-3xl/none">{lab.title}</TypographyH1>
                        <TypographyMuted>{lab.summary}</TypographyMuted>
                    </div>
                    <Tabs value={mode} onValueChange={(v) => handleModeChange(v as SimulationMode)} className="shrink-0 self-start sm:ml-auto sm:self-end">
                        <TabsList className="h-9 grid w-auto grid-cols-2">
                            <TabsTrigger value="encrypt" className="text-xs px-3">
                                {isSignature ? 'Tandatangani' : 'Enkripsi'}
                            </TabsTrigger>
                            <TabsTrigger value="decrypt" className="text-xs px-3">
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
                        concept={concept}
                        onboarding={onboarding}
                        keyInfo={keyInfo}
                        examples={examples}
                        onExampleSelect={handleExampleSelect}
                        step={player.step}
                        total={player.total}
                        progress={player.progress}
                        onReset={handleReset}
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
