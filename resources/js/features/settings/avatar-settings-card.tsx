import { Form } from '@inertiajs/react';

import {
    destroy,
    update,
} from '@/actions/App/Http/Controllers/Settings/AvatarController';
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
import type { ProfileUser } from '@/types/profile';

export function AvatarSettingsCard({
    profileUser,
}: {
    profileUser: ProfileUser;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Avatar</CardTitle>
                <CardDescription>
                    Upload a square JPG, PNG, or WebP image up to 2 MB.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
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

                {profileUser.avatar && (
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
