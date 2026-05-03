import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Check, MapPin, Pencil, Share2 } from 'lucide-react';
import { useState } from 'react';

import type { ProfileBadge } from '@/components/profile/profile-badges';
import { ProfileBadges } from '@/components/profile/profile-badges';
import { ProfilePrivate } from '@/components/profile/profile-private';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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

function ProfileOverviewCard({
    profileUser,
    isOwner,
}: {
    profileUser: ProfileUser;
    isOwner: boolean;
}) {
    const getInitials = useInitials();
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${profileUser.name}'s Profile — Crypter`,
                    url,
                });

                return;
            } catch {
                // User cancelled the share sheet.
            }
        }

        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="sticky top-24">
            <CardHeader className="space-y-4">
                <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
                    <Avatar className="size-28 rounded-full ring-4 ring-card sm:size-32">
                        <AvatarImage
                            src={profileUser.avatar ?? undefined}
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
                                ).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                })}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isOwner && (
                        <Badge
                            variant={
                                profileUser.profile_visibility === 'private'
                                    ? 'secondary'
                                    : 'outline'
                            }
                        >
                            {profileUser.profile_visibility === 'private'
                                ? 'Profil pribadi'
                                : 'Profil publik'}
                        </Badge>
                    )}

                    {isOwner && (
                        <Button asChild variant="outline" size="sm">
                            <Link href="/settings/profile/">
                                <Pencil className="size-4" />
                                Edit profil
                            </Link>
                        </Button>
                    )}

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={handleShare}
                                    className="shrink-0"
                                >
                                    {copied ? (
                                        <Check className="size-4" />
                                    ) : (
                                        <Share2 className="size-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {copied ? 'Tautan disalin!' : 'Bagikan profil'}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                {profileUser.bio && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {profileUser.bio}
                    </p>
                )}

                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {profileUser.pronoun && <span>{profileUser.pronoun}</span>}
                    {profileUser.location && (
                        <span className="inline-flex items-center gap-2">
                            <MapPin className="size-3.5 shrink-0" />
                            {profileUser.location}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
