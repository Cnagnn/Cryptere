import { motion } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { bitsToHex } from '@/features/labs/algorithms/des';
import type { DesTrace } from '@/types/labs';

function HexBox({ label, bits }: { label: string; bits: number[] }) {
    return (
        <Card className="px-3 py-2 min-w-0 border-border/50 bg-muted/20">
            <p className="text-[10px] font-semibold mb-1 text-muted-foreground">{label}</p>
            <p className="font-mono text-xs font-medium break-all text-foreground">{bitsToHex(bits)}</p>
            <p className="text-[8px] text-muted-foreground mt-0.5">{bits.length} bit</p>
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground">
            <span className="text-sm">{symbol}</span>
            {label}
        </div>
    );
}

function FnBox({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/20 px-2 py-1">
            <span className="text-[9px] font-semibold text-muted-foreground">{label}</span>
            {children}
        </div>
    );
}

function IoBox({ label, value }: { label: string; value: string }) {
    return (
        <Card className="px-3 py-2 border-border/50 bg-muted/20">
            <p className="text-[10px] font-semibold mb-1 uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="font-mono text-xs break-all text-foreground">{value}</p>
        </Card>
    );
}

function Narration({ children }: { children: React.ReactNode }) {
    return (
        <Card className="border-border/30 bg-muted/10 p-3 flex items-start gap-2">
            <span className="text-sm shrink-0 mt-0.5 text-muted-foreground">📖</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
        </Card>
    );
}

export function InitialPermutationSlide({ trace }: { trace: DesTrace }) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
                <Badge variant="outline">Step 0</Badge>
                <p className="text-sm font-semibold text-foreground">Initial Permutation (IP)</p>
                <p className="text-[11px] text-muted-foreground ml-auto">64 bit → 32 + 32</p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
                Plaintext <strong className="text-foreground">64-bit</strong> masuk, lalu diacak oleh <strong className="text-foreground">Initial Permutation</strong>.
                Hasilnya dibagi dua:{' '}
                <strong className="text-foreground">L₀</strong> (32-bit kiri) dan{' '}
                <strong className="text-foreground">R₀</strong> (32-bit kanan).
            </p>

            <Card className="border-dashed p-4 bg-muted/5 space-y-2">
                <div className="flex justify-center">
                    <IoBox label="Plaintext" value={bitsToHex(trace.afterIP)} />
                </div>
                <VArrow />
                <div className="flex justify-center">
                    <OpNode symbol="↻" label="IP — Initial Permutation" />
                </div>
                <VArrow />
                <div className="flex justify-center gap-4">
                    <HexBox label="L₀ 32-bit" bits={trace.L0} />
                    <HexBox label="R₀ 32-bit" bits={trace.R0} />
                </div>
            </Card>

            <Narration>
                <strong>IP</strong> adalah tabel permutasi tetap yang mengatur ulang posisi bit. Tidak ada operasi kriptografi — hanya <strong>pengacakan posisi</strong>. Pola IP sudah ditentukan dalam standar DES.
            </Narration>
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
                <Badge variant="outline">Step {rn}</Badge>
                <p className="text-sm font-semibold text-foreground">Feistel Round {rn}</p>
                <p className="text-[11px] text-muted-foreground ml-auto">K{rn}</p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Round {rn}</strong> dimulai.{' '}
                <strong className="text-foreground">L{roundIndex}</strong> dan{' '}
                <strong className="text-foreground">R{roundIndex}</strong> masuk ke struktur Feistel.{' '}
                <strong className="text-foreground">R{roundIndex}</strong> melewati{' '}
                <strong className="text-foreground">fungsi F</strong> bersama round key{' '}
                <strong className="text-foreground">K{rn}</strong>,
                lalu hasilnya di-XOR dengan <strong className="text-foreground">L{roundIndex}</strong>.
            </p>

            <Card className="border-dashed p-4 bg-muted/5 space-y-2">
                <div className="flex justify-center gap-4">
                    <HexBox label={`L${roundIndex} 32-bit`} bits={round.L} />
                    <HexBox label={`R${roundIndex} 32-bit`} bits={round.R} />
                </div>

                <VArrow />

                <div className="flex items-center justify-center gap-3">
                    <OpNode symbol="⊕" label="" />
                    <div className="px-3 py-2 rounded-md border border-border/50 bg-muted/20 text-xs font-medium text-muted-foreground">
                        F(R{roundIndex}, K{rn})
                        <span className="text-muted-foreground ml-1 text-[10px]">32-bit</span>
                    </div>
                    <HexBox label={`K${rn} 48-bit`} bits={round.roundKey} />
                </div>

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
                    <HexBox label={`L${rn} = R${roundIndex} 32-bit`} bits={round.newL} />
                    <HexBox label={`R${rn} = L${roundIndex}⊕F 32-bit`} bits={round.newR} />
                </div>
            </Card>

            <Narration>
                <strong>Struktur Feistel:</strong> L{rn} = R{roundIndex}, R{rn} = L{roundIndex} ⊕ F(R{roundIndex}, K{rn}).{' '}
                <strong>Fungsi F</strong> terdiri dari: Ekspansi E (32→48), XOR dengan K{rn}, substitusi S-box (48→32), dan Permutasi P.
            </Narration>
        </motion.div>
    );
}

export function FinalPermutationSlide({ trace }: { trace: DesTrace }) {
    const lastRound = trace.rounds[15];

    if (!lastRound) {
return null;
}

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
                <Badge variant="outline">Step 17</Badge>
                <p className="text-sm font-semibold text-foreground">Final Permutation (FP)</p>
                <Badge variant="outline" className="text-[10px] text-muted-foreground ml-auto">✓ Selesai</Badge>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
                Setelah <strong className="text-foreground">16 putaran</strong>, L₁₆ dan R₁₆{' '}
                <strong className="text-foreground">ditukar</strong> menjadi R₁₆ L₁₆,
                lalu melewati <strong className="text-foreground">Final Permutation (FP)</strong> —
                kebalikan dari IP. Hasilnya:{' '}
                <strong className="text-foreground">ciphertext 64-bit</strong>.
            </p>

            <Card className="border-dashed p-4 bg-muted/5 space-y-2">
                <div className="flex justify-center gap-4">
                    <HexBox label="L₁₆ 32-bit" bits={lastRound.newL} />
                    <HexBox label="R₁₆ 32-bit" bits={lastRound.newR} />
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
                    <IoBox label="Ciphertext" value={trace.ciphertext} />
                </div>
            </Card>

            <Narration>
                <strong>Enkripsi selesai!</strong> Ciphertext 64-bit siap dikirim. Untuk mendekripsi, gunakan kunci yang sama — prosesnya identik dengan round key dibalik (K₁₆ → K₁).
            </Narration>
        </motion.div>
    );
}
