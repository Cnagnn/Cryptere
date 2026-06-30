/**
 * LabIO — guided story workbench for simulation input/output.
 */
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { FormatValue } from '@/types/labs';

const FORMAT_OPTIONS: Array<{ value: FormatValue; label: string }> = [
    { value: 'ascii', label: 'ASCII' },
    { value: 'hex', label: 'Hex' },
    { value: 'binary', label: 'Biner' },
    { value: 'base64', label: 'Base64' },
    { value: 'decimal', label: 'Desimal' },
];

interface Props {
    keyValue: string;
    onKeyChange: (v: string) => void;
    keyLabel: string;
    keyPlaceholder: string;
    hideKey: boolean;
    inputValue: string;
    onInputChange: (v: string) => void;
    inputLabel: string;
    inputPlaceholder: string;
    inputHelper: string;
    inputFormat: FormatValue;
    onInputFormatChange: (f: FormatValue) => void;
    output: string;
    outputLabel: string;
    outputFormat: FormatValue;
    onOutputFormatChange: (f: FormatValue) => void;
    canChangeOutputFormat: boolean;
    error: string | null;
    step: number;
    total: number;
    progress: number;
}

export default function LabIO({
    keyValue,
    onKeyChange,
    keyLabel,
    keyPlaceholder,
    hideKey,
    inputValue,
    onInputChange,
    inputLabel,
    inputPlaceholder,
    inputHelper,
    inputFormat,
    onInputFormatChange,
    output,
    outputLabel,
    outputFormat,
    onOutputFormatChange,
    canChangeOutputFormat,
    error,
    step,
    total,
    progress,
}: Props) {
    const [copied, setCopied] = useState(false);
    const hasOutput = output.trim().length > 0;
    const teacherNote = error
        ? 'Ada input yang belum valid. Perbaiki bagian yang ditandai, lalu coba jalankan lagi.'
        : hasOutput
          ? 'Output sudah terbentuk. Sekarang bandingkan input awal dengan hasil akhirnya, lalu buka visualisasi untuk melihat perubahan per langkah.'
          : 'Mulai dari plainteks atau pesan asli. Setelah itu tentukan kunci, lalu hasilnya akan muncul sebagai ciphertext.';

    const handleCopy = () => {
        navigator.clipboard.writeText(output).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <Card className="min-w-0 gap-0 py-0">
            <CardHeader className="border-b py-4">
                <CardTitle>Guided Story Workbench</CardTitle>
                <CardDescription>
                    Ikuti alur seperti guru: mulai dari plainteks, atur kunci,
                    lalu baca perubahan sampai menjadi ciphertext.
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 py-4">
                <section className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-3 text-xs">
                        <p className="font-medium">Langkah belajar</p>
                        <p className="text-muted-foreground tabular-nums">
                            {total > 1
                                ? `${step + 1} / ${total}`
                                : hasOutput
                                  ? 'Output siap'
                                  : 'Mulai'}
                        </p>
                    </div>
                    <Progress
                        value={total > 1 ? progress : hasOutput ? 100 : 0}
                        className="mt-2 h-1.5"
                    />
                    <div className="mt-3 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-4">
                        <span>1. Plainteks</span>
                        <span>2. Kunci</span>
                        <span>3. Proses</span>
                        <span>4. Ciphertext</span>
                    </div>
                </section>

                <section className="flex flex-col gap-3">
                    <div>
                        <h3 className="text-sm font-medium">
                            1. Siapkan plainteks dan kunci
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Masukkan pesan asli, lalu pilih aturan yang akan
                            mengubahnya.
                        </p>
                    </div>
                    <FieldGroup className="gap-3">
                        {!hideKey && (
                            <Field>
                                <FieldLabel className="text-[11px] font-medium text-muted-foreground">
                                    {keyLabel}
                                </FieldLabel>
                                <Input
                                    value={keyValue}
                                    onChange={(e) =>
                                        onKeyChange(e.target.value)
                                    }
                                    placeholder={keyPlaceholder}
                                    className="h-8 font-mono text-sm"
                                />
                            </Field>
                        )}

                        <Field>
                            <div className="flex items-center justify-between gap-2">
                                <FieldLabel className="text-[11px] font-medium text-muted-foreground">
                                    {inputLabel}
                                </FieldLabel>
                                <Select
                                    value={inputFormat}
                                    onValueChange={(v) =>
                                        onInputFormatChange(v as FormatValue)
                                    }
                                >
                                    <SelectTrigger
                                        className="h-6 w-auto min-w-16 gap-1 text-[11px]"
                                        aria-label="Format input"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent align="end">
                                        {FORMAT_OPTIONS.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                                className="text-xs"
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Textarea
                                value={inputValue}
                                onChange={(e) => onInputChange(e.target.value)}
                                placeholder={inputPlaceholder}
                                className="min-h-24 resize-none font-mono text-sm"
                            />
                            {inputHelper && (
                                <FieldDescription className="text-xs">
                                    {inputHelper}
                                </FieldDescription>
                            )}
                        </Field>

                        {error && (
                            <Alert variant="destructive" className="py-2">
                                <AlertDescription className="text-xs">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}
                    </FieldGroup>
                </section>

                <section className="rounded-lg border p-3">
                    <p className="text-xs font-medium">Narasi guru</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {teacherNote}
                    </p>
                </section>

                <section className="flex flex-col gap-3">
                    <div>
                        <h3 className="text-sm font-medium">
                            2. Baca ciphertext
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Gunakan hasil ini untuk membandingkan perubahan dari
                            input awal.
                        </p>
                    </div>
                    <Field>
                        <div className="flex items-center justify-between gap-2">
                            <FieldLabel className="text-[11px] font-medium text-muted-foreground">
                                {outputLabel}
                            </FieldLabel>
                            <div className="flex items-center gap-1">
                                {canChangeOutputFormat && (
                                    <Select
                                        value={outputFormat}
                                        onValueChange={(v) =>
                                            onOutputFormatChange(
                                                v as FormatValue,
                                            )
                                        }
                                    >
                                        <SelectTrigger
                                            className="h-6 w-auto min-w-16 gap-1 text-[11px]"
                                            aria-label="Format output"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent align="end">
                                            {FORMAT_OPTIONS.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                    className="text-xs"
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[11px]"
                                    onClick={handleCopy}
                                    disabled={!hasOutput}
                                >
                                    {copied ? 'Tersalin' : 'Salin'}
                                </Button>
                            </div>
                        </div>
                        <Textarea
                            readOnly
                            value={output}
                            placeholder="Hasil akan tampil di sini..."
                            className="min-h-24 resize-none bg-background font-mono text-sm"
                        />
                    </Field>
                </section>
            </CardContent>
        </Card>
    );
}
