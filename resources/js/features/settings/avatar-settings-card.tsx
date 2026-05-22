import { Form } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import {
    destroy,
    pixabot,
    update,
} from '@/actions/App/Http/Controllers/Settings/AvatarController';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AvatarOption, ProfileUser } from '@/types/profile';

export function AvatarSettingsCard({
    profileUser,
    avatarOptions,
}: {
    profileUser: ProfileUser;
    avatarOptions: AvatarOption;
}) {
    const [visibleCount, setVisibleCount] = useState(96);
    const [query, setQuery] = useState('');

    const filteredAvatarIds = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return normalizedQuery === ''
            ? avatarOptions.ids
            : avatarOptions.ids.filter((avatarId) =>
                  avatarId.includes(normalizedQuery),
              );
    }, [avatarOptions, query]);

    const visibleAvatarIds = useMemo(
        () => filteredAvatarIds.slice(0, visibleCount),
        [filteredAvatarIds, visibleCount],
    );

    const avatarUrl = (avatarId: string) =>
        `${avatarOptions.baseUrl.replace(/\/$/, '')}/${avatarId}.webp`;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Avatar</CardTitle>
                <CardDescription>
                    Choose a Pixabots character for your profile. Custom
                    uploads are still available when you need one.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="flex items-center gap-3">
                    <Avatar data-size="lg">
                        <AvatarImage src={profileUser.avatar ?? undefined} />
                        <AvatarFallback>
                            {profileUser.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="text-sm font-medium">
                            Current avatar
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {profileUser.has_custom_avatar
                                ? 'Custom upload'
                                : profileUser.pixabot_avatar_id
                                  ? `Pixabot ${profileUser.pixabot_avatar_id}`
                                  : 'Default Pixabot'}
                        </p>
                    </div>
                </div>

                <div className="grid gap-3">
                    <div className="grid gap-2">
                        <Label htmlFor="pixabot-search">
                            Pixabots gallery
                        </Label>
                        <Input
                            id="pixabot-search"
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                setVisibleCount(96);
                            }}
                            placeholder="Search avatar ID"
                        />
                    </div>

                    <div className="grid max-h-80 grid-cols-6 gap-2 overflow-y-auto rounded-md border p-2 sm:grid-cols-8">
                        {visibleAvatarIds.map((avatarId) => {
                            const selected =
                                profileUser.pixabot_avatar_id === avatarId;

                            return (
                                <Form
                                    key={avatarId}
                                    action={pixabot.url()}
                                    method="patch"
                                >
                                    {({ processing }) => (
                                        <>
                                            <input
                                                type="hidden"
                                                name="pixabot_avatar_id"
                                                value={avatarId}
                                            />
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                title={`Choose Pixabot ${avatarId}`}
                                                className={`aspect-square w-full rounded-md border p-1 transition hover:border-primary hover:bg-muted ${
                                                    selected
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-transparent'
                                                }`}
                                            >
                                                <img
                                                    src={avatarUrl(avatarId)}
                                                    alt={`Pixabot ${avatarId}`}
                                                    loading="lazy"
                                                    className="size-full rounded object-cover"
                                                />
                                            </button>
                                        </>
                                    )}
                                </Form>
                            );
                        })}
                    </div>

                    {visibleAvatarIds.length < filteredAvatarIds.length && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setVisibleCount((count) => count + 96)
                            }
                        >
                            Load more avatars
                        </Button>
                    )}
                </div>

                <Form
                    action={update.url()}
                    method="patch"
                    encType="multipart/form-data"
                    resetOnSuccess={['avatar']}
                    className="grid gap-3"
                >
                    {({ errors, processing, recentlySuccessful }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="avatar">Avatar image</Label>
                                <Input
                                    id="avatar"
                                    name="avatar"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                />
                                {errors.avatar && (
                                    <p className="text-sm text-destructive">
                                        {errors.avatar}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                {recentlySuccessful && (
                                    <p className="text-sm text-muted-foreground">
                                        Uploaded.
                                    </p>
                                )}
                                <Button type="submit" disabled={processing}>
                                    Upload avatar
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                {profileUser.has_custom_avatar && (
                    <Form action={destroy.url()} method="delete">
                        {({ processing }) => (
                            <Button
                                type="submit"
                                variant="outline"
                                disabled={processing}
                                className="w-full"
                            >
                                Remove avatar
                            </Button>
                        )}
                    </Form>
                )}
            </CardContent>
        </Card>
    );
}
