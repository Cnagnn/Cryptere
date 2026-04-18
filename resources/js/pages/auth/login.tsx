import { Form, Head, Link } from '@inertiajs/react';
import { AtSign, LoaderCircle, Lock } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import PasswordInput from '@/components/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    canResetPassword,
    canRegister,
    status,
}: Props) {
    const failedSignInMessage = 'Sign in failed. Check credentials or reset password.';
    const [identifier, setIdentifier] = useState('');

    const identifierHint = useMemo(() => {
        if (identifier.includes('@')) {
            return 'Detected email format. Use your full email address.';
        }

        if (identifier.length > 0) {
            return 'Detected username format. You can use @username or plain username.';
        }

        return 'Use your work email or username.';
    }, [identifier]);

    return (
        <>
            <Head title="Sign In" />

            <div className="flex min-h-screen items-center justify-center bg-background px-4 py-4 lg:h-screen">
                <Card className="mx-auto w-full max-w-sm">
                    <CardHeader>
                        <div className="mb-2">
                            <img
                                src="/images/Logo/Logomark.svg"
                                alt="Crypter"
                                className="h-11 w-auto"
                            />
                        </div>
                        <CardTitle className="text-2xl">Sign In</CardTitle>
                    </CardHeader>

                    <CardContent>
                        {status && (
                            <Alert className="mb-4 text-center">
                                <AlertDescription>{status}</AlertDescription>
                            </Alert>
                        )}

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="grid gap-4"
                        >
                            {({ processing, errors }) => {
                                const authFailureError = errors.email === failedSignInMessage ? errors.email : undefined;

                                return (
                                    <>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" className="w-full" asChild>
                                            <a href="/auth/google/redirect">
                                                <svg viewBox="0 0 24 24" className="size-4" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                                    <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/>
                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.53 7.79-4.53z" fill="#EA4335"/>
                                                </svg>
                                                Google
                                            </a>
                                        </Button>

                                        <Button variant="outline" className="w-full" asChild>
                                            <a href="/auth/github/redirect">
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    className="size-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="currentColor"
                                                    aria-hidden="true"
                                                >
                                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                                </svg>
                                                GitHub
                                            </a>
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Separator className="flex-1" />
                                        <span className="text-muted-foreground shrink-0 text-sm">
                                            or continue with
                                        </span>
                                        <Separator className="flex-1" />
                                    </div>

                                    <Field data-invalid={Boolean(authFailureError ? undefined : errors.email)}>
                                        <FieldLabel htmlFor="email">Email or Username</FieldLabel>
                                        <div className="relative">
                                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                            <Input
                                                id="email"
                                                type="text"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="username"
                                                placeholder="email@domain.com or @username"
                                                className="pl-9"
                                                value={identifier}
                                                aria-invalid={Boolean(authFailureError ? undefined : errors.email) || undefined}
                                                onChange={(event) => setIdentifier(event.target.value)}
                                            />
                                        </div>
                                        <p className="text-sm text-muted-foreground">{identifierHint}</p>
                                        {authFailureError ? null : (errors.email && <p className="text-sm text-destructive">{errors.email}</p>)}
                                    </Field>

                                    <Field data-invalid={Boolean(errors.password)}>
                                        <div className="flex flex-wrap items-center justify-between gap-1">
                                            <FieldLabel htmlFor="password">Password</FieldLabel>
                                            {canResetPassword && (
                                                <Link
                                                    href={request()}
                                                    className="inline-block text-sm text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                                                    tabIndex={4}
                                                >
                                                    Forgot password?
                                                </Link>
                                            )}
                                        </div>
                                        <PasswordInput
                                            id="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            aria-invalid={Boolean(errors.password) || undefined}
                                            icon={<Lock className="size-4" />}
                                        />
                                        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                                    </Field>

                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                        />
                                        <FieldLabel
                                            htmlFor="remember"
                                            className="font-normal cursor-pointer"
                                        >
                                            Keep me signed in
                                        </FieldLabel>
                                    </div>

                                    {authFailureError && <p className="-mt-1 text-sm text-destructive">{authFailureError}</p>}

                                    <div className="flex flex-col gap-3 mt-4">
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            tabIndex={5}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing && (
                                                <LoaderCircle className="size-4 animate-spin -ml-1 mr-2" />
                                            )}
                                            Sign In
                                        </Button>
                                    </div>

                                    {canRegister && (
                                        <div className="mt-4 text-center text-sm">
                                            Don't have an account?{' '}
                                            <Link
                                                href={register()}
                                                tabIndex={6}
                                                className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                                            >
                                                Sign Up
                                            </Link>
                                        </div>
                                    )}
                                    </>
                                );
                            }}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Login.layout = (page: React.ReactNode) => page;
