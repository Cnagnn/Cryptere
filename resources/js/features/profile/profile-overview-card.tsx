import { Link } from '@inertiajs/react';
import { CalendarDays, Check, Eye, MapPin, Pencil, Share2 } from 'lucide-react';
import { useState } from 'react';

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
        <Card className="sticky top-24 overflow-hidden border-0 bg-foreground text-background shadow-xl">
            <CardHeader className="gap-5 p-7">
                <div className="flex justify-end">
                    {isOwner && (
                        <Badge className="bg-background text-foreground">
                            {profileUser.profile_visibility === 'private'
                                ? 'Private profile'
                                : 'Public profile'}
                        </Badge>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                    <Avatar className="size-28 rounded-full border-4 border-background/10 sm:size-32">
                        <AvatarImage
                            src={profileUser.avatar ?? undefined}
                            alt={profileUser.name}
                        />
                        <AvatarFallback className="bg-background text-2xl font-semibold text-foreground sm:text-3xl">
                            {getInitials(profileUser.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-3xl leading-tight">
                            {profileUser.name}
                        </CardTitle>
                        {profileUser.username && (
                            <p className="text-sm text-background/70">
                                @{profileUser.username}
                            </p>
                        )}
                        {profileUser.created_at && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-background/70">
                                <CalendarDays className="shrink-0" />
                                Joined{' '}
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
            </CardHeader>

            <CardContent className="flex flex-col gap-5 border-t border-background/15 p-7">
                {profileUser.bio && (
                    <p className="text-sm leading-relaxed text-background/80">
                        {profileUser.bio}
                    </p>
                )}

                <div className="flex flex-col gap-2 text-sm text-background/80">
                    {profileUser.pronoun && <span>{profileUser.pronoun}</span>}
                    {profileUser.location && (
                        <span className="inline-flex items-center gap-2">
                            <MapPin className="shrink-0" />
                            {profileUser.location}
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                    {isOwner && editHref && (
                        <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="rounded-full"
                        >
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
                                    variant="secondary"
                                    size="icon-sm"
                                    onClick={handleShare}
                                    className="rounded-full"
                                >
                                    {copied ? <Check /> : <Share2 />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {copied ? 'Link copied' : 'Share profile'}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {isOwner && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon-sm"
                            className="rounded-full"
                            disabled
                        >
                            <Eye />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
