/**
 * SignaturePanel — centered arrow flow: sign / verify.
 */
import { cn } from '@/lib/utils';

interface Props {
    trace: { digestHex: string; digestPrefix: string; signatureInt?: string; isValid?: boolean; explanationSteps: string[] };
    steps: string[]; learnerMode: string; mode: 'encrypt' | 'decrypt';
}

function Bx({ L, V, c }: { L: string; V: string; c: string }) {
    return (
        <div className={cn('rounded-xl border px-5 py-3 text-center min-w-[200px]', c)}>
            <p className="text-[10px] font-bold text-muted-foreground">{L}</p>
            <p className="font-mono text-[11px] font-semibold break-all leading-tight mt-1">{V}</p>
        </div>
    );
}

function SN({ n }: { n: number }) {
    return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">
            {n}
        </span>
    );
}

function Dn() {
 return <span className="text-2xl text-muted-foreground/20">↓</span>; 
}

export default function SignaturePanel({ trace, mode }: Props) {
    if (mode === 'encrypt') {
        const chunks = trace.digestHex.match(/.{1,8}/g) ?? [];
        const sig = trace.signatureInt
            ? trace.signatureInt.slice(0, 50) + (trace.signatureInt.length > 50 ? '…' : '')
            : '';

        return (
            <div className="flex flex-col items-center gap-3">
                <p className="text-xs font-semibold text-muted-foreground">Alur Penandatanganan</p>

                <div className="flex flex-col items-center gap-1">
                    <SN n={1} />
                    <Bx L="Pesan" V="input pengirim" c="bg-sky-50 border-sky-200 dark:bg-sky-950/20" />
                </div>

                <Dn />

                <div className="flex flex-col items-center gap-1">
                    <SN n={2} />
                    <Bx L="Hash SHA-256" V={chunks.slice(0, 4).join(' ') + (chunks.length > 4 ? ' …' : '')} c="bg-amber-50 border-amber-200 dark:bg-amber-950/20" />
                </div>

                <Dn />

                <div className="flex flex-col items-center gap-1">
                    <SN n={3} />
                    <Bx L="Tandatangani" V={sig || 'digest^d mod n'} c="bg-rose-50 border-rose-200 dark:bg-rose-950/20" />
                </div>

                <Dn />

                <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 px-6 py-3 text-center">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Token Tanda Tangan</p>
                </div>
            </div>
        );
    }

    /* Verify */
    return (
        <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-semibold text-muted-foreground">Alur Verifikasi</p>

            <div className="flex flex-col items-center gap-1">
                <SN n={1} />
                <Bx L="Pesan + Token" V="diterima" c="bg-sky-50 border-sky-200 dark:bg-sky-950/20" />
            </div>

            <Dn />

            <div className="flex items-start justify-center gap-4 flex-wrap">
                <div className="flex flex-col items-center gap-1">
                    <SN n={2} />
                    <Bx L="Hash ulang" V="SHA-256(pesan)" c="bg-amber-50 border-amber-200 dark:bg-amber-950/20" />
                </div>
                <div className="flex flex-col items-center gap-1">
                    <SN n={3} />
                    <Bx L="Dekripsi token" V="token^e mod n" c="bg-rose-50 border-rose-200 dark:bg-rose-950/20" />
                </div>
            </div>

            <Dn />

            <div className="flex flex-col items-center gap-1">
                <SN n={4} />
                <div className={cn(
                    'rounded-xl border-2 px-6 py-3 text-center',
                    trace.isValid
                        ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-red-300 bg-red-50 dark:bg-red-950/20',
                )}>
                    <p className={cn(
                        'text-sm font-bold',
                        trace.isValid ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400',
                    )}>
                        {trace.isValid ? 'Digest Cocok — VALID' : 'Digest Berbeda — TIDAK VALID'}
                    </p>
                </div>
            </div>
        </div>
    );
}