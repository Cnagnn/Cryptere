import { motion } from 'framer-motion';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { bitsToHex } from '@/features/labs/algorithms/des';
import { cn } from '@/lib/utils';
import type { DesTrace } from '@/types/labs';

type HexBoxColor = 'blue' | 'green' | 'orange' | 'amber' | 'purple' | 'violet' | 'cyan' | 'emerald';

const colors: Record<HexBoxColor, { border: string; bg: string; label: string }> = {
    blue: { border: 'border-blue-500/40', bg: 'bg-blue-950/20', label: 'text-blue-400' },
    green: { border: 'border-green-500/40', bg: 'bg-green-950/20', label: 'text-green-400' },
    orange: { border: 'border-orange-500/40', bg: 'bg-orange-950/20', label: 'text-orange-400' },
    amber: { border: 'border-amber-500/40', bg: 'bg-amber-950/20', label: 'text-amber-400' },
    purple: { border: 'border-purple-500/40', bg: 'bg-purple-950/20', label: 'text-purple-400' },
    violet: { border: 'border-violet-500/40', bg: 'bg-violet-950/20', label: 'text-violet-400' },
    cyan: { border: 'border-cyan-500/40', bg: 'bg-cyan-950/20', label: 'text-cyan-400' },
    emerald: { border: 'border-emerald-500/40', bg: 'bg-emerald-950/20', label: 'text-emerald-400' },
};

function HexBox({ label, bits, color }: { label: string; bits: number[]; color: HexBoxColor }) {
    return (
        <Card className={cn('px-3 py-2 min-w-0', colors[color].border, colors[color].bg)}>
            <p className={cn('text-[10px] font-semibold mb-1', colors[color].label)}>{label}</p>
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
        <div className="inline-flex items-center gap-1 rounded-md border border-orange-500/30 bg-orange-950/10 px-2 py-1">
            <span className="text-[9px] font-semibold text-orange-400">{label}</span>
            {children}
        </div>
    );
}

function IoBox({ label, value, color }: { label: string; value: string; color?: HexBoxColor }) {
    return (
        <Card className={cn('px-3 py-2', color ? colors[color].border : 'border-border/50', color ? colors[color].bg : 'bg-muted/20')}>
            <p className={cn('text-[10px] font-semibold mb-1 uppercase tracking-wider', color ? colors[color].label : 'text-muted-foreground')}>
                {label}
            </p>
            <p className="font-mono text-xs break-all text-foreground">{value}</p>
        </Card>
    );
}

function Narration({ children }: { children: React.ReactNode }) {
    return (
        <Card className="border-blue-500/20 bg-blue-950/10 p-3 flex items-start gap-2">
            <span className="text-sm shrink-0 mt-0.5">📖</span>
            <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
        </Card>
    );
}

function CompletedBadge() {
    return (
        <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-950/20">
            ✓ Selesai
        </Badge>
    );
}

export function InitialPermutationSlide({ trace }: { trace: DesTrace }) {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">Step 0</Badge>
                <p className="text-sm font-semibold text-foreground">Initial Permutation (IP)</p>
                <p className="text-[11px] text-muted-foreground ml-auto">64 bit → 32 + 32</p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
                Plaintext <strong className="text-foreground">64-bit</strong> masuk, lalu diacak oleh <strong className="text-foreground">Initial Permutation</strong>.
                Hasilnya dibagi dua:{' '}
                <strong className="text-blue-400">L₀</strong> (32-bit kiri) dan{' '}
                <strong className="text-green-400">R₀</strong> (32-bit kanan).
            </p>

            <Card className="border-dashed p-4 bg-muted/5 space-y-2">
                <div className="flex justify-center">
                    <IoBox label="Plaintext" value={bitsToHex(trace.afterIP)} color="cyan" />
                </div>
                <VArrow />
                <div className="flex justify-center">
                    <OpNode symbol="↻" label="IP — Initial Permutation" />
                </div>
                <VArrow />
                <div className="flex justify-center gap-4">
                    <HexBox label="L₀ 32-bit" bits={trace.L0} color="blue" />
                    <HexBox label="R₀ 32-bit" bits={trace.R0} color="green" />
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
                <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-500/30">Step {rn}</Badge>
                <p className="text-sm font-semibold text-foreground">Feistel Round {rn}</p>
                <p className="text-[11px] text-muted-foreground ml-auto">K{rn}</p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Round {rn}</strong> dimulai.{' '}
                <strong className="text-blue-400">L{roundIndex}</strong> dan{' '}
                <strong className="text-green-400">R{roundIndex}</strong> masuk ke struktur Feistel.{' '}
                <strong className="text-green-400">R{roundIndex}</strong> melewati{' '}
                <strong className="text-foreground">fungsi F</strong> bersama round key{' '}
                <strong className="text-violet-400">K{rn}</strong>,
                lalu hasilnya di-XOR dengan <strong className="text-blue-400">L{roundIndex}</strong>.
            </p>

            <Card className="border-dashed p-4 bg-muted/5 space-y-2">
                <div className="flex justify-center gap-4">
                    <HexBox label={`L${roundIndex} 32-bit`} bits={round.L} color="blue" />
                    <HexBox label={`R${roundIndex} 32-bit`} bits={round.R} color="green" />
                </div>

                <VArrow />

                <div className="flex items-center justify-center gap-3">
                    <OpNode symbol="⊕" label="" />
                    <div className="px-3 py-2 rounded-md border border-orange-500/30 bg-orange-950/10 text-xs font-medium text-orange-400">
                        F(R{roundIndex}, K{rn})
                        <span className="text-muted-foreground ml-1 text-[10px]">32-bit</span>
                    </div>
                    <HexBox label={`K${rn} 48-bit`} bits={round.roundKey} color="violet" />
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
                    <HexBox label={`L${rn} = R${roundIndex} 32-bit`} bits={round.newL} color="blue" />
                    <HexBox label={`R${rn} = L${roundIndex}⊕F 32-bit`} bits={round.newR} color="green" />
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
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">Step 17</Badge>
                <p className="text-sm font-semibold text-foreground">Final Permutation (FP)</p>
                <p className="text-[11px] text-muted-foreground ml-auto"><CompletedBadge /></p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
                Setelah <strong className="text-foreground">16 putaran</strong>, L₁₆ dan R₁₆{' '}
                <strong className="text-foreground">ditukar</strong> menjadi R₁₆ L₁₆,
                lalu melewati <strong className="text-foreground">Final Permutation (FP)</strong> —
                kebalikan dari IP. Hasilnya:{' '}
                <strong className="text-emerald-400">ciphertext 64-bit</strong>.
            </p>

            <Card className="border-dashed p-4 bg-muted/5 space-y-2">
                <div className="flex justify-center gap-4">
                    <HexBox label="L₁₆ 32-bit" bits={lastRound.newL} color="blue" />
                    <HexBox label="R₁₆ 32-bit" bits={lastRound.newR} color="green" />
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
                    <IoBox label="Ciphertext" value={trace.ciphertext} color="emerald" />
                </div>
            </Card>

            <Narration>
                <strong>Enkripsi selesai!</strong> Ciphertext 64-bit siap dikirim. Untuk mendekripsi, gunakan kunci yang sama — prosesnya identik dengan round key dibalik (K₁₆ → K₁).
            </Narration>
        </motion.div>
    );
}
