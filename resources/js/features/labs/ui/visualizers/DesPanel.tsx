/**
 * DesPanel — DES Feistel visualization (v3, clean rebuild)
 *
 * One layout for every round. Visual data flow through the Feistel
 * structure: L→XOR, R→F→XOR, with F-function pipeline always visible.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Minus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { bitsToHex } from '@/features/labs/algorithms/des';
import { cn } from '@/lib/utils';
import type { DesTrace } from '@/types/labs';

// ── Round strip ──────────────────────────────────────────────────────────────

function RoundStrip({
    total,
    current,
    onJump,
}: {
    total: number;
    current: number; // 0-based round index, -1 if not in a round
    onJump: (roundIdx: number) => void;
}) {
    return (
        <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: total }, (_, i) => (
                <button
                    key={i}
                    onClick={() => onJump(i)}
                    className={cn(
                        'flex size-7 items-center justify-center rounded-md text-[10px] font-medium transition-all',
                        i === current
                            ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                            : i < current
                              ? 'bg-primary/15 text-primary hover:bg-primary/25'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                    title={`Putaran ${i + 1}`}
                >
                    {i + 1}
                </button>
            ))}
        </div>
    );
}

// ── Hex value box ────────────────────────────────────────────────────────────

function HexBox({
    label,
    hex,
    color,
}: {
    label: string;
    hex: string;
    color: 'blue' | 'green' | 'violet' | 'orange' | 'amber' | 'purple';
}) {
    const colors = {
        blue: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30',
        green: 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30',
        violet: 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30',
        orange: 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30',
        amber: 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30',
        purple: 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30',
    };
    const labelColors = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-green-600 dark:text-green-400',
        violet: 'text-violet-600 dark:text-violet-400',
        orange: 'text-orange-600 dark:text-orange-400',
        amber: 'text-amber-600 dark:text-amber-400',
        purple: 'text-purple-600 dark:text-purple-400',
    };

    return (
        <div className={cn('rounded-lg border px-3 py-2 min-w-0', colors[color])}>
            <div className={cn('text-[10px] font-semibold mb-0.5', labelColors[color])}>{label}</div>
            <div className="font-mono text-[11px] font-medium break-all">{hex}</div>
        </div>
    );
}

// ── F-function pipeline ──────────────────────────────────────────────────────

function FPipeline({ round }: { round: DesTrace['rounds'][number] }) {
    const steps = [
        { label: 'E(R)', value: bitsToHex(round.expandedR), bits: '48b', color: 'orange' as const },
        { label: `⊕ K${round.roundIndex}`, value: bitsToHex(round.xoredWithKey), bits: '48b', color: 'amber' as const },
        { label: 'S-box', value: bitsToHex(round.sboxOutput), bits: '32b', color: 'purple' as const },
        { label: 'P', value: bitsToHex(round.permutedOutput), bits: '32b', color: 'orange' as const },
    ];

    return (
        <div className="space-y-1.5">
            <div className="grid grid-cols-4 gap-1.5">
                {steps.map((s, i) => (
                    <div key={i}>
                        <HexBox label={s.label} hex={s.value} color={s.color} />
                        <div className="text-center text-[8px] text-muted-foreground mt-0.5">{s.bits}</div>
                        {i < steps.length - 1 && (
                            <div className="flex justify-center">
                                <ArrowDown className="size-3 text-muted-foreground/40" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Feistel round diagram ────────────────────────────────────────────────────

function FeistelRound({
    round,
    totalRounds,
    onJump,
    roundIdx,
}: {
    round: DesTrace['rounds'][number];
    totalRounds: number;
    onJump: (i: number) => void;
    roundIdx: number;
}) {
    const i = round.roundIndex;

    return (
        <div className="space-y-4">
            {/* Round strip */}
            <RoundStrip total={totalRounds} current={roundIdx} onJump={onJump} />

            {/* Feistel diagram */}
            <div className="space-y-2">
                {/* Input row */}
                <div className="grid grid-cols-2 gap-3">
                    <HexBox label={`L${i - 1}`} value={bitsToHex(round.L)} color="blue" />
                    <HexBox label={`R${i - 1}`} value={bitsToHex(round.R)} color="green" />
                </div>

                {/* Flow arrows */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-center text-[9px] text-muted-foreground">
                        <span className="px-2">langsung ke XOR</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
                        <ArrowDown className="size-3" />
                        <span>masuk F</span>
                    </div>
                </div>

                {/* F-function */}
                <div className="rounded-xl border-2 border-purple-200 dark:border-purple-800 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                            Fungsi F(R, K{i})
                        </span>
                        <span className="text-[9px] text-muted-foreground">E → ⊕K → S-box → P</span>
                    </div>
                    <FPipeline round={round} />
                </div>

                {/* XOR + output */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[9px] text-muted-foreground">L</span>
                        <ArrowRight className="size-3 text-muted-foreground/50" />
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="flex size-8 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30">
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">⊕</span>
                        </div>
                        <span className="text-[8px] text-muted-foreground mt-0.5">XOR</span>
                    </div>
                    <div className="flex items-center justify-start gap-1.5">
                        <ArrowRight className="size-3 text-muted-foreground/50" />
                        <span className="text-[9px] text-muted-foreground">F(R,K)</span>
                    </div>
                </div>

                {/* Output row */}
                <div className="grid grid-cols-2 gap-3">
                    <HexBox label={`R${i} = L ⊕ F`} value={bitsToHex(round.newR)} color="green" />
                    <HexBox label={`L${i} = R${i - 1}`} value={bitsToHex(round.newL)} color="blue" />
                </div>
            </div>

            {/* Round key */}
            <div className="flex items-center gap-2 rounded-lg border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 px-3 py-2">
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 shrink-0">
                    K{i}
                </span>
                <span className="font-mono text-[11px] break-all flex-1">
                    {bitsToHex(round.roundKey)}
                </span>
                <span className="text-[9px] text-muted-foreground shrink-0">48 bit</span>
            </div>
        </div>
    );
}

