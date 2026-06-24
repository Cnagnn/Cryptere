/**
 * DesPanel — DES Feistel round visualization
 *
 * Single adaptive mode. Every round shows the same Feistel diagram,
 * but the F-function depth auto-grows:
 *   shallow (1-4):  F as mystery box
 *   medium (5-11):  pipeline labels visible
 *   deep   (12-16): full hex values + bit counts
 */

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, Lock, Unlock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { bitsToHex } from '@/features/labs/algorithms/des';
import { cn } from '@/lib/utils';
import type { DesTrace } from '@/types/labs';

// ── Color tokens ─────────────────────────────────────────────────────────────

const styles = {
    box: {
        blue: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20',
        green: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20',
        orange: 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20',
        amber: 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20',
        purple: 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20',
        violet: 'border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20',
        red: 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20',
    } as const,
    label: {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'text-green-600 dark:text-green-400',
        orange: 'text-orange-600 dark:text-orange-400',
        amber: 'text-amber-600 dark:text-amber-400',
        purple: 'text-purple-600 dark:text-purple-400',
        violet: 'text-violet-600 dark:text-violet-400',
        red: 'text-red-600 dark:text-red-400',
    } as const,
} as const;

type Color = keyof typeof styles.box;

function box(color: Color) {
    return cn('rounded-lg border', styles.box[color]);
}
function lbl(color: Color) {
    return cn('text-[10px] font-semibold', styles.label[color]);
}

// ── Mini helpers ─────────────────────────────────────────────────────────────

function Hex({
    label,
    value,
    color = 'blue',
    subtitle,
}: {
    label: string;
    value: string;
    color?: Color;
    subtitle?: string;
}) {
    return (
        <div className={cn(box(color), 'px-2.5 py-1.5 min-w-0')}>
            <div className="flex items-baseline justify-between gap-1.5">
                <span className={lbl(color)}>{label}</span>
                {subtitle && <span className="text-[9px] text-muted-foreground">{subtitle}</span>}
            </div>
            <div className="font-mono text-[11px] font-medium break-all mt-0.5">{value}</div>
        </div>
    );
}

function VSep({ label, className }: { label?: string; className?: string }) {
    return (
        <div className={cn('flex items-center justify-center gap-2 py-0.5', className)}>
            {label && <span className="text-[9px] text-muted-foreground">{label}</span>}
            <ArrowDown className="size-3 text-muted-foreground/40" />
        </div>
    );
}

// ── Round dots ───────────────────────────────────────────────────────────────

