import { Head } from '@inertiajs/react';
import {
    Image,
    Link2,
    Palette,
    ShieldCheck,
    Trash2,
    UserRound,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
    ProfileMiniIdentity,
    ProfileShell,
} from '@/features/profile/profile-shell';
import { AccountDeleteCard } from '@/features/settings/account-delete-card';
import { AppearanceSettingsCard } from '@/features/settings/appearance-settings-card';
import { AvatarSettingsCard } from '@/features/settings/avatar-settings-card';
import { PasswordSettingsCard } from '@/features/settings/password-settings-card';
import { ProfileSettingsForm } from '@/features/settings/profile-settings-form';
import { SocialAccountsCard } from '@/features/settings/social-accounts-card';
import { TwoFactorSettingsCard } from '@/features/settings/two-factor-settings-card';
import type { AvatarOption, ProfileUser, SocialAccount } from '@/types/profile';

type Props = {
    profileUser: ProfileUser;
    isOwner: boolean;
    isPrivate: boolean;
    avatarOptions: AvatarOption;
    canManageTwoFactor?: boolean;
    twoFactorEnabled?: boolean;
    requiresConfirmation?: boolean;
    socialAccounts?: SocialAccount[];
    hasPassword?: boolean;
};

export default function ProfileSettings({
    profileUser,
    isOwner,
    avatarOptions,
    canManageTwoFactor = false,
    twoFactorEnabled = false,
    requiresConfirmation = false,
    socialAccounts = [],
    hasPassword = false,
}: Props) {
    const pageTitle = `Settings ${profileUser.name}`;

    return (
        <>
            <Head title={pageTitle} />

            <ProfileShell
                profileUser={profileUser}
                isOwner={isOwner}
                active="settings"
            >
                <header className="mb-8 max-w-2xl">
                    <h1 className="text-2xl font-semibold">Account settings</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage your profile, privacy, security, and display
                        preferences.
                    </p>
                </header>

                <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
                    <aside className="lg:sticky lg:top-20 lg:self-start">
                        <div className="mb-4 border-b pb-4">
                            <ProfileMiniIdentity profileUser={profileUser} />
                            <Badge
                                variant="secondary"
                                className="mt-3 capitalize"
                            >
                                {profileUser.profile_visibility ?? 'private'}{' '}
                                profile
                            </Badge>
                        </div>
                        <nav
                            aria-label="Settings sections"
                            className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1"
                        >
                            {settingsSections.map((section) => (
                                <a
                                    key={section.id}
                                    href={section.href}
                                    className="flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <section.icon className="size-4" />
                                    {section.label}
                                </a>
                            ))}
                        </nav>
                    </aside>

                    <div className="flex min-w-0 flex-col gap-8">
                        <section id="profile" className="scroll-mt-24">
                            <ProfileSettingsForm profileUser={profileUser} />
                        </section>

                        <section id="avatar" className="scroll-mt-24">
                            <AvatarSettingsCard
                                profileUser={profileUser}
                                avatarOptions={avatarOptions}
                            />
                        </section>

                        <section
                            id="security"
                            className="grid scroll-mt-24 gap-6 xl:grid-cols-2"
                        >
                            <PasswordSettingsCard />
                            {canManageTwoFactor && (
                                <TwoFactorSettingsCard
                                    enabled={twoFactorEnabled}
                                    requiresConfirmation={requiresConfirmation}
                                />
                            )}
                        </section>

                        <section id="connections" className="scroll-mt-24">
                            <SocialAccountsCard
                                socialAccounts={socialAccounts}
                                hasPassword={hasPassword}
                            />
                        </section>

                        <section id="appearance" className="scroll-mt-24">
                            <AppearanceSettingsCard />
                        </section>

                        <section id="danger-zone" className="scroll-mt-24">
                            <AccountDeleteCard />
                        </section>
                    </div>
                </div>
            </ProfileShell>
        </>
    );
}

const settingsSections = [
    { id: 'profile', href: '#profile', label: 'Profile', icon: UserRound },
    { id: 'avatar', href: '#avatar', label: 'Avatar', icon: Image },
    { id: 'security', href: '#security', label: 'Security', icon: ShieldCheck },
    {
        id: 'connections',
        href: '#connections',
        label: 'Connections',
        icon: Link2,
    },
    {
        id: 'appearance',
        href: '#appearance',
        label: 'Appearance',
        icon: Palette,
    },
    {
        id: 'danger-zone',
        href: '#danger-zone',
        label: 'Danger zone',
        icon: Trash2,
    },
] as const;
