import { Head } from '@inertiajs/react';

import { PasswordCard } from '@/components/settings/password-card';
import { TwoFactorCard } from '@/components/settings/two-factor-card';

type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function SettingsSecurity({
    canManageTwoFactor = false,
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: Props) {
    return (
        <>
            <Head title="Pengaturan Keamanan" />

            <div className="flex flex-col gap-6">
                <PasswordCard />
                {canManageTwoFactor && (
                    <TwoFactorCard
                        enabled={twoFactorEnabled}
                        requiresConfirmation={requiresConfirmation}
                    />
                )}
            </div>
        </>
    );
}
