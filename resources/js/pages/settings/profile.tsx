import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { store as send } from '@/actions/Laravel/Fortify/Http/Controllers/EmailVerificationNotificationController';
import DeleteUser from '@/components/delete-user';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { TypographyLarge, TypographyMuted } from '@/components/ui/typography';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<{ auth: Auth }>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-0.5">
                    <TypographyLarge className="text-base font-medium leading-snug">
                        Profile information
                    </TypographyLarge>
                    <TypographyMuted className="text-sm/6">
                        Update your name and email address
                    </TypographyMuted>
                </div>

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field data-invalid={Boolean(errors.name)}>
                                <FieldLabel htmlFor="name">Name</FieldLabel>

                                <Input
                                    id="name"
                                    className="block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                    aria-invalid={Boolean(errors.name) || undefined}
                                />

                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </Field>

                            <Field data-invalid={Boolean(errors.email)}>
                                <FieldLabel htmlFor="email">Email address</FieldLabel>

                                <Input
                                    id="email"
                                    type="email"
                                    className="block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                    aria-invalid={Boolean(errors.email) || undefined}
                                />

                                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                            </Field>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                                            >
                                                Click here to resend the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <Alert className="mt-2">
                                                <AlertDescription>
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