// ── Prep view ────────────────────────────────────────────────────────────────

function PrepView({ trace }: { trace: DesTrace }) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <HexBox label="Plaintext" value={trace.plaintext} color="blue" />
                <HexBox label="Kunci" value={trace.key} color="violet" />
            </div>
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                <ArrowDown className="size-3" />
                IP (Initial Permutation)
            </div>
            <HexBox label="Setelah IP" value={bitsToHex(trace.afterIP)} color="blue" />
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                <ArrowDown className="size-3" />
                Pisah jadi L₀ / R₀
            </div>
            <div className="grid grid-cols-2 gap-3">
                <HexBox label="L₀" value={bitsToHex(trace.L0)} color="blue" />
                <HexBox label="R₀" value={bitsToHex(trace.R0)} color="green" />
            </div>
            <p className="text-center text-[10px] text-muted-foreground italic">
                Blok 64-bit dibelah jadi dua bagian 32-bit sebelum masuk 16 putaran Feistel.
            </p>
        </div>
    );
}

// ── Final view ───────────────────────────────────────────────────────────────

function FinalView({ trace, rounds }: { trace: DesTrace; rounds: DesTrace['rounds'] }) {
    const last = rounds[rounds.length - 1];
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <HexBox label="L₁₆" value={bitsToHex(last.newL)} color="blue" />
                <HexBox label="R₁₆" value={bitsToHex(last.newR)} color="green" />
            </div>
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                <ArrowDown className="size-3" />
                Tukar R₁₆L₁₆ + FP (Final Permutation)
            </div>
            <HexBox label="Ciphertext" value={trace.ciphertext} color="green" />
            <p className="text-center text-[10px] text-muted-foreground italic">
                L dan R ditukar, lalu FP menghasilkan ciphertext 64-bit.
                Dekripsi: proses sama, urutan kunci dibalik (K₁₆ → K₁).
            </p>
        </div>
    );
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface DesPanelProps {
    trace: DesTrace;
    steps: string[];
    activeStep: number;
    onStepChange?: (n: number) => void;
}

const ROUND_RE = /Putaran (\d+)/;

export default function DesPanel({ trace, steps, activeStep, onStepChange }: DesPanelProps) {
    const rounds = trace.rounds;
    const totalRounds = rounds.length;

    // Detect what step we're on
    const match = ROUND_RE.exec(steps[activeStep] ?? '');
    const isRound = match !== null;
    const roundNumber = match ? Number.parseInt(match[1]) : -1;

    // Find first round step index
    let firstRoundStep = 0;
    for (let i = 0; i < steps.length; i++) {
        if (ROUND_RE.test(steps[i])) {
            firstRoundStep = i;
            break;
        }
    }

    const isFinal = !isRound && activeStep > firstRoundStep;
    const currentRound = isRound ? rounds[roundNumber - 1] : null;
    const roundIdx = isRound ? roundNumber - 1 : -1;

    const handleJump = (targetRoundIdx: number) => {
        onStepChange?.(firstRoundStep + targetRoundIdx);
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">DES Feistel</Badge>
                    <span className="text-xs text-muted-foreground">16 putaran</span>
                </div>
                <Badge variant="secondary" className="text-xs tabular-nums">
                    {!isRound && !isFinal ? 'Persiapan' : isFinal ? 'Selesai' : `Putaran ${roundNumber}/16`}
                </Badge>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                >
                    {!isRound && !isFinal && <PrepView trace={trace} />}

                    {isRound && currentRound && (
                        <FeistelRound
                            round={currentRound}
                            totalRounds={totalRounds}
                            onJump={handleJump}
                            roundIdx={roundIdx}
                        />
                    )}

                    {isFinal && <FinalView trace={trace} rounds={rounds} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
