import { useForm } from '@inertiajs/react';
import { Loader2, Save } from 'lucide-react';
import type { FormEventHandler } from 'react';

import { update } from '@/actions/App/Http/Controllers/Settings/SecurityController';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';

export function PasswordCard() {
    const {
        data,
        setData,
        put,
        errors,
        processing,
        recentlySuccessful,
        reset,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(update.url(), {
            onSuccess: () => reset(),
            preserveScroll: true,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Update Password</CardTitle>
                <CardDescription>
                    Use a strong, unique password to protect your account.
                </CardDescription>
            </CardHeader>

            <form onSubmit={submit}>
                <CardContent className="flex flex-col gap-4">
                    <Field>
                        <FieldLabel htmlFor="current_password">
                            Current Password
                        </FieldLabel>
                        <PasswordInput
                            id="current_password"
                            value={data.current_password}
                            onChange={(e) =>
                                setData('current_password', e.target.value)
                            }
                            autoComplete="current-password"
                            placeholder="Enter current password"
                        />
                        <FieldError>{errors.current_password}</FieldError>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="password">New Password</FieldLabel>
                        <PasswordInput
                            id="password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            autoComplete="new-password"
                            placeholder="Enter new password"
                        />
                        <FieldError>{errors.password}</FieldError>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="password_confirmation">
                            Confirm Password
                        </FieldLabel>
                        <PasswordInput
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            autoComplete="new-password"
                            placeholder="Confirm new password"
                        />
                        <FieldError>{errors.password_confirmation}</FieldError>
                    </Field>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t pt-6">
                    <div>
                        {recentlySuccessful && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                                Password updated.
                            </p>
                        )}
                    </div>
                    <Button type="submit" disabled={processing}>
                        {processing ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Save className="size-4" />
                        )}
                        Update Password
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
