import { Head } from '@inertiajs/react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileOverviewCard } from '@/features/profile/profile-overview-card';
import { ProfileShell } from '@/features/profile/profile-shell';
import { AccountDeleteCard } from '@/features/settings/account-delete-card';
import { AppearanceSettingsCard } from '@/features/settings/appearance-settings-card';
import { AvatarSettingsCard } from '@/features/settings/avatar-settings-card';
import { PasswordSettingsCard } from '@/features/settings/password-settings-card';
import { ProfileSettingsForm } from '@/features/settings/profile-settings-form';
import { SocialAccountsCard } from '@/features/settings/social-accounts-card';
import { TwoFactorSettingsCard } from '@/features/settings/two-factor-settings-card';
import { settings as profileSettings } from '@/routes/profile';
import type {
    AvatarOption,
    ProfileBadge,
    ProfileUser,
    SocialAccount,
} from '@/types/profile';

type Props = {
    profileUser: ProfileUser;
    isOwner: boolean;
    isPrivate: boolean;
    badges: ProfileBadge[];
    avatarOptions: AvatarOption;
    profileUrl: string;
    canManageTwoFactor?: boolean;
    twoFactorEnabled?: boolean;
    requiresConfirmation?: boolean;
    socialAccounts?: SocialAccount[];
    hasPassword?: boolean;
};

export default function ProfileSettings({
    profileUser,
    isOwner,
    badges,
    avatarOptions,
    profileUrl,
    canManageTwoFactor = false,
    twoFactorEnabled = false,
    requiresConfirmation = false,
    socialAccounts = [],
    hasPassword = false,
}: Props) {
    const pageTitle = `Settings ${profileUser.name}`;
    const settingsHref = profileUser.username
        ? profileSettings.url(profileUser.username)
        : undefined;

    return (
        <>
            <Head title={pageTitle} />

            <ProfileShell
                profileUser={profileUser}
                isOwner={isOwner}
                active="settings"
            >
                <div className="grid gap-6 lg:grid-cols-10">
                    <div className="flex flex-col gap-6 lg:col-span-3">
                        <ProfileOverviewCard
                            profileUser={profileUser}
                            isOwner={isOwner}
                            editHref={settingsHref}
                            profileUrl={profileUrl}
                        />
                        <AvatarSettingsCard
                            profileUser={profileUser}
                            avatarOptions={avatarOptions}
                        />
                    </div>

                    <div className="flex flex-col gap-6 lg:col-span-7">
                        <ProfileSettingsForm profileUser={profileUser} />
                        <div className="grid gap-6 xl:grid-cols-2">
                            <PasswordSettingsCard />
                            {canManageTwoFactor && (
                                <TwoFactorSettingsCard
                                    enabled={twoFactorEnabled}
                                    requiresConfirmation={requiresConfirmation}
                                />
                            )}
                        </div>
                        <SocialAccountsCard
                            socialAccounts={socialAccounts}
                            hasPassword={hasPassword}
                        />
                        <AppearanceSettingsCard />
                        {badges.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Public badges</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {badges.slice(0, 8).map((badge) => (
                                            <Badge
                                                key={badge.id}
                                                variant="secondary"
                                            >
                                                {badge.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        <AccountDeleteCard />
                    </div>
                </div>
            </ProfileShell>
        </>
    );
}
