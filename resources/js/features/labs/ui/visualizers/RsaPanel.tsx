/**
 * RsaPanel — centered key gen flow + modular exp.
 */
import { cn } from '@/lib/utils';

interface Props {
    trace: { p: string; q: string; n: string; phi: string; e: string; d: string; keyGenSteps: string[] };
    steps: string[]; learnerMode: string;
}

function Bx({ L, V, c }: { L: string; V: string; c: string }) {
    return (
        <div className={cn('rounded-xl border px-4 py-3 text-center min-w-[110px]', c)}>
            <p className="text-[10px] font-bold text-muted-foreground">{L}</p>
            <p className="font-mono text-[11px] font-semibold break-all leading-tight mt-1">{V}</p>
        </div>
    );
}

function SN({ n }: { n: number }) {
    return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
            {n}
        </span>
    );
}

function trunc(s: string, n = 34) {
 return s.length <= n ? s : s.slice(0, n) + '…'; 
}

export default function RsaPanel({ trace, steps }: Props) {
    const blokSteps = steps.filter((s) =>
        s.includes('Blok') || s.includes('byte') || s.includes('mod'),
    );

    return (
        <div className="flex flex-col items-center gap-5">
            {/* Key gen — horizontal centered */}
            <div className="flex flex-col items-center gap-3">
                <p className="text-xs font-semibold text-muted-foreground">Pembangkitan Kunci</p>
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
                    <div className="flex flex-col items-center gap-1">
                        <SN n={1} />
                        <Bx L="p" V={trunc(trace.p)} c="bg-blue-50 border-blue-200 dark:bg-blue-950/20" />
                    </div>
                    <span className="text-muted-foreground/20 text-xl">·</span>
                    <div className="flex flex-col items-center gap-1">
                        <SN n={2} />
                        <Bx L="q" V={trunc(trace.q)} c="bg-violet-50 border-violet-200 dark:bg-violet-950/20" />
                    </div>
                    <span className="text-muted-foreground/30 text-xl">→</span>
                    <div className="flex flex-col items-center gap-1">
                        <SN n={3} />
                        <Bx L="n = p × q" V={trunc(trace.n)} c="bg-amber-50 border-amber-200 dark:bg-amber-950/20" />
                    </div>
                    <span className="text-muted-foreground/30 text-xl">→</span>
                    <div className="flex flex-col items-center gap-1">
                        <SN n={4} />
                        <Bx L="φ(n)" V={trunc(trace.phi)} c="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20" />
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3">
                    <div className="flex flex-col items-center gap-1">
                        <SN n={5} />
                        <Bx L="e (publik)" V={trace.e} c="bg-sky-50 border-sky-200 dark:bg-sky-950/20" />
                    </div>
                    <span className="text-muted-foreground/30 text-xl">→</span>
                    <div className="flex flex-col items-center gap-1">
                        <SN n={6} />
                        <Bx L="d = e⁻¹ mod φ" V={trunc(trace.d)} c="bg-rose-50 border-rose-200 dark:bg-rose-950/20" />
                    </div>
                </div>
            </div>

            {/* Modular exponentiation */}
            {blokSteps.length > 0 && (
                <div className="flex flex-col items-center gap-3">
                    <p className="text-xs font-semibold text-muted-foreground">Enkripsi Modular</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {blokSteps.slice(0, 6).map((s, i) => {
                            const num = s.match(/Blok\s+(\d+)/);
                            const val = s.match(/c\s*=\s*(.+)\b/);

                            return (
                                <div key={i} className="flex flex-col items-center gap-1">
                                    <SN n={(parseInt(num?.[1] ?? '0')) + 6} />
                                    <div className="rounded-xl border bg-muted/5 px-3 py-2 text-center">
                                        <p className="font-mono text-[10px] font-semibold break-all">
                                            {val ? val[1] : s.slice(0, 60)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}