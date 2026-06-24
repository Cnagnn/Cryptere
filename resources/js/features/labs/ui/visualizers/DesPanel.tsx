/**
 * DesPanel — DES Feistel round visualization
 *
 * Single adaptive mode that progressively reveals detail:
 * - Prep (steps 0-2): plaintext, key, padding, IP, L₀/R₀ overview
 * - Structure (rounds 1-4): Feistel diagram + F as black box
 * - Detail (rounds 5-12): Feistel diagram + F-function pipeline opened
 * - Full (rounds 13-16): full detail + contextual explanation
 * - Final (last step): swap L₁₆/R₁₆ → FP → ciphertext
 *
 * Phases are auto-detected from the steps array by finding round markers.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, Info, Lock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { bitsToHex } from '@/features/labs/algorithms/des';
import { cn } from '@/lib/utils';
import type { DesTrace } from '@/types/labs';

// ── Color system ─────────────────────────────────────────────────────────────

type Variant = 'blue' | 'green' | 'orange' | 'amber' | 'purple' | 'violet' | 'red' | 'neutral';

const boxStyle: Record<Variant, string> = {
    blue: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20',
    green: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20',
    orange: 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20',
    amber: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20',
    purple: 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20',
    violet: 'border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20',
    red: 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20',
    neutral: 'border-border bg-muted/30',
};

const labelStyle: Record<Variant, string> = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
    amber: 'text-amber-600 dark:text-amber-400',
    purple: 'text-purple-600 dark:text-purple-400',
    violet: 'text-violet-600 dark:text-violet-400',
    red: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground',
};

// ── Helper components ────────────────────────────────────────────────────────

function HexBox({
    label,
    bits,
    variant = 'neutral',
}: {
    label: string;
    bits: number[];
    variant?: Variant;
}) {
    return (
        <div className={cn('rounded-lg border px-3 py-2 min-w-0', boxStyle[variant])}>
            <span className={cn('text-[10px] font-semibold', labelStyle[variant])}>{label}</span>
            <div className="font-mono text-[11px] font-medium break-all mt-0.5">{bitsToHex(bits)}</div>
            <div className="text-[8px] text-muted-foreground mt-0.5">{bits.length} bit</div>
        </div>
    );
}

function HexBoxStr({
    label,
    hex,
    variant = 'neutral',
    sublabel,
}: {
    label: string;
    hex: string;
    variant?: Variant;
    sublabel?: string;
}) {
    return (
        <div className={cn('rounded-lg border px-3 py-2 min-w-0', boxStyle[variant])}>
            <div className="flex items-baseline justify-between gap-2">
                <span className={cn('text-[10px] font-semibold', labelStyle[variant])}>{label}</span>
                {sublabel && <span className="text-[9px] text-muted-foreground">{sublabel}</span>}
            </div>
            <div className="font-mono text-[11px] font-medium break-all mt-0.5">{hex}</div>
        </div>
    );
}

function VerticalArrow({ label, className }: { label?: string; className?: string }) {
    return (
        <div className={cn('flex items-center justify-center gap-2 py-1', className)}>
            {label && <span className="text-[9px] text-muted-foreground">{label}</span>}
            <ArrowDown className="size-3 text-muted-foreground/50" />
        </div>
    );
}

function RoundDots({
    count,
    current,
    onStepChange,
    stepOffset,
}: {
    count: number;
    current: number;
    onStepChange?: (n: number) => void;
    stepOffset: number;
}) {
    return (
        <div className="flex justify-center gap-1 flex-wrap pt-1">
            {Array.from({ length: count }, (_, i) => (
                <button
                    key={i}
                    onClick={() => onStepChange?.(stepOffset + i)}
                    className={cn(
                        'size-2.5 rounded-full transition-all',
                        i === current
                            ? 'bg-primary scale-125'
                            : i < current
                              ? 'bg-primary/30 hover:bg-primary/50'
                              : 'bg-muted hover:bg-muted-foreground/30',
                    )}
                    title={`Putaran ${i + 1}`}
                />
            ))}
        </div>
    );
}

// ── Phase detection ──────────────────────────────────────────────────────────

type RoundPhase = 'prep' | 'structure' | 'detail' | 'full' | 'final';

const ROUND_REGEX = /Putaran (\d+)/;

function detectPhase(
    activeStep: number,
    steps: string[],
    totalRounds: number,
): { phase: RoundPhase; roundIndex: number; prepCount: number; roundStepStart: number } {
    const roundStepIndices: number[] = [];
    const prepSteps: number[] = [];

    for (let i = 0; i < steps.length; i++) {
        if (ROUND_REGEX.test(steps[i])) {
            roundStepIndices.push(i);
        } else if (roundStepIndices.length === 0) {
            prepSteps.push(i);
        }
    }

    const prepCount = prepSteps.length;
    const roundStepStart = roundStepIndices[0] ?? prepCount;
    const roundIdx = roundStepIndices.indexOf(activeStep);

    if (roundIdx === -1) {
        if (activeStep < roundStepStart) return { phase: 'prep', roundIndex: -1, prepCount, roundStepStart };
        return { phase: 'final', roundIndex: -1, prepCount, roundStepStart };
    }

    if (roundIdx < 4) return { phase: 'structure', roundIndex: roundIdx, prepCount, roundStepStart };
    if (roundIdx < 12) return { phase: 'detail', roundIndex: roundIdx, prepCount, roundStepStart };
    return { phase: 'full', roundIndex: roundIdx, prepCount, roundStepStart };
}

// ── Phase: Preparation ───────────────────────────────────────────────────────

function PrepPhase({ trace }: { trace: DesTrace }) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <HexBoxStr label="Plaintext" hex={trace.plaintext} variant="blue" sublabel="64 bit" />
                <HexBoxStr label="Kunci" hex={trace.key} variant="violet" sublabel="64 bit (56 efektif)" />
            </div>
            <VerticalArrow label="IP (Initial Permutation)" />
            <HexBox label="Setelah IP" bits={trace.afterIP} variant="neutral" />
            <VerticalArrow label="Pisah L₀ / R₀" />
            <div className="grid grid-cols-2 gap-2">
                <HexBox label="L₀" bits={trace.L0} variant="blue" />
                <HexBox label="R₀" bits={trace.R0} variant="green" />
            </div>
            <p className="text-xs text-muted-foreground italic pt-1">
                IP mengatur ulang bit, lalu blok 64-bit dibagi menjadi L₀ dan R₀ (masing-masing 32 bit) sebelum memasuki 16 putaran Feistel.
            </p>
        </div>
    );
}

// ── Phase: Structure (rounds 1-4) — Feistel + F black box ────────────────────

function StructurePhase({
    traceRound,
    roundIndex,
    totalRounds,
    onStepChange,
    stepOffset,
}: {
    traceRound: NonNullable<DesTrace['rounds']>[number];
    roundIndex: number;
    totalRounds: number;
    onStepChange?: (n: number) => void;
    stepOffset: number;
}) {
    const Foutput = traceRound.permutedOutput;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                {/* Left: Feistel flow */}
                <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground text-center">Diagram Feistel</p>
                    <div className="grid grid-cols-2 gap-1.5">
                        <HexBox label={`L${roundIndex - 1}`} bits={traceRound.L} variant="blue" />
                        <HexBox label={`R${roundIndex - 1}`} bits={traceRound.R} variant="green" />
                    </div>
                    <VerticalArrow />
                    {/* F-function black box */}
                    <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/20 p-2 text-center">
                        <Lock className="size-3.5 mx-auto mb-1 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground font-medium">F(R, K{roundIndex})</span>
                    </div>
                    <VerticalArrow />
                    <div className="grid grid-cols-2 gap-1.5">
                        <HexBox label={`L${roundIndex}`} bits={traceRound.newL} variant="blue" />
                        <HexBox label={`R${roundIndex}`} bits={traceRound.newR} variant="green" />
                    </div>
                </div>

                {/* Right: explanation */}
                <div className="space-y-2">
                    <Card className="border-blue-200 dark:border-blue-800">
                        <CardContent className="p-3 space-y-1.5">
                            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                Cara kerja putaran
                            </p>
                            <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                                <p>• Blok 64-bit dibelah jadi dua: L dan R (masing-masing 32 bit)</p>
                                <p>• R kanan masuk fungsi F dicampur kunci putaran</p>
                                <p>• Hasil F di-XOR dengan L kiri</p>
                                <p>• L baru = R lama, R baru = L ⊕ F(R, K)</p>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                            <Info className="size-3" />
                            Lihat fungsi F?
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                            Fungsi F masih sebagai kotak hitam. Maju ke putaran 5-12 untuk melihat isi fungsi F: ekspansi E, XOR kunci, S-box, dan permutasi P.
                        </p>
                    </div>
                </div>
            </div>

            <RoundDots count={totalRounds} current={roundIndex} onStepChange={onStepChange} stepOffset={stepOffset} />
        </div>
    );
}

