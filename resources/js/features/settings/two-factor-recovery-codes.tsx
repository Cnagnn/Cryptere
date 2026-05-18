import { Copy, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

type TwoFactorRecoveryCodesProps = {
    recoveryCodesList: string[];
    fetchRecoveryCodes: () => Promise<void>;
    regenerateRecoveryCodes: () => Promise<void>;
    errors: string[];
};

export function TwoFactorRecoveryCodes({
    recoveryCodesList,
    fetchRecoveryCodes,
    regenerateRecoveryCodes,
    errors,
}: TwoFactorRecoveryCodesProps) {
    const copyCodes = async (): Promise<void> => {
        if (typeof navigator === 'undefined') {
            return;
        }

        await navigator.clipboard.writeText(recoveryCodesList.join('\n'));
    };

    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-sm font-medium">Recovery codes</p>
                    <p className="text-sm/6 text-muted-foreground">
                        Store these codes somewhere safe.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchRecoveryCodes}
                    >
                        Show codes
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={regenerateRecoveryCodes}
                    >
                        <RefreshCw className="size-4" />
                    </Button>
                </div>
            </div>

            {recoveryCodesList.length > 0 && (
                <div className="grid gap-3">
                    <div className="grid gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                        {recoveryCodesList.map((code) => (
                            <span key={code}>{code}</span>
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={copyCodes}
                        className="justify-self-start"
                    >
                        <Copy className="size-4" />
                        Copy all
                    </Button>
                </div>
            )}

            {errors.map((error) => (
                <p key={error} className="text-sm text-destructive">
                    {error}
                </p>
            ))}
        </div>
    );
}
