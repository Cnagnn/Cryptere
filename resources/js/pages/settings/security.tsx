import { Head } from '@inertiajs/react';

import { PasswordSettingsCard } from '@/features/settings/password-settings-card';
import { TwoFactorSettingsCard } from '@/features/settings/two-factor-settings-card';

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
                <PasswordSettingsCard />

                {canManageTwoFactor && (
                    <TwoFactorSettingsCard
                        enabled={twoFactorEnabled}
                        requiresConfirmation={requiresConfirmation}
                    />
                )}
            </div>
        </>
    );
}
