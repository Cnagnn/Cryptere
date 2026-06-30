/**
 * SignaturePanel — shared-shell signature visualizer.
 */
import VisualizerShell from '@/features/labs/visualizers/VisualizerShell';
import { cn } from '@/lib/utils';

interface Props {
    trace: {
        digestHex: string;
        digestPrefix: string;
        signatureInt?: string;
        isValid?: boolean;
        explanationSteps: string[];
    };
    steps: string[];
    learnerMode: string;
    mode: 'encrypt' | 'decrypt';
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
                'min-w-[240px] rounded-xl border px-6 py-4 text-center',
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

export default function SignaturePanel({ trace, mode }: Props) {
    const signaturePreview = trace.signatureInt
        ? `${trace.signatureInt.slice(0, 50)}${trace.signatureInt.length > 50 ? '...' : ''}`
        : 'digest^d mod n';

    const stage =
        mode === 'encrypt' ? (
            <div className="flex w-full max-w-6xl flex-wrap items-center justify-center gap-4">
                <FlowCard label="Pesan" value="input pengirim" muted />
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <FlowCard
                    label="Hash SHA-256"
                    value={trace.digestHex.slice(0, 32)}
                />
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <FlowCard label="Tandatangani" value={signaturePreview} muted />
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <FlowCard label="Token" value="signature token" />
            </div>
        ) : (
            <div className="flex w-full max-w-6xl flex-wrap items-center justify-center gap-4">
                <FlowCard label="Pesan + Token" value="diterima" muted />
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <FlowCard label="Hash ulang" value="SHA-256(pesan)" />
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <FlowCard label="Dekripsi token" value="token^e mod n" muted />
                <span className="text-2xl text-muted-foreground/20">-&gt;</span>
                <FlowCard
                    label="Hasil"
                    value={
                        trace.isValid
                            ? 'Digest Cocok - VALID'
                            : 'Digest Berbeda - TIDAK VALID'
                    }
                />
            </div>
        );

    const detail = (
        <div className="flex flex-col gap-3 text-xs">
            <DetailCard label="Digest" value={trace.digestHex} />
            {trace.signatureInt && (
                <DetailCard label="Token" value={trace.signatureInt} />
            )}
            <DetailCard
                label="Status"
                value={trace.isValid ? 'VALID' : 'MENUNGGU / TIDAK VALID'}
            />
        </div>
    );

    return (
        <VisualizerShell
            step={mode === 'encrypt' ? 0 : 1}
            caption={
                mode === 'encrypt'
                    ? 'Tanda tangan digital divisualisasikan sebagai alur pesan -> hash -> penandatanganan -> token hasil.'
                    : 'Verifikasi divisualisasikan sebagai alur pesan + token -> hash ulang -> dekripsi token -> hasil validasi.'
            }
            stage={stage}
            detail={detail}
        />
    );
}