// ── Phase: Detail (rounds 5-12) — F-function pipeline opened ─────────────────

function DetailPhase({
    traceRound,
    roundIndex,
    totalRounds,
    onStepChange,
    stepOffset,
}: {
    traceRound: NonNullable<DesTrace['rounds']>[number];
    roundIndex: number;
    totalRounds: number;
    onStepChange?: (n: number) => void;
    stepOffset: number;
}) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                {/* Left: Feistel flow (compact) */}
                <div className="space-y-1">
                    <div className="grid grid-cols-2 gap-1.5">
                        <HexBox label={`L${roundIndex - 1}`} bits={traceRound.L} variant="blue" />
                        <HexBox label={`R${roundIndex - 1}`} bits={traceRound.R} variant="green" />
                    </div>
                    <VerticalArrow />
                    <div className="grid grid-cols-2 gap-1.5">
                        <HexBox label={`L${roundIndex}`} bits={traceRound.newL} variant="blue" />
                        <HexBox label={`R${roundIndex}`} bits={traceRound.newR} variant="green" />
                    </div>
                    <p className="text-[9px] text-muted-foreground text-center italic pt-1">
                        L{roundIndex} = R{roundIndex - 1}, R{roundIndex} = L ⊕ F(R, K)
                    </p>
                </div>

                {/* Right: F-function pipeline */}
                <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground text-center">
                        Fungsi F — Putaran {roundIndex}
                    </p>
                    <HexBox label="R (32-bit)" bits={traceRound.R} variant="green" />
                    <VerticalArrow label="Ekspansi E (32→48 bit)" />
                    <HexBox label="E(R)" bits={traceRound.expandedR} variant="orange" />
                    <VerticalArrow label={`⊕ K${roundIndex}`} />
                    <HexBox label={`⊕ K${roundIndex}`} bits={traceRound.xoredWithKey} variant="amber" />
                    <VerticalArrow label="S-box (8× 6→4 bit)" />
                    <HexBox label="S-box output" bits={traceRound.sboxOutput} variant="purple" />
                    <VerticalArrow label="Permutasi P" />
                    <HexBox label="P(S)" bits={traceRound.permutedOutput} variant="orange" />
                </div>
            </div>

            {/* Round key highlight */}
            <div className="flex items-center gap-2 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 px-3 py-1.5">
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 shrink-0">K{roundIndex}</span>
                <span className="font-mono text-[11px] break-all">{bitsToHex(traceRound.roundKey)}</span>
                <span className="text-[9px] text-muted-foreground shrink-0">48 bit</span>
            </div>

            <RoundDots count={totalRounds} current={roundIndex} onStepChange={onStepChange} stepOffset={stepOffset} />
        </div>
    );
}

