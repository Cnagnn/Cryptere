import { Form } from '@inertiajs/react';
import { Globe2, Lock } from 'lucide-react';
import { useState } from 'react';

import { update } from '@/actions/App/Http/Controllers/Settings/ProfileController';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ProfileUser, ProfileVisibility } from '@/types/profile';

export function ProfileSettingsForm({
    profileUser,
}: {
    profileUser: ProfileUser;
}) {
    const [visibility, setVisibility] = useState<ProfileVisibility>(
        profileUser.profile_visibility ?? 'private',
    );
    const [username, setUsername] = useState(profileUser.username ?? '');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile details</CardTitle>
                <CardDescription>
                    Control who can view your profile and update the information
                    shown there.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form
                    action={update.url()}
                    method="patch"
                    setDefaultsOnSuccess
                    className="grid gap-4"
                >
                    {({ errors, processing, recentlySuccessful }) => (
                        <>
                            <fieldset className="grid gap-3">
                                <legend className="text-sm font-medium">
                                    Profile visibility
                                </legend>
                                <input
                                    type="hidden"
                                    name="profile_visibility"
                                    value={visibility}
                                />
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <VisibilityChoice
                                        title="Public profile"
                                        description="Anyone can view your profile and find it in search."
                                        icon={Globe2}
                                        selected={visibility === 'public'}
                                        onClick={() => setVisibility('public')}
                                    />
                                    <VisibilityChoice
                                        title="Private profile"
                                        description="Only you can view your complete profile."
                                        icon={Lock}
                                        selected={visibility === 'private'}
                                        onClick={() => setVisibility('private')}
                                    />
                                </div>
                                {errors.profile_visibility && (
                                    <p className="text-sm text-destructive">
                                        {errors.profile_visibility}
                                    </p>
                                )}
                            </fieldset>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Display name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        defaultValue={profileUser.name}
                                        autoComplete="name"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        value={username}
                                        onChange={(event) =>
                                            setUsername(
                                                event.currentTarget.value
                                                    .replace(
                                                        /[^a-zA-Z0-9._]/g,
                                                        '',
                                                    )
                                                    .toLowerCase(),
                                            )
                                        }
                                        autoComplete="username"
                                    />
                                    {errors.username && (
                                        <p className="text-sm text-destructive">
                                            {errors.username}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={profileUser.email ?? ''}
                                    autoComplete="email"
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea
                                    id="bio"
                                    name="bio"
                                    defaultValue={profileUser.bio ?? ''}
                                    maxLength={500}
                                    rows={4}
                                />
                                {errors.bio && (
                                    <p className="text-sm text-destructive">
                                        {errors.bio}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="pronoun">Pronoun</Label>
                                    <Input
                                        id="pronoun"
                                        name="pronoun"
                                        defaultValue={profileUser.pronoun ?? ''}
                                        maxLength={30}
                                    />
                                    {errors.pronoun && (
                                        <p className="text-sm text-destructive">
                                            {errors.pronoun}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        name="location"
                                        defaultValue={
                                            profileUser.location ?? ''
                                        }
                                    />
                                    {errors.location && (
                                        <p className="text-sm text-destructive">
                                            {errors.location}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                {recentlySuccessful && (
                                    <p className="text-sm text-muted-foreground">
                                        Saved.
                                    </p>
                                )}
                                <Button type="submit" disabled={processing}>
                                    Save profile
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

function VisibilityChoice({
    title,
    description,
    icon: Icon,
    selected,
    onClick,
}: {
    title: string;
    description: string;
    icon: typeof Globe2;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={cn(
                'flex min-h-28 items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-muted/50',
            )}
        >
            <span
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted',
                    selected && 'bg-primary text-primary-foreground',
                )}
            >
                <Icon className="size-4" />
            </span>
            <span className="grid gap-1">
                <span className="font-medium">{title}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                    {description}
                </span>
            </span>
        </button>
    );
}
