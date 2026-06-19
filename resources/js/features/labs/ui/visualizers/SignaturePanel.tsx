/**
 * SignaturePanel — RSA Digital Signature visualization
 *
 * Shows the signing or verification flow with SHA-256 hash,
 * modular exponentiation, and result validation.
 */

import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { RsaSignatureTraceData } from '@/types/labs';

interface SignaturePanelProps {
    trace: RsaSignatureTraceData;
    steps: string[];
    learnerMode: 'pemula' | 'mahir';
    mode: 'encrypt' | 'decrypt';
}

function hexToBytes(hex: string): number[] {
    const bytes: number[] = [];

    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }

    return bytes;
}

export default function SignaturePanel({
    trace,
    learnerMode,
    mode,
}: SignaturePanelProps) {
    const isSigning = mode === 'encrypt';
    const digestBytes = hexToBytes(trace.digestHex);

    if (isSigning) {
        return (
            <div className="space-y-4">
                {/* Step 1: Message Hash */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <span className="size-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">1</span>
                            SHA-256 Hash
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="rounded bg-muted/40 p-2 text-xs font-mono break-all">
                            {trace.digestHex}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded bg-muted/30 p-2">
                                <span className="text-muted-foreground">Length: </span>
                                <span className="font-mono">{trace.digestHex.length} hex chars</span>
                            </div>
                            <div className="rounded bg-muted/30 p-2">
                                <span className="text-muted-foreground">Bytes: </span>
                                <span className="font-mono">{digestBytes.length} bytes</span>
                            </div>
                        </div>
                        {learnerMode === 'mahir' && (
                            <p className="text-xs text-muted-foreground italic">
                                SHA-256 produces a fixed 256-bit (32-byte) hash from any input.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2: Digest Prefix */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <span className="size-5 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-[10px] font-bold text-orange-600 dark:text-orange-400">2</span>
                            Digest Prefix
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded bg-orange-50 dark:bg-orange-950/30 p-3 text-sm font-mono break-all border border-orange-200 dark:border-orange-800">
                            {trace.digestPrefix}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            For education, only the first {trace.digestPrefix.length} hex characters are used.
                            In real RSA signatures, the full hash is converted to an integer.
                        </p>
                    </CardContent>
                </Card>

                {/* Step 3: Signing */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <span className="size-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-[10px] font-bold text-green-600 dark:text-green-400">3</span>
                            Digital Signature
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="rounded bg-green-50 dark:bg-green-950/30 p-3 border border-green-200 dark:border-green-800 space-y-2">
                            <div className="text-xs">
                                <span className="text-muted-foreground">digest </span>
                                <span className="font-mono font-bold">^ d </span>
                                <span className="text-muted-foreground">mod n</span>
                            </div>
                            <div className="text-xs font-mono text-muted-foreground">
                                {trace.digestPrefix}... ^ d mod n
                            </div>
                        </div>
                        {trace.signatureInt && (
                            <>
                                <Separator />
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Signature (integer)</span>
                                    <div className="rounded bg-muted/40 p-2 text-xs font-mono break-all">
                                        {trace.signatureInt}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Signature (hex)</span>
                                    <div className="rounded bg-muted/40 p-2 text-xs font-mono break-all">
                                        0x{BigInt(trace.signatureInt).toString(16).toUpperCase()}
                                    </div>
                                </div>
                            </>
                        )}
                        {learnerMode === 'mahir' && (
                            <p className="text-xs text-muted-foreground italic">
                                Only the private key holder can compute signature = digest^d mod n.
                                Anyone with the public key can verify it.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Verification mode
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <span className="size-5 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">1</span>
                        Signature Verification
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded bg-muted/40 p-3 text-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-muted-foreground">Recovered digest</span>
                            <Badge variant={trace.isValid ? 'default' : 'destructive'}>
                                {trace.isValid ? 'VALID' : 'INVALID'}
                            </Badge>
                        </div>
                        <div className="font-mono text-xs break-all">
                            {trace.digestHex || '(none)'}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {trace.explanationSteps.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Verification Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {trace.explanationSteps.map((step, i) => (
                                <div key={i} className="flex gap-2 text-xs">
                                    <span className="text-muted-foreground font-mono shrink-0">{i + 1}.</span>
                                    <span className="text-muted-foreground font-mono">{step}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className={trace.isValid ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">
                            {trace.isValid ? '✅' : '❌'}
                        </span>
                        <div>
                            <p className="text-sm font-medium">
                                {trace.isValid
                                    ? 'Signature is authentic'
                                    : 'Signature verification failed'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {trace.isValid
                                    ? 'The message is authentic and has not been tampered with.'
                                    : 'The signature does not match — message may be tampered or wrong key used.'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