// ── Phase: Full (rounds 13-16) — detail + context ─────────────────────────────

function FullPhase({
    traceRound,
    roundIndex,
    totalRounds,
    onStepChange,
    stepOffset,
}: {
    traceRound: NonNullable<DesTrace['rounds']>[number];
    roundIndex: number;
    totalRounds: number;
    onStepChange?: (n: number) => void;
    stepOffset: number;
}) {
    return (
        <div className="space-y-3">
            <DetailPhase traceRound={traceRound} roundIndex={roundIndex} totalRounds={totalRounds} onStepChange={onStepChange} stepOffset={stepOffset} />

            <Card className="border-blue-200 dark:border-blue-800">
                <CardContent className="p-3 space-y-1">
                    <p className="text-xs font-medium">Konteks: fungsi F di putaran akhir</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>
                            • <strong>Ekspansi E</strong>: menduplikasi 16 bit dari 32 → 48 bit, supaya ukurannya cocok dengan round key
                        </li>
                        <li>
                            • <strong>XOR dengan K{roundIndex}</strong>: bit-bit dicampur dengan round key, hanya bisa dibalik jika tahu kuncinya
                        </li>
                        <li>
                            • <strong>S-box</strong>: 8 tabel substitusi non-linear — inilah jantung keamanan DES
                        </li>
                        <li>
                            • <strong>Permutasi P</strong>: menyebar hasil S-box ke seluruh 32 bit untuk efek avalanche
                        </li>
                    </ul>
                    <p className="text-[10px] text-muted-foreground italic mt-1">
                        Setiap putaran makin mengaburkan hubungan plaintext-ciphertext. Setelah 16 putaran, setiap bit output bergantung pada semua bit input dan kunci.
                    </p>
                </CardContent>
            </Card>

            <RoundDots count={totalRounds} current={roundIndex} onStepChange={onStepChange} stepOffset={stepOffset} />
        </div>
    );
}

