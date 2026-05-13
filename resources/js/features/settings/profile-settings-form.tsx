import { Form } from '@inertiajs/react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ProfileUser, ProfileVisibility } from '@/types/profile';

export function ProfileSettingsForm({
    profileUser,
}: {
    profileUser: ProfileUser;
}) {
    const [visibility, setVisibility] = useState<ProfileVisibility>(
        profileUser.profile_visibility ?? 'private',
    );

    return (
        <Card id="edit-profile">
            <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                    Update the public information shown on your profile.
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
                                    defaultValue={profileUser.username ?? ''}
                                    autoComplete="username"
                                />
                                {errors.username && (
                                    <p className="text-sm text-destructive">
                                        {errors.username}
                                    </p>
                                )}
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
                                        defaultValue={profileUser.location ?? ''}
                                    />
                                    {errors.location && (
                                        <p className="text-sm text-destructive">
                                            {errors.location}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="profile_visibility">
                                    Profile visibility
                                </Label>
                                <input
                                    type="hidden"
                                    name="profile_visibility"
                                    value={visibility}
                                />
                                <Select
                                    value={visibility}
                                    onValueChange={(value) => {
                                        if (
                                            value === 'public' ||
                                            value === 'private'
                                        ) {
                                            setVisibility(value);
                                        }
                                    }}
                                >
                                    <SelectTrigger id="profile_visibility">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">
                                            Public
                                        </SelectItem>
                                        <SelectItem value="private">
                                            Private
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.profile_visibility && (
                                    <p className="text-sm text-destructive">
                                        {errors.profile_visibility}
                                    </p>
                                )}
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
