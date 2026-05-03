import { useForm } from '@inertiajs/react';
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { useState } from 'react';

import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
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
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { disable } from '@/routes/two-factor';

type TwoFactorCardProps = {
    enabled: boolean;
    requiresConfirmation: boolean;
};

export function TwoFactorCard({
    enabled,
    requiresConfirmation,
}: TwoFactorCardProps) {
    const [isEnabled, setIsEnabled] = useState(enabled);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const twoFactor = useTwoFactorAuth();

    const handleEnable = async () => {
        setShowSetupModal(true);
    };

    const handleCloseModal = () => {
        setShowSetupModal(false);
        twoFactor.clearSetupData();
    };

    const handleDisable = () => {
        setIsEnabled(false);
        twoFactor.clearTwoFactorAuthData();
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1.5">
                            <CardTitle className="flex items-center gap-2">
                                Two-Factor Authentication
                                {isEnabled ? (
                                    <Badge
                                        variant="default"
                                        className="bg-green-600 text-xs hover:bg-green-700"
                                    >
                                        Enabled
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Disabled
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Add an extra layer of security with a time-based
                                one-time password (TOTP).
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {isEnabled ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                                <ShieldCheck className="size-5 text-green-600 dark:text-green-400" />
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    Two-factor authentication is active. Your
                                    account has an extra layer of protection.
                                </p>
                            </div>

                            <Separator />

                            <TwoFactorRecoveryCodes
                                recoveryCodesList={twoFactor.recoveryCodesList}
                                fetchRecoveryCodes={
                                    twoFactor.fetchRecoveryCodes
                                }
                                errors={twoFactor.errors}
                            />

                            <Separator />

                            <div className="flex justify-end">
                                <DisableTwoFactorButton
                                    onDisabled={handleDisable}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                                <ShieldOff className="size-6 text-muted-foreground" />
                            </div>
                            <div className="flex max-w-sm flex-col gap-1">
                                <p className="text-sm font-medium">
                                    Not yet enabled
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Protect your account by requiring a
                                    verification code from your authenticator
                                    app when signing in.
                                </p>
                            </div>
                            <Button onClick={handleEnable}>
                                <ShieldCheck className="size-4" />
                                Enable 2FA
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={handleCloseModal}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={isEnabled}
                qrCodeSvg={twoFactor.qrCodeSvg}
                manualSetupKey={twoFactor.manualSetupKey}
                clearSetupData={twoFactor.clearSetupData}
                fetchSetupData={twoFactor.fetchSetupData}
                errors={twoFactor.errors}
            />
        </>
    );
}

/* ── Disable 2FA Button ── */
function DisableTwoFactorButton({ onDisabled }: { onDisabled: () => void }) {
    const { delete: deleteAction, processing } = useForm({});

    const handleDisable = () => {
        deleteAction(disable.url(), {
            preserveScroll: true,
            onSuccess: () => onDisabled(),
        });
    };

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={handleDisable}
            disabled={processing}
        >
            {processing ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <ShieldOff className="size-4" />
            )}
            Disable 2FA
        </Button>
    );
}
