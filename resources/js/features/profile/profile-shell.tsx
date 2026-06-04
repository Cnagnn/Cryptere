import { Link } from '@inertiajs/react';
import { Settings, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    show as profileShow,
    settings as profileSettings,
} from '@/routes/profile';
import type { ProfileUser } from '@/types/profile';

type ProfileShellProps = PropsWithChildren<{
    profileUser: ProfileUser;
    isOwner: boolean;
    active: 'profile' | 'settings';
}>;

export function ProfileShell({
    profileUser,
    isOwner,
    active,
    children,
}: ProfileShellProps) {
    const username = profileUser.username ?? '';

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between gap-4 border-b">
                <nav
                    aria-label="Profile sections"
                    className="flex min-w-0 items-center gap-1"
                >
                    <Button
                        asChild
                        variant="ghost"
                        className="h-11 rounded-none border-b-2 border-transparent px-3 data-[active=true]:border-primary data-[active=true]:text-foreground"
                        data-active={active === 'profile'}
                    >
                        <Link href={profileShow.url(username)}>
                            <User data-icon="inline-start" />
                            Profile
                        </Link>
                    </Button>

                    {isOwner && (
                        <Button
                            asChild
                            variant="ghost"
                            className="h-11 rounded-none border-b-2 border-transparent px-3 data-[active=true]:border-primary data-[active=true]:text-foreground"
                            data-active={active === 'settings'}
                        >
                            <Link href={profileSettings.url(username)}>
                                <Settings data-icon="inline-start" />
                                Settings
                            </Link>
                        </Button>
                    )}
                </nav>
            </div>

            <main>{children}</main>
        </div>
    );
}

export function ProfileMiniIdentity({
    profileUser,
}: {
    profileUser: ProfileUser;
}) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10 rounded-full">
                <AvatarImage src={profileUser.avatar ?? undefined} />
                <AvatarFallback className="text-sm">
                    {profileUser.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                    {profileUser.name}
                </p>
                {profileUser.username && (
                    <p className="truncate text-xs text-muted-foreground">
                        @{profileUser.username}
                    </p>
                )}
            </div>
        </div>
    );
}
