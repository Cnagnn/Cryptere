/**
 * LabInputCard — sisi kiri lab detail. Field: Key, Input, Output (read-only)
 * dengan tombol Convert untuk swap arah (encrypt ↔ decrypt) + tombol Reset.
 */
import { ArrowDownUp, RotateCcw } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { SimulationMode } from '@/types/labs';

interface Props {
    mode: SimulationMode;
    onModeChange: (m: SimulationMode) => void;
    keyValue: string;
    onKeyChange: (v: string) => void;
    keyLabel: string;
    keyPlaceholder: string;
    inputValue: string;
    onInputChange: (v: string) => void;
    inputLabel: string;
    inputPlaceholder: string;
    inputHelper: string;
    output: string;
    outputLabel: string;
    error: string | null;
    onReset: () => void;
    onConvert: () => void;
}

export default function LabInputCard({
    mode,
    keyValue,
    onKeyChange,
    keyLabel,
    keyPlaceholder,
    inputValue,
    onInputChange,
    inputLabel,
    inputPlaceholder,
    inputHelper,
    output,
    outputLabel,
    error,
    onReset,
    onConvert,
}: Props) {
    return (
        <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="gap-1 pb-3">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">Data & Kunci</CardTitle>
                    <Badge variant="outline" className="capitalize">
                        {mode === 'encrypt' ? 'Enkripsi' : 'Dekripsi'}
                    </Badge>
                </div>
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
                        <FieldLabel htmlFor="lab-input">{inputLabel}</FieldLabel>
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
