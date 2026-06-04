import { Link } from '@inertiajs/react';
import { CalendarDays, Check, MapPin, Pencil, Share2 } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import type { ProfileUser } from '@/types/profile';

type ProfileOverviewCardProps = {
    profileUser: ProfileUser;
    isOwner: boolean;
    editHref?: string;
    profileUrl?: string;
};

export function ProfileOverviewCard({
    profileUser,
    isOwner,
    editHref,
    profileUrl,
}: ProfileOverviewCardProps) {
    const getInitials = useInitials();
    const [copied, setCopied] = useState(false);

    const handleShare = async (): Promise<void> => {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') {
            return;
        }

        const shareUrl = profileUrl ?? window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${profileUser.name}'s Profile - Crypter`,
                    url: shareUrl,
                });

                return;
            } catch {
                // User cancelled the share sheet.
            }
        }

        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card>
            <CardHeader className="gap-5">
                <div className="flex justify-end">
                    {isOwner && (
                        <Badge variant="secondary">
                            {profileUser.profile_visibility === 'private'
                                ? 'Private profile'
                                : 'Public profile'}
                        </Badge>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
                    <Avatar className="size-28 rounded-full ring-1 ring-foreground/10">
                        <AvatarImage
                            src={profileUser.avatar ?? undefined}
                            alt={profileUser.name}
                        />
                        <AvatarFallback className="bg-muted text-xl font-semibold text-foreground">
                            {getInitials(profileUser.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex min-w-0 flex-col gap-1">
                        <CardTitle className="text-2xl leading-tight">
                            {profileUser.name}
                        </CardTitle>
                        {profileUser.username && (
                            <p className="text-sm text-muted-foreground">
                                @{profileUser.username}
                            </p>
                        )}
                        {profileUser.pronoun && (
                            <p className="text-sm font-medium">
                                {profileUser.pronoun}
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                {profileUser.bio && (
                    <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                        {profileUser.bio}
                    </p>
                )}

                {(profileUser.created_at || profileUser.location) && (
                    <Separator />
                )}

                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {profileUser.created_at && (
                        <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="size-4 shrink-0" />
                            Joined{' '}
                            {new Date(
                                profileUser.created_at,
                            ).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                            })}
                        </span>
                    )}
                    {profileUser.location && (
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-4 shrink-0" />
                            {profileUser.location}
                        </span>
                    )}
                </div>
            </CardContent>

            <CardFooter className="gap-2">
                {isOwner && editHref && (
                    <Button asChild variant="outline" size="sm">
                        <Link href={editHref}>
                            <Pencil data-icon="inline-start" />
                            Edit profile
                        </Link>
                    </Button>
                )}

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                onClick={handleShare}
                            >
                                {copied ? <Check /> : <Share2 />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {copied ? 'Link copied' : 'Share profile'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardFooter>
        </Card>
    );
}
