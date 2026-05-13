import { Head } from '@inertiajs/react';

import { ProfileBadges } from '@/features/profile/profile-badges';
import { ProfileOverviewCard } from '@/features/profile/profile-overview-card';
import { AccountDeleteCard } from '@/features/settings/account-delete-card';
import { AvatarSettingsCard } from '@/features/settings/avatar-settings-card';
import { ProfileSettingsForm } from '@/features/settings/profile-settings-form';
import { edit as settingsProfileEdit } from '@/routes/settings/profile';
import type { ProfileBadge, ProfileUser, SocialAccount } from '@/types/profile';

type Props = {
    profileUser: ProfileUser;
    profileUrl: string;
    badges: ProfileBadge[];
    mustVerifyEmail?: boolean;
    status?: string;
    canManageTwoFactor?: boolean;
    twoFactorEnabled?: boolean;
    requiresConfirmation?: boolean;
    socialAccounts?: SocialAccount[];
    hasPassword?: boolean;
};

export default function SettingsProfile({
    profileUser,
    profileUrl,
    badges,
}: Props) {
    return (
        <>
            <Head title="Pengaturan Profil" />

            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="flex flex-col gap-6">
                    <ProfileOverviewCard
                        profileUser={profileUser}
                        isOwner
                        editHref={`${settingsProfileEdit.url()}#edit-profile`}
                        profileUrl={profileUrl}
                    />
                    <AvatarSettingsCard profileUser={profileUser} />
                </div>

                <div className="flex flex-col gap-6">
                    <ProfileSettingsForm profileUser={profileUser} />

                    {badges.length > 0 && (
                        <section className="grid gap-3">
                            <h2 className="text-base font-semibold">
                                Public badges
                            </h2>
                            <ProfileBadges badges={badges} />
                        </section>
                    )}

                    <AccountDeleteCard />
                </div>
            </div>
        </>
    );
}
