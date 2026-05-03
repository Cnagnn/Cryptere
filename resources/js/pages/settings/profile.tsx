import { Head, Link } from '@inertiajs/react';
import {
    CalendarDays,
    KeyRound,
    MapPin,
    Pencil,
    Share2,
    Users,
} from 'lucide-react';

import { AppearanceTabs } from '@/components/appearance-tabs';
import type { ProfileBadge } from '@/components/profile/profile-badges';
import { ProfileBadges } from '@/components/profile/profile-badges';
import { PasswordCard } from '@/components/settings/password-card';
import type { SocialAccount } from '@/components/settings/social-accounts-card';
import { SocialAccountsCard } from '@/components/settings/social-accounts-card';
import { TwoFactorCard } from '@/components/settings/two-factor-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInitials } from '@/hooks/use-initials';

type ProfileUser = {
    id?: number;
    name: string;
    username: string | null;
    email?: string | null;
    avatar?: string | null;
    bio?: string | null;
    pronoun?: string | null;
    location?: string | null;
    profile_visibility?: 'public' | 'private';
    created_at?: string;
};

type Props = {
    profileUser: ProfileUser;
    badges: ProfileBadge[];
    mustVerifyEmail?: boolean;
    status?: string;
    // Security props
    canManageTwoFactor?: boolean;
    twoFactorEnabled?: boolean;
    requiresConfirmation?: boolean;
    // Social accounts props
    socialAccounts?: SocialAccount[];
    hasPassword?: boolean;
};

export default function SettingsProfile({
    profileUser,
    badges,
    mustVerifyEmail,
    status,
    canManageTwoFactor = false,
    twoFactorEnabled = false,
    requiresConfirmation = false,
    socialAccounts = [],
    hasPassword = true,
}: Props) {
    const getInitials = useInitials();

    return (
        <>
            <Head title="Pengaturan Profil" />

            <Tabs defaultValue="profile" className="w-full">
                {/* Centered tabs at the top */}
                <div className="flex justify-center">
                    <TabsList>
                        <TabsTrigger value="profile">
                            <Users className="size-4" />
                            Profil
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <KeyRound className="size-4" />
                            Pengaturan
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Profile tab */}
                <TabsContent value="profile" className="mt-6">
                    <div className="grid gap-6 lg:grid-cols-10">
                        <div className="lg:col-span-3">
                            <Card className="sticky top-24">
                                <CardHeader className="space-y-4">
                                    <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
                                        <Avatar className="size-28 rounded-full ring-4 ring-card sm:size-32">
                                            <AvatarImage
                                                src={
                                                    profileUser.avatar ??
                                                    undefined
                                                }
                                                alt={profileUser.name}
                                            />
                                            <AvatarFallback className="bg-muted text-2xl font-semibold text-foreground sm:text-3xl">
                                                {getInitials(profileUser.name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex flex-col gap-1">
                                            <CardTitle className="text-2xl">
                                                {profileUser.name}
                                            </CardTitle>
                                            {profileUser.username && (
                                                <p className="text-sm text-muted-foreground">
                                                    @{profileUser.username}
                                                </p>
                                            )}
                                            {profileUser.created_at && (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <CalendarDays className="size-3.5 shrink-0" />
                                                    Bergabung{' '}
                                                    {new Date(
                                                        profileUser.created_at,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            year: 'numeric',
                                                            month: 'long',
                                                        },
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="flex-9"
                                            asChild
                                        >
                                            <Link href="#edit-profile">
                                                <Pencil className="size-3.5" />
                                                Edit Profil
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    window.location.origin +
                                                        '/profile/' +
                                                        (profileUser.username ??
                                                            profileUser.id),
                                                );
                                            }}
                                        >
                                            <Share2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex flex-col gap-4">
                                    {profileUser.bio && (
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {profileUser.bio}
                                        </p>
                                    )}

                                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                        {profileUser.pronoun && (
                                            <span>{profileUser.pronoun}</span>
                                        )}
                                        {profileUser.location && (
                                            <span className="inline-flex items-center gap-2">
                                                <MapPin className="size-3.5 shrink-0" />
                                                {profileUser.location}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-7">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Lencana publik</CardTitle>
                                    <CardDescription>
                                        Lencana ini terlihat di profil publik
                                        Anda.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ProfileBadges badges={badges} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Settings tab - one-page scroll with all sections inline */}
                <TabsContent value="settings" className="mt-6">
                    <div className="mx-auto flex max-w-2xl flex-col gap-6">
                        {/* Appearance section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tampilan</CardTitle>
                                <CardDescription>
                                    Pilih tema yang Anda sukai untuk antarmuka.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AppearanceTabs />
                            </CardContent>
                        </Card>

                        {/* Security section */}
                        <PasswordCard />

                        {canManageTwoFactor && (
                            <TwoFactorCard
                                enabled={twoFactorEnabled}
                                requiresConfirmation={requiresConfirmation}
                            />
                        )}

                        {/* Connected accounts section */}
                        <SocialAccountsCard
                            socialAccounts={socialAccounts}
                            hasPassword={hasPassword}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
}
