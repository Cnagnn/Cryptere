import { Form } from '@inertiajs/react';

import { update } from '@/actions/App/Http/Controllers/Settings/PasswordController';
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

export function PasswordSettingsCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                    Change your account password with your current password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form
                    action={update.url()}
                    method="put"
                    resetOnSuccess={[
                        'current_password',
                        'password',
                        'password_confirmation',
                    ]}
                    className="grid gap-4"
                >
                    {({ errors, processing, recentlySuccessful }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="current_password">
                                    Current password
                                </Label>
                                <Input
                                    id="current_password"
                                    name="current_password"
                                    type="password"
                                    autoComplete="current-password"
                                />
                                {errors.current_password && (
                                    <p className="text-sm text-destructive">
                                        {errors.current_password}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        New password
                                    </Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-destructive">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Confirm password
                                    </Label>
                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                {recentlySuccessful && (
                                    <p className="text-sm text-muted-foreground">
                                        Password updated.
                                    </p>
                                )}
                                <Button type="submit" disabled={processing}>
                                    Update password
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}
