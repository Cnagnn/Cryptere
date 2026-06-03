import { Head } from '@inertiajs/react';
import { Lock, Plus, Sparkles } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { ProfileBadges } from '@/features/profile/profile-badges';
import { ProfileOverviewCard } from '@/features/profile/profile-overview-card';
import { ProfileShell } from '@/features/profile/profile-shell';
import { useInitials } from '@/hooks/use-initials';
import { settings as profileSettings } from '@/routes/profile';
import type { ProfileBadge, ProfileUser } from '@/types/profile';

type Props = {
    profileUser: ProfileUser;
    isOwner: boolean;
    isPrivate: boolean;
    badges: ProfileBadge[];
    mustVerifyEmail?: boolean;
    status?: string;
    profileUrl?: string;
};

export default function ProfileShow({
    profileUser,
    isOwner,
    isPrivate,
    badges,
    profileUrl,
}: Props) {
    const pageTitle = isOwner ? 'Profil Saya' : `Profil ${profileUser.name}`;
    const settingsHref = profileUser.username
        ? profileSettings.url(profileUser.username)
        : undefined;

    if (isPrivate) {
        return (
            <>
                <Head title={pageTitle} />
                <div className="mx-auto w-full max-w-4xl px-4 pt-6 pb-4 sm:px-6 lg:px-8">
                    <ProfilePrivate user={profileUser} />
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={pageTitle} />

            <ProfileShell
                profileUser={profileUser}
                isOwner={isOwner}
                active="profile"
            >
                <div className="grid gap-6 lg:grid-cols-10">
                    <div className="lg:col-span-3">
                        <ProfileOverviewCard
                            profileUser={profileUser}
                            isOwner={isOwner}
                            editHref={settingsHref}
                            profileUrl={profileUrl}
                        />
                    </div>

                    <div className="flex flex-col gap-6 lg:col-span-7">
                        <ProfileContent badges={badges} />
                        <ProfileInterests badges={badges} />
                    </div>
                </div>
            </ProfileShell>
        </>
    );
}

function ProfileContent({ badges }: { badges: ProfileBadge[] }) {
    return (
        <Card className="border-0 bg-background/95 shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-4">
                <div>
                    <CardTitle>Badges</CardTitle>
                    <CardDescription>
                        Earned milestones and learning achievements.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <ProfileBadges badges={badges} />
            </CardContent>
        </Card>
    );
}

function ProfileInterests({ badges }: { badges: ProfileBadge[] }) {
    const categories = Array.from(
        new Set(badges.map((badge) => badge.category)),
    )
        .filter(Boolean)
        .slice(0, 5);

    return (
        <Card className="border-0 bg-foreground text-background shadow-xl">
            <CardContent className="flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
                        <Sparkles />
                    </div>
                    <div className="grid gap-2">
                        <h2 className="text-2xl font-semibold">
                            Your crypto interests
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <Badge
                                        key={category}
                                        className="bg-background text-foreground"
                                    >
                                        {category}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-background/70">
                                    Complete courses and labs to shape this
                                    profile.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    disabled
                >
                    <Plus data-icon="inline-start" />
                    Add interests
                </Button>
            </CardContent>
        </Card>
    );
}

function ProfilePrivate({ user }: { user: ProfileUser }) {
    const getInitials = useInitials();

    return (
        <Card className="overflow-hidden">
            <CardHeader className="gap-4 text-center">
                <Avatar className="mx-auto size-20 rounded-none">
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
