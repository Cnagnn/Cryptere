/**
 * RSA Key Generation Visualization
 *
 * Displays the RSA key generation flow with p → n → φ(n) → e → d
 * and mathematical formulas.
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface RsaKeyGenViewProps {
    p: bigint;
    q: bigint;
    n: bigint;
    phi: bigint;
    e: bigint;
    d: bigint;
    steps?: string[];
}

function BigIntDisplay({
    value,
    label,
    variant = 'default',
}: {
    value: bigint;
    label: string;
    variant?: 'prime' | 'public' | 'private' | 'default';
}) {
    const variantStyles = {
        prime: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
        public: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
        private: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
        default: 'bg-muted/30 border-muted',
    };

    return (
        <div
            className={cn(
                'p-3 rounded-lg border space-y-1',
                variantStyles[variant],
            )}
        >
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {label}
            </span>
            <span className="block font-mono text-sm text-foreground break-all">
                {value.toString()}
            </span>
        </div>
    );
}

function FormulaDisplay({
    equation,
    description,
}: {
    equation: string;
    description?: string;
}) {
    return (
        <div className="flex flex-col items-center gap-1 py-2">
            <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-3 py-1 rounded">
                {equation}
            </span>
            {description && (
                <span className="text-[10px] text-muted-foreground/70 italic">
                    {description}
                </span>
            )}
        </div>
    );
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
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
            </svg>
        </div>
    );
}

export default function RsaKeyGenView({
    p,
    q,
    n,
    phi,
    e,
    d,
    steps = [],
}: RsaKeyGenViewProps) {
    return (
        <div className="space-y-6">
            {/* Key generation flow */}
            <div className="space-y-4">
                {/* Step 1: Primes */}
                <div className="grid grid-cols-2 gap-4">
                    <BigIntDisplay value={p} label="p (prime)" variant="prime" />
                    <BigIntDisplay value={q} label="q (prime)" variant="prime" />
                </div>

                <FlowArrow />

                {/* Step 2: n = p × q */}
                <FormulaDisplay
                    equation="n = p × q"
                    description="Modulus for both public and private keys"
                />
                <BigIntDisplay value={n} label="n (modulus)" variant="default" />

                <FlowArrow />

                {/* Step 3: φ(n) = (p-1)(q-1) */}
                <FormulaDisplay
                    equation="φ(n) = (p-1)(q-1)"
                    description="Euler's totient function"
                />
                <BigIntDisplay value={phi} label="φ(n)" variant="default" />

                <FlowArrow />

                {/* Step 4: Choose e */}
                <FormulaDisplay
                    equation="e = 65537 (typically)"
                    description="Public exponent, coprime with φ(n)"
                />
                <BigIntDisplay value={e} label="e (public exponent)" variant="public" />

                <FlowArrow />

                {/* Step 5: Find d */}
                <FormulaDisplay
                    equation="d = e⁻¹ mod φ(n)"
                    description="Modular multiplicative inverse"
                />
                <BigIntDisplay value={d} label="d (private exponent)" variant="private" />
            </div>

            {/* Key pairs summary */}
            <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                    Key Pairs
                </h4>

                <div className="grid grid-cols-2 gap-4">
                    {/* Public key */}
                    <Card>
                        <CardContent className="p-3 space-y-2">
                            <Badge variant="secondary" className="text-xs">
                                Public Key
                            </Badge>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">e:</span>
                                    <span className="font-mono">{e.toString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">n:</span>
                                    <span className="font-mono text-[10px] break-all">
                                        {n.toString()}
                                    </span>
                                </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground italic">
                                Used to encrypt / verify signature
                            </div>
                        </CardContent>
                    </Card>

                    {/* Private key */}
                    <Card>
                        <CardContent className="p-3 space-y-2">
                            <Badge variant="destructive" className="text-xs">
                                Private Key
                            </Badge>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">d:</span>
                                    <span className="font-mono text-[10px] break-all">
                                        {d.toString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">n:</span>
                                    <span className="font-mono text-[10px] break-all">
                                        {n.toString()}
                                    </span>
                                </div>
                            </div>
                            <div className="text-[10px] text-muted-foreground italic">
                                Used to decrypt / sign
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Step-by-step log */}
            {steps.length > 0 && (
                <div className="border-t pt-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">
                        Generation Steps
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
                        {steps.map((step, idx) => (
                            <div
                                key={idx}
                                className="text-xs font-mono text-muted-foreground"
                            >
                                <span className="text-muted-foreground/50 mr-2">
                                    {idx + 1}.
                                </span>
                                {step}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Mathematical relationships */}
            <div className="border-t pt-4 space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                    Key Relationships
                </h4>
                <div className="grid gap-2 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-purple-600 dark:text-purple-400">p, q</span>
                        <span className="text-muted-foreground">Large random primes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-purple-600 dark:text-purple-400">n = p × q</span>
                        <span className="text-muted-foreground">Cannot be efficiently factored</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-purple-600 dark:text-purple-400">φ(n) = (p-1)(q-1)</span>
                        <span className="text-muted-foreground">Count of numbers coprime to n</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-purple-600 dark:text-purple-400">e × d ≡ 1 (mod φ(n))</span>
                        <span className="text-muted-foreground">Modular inverse property</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
