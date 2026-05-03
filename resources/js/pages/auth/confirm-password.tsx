import { Form, Head } from '@inertiajs/react';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <>
            <Head title="Konfirmasi Kata Sandi" />

            <Form {...store.form()} resetOnSuccess={['password']}>
                {({ processing, errors }) => (
                    <div className="flex flex-col gap-6">
                        <Field data-invalid={Boolean(errors.password)}>
                            <FieldLabel htmlFor="password">
                                Kata Sandi
                            </FieldLabel>
                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder="Kata Sandi"
                                autoComplete="current-password"
                                autoFocus
                                aria-invalid={
                                    Boolean(errors.password) || undefined
                                }
                            />

                            {errors.password && (
                                <p className="text-sm text-destructive">
                                    {errors.password}
                                </p>
                            )}
                        </Field>

                        <div className="flex items-center">
                            <Button
                                className="w-full"
                                disabled={processing}
                                data-test="confirm-password-button"
                            >
                                {processing && <Spinner />}
                                Konfirmasi Kata Sandi
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </>
    );
}

ConfirmPassword.layout = {
    title: 'Konfirmasi Kata Sandi Anda',
    description:
        'Ini adalah area aman dari aplikasi. Silakan konfirmasi kata sandi Anda sebelum melanjutkan.',
};
