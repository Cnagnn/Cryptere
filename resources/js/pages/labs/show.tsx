/**
 * labs/show.tsx — detail page untuk SEMUA lab.
 *
 * Layout: 2 card.
 *   - Kiri (LabInputCard): key + input + output + tombol Convert (swap arah).
 *   - Kanan (LabVisualizerCard): visualisasi step-by-step + playback.
 *
 * Tab Encrypt/Decrypt di header. Tidak ada lagi special-casing per lab.
 */
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import LabInputCard from '@/features/labs/LabInputCard';
import LabVisualizerCard from '@/features/labs/LabVisualizerCard';
import { useStepPlayer } from '@/features/labs/useStepPlayer';
import {
    inputHelperByLab,
    inputLabelByLab,
    inputPlaceholderByLab,
    keyLabelByLab,
    keyPlaceholderByLab,
    normalizeInputForSimulation,
    runSimulation,
    validationErrorByLab,
} from '@/lib/lab-simulations';
import type {
    AesTrace,
    DesTrace,
    LabShowProps,
    RsaKeyGenTraceData,
    RsaSignatureTraceData,
    SimulationMode,
    SimulationResult,
} from '@/types/labs';

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
): ResultBundle {
    if (!rawInput.trim() && !keyValue.trim()) {
        return { output: '', outputLabel: 'Hasil', steps: [], traces: {}, error: null };
    }

    const normalized = normalizeInputForSimulation(slug, mode, rawInput, 'ascii');

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

export default function LabsShow({ lab }: LabShowProps) {
    const [mode, setMode] = useState<SimulationMode>('encrypt');
    const [keyValue, setKeyValue] = useState('');
    const [inputValue, setInputValue] = useState('');

    const result = useMemo(
        () => computeResult(lab.slug, mode, inputValue, keyValue),
        [lab.slug, mode, inputValue, keyValue],
    );

    const player = useStepPlayer(result.steps.length);
    const hasResult = result.steps.length > 0 && !!result.output;

    const handleConvert = () => {
        if (!result.output) {
            return;
        }

        setInputValue(result.output);
        setMode((m) => (m === 'encrypt' ? 'decrypt' : 'encrypt'));
    };

    const handleReset = () => {
        setKeyValue('');
        setInputValue('');
        setMode('encrypt');
        player.reset();
    };

    return (
        <>
            <Head title={`${lab.title} Lab`} />

            <div className="flex flex-col gap-4 px-4 pt-3 pb-4 lg:gap-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex min-w-0 flex-col gap-1">
                        <TypographyH1>{lab.title}</TypographyH1>
                        <TypographyMuted>{lab.summary}</TypographyMuted>
                    </div>
                    <Tabs value={mode} onValueChange={(v) => setMode(v as SimulationMode)}>
                        <TabsList className="grid h-10 w-full grid-cols-2 sm:w-72">
                            <TabsTrigger value="encrypt">Enkripsi</TabsTrigger>
                            <TabsTrigger value="decrypt">Dekripsi</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </header>

                <section className="grid min-h-[calc(100vh-12rem)] gap-4 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-stretch">
                    <LabInputCard
                        mode={mode}
                        onModeChange={setMode}
                        keyValue={keyValue}
                        onKeyChange={setKeyValue}
                        keyLabel={keyLabelByLab(lab.slug, mode)}
                        keyPlaceholder={keyPlaceholderByLab(lab.slug, mode)}
                        inputValue={inputValue}
                        onInputChange={setInputValue}
                        inputLabel={inputLabelByLab(lab.slug, mode)}
                        inputPlaceholder={inputPlaceholderByLab(lab.slug, mode)}
                        inputHelper={inputHelperByLab(lab.slug, mode)}
                        output={result.output}
                        outputLabel={result.outputLabel}
                        error={result.error}
                        onReset={handleReset}
                        onConvert={handleConvert}
                    />

                    <LabVisualizerCard
                        slug={lab.slug}
                        mode={mode}
                        steps={result.steps}
                        step={player.step}
                        onStep={player.setStep}
                        playing={player.playing}
                        onTogglePlay={() => player.setPlaying(!player.playing)}
                        onNext={player.next}
                        onPrev={player.prev}
                        traces={result.traces}
                        hasResult={hasResult}
                    />
                </section>
            </div>
        </>
    );
}