// ── Phase: Final ─────────────────────────────────────────────────────────────

function FinalPhase({ trace, rounds }: { trace: DesTrace; rounds: DesTrace['rounds'] }) {
    const lastRound = rounds[rounds.length - 1];

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <HexBox label="L₁₆" bits={lastRound.newL} variant="blue" />
                <HexBox label="R₁₆" bits={lastRound.newR} variant="green" />
            </div>
            <VerticalArrow label="Tukar → R₁₆L₁₆" />
            <VerticalArrow label="FP (Final Permutation)" />
            <HexBoxStr label="Ciphertext" hex={trace.ciphertext} variant="green" sublabel="64 bit" />
            <p className="text-xs text-muted-foreground italic pt-1">
                L dan R akhir ditukar (R₁₆L₁₆), lalu Permutasi Akhir (FP) diterapkan untuk menghasilkan ciphertext 64-bit. Dekripsi menggunakan proses yang sama dengan round key terbalik.
            </p>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────

interface DesPanelProps {
    trace: DesTrace;
    steps: string[];
    activeStep: number;
    onStepChange?: (n: number) => void;
}

export default function DesPanel({ trace, steps, activeStep, onStepChange }: DesPanelProps) {
    const rounds = trace.rounds;
    const totalRounds = rounds.length;

    const { phase, roundIndex, prepCount, roundStepStart } = detectPhase(activeStep, steps, totalRounds);
    const currentRound = roundIndex >= 0 ? rounds[roundIndex] : null;

    // Only show round dots during round phases
    const showRoundDots = roundIndex >= 0;

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                        DES Feistel
                    </Badge>
                    <span className="text-xs text-muted-foreground">16 putaran</span>
                </div>
                <Badge variant="secondary" className="text-xs tabular-nums">
                    {phase === 'prep'
                        ? 'Persiapan'
                        : phase === 'final'
                          ? 'Selesai'
                          : `Putaran ${roundIndex + 1}/16`}
                </Badge>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                    {/* ═══ PREP ═══ */}
                    {phase === 'prep' && <PrepPhase trace={trace} />}

                    {/* ═══ STRUCTURE (rounds 1-4) ═══ */}
                    {phase === 'structure' && currentRound && (
                        <StructurePhase
                            traceRound={currentRound}
                            roundIndex={roundIndex + 1}
                            totalRounds={totalRounds}
                            onStepChange={onStepChange}
                            stepOffset={roundStepStart}
                        />
                    )}

                    {/* ═══ DETAIL (rounds 5-12) ═══ */}
                    {phase === 'detail' && currentRound && (
                        <DetailPhase
                            traceRound={currentRound}
                            roundIndex={roundIndex + 1}
                            totalRounds={totalRounds}
                            onStepChange={onStepChange}
                            stepOffset={roundStepStart}
                        />
                    )}

                    {/* ═══ FULL (rounds 13-16) ═══ */}
                    {phase === 'full' && currentRound && (
                        <FullPhase
                            traceRound={currentRound}
                            roundIndex={roundIndex + 1}
                            totalRounds={totalRounds}
                            onStepChange={onStepChange}
                            stepOffset={roundStepStart}
                        />
                    )}

                    {/* ═══ FINAL ═══ */}
                    {phase === 'final' && <FinalPhase trace={trace} rounds={rounds} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
