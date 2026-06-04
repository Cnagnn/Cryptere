import { router } from '@inertiajs/react';
import { Settings, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    const handleTabChange = (value: string): void => {
        if (value === active) {
            return;
        }

        router.visit(
            value === 'settings'
                ? profileSettings.url(username)
                : profileShow.url(username),
        );
    };

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex justify-center">
                <Tabs value={active} onValueChange={handleTabChange}>
                    <TabsList aria-label="Profile sections">
                        <TabsTrigger value="profile">
                            <User className="size-4" />
                            Profile
                        </TabsTrigger>

                        {isOwner && (
                            <TabsTrigger value="settings">
                                <Settings className="size-4" />
                                Settings
                            </TabsTrigger>
                        )}
                    </TabsList>
                </Tabs>
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
