/**
 * RsaPanel — RSA Key Generation visualization
 *
 * Shows p, q, n, φ(n), e, d derivation with formulas.
 */

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { RsaKeyGenTraceData } from '@/types/labs';

interface RsaPanelProps {
    trace: RsaKeyGenTraceData;
    steps: string[];
    learnerMode: 'pemula' | 'mahir';
}

function FlowArrow() {
    return (
        <div className="flex justify-center py-1">
            <svg
                className="w-4 h-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
        </div>
    );
}

export default function RsaPanel({ trace, learnerMode }: RsaPanelProps) {
    const p = BigInt(trace.p);
    const q = BigInt(trace.q);
    const n = BigInt(trace.n);
    const phi = BigInt(trace.phi);
    const e = BigInt(trace.e);
    const d = BigInt(trace.d);

    return (
        <div className="space-y-4 overflow-auto">
            {/* Primes */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="border-purple-200 dark:border-purple-800">
                    <CardContent className="p-3 space-y-1">
                        <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                            p (prima)
                        </span>
                        <span className="block font-mono text-lg text-foreground">
                            {p.toString()}
                        </span>
                    </CardContent>
                </Card>
                <Card className="border-purple-200 dark:border-purple-800">
                    <CardContent className="p-3 space-y-1">
                        <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                            q (prima)
                        </span>
                        <span className="block font-mono text-lg text-foreground">
                            {q.toString()}
                        </span>
                    </CardContent>
                </Card>
            </div>

            <FlowArrow />

            {/* n = p × q */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">n = p × q</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <span className="block font-mono text-lg text-foreground">
                        {n.toString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {p.toString()} × {q.toString()} = {n.toString()}
                    </span>
                    {learnerMode === 'mahir' && (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                            n adalah modulus untuk enkripsi dan dekripsi. Memfaktorkan n kembali menjadi p dan q adalah masalah sulit yang menjadi dasar keamanan RSA.
                        </p>
                    )}
                </CardContent>
            </Card>

            <FlowArrow />

            {/* φ(n) */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">φ(n) = (p-1)(q-1)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <span className="block font-mono text-lg text-foreground">
                        {phi.toString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        ({p.toString()}-1) × ({q.toString()}-1) = {phi.toString()}
                    </span>
                    {learnerMode === 'mahir' && (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                            Totient Euler menghitung bilangan bulat 1 ≤ x &lt; n yang koprima dengan n.
                        </p>
                    )}
                </CardContent>
            </Card>

            <FlowArrow />

            {/* e */}
            <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">e (eksponen publik)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <span className="block font-mono text-lg text-foreground">
                        {e.toString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        gcd(e, φ(n)) = 1 (koprima)
                    </span>
                </CardContent>
            </Card>

            <FlowArrow />

            {/* d */}
            <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">d = e⁻¹ mod φ(n)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <span className="block font-mono text-lg text-foreground">
                        {d.toString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Algoritma Euclidean yang Diperluas
                    </span>
                    {learnerMode === 'mahir' && (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                            d adalah invers perkalian modular dari e modulo φ(n).
                            Menemukan d dari e dan n tanpa mengetahui p dan q tidak layak secara komputasional.
                        </p>
                    )}
                </CardContent>
            </Card>

            <Separator />

            {/* Key pairs */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="border-blue-200 dark:border-blue-800">
                    <CardContent className="p-3 space-y-2">
                        <Badge variant="secondary" className="text-xs">Kunci Publik</Badge>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">e:</span>
                                <span className="font-mono">{e.toString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">n:</span>
                                <span className="font-mono text-[10px] break-all">{n.toString()}</span>
                            </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground italic">Enkripsi / verifikasi</div>
                    </CardContent>
                </Card>
                <Card className="border-red-200 dark:border-red-800">
                    <CardContent className="p-3 space-y-2">
                        <Badge variant="destructive" className="text-xs">Kunci Privat</Badge>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">d:</span>
                                <span className="font-mono text-[10px] break-all">{d.toString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">n:</span>
                                <span className="font-mono text-[10px] break-all">{n.toString()}</span>
                            </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground italic">Dekripsi / tandatangani</div>
                    </CardContent>
                </Card>
            </div>

            {/* Key generation steps */}
            {trace.keyGenSteps.length > 0 && (
                <>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                            Langkah Pembangkitan
                        </h4>
                        <div className="bg-muted/30 rounded-lg p-3 space-y-1 max-h-48 overflow-auto">
                            {trace.keyGenSteps.map((step, i) => (
                                <div key={i} className="text-xs font-mono text-muted-foreground">
                                    <span className="text-muted-foreground/50 mr-2">{i + 1}.</span>
                                    {step}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
