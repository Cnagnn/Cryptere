import { motion } from 'framer-motion';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { bitsToHex } from '@/features/labs/algorithms/des';
import type { DesTrace } from '@/types/labs';

function DataBox({ label, value, bits }: { label: string; value: string; bits?: number }) {
    return (
        <Card className="px-3 py-2 min-w-0">
            <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
            <p className="font-mono text-xs font-medium break-all text-foreground">{value}</p>
            {bits !== undefined && <p className="text-[8px] text-muted-foreground">{bits} bit</p>}
        </Card>
    );
}

function VArrow({ label }: { label?: string }) {
    return (
        <div className="flex flex-col items-center py-1">
            <div className="w-px h-4 bg-border" />
            <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-border" />
            {label && <p className="text-[10px] text-muted-foreground mt-1">{label}</p>}
        </div>
    );
}

function HArrow() {
    return <span className="text-muted-foreground text-sm px-1">→</span>;
}

function OpNode({ symbol, label }: { symbol: string; label: string }) {
    return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 border border-border text-xs font-medium text-muted-foreground">
            <span className="text-sm">{symbol}</span>
            {label}
        </div>
    );
}

function FnBox({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/30 px-2 py-1">
            <span className="text-[9px] font-semibold text-muted-foreground">{label}</span>
            {children}
        </div>
    );
}

export function InitialPermutationSlide({ trace }: { trace: DesTrace }) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Badge variant="outline">Step 0</Badge>
                <p className="text-sm font-semibold text-foreground">Initial Permutation (IP)</p>
                <Badge variant="secondary" className="ml-auto">64 bit → 32 + 32</Badge>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
                Plaintext <strong className="text-foreground">64-bit</strong> masuk, lalu diacak oleh{' '}
                <strong className="text-foreground">Initial Permutation</strong>.
                Hasilnya dibagi dua: <strong className="text-foreground">L₀</strong> (32-bit kiri) dan{' '}
                <strong className="text-foreground">R₀</strong> (32-bit kanan).
            </p>

            <Card className="border-dashed p-4 bg-muted/5 flex flex-col gap-2">
                <div className="flex justify-center">
                    <DataBox label="Plaintext" value={bitsToHex(trace.afterIP)} />
                </div>
                <VArrow />
                <div className="flex justify-center">
                    <OpNode symbol="↻" label="IP — Initial Permutation" />
                </div>
                <VArrow />
                <div className="flex justify-center gap-4">
                    <DataBox label="L₀" value={bitsToHex(trace.L0)} bits={32} />
                    <DataBox label="R₀" value={bitsToHex(trace.R0)} bits={32} />
                </div>
            </Card>

            <Alert>
                <AlertTitle>IP</AlertTitle>
                <AlertDescription>
                    Tabel permutasi tetap yang mengatur ulang posisi bit. Tidak ada operasi kriptografi — hanya{' '}
                    <strong>pengacakan posisi</strong>. Pola IP sudah ditentukan dalam standar DES.
                </AlertDescription>
            </Alert>
        </motion.div>
    );
}

