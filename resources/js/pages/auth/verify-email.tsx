// Components
import { Form, Head, Link } from '@inertiajs/react';
import { store as send } from '@/actions/Laravel/Fortify/Http/Controllers/EmailVerificationNotificationController';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <Alert className="mb-4 text-center">
                    <AlertDescription>
                        A new verification link has been sent to the email
                        address you provided during registration.
                    </AlertDescription>
                </Alert>
            )}

            <Form {...send.form()} className="flex flex-col gap-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            Resend verification email
                        </Button>

                        <Link
                            href={logout()}
                            className="mx-auto block text-sm text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                        >
                            Log out
                        </Link>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verify email',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};
