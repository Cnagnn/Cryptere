/**
 * LabInputCard — sisi kiri lab detail. Field: Key, Input, Output (read-only)
 * dengan dropdown format untuk masing-masing field, tombol Convert untuk swap
 * arah (encrypt ↔ decrypt) + tombol Reset.
 */
import { ArrowDownUp, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

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

/** Header baris label-kiri + slot-kanan untuk konsistensi alignment semua field. */
function FieldHeader({
    htmlFor,
    label,
    children,
}: {
    htmlFor: string;
    label: string;
    children?: ReactNode;
}) {
    return (
        <div className="flex min-h-7 items-center justify-between gap-2">
            <FieldLabel htmlFor={htmlFor} className="text-sm font-medium">
                {label}
            </FieldLabel>
            {children && <div className="flex items-center gap-1.5">{children}</div>}
        </div>
    );
}

/** Dropdown format — dipakai oleh key/input/output dengan styling identik. */
function FormatSelect({
    value,
    onChange,
    label,
}: {
    value: FormatValue;
    onChange: (v: FormatValue) => void;
    label: string;
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger
                size="sm"
                className="h-7 w-auto min-w-[7.5rem] gap-1 text-xs"
                aria-label={label}
            >
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
    );
}

interface Props {
    keyValue: string;
    onKeyChange: (v: string) => void;
    keyLabel: string;
    keyPlaceholder: string;
    keyFormat: FormatValue;
    onKeyFormatChange: (f: FormatValue) => void;
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
    keyFormat,
    onKeyFormatChange,
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
                        <FieldHeader htmlFor="lab-key" label={keyLabel}>
                            <FormatSelect
                                value={keyFormat}
                                onChange={onKeyFormatChange}
                                label="Format kunci"
                            />
                        </FieldHeader>
                        <Input
                            id="lab-key"
                            value={keyValue}
                            onChange={(e) => onKeyChange(e.target.value)}
                            placeholder={keyPlaceholder}
                            className="font-mono"
                        />
                    </Field>

                    <Field>
                        <FieldHeader htmlFor="lab-input" label={inputLabel}>
                            <FormatSelect
                                value={inputFormat}
                                onChange={onInputFormatChange}
                                label="Format input"
                            />
                        </FieldHeader>
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
                        <FieldHeader htmlFor="lab-output" label={outputLabel}>
                            {canChangeOutputFormat && (
                                <FormatSelect
                                    value={outputFormat}
                                    onChange={onOutputFormatChange}
                                    label="Format hasil"
                                />
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
                        </FieldHeader>
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