export function FeistelRoundSlide({ trace, roundIndex }: { trace: DesTrace; roundIndex: number }) {
    const round = trace.rounds[roundIndex];

    if (!round) {
return null;
}

    const rn = roundIndex + 1;

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Badge variant="outline">Step {rn}</Badge>
                <p className="text-sm font-semibold text-foreground">Feistel Round {rn}</p>
                <Badge variant="secondary" className="ml-auto">K{rn}</Badge>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Round {rn}</strong> dimulai.{' '}
                <strong className="text-foreground">L{roundIndex}</strong> dan{' '}
                <strong className="text-foreground">R{roundIndex}</strong> masuk ke struktur Feistel.{' '}
                <strong className="text-foreground">R{roundIndex}</strong> melewati{' '}
                <strong className="text-foreground">fungsi F</strong> bersama round key{' '}
                <strong className="text-foreground">K{rn}</strong>, lalu hasilnya di-XOR dengan{' '}
                <strong className="text-foreground">L{roundIndex}</strong>.
            </p>

            <Card className="border-dashed p-4 bg-muted/5 flex flex-col gap-2">
                <div className="flex justify-center gap-4">
                    <DataBox label={`L${roundIndex}`} value={bitsToHex(round.L)} bits={32} />
                    <DataBox label={`R${roundIndex}`} value={bitsToHex(round.R)} bits={32} />
                </div>

                <VArrow />

                <div className="flex items-center justify-center gap-3">
                    <OpNode symbol="⊕" label="" />
                    <div className="px-3 py-2 rounded-md border border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                        F(R{roundIndex}, K{rn})
                        <span className="text-muted-foreground ml-1 text-[10px]">32-bit</span>
                    </div>
                    <DataBox label={`K${rn}`} value={bitsToHex(round.roundKey)} bits={48} />
                </div>

                <Separator />

                <div className="flex items-center justify-center gap-1 py-1">
                    <FnBox label="E(R)">
                        <span className="text-[10px] text-foreground font-mono">{bitsToHex(round.expandedR).slice(0, 8)}…</span>
                    </FnBox>
                    <HArrow />
                    <FnBox label="⊕K">
                        <span className="text-[10px] text-foreground font-mono">{bitsToHex(round.xoredWithKey).slice(0, 8)}…</span>
                    </FnBox>
                    <HArrow />
                    <FnBox label="S-box">
                        <span className="text-[10px] text-foreground font-mono">{bitsToHex(round.sboxOutput).slice(0, 8)}…</span>
                    </FnBox>
                    <HArrow />
                    <FnBox label="P">
                        <span className="text-[10px] text-foreground font-mono">{bitsToHex(round.permutedOutput).slice(0, 8)}…</span>
                    </FnBox>
                </div>

                <VArrow />

                <div className="flex justify-center gap-4">
                    <DataBox label={`L${rn} = R${roundIndex}`} value={bitsToHex(round.newL)} bits={32} />
                    <DataBox label={`R${rn} = L${roundIndex}⊕F`} value={bitsToHex(round.newR)} bits={32} />
                </div>
            </Card>

            <Alert>
                <AlertTitle>Struktur Feistel</AlertTitle>
                <AlertDescription>
                    L{rn} = R{roundIndex}, R{rn} = L{roundIndex} ⊕ F(R{roundIndex}, K{rn}).{' '}
                    <strong>Fungsi F</strong> terdiri dari: Ekspansi E (32→48), XOR dengan K{rn}, substitusi S-box (48→32), dan Permutasi P.
                </AlertDescription>
            </Alert>
        </motion.div>
    );
}

export function FinalPermutationSlide({ trace }: { trace: DesTrace }) {
    const lastRound = trace.rounds[15];

    if (!lastRound) {
return null;
}

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <Badge variant="outline">Step 17</Badge>
                <p className="text-sm font-semibold text-foreground">Final Permutation (FP)</p>
                <Badge variant="secondary" className="ml-auto">Selesai</Badge>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
                Setelah <strong className="text-foreground">16 putaran</strong>, L₁₆ dan R₁₆{' '}
                <strong className="text-foreground">ditukar</strong> menjadi R₁₆ L₁₆, lalu melewati{' '}
                <strong className="text-foreground">Final Permutation (FP)</strong> — kebalikan dari IP.
                Hasilnya: <strong className="text-foreground">ciphertext 64-bit</strong>.
            </p>

            <Card className="border-dashed p-4 bg-muted/5 flex flex-col gap-2">
                <div className="flex justify-center gap-4">
                    <DataBox label="L₁₆" value={bitsToHex(lastRound.newL)} bits={32} />
                    <DataBox label="R₁₆" value={bitsToHex(lastRound.newR)} bits={32} />
                </div>

                <VArrow />
                <div className="flex justify-center">
                    <OpNode symbol="⇄" label="Swap → R₁₆ L₁₆" />
                </div>
                <VArrow />
                <div className="flex justify-center">
                    <OpNode symbol="↻" label="FP — Final Permutation" />
                </div>
                <VArrow />

                <div className="flex justify-center">
                    <DataBox label="Ciphertext" value={trace.ciphertext} bits={64} />
                </div>
            </Card>

            <Alert>
                <AlertTitle>Enkripsi selesai</AlertTitle>
                <AlertDescription>
                    Ciphertext 64-bit siap dikirim. Untuk mendekripsi, gunakan kunci yang sama — prosesnya identik
                    dengan round key dibalik (K₁₆ → K₁).
                </AlertDescription>
            </Alert>
        </motion.div>
    );
}
