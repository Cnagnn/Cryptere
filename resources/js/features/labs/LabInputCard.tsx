/**
 * LabInputCard — sisi kiri lab detail. Field: Key, Input, Output (read-only)
 * dengan tombol Convert untuk swap arah (encrypt ↔ decrypt) + tombol Reset.
 */
import { ArrowDownUp, RotateCcw } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { FormatValue } from '@/types/labs';

/** Format options dengan ASCII sebagai default (paling mudah dipahami). */
const FORMAT_OPTIONS: Array<{ value: FormatValue; label: string }> = [
    { value: 'ascii', label: 'ASCII (Default)' },
    { value: 'hex', label: 'Heksadesimal' },
    { value: 'binary', label: 'Biner' },
    { value: 'base64', label: 'Base64' },
    { value: 'decimal', label: 'Byte Desimal' },
];

/** Bento card class — referensi dari dashboard.tsx (bentoCardClass). */
const bentoCardClass = 'h-full overflow-hidden border-border/70 bg-card/95 shadow-sm';

interface Props {
    keyValue: string;
    onKeyChange: (v: string) => void;
    keyLabel: string;
    keyPlaceholder: string;
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
    onReset: () => void;
    onConvert: () => void;
}

export default function LabInputCard({
    keyValue,
    onKeyChange,
    keyLabel,
    keyPlaceholder,
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
    onReset,
    onConvert,
}: Props) {
    return (
        <Card className={bentoCardClass}>
            <CardHeader className="gap-1">
                <CardTitle>Data & Kunci</CardTitle>
                <CardDescription>
                    Masukkan kunci dan input untuk memulai simulasi.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="lab-key">{keyLabel}</FieldLabel>
                        <Input
                            id="lab-key"
                            value={keyValue}
                            onChange={(e) => onKeyChange(e.target.value)}
                            placeholder={keyPlaceholder}
                            className="font-mono"
                        />
                    </Field>

                    <Field>
                        <div className="flex items-center justify-between gap-2">
                            <FieldLabel htmlFor="lab-input">{inputLabel}</FieldLabel>
                            <Select value={inputFormat} onValueChange={onInputFormatChange}>
                                <SelectTrigger size="sm" className="h-7 w-auto gap-1 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    {FORMAT_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Textarea
                            id="lab-input"
                            value={inputValue}
                            onChange={(e) => onInputChange(e.target.value)}
                            placeholder={inputPlaceholder}
                            className="min-h-24 resize-none font-mono text-sm"
                        />
                        <FieldDescription>{inputHelper}</FieldDescription>
                    </Field>

                    <Field>
                        <div className="flex items-center justify-between gap-2">
                            <FieldLabel htmlFor="lab-output">{outputLabel}</FieldLabel>
                            <div className="flex items-center gap-1.5">
                                {canChangeOutputFormat && (
                                    <Select value={outputFormat} onValueChange={onOutputFormatChange}>
                                        <SelectTrigger size="sm" className="h-7 w-auto gap-1 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent align="end">
                                            {FORMAT_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={onConvert}
                                    disabled={!output || !!error}
                                    title="Pindahkan output ke input dan balik arah"
                                    className="h-7 gap-1.5 text-xs"
                                >
                                    <ArrowDownUp className="size-3.5" />
                                    Convert
                                </Button>
                            </div>
                        </div>
                        <Textarea
                            id="lab-output"
                            readOnly
                            value={output}
                            placeholder="Hasil akan tampil di sini"
                            className="min-h-24 resize-none bg-muted/40 font-mono text-sm"
                        />
                    </Field>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button variant="outline" onClick={onReset} className="w-full">
                        <RotateCcw className="size-4" />
                        Reset
                    </Button>
                </FieldGroup>
            </CardContent>
        </Card>
    );
}
