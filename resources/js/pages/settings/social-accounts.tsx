import { Head } from '@inertiajs/react';

import type { SocialAccount } from '@/components/settings/social-accounts-card';
import { SocialAccountsCard } from '@/components/settings/social-accounts-card';

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
