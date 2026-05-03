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
            <Head title="Verifikasi Email" />

            {status === 'verification-link-sent' && (
                <Alert className="mb-4 text-center">
                    <AlertDescription>
                        Tautan verifikasi baru telah dikirim ke alamat email
                        yang Anda berikan saat pendaftaran.
                    </AlertDescription>
                </Alert>
            )}

            <Form {...send.form()} className="flex flex-col gap-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            Kirim Ulang Email Verifikasi
                        </Button>

                        <Link
                            href={logout()}
                            className="mx-auto block text-sm text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                        >
                            Keluar
                        </Link>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verifikasi Email',
    description:
        'Silakan verifikasi alamat email Anda dengan mengklik tautan yang baru saja kami kirimkan kepada Anda.',
};
