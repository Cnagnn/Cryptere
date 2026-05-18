import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import type { UseTwoFactorAuthReturn } from '@/hooks/use-two-factor-auth';

type TwoFactorSetupDialogProps = {
    open: boolean;
    requiresConfirmation: boolean;
    twoFactor: UseTwoFactorAuthReturn;
    onOpenChange: (open: boolean) => void;
    onConfirmed: () => void;
};

export function TwoFactorSetupDialog({
    open,
    requiresConfirmation,
    twoFactor,
    onOpenChange,
    onConfirmed,
}: TwoFactorSetupDialogProps) {
    const [code, setCode] = useState('');
    const [confirming, setConfirming] = useState(false);

    const confirmSetup = async (): Promise<void> => {
        setConfirming(true);

        try {
            await twoFactor.confirmTwoFactor(code);
            await twoFactor.fetchRecoveryCodes();
            setCode('');
            onConfirmed();
        } finally {
            setConfirming(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                        Scan the QR code with your authenticator app or enter
                        the manual setup key.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    {twoFactor.qrCodeSvg && (
                        <div
                            className="mx-auto rounded-lg border bg-white p-3"
                            dangerouslySetInnerHTML={{
                                __html: twoFactor.qrCodeSvg,
                            }}
                        />
                    )}

                    {twoFactor.manualSetupKey && (
                        <div className="grid gap-2">
                            <Label>Manual setup key</Label>
                            <div className="rounded-lg border bg-muted/40 p-3 font-mono text-xs break-all">
                                {twoFactor.manualSetupKey}
                            </div>
                        </div>
                    )}

                    {requiresConfirmation && (
                        <div className="grid gap-2">
                            <Label htmlFor="two_factor_code">
                                Verification code
                            </Label>
                            <Input
                                id="two_factor_code"
                                value={code}
                                inputMode="numeric"
                                maxLength={OTP_MAX_LENGTH}
                                onChange={(event) =>
                                    setCode(event.target.value)
                                }
                            />
                        </div>
                    )}

                    {twoFactor.errors.map((error) => (
                        <p key={error} className="text-sm text-destructive">
                            {error}
                        </p>
                    ))}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    {requiresConfirmation && (
                        <Button
                            type="button"
                            onClick={confirmSetup}
                            disabled={
                                confirming || code.length !== OTP_MAX_LENGTH
                            }
                        >
                            <ShieldCheck className="size-4" />
                            Confirm 2FA
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
