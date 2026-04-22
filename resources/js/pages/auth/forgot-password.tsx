// Components
import { Form, Head, Link } from '@inertiajs/react';
import { LoaderCircle, Mail, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Forgot Password" />

            <div className="flex min-h-screen items-center justify-center bg-background py-4 lg:h-screen">
                <Card className="mx-auto w-full max-w-sm">
                    <CardHeader>
                        <div className="mb-2">
                            <img
                                src="/images/Logo/Logomark.svg"
                                alt="Crypter"
                                className="h-11 w-auto"
                            />
                        </div>
                        <CardTitle className="text-2xl">Forgot Password</CardTitle>
                        <CardDescription>
                            Enter your email address and we'll send you instructions to reset your password.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {status && (
                            <Alert className="mb-4 text-center">
                                <AlertDescription>{status}</AlertDescription>
                            </Alert>
                        )}

                        <Form {...email.form()} className="flex flex-col gap-6">
                            {({ processing, errors, wasSuccessful }) => {
                                const isSuccess = Boolean(status || wasSuccessful);

                                return (
                                <>
                                    <Field data-invalid={Boolean(errors.email)}>
                                        <FieldLabel htmlFor="email">
                                            Email address
                                        </FieldLabel>

                                        <div className="relative">
                                            <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 transform" />
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                autoComplete="email"
                                                autoFocus
                                                placeholder="email@domain.com"
                                                aria-invalid={Boolean(errors.email) || undefined}
                                                className="w-full pl-9"
                                                disabled={isSuccess}
                                            />
                                        </div>

                                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                                    </Field>

                                    <Button
                                        className="w-full"
                                        disabled={processing || isSuccess}
                                        data-test="email-password-reset-link-button"
                                        variant={isSuccess ? "outline" : "default"}
                                    >
                                        {processing && (
                                            <LoaderCircle className="size-4 animate-spin -ml-1 mr-2" />
                                        )}
                                        {isSuccess && !processing && (
                                            <CheckCircle2 className="-ml-1 mr-2 size-4 text-foreground" />
                                        )}
                                        {isSuccess
                                            ? 'Terkirim ke Email anda (jika cocok)'
                                            : 'Send Reset Instructions'}
                                    </Button>
                                </>
                                );
                            }}
                        </Form>
                    </CardContent>

                    <CardFooter className="justify-center">
                        <p className="text-sm">
                            Already have an account?{' '}
                            <Link
                                href={login()}
                                className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                            >
                                Log in
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}

ForgotPassword.layout = (page: React.ReactNode) => page;
