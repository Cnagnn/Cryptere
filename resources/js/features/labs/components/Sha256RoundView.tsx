/**
 * SHA-256 Round Visualization
 *
 * Displays the 8 working variables (a-h) for a SHA-256 round
 * with color coding and optional Wt/Kt values.
 */

import { cn } from '@/lib/utils';

interface Sha256RoundViewProps {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
    g: number;
    h: number;
    Wt?: number;
    Kt?: number;
    roundIndex?: number;
}

function formatHex(value: number): string {
    return '0x' + value.toString(16).padStart(8, '0').toUpperCase();
}

function VariableCell({
    value,
    label,
    variant,
}: {
    value: number;
    label: string;
    variant: 'upper' | 'lower';
}) {
    const isUpper = variant === 'upper';

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded border p-2 min-w-16',
                isUpper
                    ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-orange-300 bg-orange-50 dark:bg-orange-950/30',
            )}
        >
            <span
                className={cn(
                    'text-[10px] font-medium',
                    isUpper ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400',
                )}
            >
                {label}
            </span>
            <span className="font-mono text-sm font-semibold text-foreground">
                {formatHex(value)}
            </span>
        </div>
    );
}

export default function Sha256RoundView({
    a,
    b,
    c,
    d,
    e,
    f,
    g,
    h,
    Wt,
    Kt,
    roundIndex,
}: Sha256RoundViewProps) {
    return (
        <div className="space-y-3">
            {/* Round header */}
            {roundIndex !== undefined && (
                <div className="text-xs text-muted-foreground">
                    Round {roundIndex}
                </div>
            )}

            {/* Upper variables (a-d) - blue group */}
            <div className="space-y-1">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                    Σ₀(a,b,c) group
                </span>
                <div className="flex gap-1">
                    <VariableCell value={a} label="a" variant="upper" />
                    <VariableCell value={b} label="b" variant="upper" />
                    <VariableCell value={c} label="c" variant="upper" />
                    <VariableCell value={d} label="d" variant="upper" />
                </div>
            </div>

            {/* Lower variables (e-h) - orange group */}
            <div className="space-y-1">
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                    Σ₁(e,f,g) + Ch(e,f,g) group
                </span>
                <div className="flex gap-1">
                    <VariableCell value={e} label="e" variant="lower" />
                    <VariableCell value={f} label="f" variant="lower" />
                    <VariableCell value={g} label="g" variant="lower" />
                    <VariableCell value={h} label="h" variant="lower" />
                </div>
            </div>

            {/* Optional Wt and Kt */}
            {(Wt !== undefined || Kt !== undefined) && (
                <div className="flex gap-2 text-xs">
                    {Wt !== undefined && (
                        <span className="text-muted-foreground">
                            W<sub>t</sub>: {formatHex(Wt)}
                        </span>
                    )}
                    {Kt !== undefined && (
                        <span className="text-muted-foreground">
                            K<sub>t</sub>: {formatHex(Kt)}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
