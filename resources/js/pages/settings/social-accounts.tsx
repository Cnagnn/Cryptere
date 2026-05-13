import { Head } from '@inertiajs/react';

import { SocialAccountsCard } from '@/features/settings/social-accounts-card';
import type { SocialAccount } from '@/types/profile';

type Props = {
    socialAccounts: SocialAccount[];
    hasPassword: boolean;
    errors?: Record<string, string>;
};

export default function SettingsSocialAccounts({
    socialAccounts,
    hasPassword,
    errors,
}: Props) {
    return (
        <>
            <Head title="Akun Terhubung" />

            <div className="flex flex-col gap-6">
                <SocialAccountsCard
                    socialAccounts={socialAccounts}
                    hasPassword={hasPassword}
                    errors={errors}
                />
            </div>
        </>
    );
}
