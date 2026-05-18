import { BadgeCheck, ShieldCheck, ShieldOff } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TwoFactorRecoveryCodes } from '@/features/settings/two-factor-recovery-codes';
import { TwoFactorSetupDialog } from '@/features/settings/two-factor-setup-dialog';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';

type TwoFactorSettingsCardProps = {
    enabled: boolean;
    requiresConfirmation: boolean;
};

export function TwoFactorSettingsCard({
    enabled,
    requiresConfirmation,
}: TwoFactorSettingsCardProps) {
    const [isEnabled, setIsEnabled] = useState(enabled);
    const [setupOpen, setSetupOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const twoFactor = useTwoFactorAuth();

    const enableTwoFactor = async (): Promise<void> => {
        setProcessing(true);

        try {
            await twoFactor.enableTwoFactor();
            await twoFactor.fetchSetupData();

            if (!requiresConfirmation) {
                setIsEnabled(true);
                await twoFactor.fetchRecoveryCodes();
            }

            setSetupOpen(true);
        } finally {
            setProcessing(false);
        }
    };

    const disableTwoFactor = async (): Promise<void> => {
        setProcessing(true);

        try {
            await twoFactor.disableTwoFactor();
            setIsEnabled(false);
            setSetupOpen(false);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="grid gap-1.5">
                            <CardTitle className="flex items-center gap-2">
                                Two-Factor Authentication
                                <Badge
                                    variant={
                                        isEnabled ? 'default' : 'secondary'
                                    }
                                >
                                    {isEnabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                Protect sign-in with an authenticator app and
                                recovery codes.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {isEnabled ? (
                        <div className="grid gap-4">
                            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                                <BadgeCheck className="size-5 text-green-600 dark:text-green-400" />
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    Two-factor authentication is active.
                                </p>
                            </div>

                            <TwoFactorRecoveryCodes
                                recoveryCodesList={twoFactor.recoveryCodesList}
                                fetchRecoveryCodes={
                                    twoFactor.fetchRecoveryCodes
                                }
                                regenerateRecoveryCodes={
                                    twoFactor.regenerateRecoveryCodes
                                }
                                errors={twoFactor.errors}
                            />

                            <Separator />

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={disableTwoFactor}
                                    disabled={processing}
                                >
                                    <ShieldOff className="size-4" />
                                    Disable 2FA
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <div className="flex size-14 items-center justify-center rounded-lg bg-muted">
                                <ShieldOff className="size-6 text-muted-foreground" />
                            </div>
                            <div className="flex max-w-sm flex-col gap-1">
                                <p className="text-sm font-medium">
                                    Not enabled
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Require a time-based code from your
                                    authenticator app when signing in.
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={enableTwoFactor}
                                disabled={processing}
                            >
                                <ShieldCheck className="size-4" />
                                Enable 2FA
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <TwoFactorSetupDialog
                open={setupOpen}
                requiresConfirmation={requiresConfirmation}
                twoFactor={twoFactor}
                onOpenChange={(open) => {
                    setSetupOpen(open);

                    if (!open) {
                        twoFactor.clearSetupData();
                    }
                }}
                onConfirmed={() => {
                    setIsEnabled(true);
                    setSetupOpen(false);
                }}
            />
        </>
    );
}
