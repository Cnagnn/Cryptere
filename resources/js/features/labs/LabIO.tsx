/**
 * LabIO — left card: simulation input/output + algorithm info.
 * Compact layout: header with example dropdown, input area, output area,
 * step progress, collapsible algorithm info, reset footer.
 */
import {
    Key,
    MessageSquareText,
    FileOutput,
    ClipboardCheck,
    ClipboardCopy,
    Lightbulb,
    RotateCcw,
    Beaker,
} from 'lucide-react';
import { useState } from 'react';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { ConceptLens, FormatValue } from '@/types/labs';

interface LabExample {
    label: string;
    key: string;
    input: string;
    inputFormat: string;
}

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
    concept: ConceptLens;
    onboarding: string[];
    keyInfo: { label: string; value: string }[];
    examples: LabExample[];
    onExampleSelect: (ex: LabExample) => void;
    step: number;
    total: number;
    progress: number;
    onReset: () => void;
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
    concept,
    onboarding,
    keyInfo,
    examples,
    onExampleSelect,
    step,
    total,
    progress,
    onReset,
}: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(output).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl border bg-background">
                {/* Header: Simulasi + examples dropdown */}
                <div className="border-b px-4 py-4 sm:px-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-sm font-semibold">Simulasi</h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Masukkan kunci dan data untuk diproses.
                            </p>
                        </div>
                        {examples.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                                        <Beaker className="size-3" />
                                        Contoh
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-52">
                                    {examples.map((ex) => (
                                        <DropdownMenuItem
                                            key={ex.label}
                                            onClick={() => onExampleSelect(ex)}
                                            className="text-xs"
                                        >
                                            {ex.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Input area */}
                <div className="space-y-3 p-4 sm:px-5 sm:pb-4">
                    {!hideKey && (
                        <Field>
                            <FieldLabel className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                <Key className="size-3" />
                                {keyLabel}
                            </FieldLabel>
                            <Input
                                value={keyValue}
                                onChange={(e) => onKeyChange(e.target.value)}
                                placeholder={keyPlaceholder}
                                className="h-8 font-mono text-sm"
                            />
                        </Field>
                    )}

                    <Field>
                        <div className="flex items-center justify-between gap-2">
                            <FieldLabel className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                <MessageSquareText className="size-3" />
                                {inputLabel}
                            </FieldLabel>
                            <Select
                                value={inputFormat}
                                onValueChange={(v) => onInputFormatChange(v as FormatValue)}
                            >
                                <SelectTrigger className="h-6 w-auto min-w-16 gap-1 text-[11px]" aria-label="Format input">
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
                            value={inputValue}
                            onChange={(e) => onInputChange(e.target.value)}
                            placeholder={inputPlaceholder}
                            className="min-h-16 resize-none font-mono text-sm"
                        />
                        {inputHelper && (
                            <FieldDescription className="text-xs">{inputHelper}</FieldDescription>
                        )}
                    </Field>

                    {error && (
                        <Alert variant="destructive" className="py-2">
                            <AlertDescription className="text-xs">{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Output area */}
                <div className="border-t p-4 sm:px-5 sm:py-4">
                    <Field>
                        <div className="flex items-center justify-between gap-2">
                            <FieldLabel className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                <FileOutput className="size-3" />
                                {outputLabel}
                            </FieldLabel>
                            <div className="flex items-center gap-1">
                                {canChangeOutputFormat && (
                                    <Select
                                        value={outputFormat}
                                        onValueChange={(v) => onOutputFormatChange(v as FormatValue)}
                                    >
                                        <SelectTrigger className="h-6 w-auto min-w-16 gap-1 text-[11px]" aria-label="Format output">
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
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={handleCopy}
                                    disabled={!output}
                                    title={copied ? 'Tersalin' : 'Salin'}
                                >
                                    {copied ? (
                                        <ClipboardCheck className="size-3 text-emerald-500" />
                                    ) : (
                                        <ClipboardCopy className="size-3" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <Textarea
                            readOnly
                            value={output}
                            placeholder="Hasil akan tampil di sini..."
                            className="min-h-16 resize-none bg-background font-mono text-sm"
                        />
                    </Field>
                </div>

                {/* Step progress — between output and about section */}
                {total > 1 && (
                    <div className="border-t px-4 py-3 sm:px-5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Langkah</span>
                            <span className="font-medium tabular-nums">
                                {step + 1} / {total}
                            </span>
                        </div>
                        <Progress value={progress} className="mt-1.5 h-1.5" />
                    </div>
                )}

                {/* Algorithm info — collapsed by default */}
                <div className="border-t">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="info" className="border-b-0">
                            <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline sm:px-5">
                                <span className="flex items-center gap-2">
                                    <Lightbulb className="size-3.5" />
                                    Tentang Algoritma
                                </span>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
                                    {/* Concept */}
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="concept" className="border-b-0">
                                            <AccordionTrigger className="py-1.5 text-xs hover:no-underline">
                                                {concept.title}
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-1">
                                                <div className="space-y-2 pl-5">
                                                    {onboarding.length > 0 && (
                                                        <div className="space-y-1">
                                                            <p className="text-[11px] font-medium text-muted-foreground">
                                                                Analogi
                                                            </p>
                                                            {onboarding.map((line, i) => (
                                                                <p key={i} className="text-[11px] text-muted-foreground">
                                                                    {line}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="space-y-1">
                                                        <p className="text-[11px] font-medium text-muted-foreground">
                                                            Poin Kunci
                                                        </p>
                                                        <ul className="space-y-1">
                                                            {concept.points.map((point, i) => (
                                                                <li key={i} className="flex gap-1.5 text-[11px]">
                                                                    <span className="mt-1 size-1 shrink-0 rounded-full bg-primary" />
                                                                    <span className="text-muted-foreground">
                                                                        {point}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>

                                    <Separator />

                                    {/* Key info badges */}
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-medium text-muted-foreground">
                                            Parameter
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {keyInfo.map((info) => (
                                                <Badge key={info.label} variant="outline" className="text-[11px] font-mono">
                                                    {info.label}: {info.value}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                {/* Footer: reset */}
                <div className="border-t bg-muted/20 p-4 sm:px-5 sm:pb-4">
                    <Button variant="outline" size="sm" onClick={onReset} className="w-full gap-1.5 text-xs">
                        <RotateCcw className="size-3" />
                        Reset Simulasi
                    </Button>
                </div>
            </div>
        </div>
    );
}
