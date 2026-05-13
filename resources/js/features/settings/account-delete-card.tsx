import { Form } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';

import { destroy } from '@/actions/App/Http/Controllers/Settings/ProfileController';
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

export function AccountDeleteCard() {
    return (
        <Card className="border-destructive/30">
            <CardHeader>
                <CardTitle>Delete Account</CardTitle>
                <CardDescription>
                    Permanently remove your account and profile data.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form
                    action={destroy.url()}
                    method="delete"
                    resetOnError={['password']}
                    className="grid gap-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="delete_password">
                                    Current password
                                </Label>
                                <Input
                                    id="delete_password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={processing}
                                className="justify-self-end"
                            >
                                <Trash2 className="size-4" />
                                Delete account
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}
