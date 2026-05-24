import { Link } from '@inertiajs/react';
import { CalendarDays, Check, MapPin, Pencil, Share2 } from 'lucide-react';
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
        <Card className="sticky top-24">
            <CardHeader className="space-y-4">
                <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
                    <Avatar className="size-28 rounded-none sm:size-32">
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
                                ? 'Private profile'
                                : 'Public profile'}
                        </Badge>
                    )}

                    {isOwner && editHref && (
                        <Button asChild variant="outline" size="sm">
                            <Link href={editHref}>
                                <Pencil className="size-4" />
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
                                {copied ? 'Link copied' : 'Share profile'}
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
