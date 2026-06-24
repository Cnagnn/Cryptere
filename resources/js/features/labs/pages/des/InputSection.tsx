/**
 * InputSection — Left sidebar for DES lab
 * Handles plaintext, key input, mode toggle, and output display
 */

import { Copy } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { runSimulation } from '@/lib/lab-simulations';
import { cn } from '@/lib/utils';
import type { DesTrace } from '@/types/labs';

interface InputSectionProps {
    trace?: DesTrace;
    output: string;
    outputFormat: 'hex' | 'binary' | 'ascii';
    onOutputFormatChange: (format: 'hex' | 'binary' | 'ascii') => void;
    onTraceUpdate?: (trace: DesTrace) => void;
}

export default function InputSection({
    trace,
    output,
    outputFormat,
    onOutputFormatChange,
    onTraceUpdate,
}: InputSectionProps) {
    const [plaintext, setPlaintext] = useState('');
    const [key, setKey] = useState('');
    const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEncrypt = async () => {
        setError('');

        if (!plaintext.trim() || !key.trim()) {
            setError('Plaintext dan key tidak boleh kosong');

            return;
        }

        setIsLoading(true);

        try {
            const result = runSimulation('des-lab', plaintext, key, mode);

            if (result.trace?.des) {
                onTraceUpdate?.(result.trace.des);
            } else {
                setError('Simulasi gagal');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setPlaintext('');
        setKey('');
        setMode('encrypt');
        setError('');
    };

    const handleCopyOutput = () => {
        navigator.clipboard.writeText(output);
    };

    return (
        <div className="space-y-4">
            {/* Input Card */}
            <Card className="border-border/70 bg-card/95 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Input</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Plaintext Input */}
                    <div className="space-y-2">
                        <Label htmlFor="plaintext" className="text-xs font-semibold">
                            Plaintext
                        </Label>
                        <Textarea
                            id="plaintext"
                            placeholder="Masukkan teks (8 karakter / 64 bit)"
                            value={plaintext}
                            onChange={(e) => setPlaintext(e.target.value)}
                            className="min-h-20 text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            {plaintext.length} karakter
                        </p>
                    </div>

                    {/* Key Input */}
                    <div className="space-y-2">
                        <Label htmlFor="key" className="text-xs font-semibold">
                            Kunci
                        </Label>
                        <Textarea
                            id="key"
                            placeholder="Masukkan kunci (8 karakter / 64 bit)"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            className="min-h-20 text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            {key.length} karakter
                        </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Mode</Label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMode('encrypt')}
                                className={cn(
                                    'flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                                    mode === 'encrypt'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                                )}
                            >
                                Enkripsi
                            </button>
                            <button
                                onClick={() => setMode('decrypt')}
                                className={cn(
                                    'flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                                    mode === 'decrypt'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                                )}
                            >
                                Dekripsi
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleEncrypt}
                            disabled={isLoading}
                            className="flex-1 h-8 text-xs"
                        >
                            {isLoading ? 'Memproses...' : mode === 'encrypt' ? 'Enkripsi' : 'Dekripsi'}
                        </Button>
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                        >
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Output Card */}
            {trace && (
                <Card className="border-border/70 bg-card/95 shadow-sm border-green-200 dark:border-green-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            Output
                            <Badge variant="outline" className="text-xs">
                                {mode === 'encrypt' ? 'Ciphertext' : 'Plaintext'}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Output Display */}
                        <div className="rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 p-3">
                            <p className="text-[10px] font-semibold text-green-600 dark:text-green-400 mb-1">
                                {outputFormat.toUpperCase()}
                            </p>
                            <p className="font-mono text-xs break-all text-foreground">
                                {output}
                            </p>
                        </div>

                        {/* Format Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="format" className="text-xs font-semibold">
                                Format
                            </Label>
                            <Select value={outputFormat} onValueChange={(v: any) => onOutputFormatChange(v)}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hex">Hexadecimal</SelectItem>
                                    <SelectItem value="binary">Binary</SelectItem>
                                    <SelectItem value="ascii">ASCII</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Copy Button */}
                        <Button
                            onClick={handleCopyOutput}
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs"
                        >
                            <Copy className="w-3 h-3 mr-2" />
                            Salin
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