function Dots({
    total,
    current,
    onJump,
}: {
    total: number;
    current: number;
    onJump: (roundIndex: number) => void;
}) {
    return (
        <div className="flex justify-center gap-1 flex-wrap pt-1">
            {Array.from({ length: total }, (_, i) => (
                <button
                    key={i}
                    onClick={() => onJump(i)}
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

// ── F-function pipeline ──────────────────────────────────────────────────────

type Depth = 'shallow' | 'medium' | 'deep';

function FPipeline({
    round,
    depth,
}: {
    round: DesTrace['rounds'][number];
    depth: Depth;
}) {
    if (depth === 'shallow') {
        return (
            <div className={cn(box('purple'), 'px-3 py-2.5 text-center')}>
                <Lock className="size-4 mx-auto mb-1 text-purple-500/60" />
                <span className="text-[10px] text-muted-foreground font-medium">
                    F(R, K{round.roundIndex})
                </span>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                    Fungsi F masih tersembunyi — lanjut ke putaran 5+ untuk melihat detail
                </p>
            </div>
        );
    }

    const ex = bitsToHex(round.expandedR);
    const xk = bitsToHex(round.xoredWithKey);
    const sb = bitsToHex(round.sboxOutput);
    const pp = bitsToHex(round.permutedOutput);

    if (depth === 'medium') {
        return (
            <div className={cn(box('purple'), 'px-3 py-2 space-y-1.5')}>
                <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                    Fungsi F — pipeline
                </p>
                <div className="grid grid-cols-4 gap-1 text-center">
                    <div className="rounded bg-orange-50 dark:bg-orange-950/30 px-1 py-0.5">
                        <div className="text-[10px] font-medium text-orange-600 dark:text-orange-400">E</div>
                        <div className="text-[9px] text-muted-foreground">ekspansi</div>
                    </div>
                    <div className="rounded bg-amber-50 dark:bg-amber-950/30 px-1 py-0.5">
                        <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400">⊕ K</div>
                        <div className="text-[9px] text-muted-foreground">XOR</div>
                    </div>
                    <div className="rounded bg-violet-50 dark:bg-violet-950/30 px-1 py-0.5">
                        <div className="text-[10px] font-medium text-violet-600 dark:text-violet-400">S</div>
                        <div className="text-[9px] text-muted-foreground">S-box</div>
                    </div>
                    <div className="rounded bg-orange-50 dark:bg-orange-950/30 px-1 py-0.5">
                        <div className="text-[10px] font-medium text-orange-600 dark:text-orange-400">P</div>
                        <div className="text-[9px] text-muted-foreground">permutasi</div>
                    </div>
                </div>
            </div>
        );
    }

    // deep
    return (
        <div className={cn(box('purple'), 'px-3 py-2 space-y-2')}>
            <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                Fungsi F — detail penuh
            </p>
            <div className="grid grid-cols-4 gap-1.5">
                <div className="space-y-0.5">
                    <span className={lbl('orange')}>E(R)</span>
                    <div className="font-mono text-[10px] break-all">{ex}</div>
                    <div className="text-[8px] text-muted-foreground">48 bit</div>
                </div>
                <div className="space-y-0.5">
                    <span className={lbl('amber')}>⊕ K</span>
                    <div className="font-mono text-[10px] break-all">{xk}</div>
                    <div className="text-[8px] text-muted-foreground">48 bit</div>
                </div>
                <div className="space-y-0.5">
                    <span className={lbl('violet')}>S-box</span>
                    <div className="font-mono text-[10px] break-all">{sb}</div>
                    <div className="text-[8px] text-muted-foreground">32 bit</div>
                </div>
                <div className="space-y-0.5">
                    <span className={lbl('orange')}>P</span>
                    <div className="font-mono text-[10px] break-all">{pp}</div>
                    <div className="text-[8px] text-muted-foreground">32 bit</div>
                </div>
            </div>
        </div>
    );
}

// ── Feistel round card ───────────────────────────────────────────────────────

function FeistelRound({
    round,
    depth,
    onJump,
    totalRounds,
}: {
    round: DesTrace['rounds'][number];
    depth: Depth;
    onJump: (i: number) => void;
    totalRounds: number;
}) {
    const i = round.roundIndex;
    const prevL = bitsToHex(round.L);
    const prevR = bitsToHex(round.R);
    const newL = bitsToHex(round.newL);
    const newR = bitsToHex(round.newR);
    const rk = bitsToHex(round.roundKey);

    return (
        <div className="space-y-3">
            {/* Feistel diagram */}
            <Card className="border-border/70 bg-card/95">
                <CardContent className="p-4 space-y-3">
                    {/* Input side */}
                    <div className="grid grid-cols-2 gap-2">
                        <Hex label={`L${i - 1}`} value={prevL} color="blue" subtitle="32 bit" />
                        <Hex label={`R${i - 1}`} value={prevR} color="green" subtitle="32 bit" />
                    </div>

                    {/* Flow annotation */}
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                        <div className="flex-1 border-t border-dashed border-muted-foreground/20" />
                        <span>R masuk ke F, hasil XOR dengan L</span>
                        <div className="flex-1 border-t border-dashed border-muted-foreground/20" />
                    </div>

                    {/* F-function */}
                    <FPipeline round={round} depth={depth} />

                    <VSep />

                    {/* Output side */}
                    <div className="grid grid-cols-2 gap-2">
                        <Hex label={`L${i} = R${i - 1}`} value={newL} color="blue" subtitle="32 bit" />
                        <Hex label={`R${i} = L ⊕ F`} value={newR} color="green" subtitle="32 bit" />
                    </div>
                </CardContent>
            </Card>

            {/* Round key */}
            <div className={cn(box('violet'), 'px-3 py-2 flex items-center gap-2')}>
                <span className={lbl('violet')}>K{i}</span>
                <span className="font-mono text-[11px] break-all flex-1">{rk}</span>
                <span className="text-[9px] text-muted-foreground">48 bit</span>
            </div>

            {/* Context card — depth-dependent */}
            {depth === 'shallow' && (
                <Card className="border-blue-200 dark:border-blue-800">
                    <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Putaran {i} dari 16. Fungsi F masih sebagai kotak hitam — maju ke putaran berikutnya
                            untuk melihat bagaimana F bekerja secara bertahap.
                        </p>
                    </CardContent>
                </Card>
            )}

            {depth === 'medium' && (
                <Card className="border-blue-200 dark:border-blue-800">
                    <CardContent className="p-3 space-y-1.5">
                        <p className="text-xs font-medium">Anatomi fungsi F:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                            <li>• <strong>E</strong>: ekspansi 32→48 bit, menduplikasi 16 bit supaya cocok dengan ukuran kunci putaran</li>
                            <li>• <strong>⊕ K</strong>: XOR dengan round key — inilah yang bikin dekripsi mustahil tanpa kunci</li>
                            <li>• <strong>S</strong>: 8 tabel S-box substitusi non-linear, jantung keamanan DES</li>
                            <li>• <strong>P</strong>: permutasi menyebar hasil ke seluruh 32 bit (efek avalanche)</li>
                        </ul>
                    </CardContent>
                </Card>
            )}

            {depth === 'deep' && (
                <Card className="border-blue-200 dark:border-blue-800">
                    <CardContent className="p-3 space-y-1.5">
                        <p className="text-xs font-medium">Putaran akhir — konteks penuh</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Setelah 16 putaran, setiap bit ciphertext bergantung pada seluruh bit plaintext dan kunci.
                            Properti ini disebut <strong>efek avalanche</strong> — mengubah 1 bit input akan mengubah
                            rata-rata setengah bit output. Dekripsi menjalankan proses yang sama persis, hanya urutan
                            kunci putaran yang dibalik (K₁₆..K₁).
                        </p>
                    </CardContent>
                </Card>
            )}

            <Dots total={totalRounds} current={i - 1} onJump={onJump} />
        </div>
    );
}

// ── Prep phase ───────────────────────────────────────────────────────────────

function Prep({ trace }: { trace: DesTrace }) {
    return (
        <div className="space-y-3">
            <Card className="border-border/70 bg-card/95">
                <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <Hex label="Plaintext" value={trace.plaintext} color="blue" subtitle="64 bit" />
                        <Hex label="Kunci" value={trace.key} color="violet" subtitle="64 bit (56 efektif)" />
                    </div>
                    <VSep label="IP — Initial Permutation" />
                    <Hex label="Setelah IP" value={bitsToHex(trace.afterIP)} color="blue" subtitle="64 bit" />
                    <VSep label="Pisah L₀ / R₀" />
                    <div className="grid grid-cols-2 gap-2">
                        <Hex label="L₀" value={bitsToHex(trace.L0)} color="blue" subtitle="32 bit" />
                        <Hex label="R₀" value={bitsToHex(trace.R0)} color="green" subtitle="32 bit" />
                    </div>
                </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground italic text-center">
                IP mengatur ulang bit plaintext, lalu blok 64-bit dibelah jadi L₀ dan R₀.
                Siap masuk 16 putaran Feistel.
            </p>
        </div>
    );
}

// ── Final phase ──────────────────────────────────────────────────────────────

function Final({ trace, rounds }: { trace: DesTrace; rounds: DesTrace['rounds'] }) {
    const last = rounds[rounds.length - 1];
    return (
        <div className="space-y-3">
            <Card className="border-border/70 bg-card/95">
                <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <Hex label="L₁₆" value={bitsToHex(last.newL)} color="blue" subtitle="32 bit" />
                        <Hex label="R₁₆" value={bitsToHex(last.newR)} color="green" subtitle="32 bit" />
                    </div>
                    <VSep label="Tukar → R₁₆L₁₆ + FP" />
                    <Hex label="Ciphertext" value={trace.ciphertext} color="green" subtitle="64 bit" />
                </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800">
                <CardContent className="p-3 flex items-start gap-2">
                    <Unlock className="size-4 text-green-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground leading-relaxed">
                        L₁₆ dan R₁₆ ditukar lalu melewati Final Permutation (FP). Untuk dekripsi,
                        jalankan proses yang sama dengan urutan kunci dibalik: K₁₆, K₁₅, ..., K₁.
                    </div>
                </CardContent>
            </Card>
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

    // Detect step type
    const match = ROUND_RE.exec(steps[activeStep] ?? '');
    const isRound = match !== null;
    const roundNumber = match ? Number.parseInt(match[1]) : -1;

    // Find first round step index for dot navigation offset
    let firstRoundStep = 0;
    for (let i = 0; i < steps.length; i++) {
        if (ROUND_RE.test(steps[i])) {
            firstRoundStep = i;
            break;
        }
    }

    const isFinal = !isRound && activeStep > firstRoundStep;
    const currentRound = isRound ? rounds[roundNumber - 1] : null;

    // Depth based on round number
    const depth: Depth = roundNumber <= 4 ? 'shallow' : roundNumber <= 11 ? 'medium' : 'deep';

    const handleJump = (roundIndex: number) => {
        onStepChange?.(firstRoundStep + roundIndex);
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
                    {!isRound && !isFinal
                        ? 'Persiapan'
                        : isFinal
                          ? 'Selesai'
                          : `Putaran ${roundNumber}/16`}
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
                    {!isRound && !isFinal && <Prep trace={trace} />}

                    {isRound && currentRound && (
                        <FeistelRound
                            round={currentRound}
                            depth={depth}
                            onJump={handleJump}
                            totalRounds={totalRounds}
                        />
                    )}

                    {isFinal && <Final trace={trace} rounds={rounds} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
