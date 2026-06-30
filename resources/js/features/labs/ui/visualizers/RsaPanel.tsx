/**
 * RsaPanel — shared-shell RSA visualizer.
 */
import VisualizerShell from '@/features/labs/visualizers/VisualizerShell';
import { cn } from '@/lib/utils';

interface Props {
    trace: {
        p: string;
        q: string;
        n: string;
        phi: string;
        e: string;
        d: string;
        keyGenSteps: string[];
    };
    steps: string[];
    learnerMode: string;
}

function FlowCard({
    label,
    value,
    muted = false,
}: {
    label: string;
    value: string;
    muted?: boolean;
}) {
    return (
        <div
            className={cn(
                'min-w-[140px] rounded-xl border px-5 py-4 text-center',
                muted ? 'bg-muted/20' : 'bg-background',
            )}
        >
            <p className="text-[10px] font-bold text-muted-foreground">
                {label}
            </p>
            <p className="mt-1 font-mono text-[11px] leading-tight font-semibold break-all">
                {value}
            </p>
        </div>
    );
}

function DetailCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border bg-muted/20 px-3 py-2">
            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-1 font-mono text-[11px] break-all text-foreground">
                {value}
            </p>
        </div>
    );
}

function truncate(value: string, length = 34): string {
    return value.length <= length ? value : `${value.slice(0, length)}...`;
}

export default function RsaPanel({ trace, steps }: Props) {
    const blockSteps = steps.filter(
        (step) =>
            step.includes('Blok') ||
            step.includes('byte') ||
            step.includes('mod'),
    );

    const stage = (
        <div className="flex w-full max-w-6xl flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-4">
                <FlowCard label="p" value={truncate(trace.p)} muted />
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <FlowCard label="q" value={truncate(trace.q)} />
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <FlowCard label="n = p x q" value={truncate(trace.n)} muted />
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <FlowCard label="phi(n)" value={truncate(trace.phi)} />
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <FlowCard label="e" value={trace.e} muted />
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <FlowCard label="d" value={truncate(trace.d)} />
            </div>
        </div>
    );

    const detail = (
        <div className="flex flex-col gap-3 text-xs">
            <DetailCard label="Modulus n" value={trace.n} />
            <DetailCard label="Eksponen publik e" value={trace.e} />
            <DetailCard label="Eksponen privat d" value={trace.d} />
            {blockSteps.length > 0 && (
                <DetailCard
                    label="Jejak modular"
                    value={blockSteps.slice(0, 3).join(' | ')}
                />
            )}
        </div>
    );

    return (
        <VisualizerShell
            step={0}
            caption="RSA divisualisasikan sebagai alur pembangkitan kunci, lalu diteruskan ke jejak operasi modular untuk mengenali peran p, q, n, phi, e, dan d."
            stage={stage}
            detail={detail}
        />
    );
}
