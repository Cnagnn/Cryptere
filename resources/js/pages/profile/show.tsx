import { Head } from '@inertiajs/react';
import { Lock } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProfileBadges } from '@/features/profile/profile-badges';
import { ProfileOverviewCard } from '@/features/profile/profile-overview-card';
import { useInitials } from '@/hooks/use-initials';
import { edit as settingsProfileEdit } from '@/routes/settings/profile';
import type { ProfileBadge, ProfileUser } from '@/types/profile';

type Props = {
    profileUser: ProfileUser;
    isOwner: boolean;
    isPrivate: boolean;
    badges: ProfileBadge[];
    mustVerifyEmail?: boolean;
    status?: string;
};

export default function ProfileShow({
    profileUser,
    isOwner,
    isPrivate,
    badges,
}: Props) {
    const pageTitle = isOwner ? 'Profil Saya' : `Profil ${profileUser.name}`;

    if (isPrivate) {
        return (
            <>
                <Head title={pageTitle} />
                <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                    <ProfilePrivate user={profileUser} />
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={pageTitle} />

            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid gap-6 lg:grid-cols-10">
                    <div className="lg:col-span-3">
                        <ProfileOverviewCard
                            profileUser={profileUser}
                            isOwner={isOwner}
                            editHref={settingsProfileEdit.url()}
                        />
                    </div>

                    <div className="lg:col-span-7">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lencana</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ProfileBadges badges={badges} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

function ProfilePrivate({ user }: { user: ProfileUser }) {
    const getInitials = useInitials();

    return (
        <Card className="overflow-hidden">
            <CardHeader className="gap-4 text-center">
                <Avatar className="mx-auto size-20 rounded-full ring-4 ring-card">
                    <AvatarImage
                        src={user.avatar ?? undefined}
                        alt={user.name}
                    />
                    <AvatarFallback className="bg-muted text-xl font-semibold text-foreground">
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                    <CardTitle>{user.name}</CardTitle>
                    {user.username && (
                        <p className="text-sm text-muted-foreground">
                            @{user.username}
                        </p>
                    )}
                </div>
            </CardHeader>
            <Separator />
            <CardContent>
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                    <div className="flex size-16 items-center justify-center rounded-lg bg-muted">
                        <Lock className="size-7 text-muted-foreground" />
                    </div>
                    <div className="flex max-w-xs flex-col gap-1.5">
                        <p className="text-base font-semibold">
                            This profile is private
                        </p>
                        <p className="text-sm text-muted-foreground">
                            This user has chosen to keep their profile private.
                            Only they can see their full profile details.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
