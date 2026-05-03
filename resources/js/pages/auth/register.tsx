import { Form, Head, Link } from '@inertiajs/react';
import {
    AtSign,
    CheckCircle2,
    LoaderCircle,
    Lock,
    LockKeyhole,
    Mail,
    XCircle,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import PasswordInput from '@/components/password-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { redirect as socialRedirect } from '@/routes/social';

interface SocialUser {
    provider: string;
    email: string;
    name: string;
    avatar: string | null;
    nickname: string | null;
}

interface Props {
    status?: string;
    socialUser?: SocialUser | null;
}

function slugifyUsername(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9._]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 255);
}

function capitalizeProvider(provider: string): string {
    return provider === 'github'
        ? 'GitHub'
        : provider.charAt(0).toUpperCase() + provider.slice(1);
}

export default function Register({ status, socialUser }: Props) {
    const isSocialRegistration = Boolean(socialUser);
    const [username, setUsername] = useState(() =>
        socialUser?.name ? slugifyUsername(socialUser.name) : '',
    );
    const [password, setPassword] = useState('');
    const [usernameAvailability, setUsernameAvailability] = useState<
        'available' | 'taken' | null
    >(null);

    const getPasswordStrength = (pass: string) => {
        if (!pass) {
            return 0;
        }

        let score = 0;

        if (pass.length >= 8) {
            score += 1;
        }

        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) {
            score += 1;
        }

        if (/\d/.test(pass)) {
            score += 1;
        }

        if (/[^A-Za-z0-9]/.test(pass)) {
            score += 1;
        }

        return score;
    };

    const strength = getPasswordStrength(password);

    const getStrengthBarColor = (score: number) => {
        if (score <= 1) {
            return '[&_[data-slot=progress-indicator]]:bg-red-500';
        }

        if (score === 2) {
            return '[&_[data-slot=progress-indicator]]:bg-amber-500';
        }

        return '[&_[data-slot=progress-indicator]]:bg-emerald-500';
    };

    const usernameStatus = useMemo<
        'idle' | 'short' | 'checking' | 'available' | 'taken'
    >(() => {
        if (!username) {
            return 'idle';
        }

        if (username.trim().length < 4) {
            return 'short';
        }

        return usernameAvailability ?? 'checking';
    }, [username, usernameAvailability]);

    useEffect(() => {
        if (!username || username.trim().length < 4) {
            return;
        }

        const timer = setTimeout(() => {
            fetch(
                `/api/users/check-username?username=${encodeURIComponent(username)}`,
            )
                .then((res) => res.json())
                .then((data) => {
                    setUsernameAvailability(
                        data.available ? 'available' : 'taken',
                    );
                })
                .catch(() => setUsernameAvailability(null));
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    return (
        <>
            <Head title="Daftar" />

            <div className="flex min-h-screen items-center justify-center bg-background px-4 py-4 lg:h-screen">
                <Card className="mx-auto w-full max-w-sm">
                    <CardHeader>
                        <div>
                            <img
                                src="/images/Logo/Logomark.svg"
                                alt="Crypter"
                                className="h-11 w-auto"
                            />
                        </div>
                        <CardTitle className="text-2xl">Daftar</CardTitle>
                    </CardHeader>

                    <CardContent>
                        {status && (
                            <Alert className="mb-4 text-center">
                                <AlertDescription>{status}</AlertDescription>
                            </Alert>
                        )}

                        <Form
                            {...store.form()}
                            resetOnSuccess={[
                                'password',
                                'password_confirmation',
                            ]}
                            disableWhileProcessing
                            className="grid gap-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <Input
                                        type="hidden"
                                        name="name"
                                        value={username.trim()}
                                    />

                                    {!isSocialRegistration && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    asChild
                                                >
                                                    <a
                                                        href={socialRedirect.url(
                                                            'google',
                                                        )}
                                                    >
                                                        <svg
                                                            viewBox="0 0 24 24"
                                                            className="size-4"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            aria-hidden="true"
                                                        >
                                                            <path
                                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                                fill="#4285F4"
                                                            />
                                                            <path
                                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                                fill="#34A853"
                                                            />
                                                            <path
                                                                d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z"
                                                                fill="#FBBC05"
                                                            />
                                                            <path
                                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.53 7.79-4.53z"
                                                                fill="#EA4335"
                                                            />
                                                        </svg>
                                                        Google
                                                    </a>
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    asChild
                                                >
                                                    <a
                                                        href={socialRedirect.url(
                                                            'github',
                                                        )}
                                                    >
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
                                                <span className="shrink-0 text-sm text-muted-foreground">
                                                    atau daftar dengan
                                                </span>
                                                <Separator className="flex-1" />
                                            </div>
                                        </>
                                    )}

                                    <div className="grid grid-cols-1 gap-3">
                                        <Field
                                            data-invalid={Boolean(errors.name)}
                                        >
                                            <FieldLabel
                                                htmlFor="username"
                                                className="flex items-center"
                                            >
                                                Username{' '}
                                                <span className="ml-1 text-destructive">
                                                    *
                                                </span>
                                                <div className="ml-auto flex items-center">
                                                    {usernameStatus ===
                                                        'short' && (
                                                        <span className="flex items-center gap-1 text-sm text-destructive">
                                                            <XCircle className="size-3" />{' '}
                                                            Terlalu pendek
                                                        </span>
                                                    )}
                                                    {usernameStatus ===
                                                        'checking' && (
                                                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <LoaderCircle className="size-3 animate-spin" />{' '}
                                                            Memeriksa...
                                                        </span>
                                                    )}
                                                    {usernameStatus ===
                                                        'available' && (
                                                        <span className="flex items-center gap-1 text-sm text-foreground">
                                                            <CheckCircle2 className="size-3" />{' '}
                                                            Tersedia
                                                        </span>
                                                    )}
                                                    {usernameStatus ===
                                                        'taken' && (
                                                        <span className="flex items-center gap-1 text-sm text-destructive">
                                                            <XCircle className="size-3" />{' '}
                                                            Username sudah
                                                            digunakan
                                                        </span>
                                                    )}
                                                </div>
                                            </FieldLabel>
                                            <div className="relative">
                                                <AtSign className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="username"
                                                    type="text"
                                                    required
                                                    minLength={4}
                                                    autoFocus
                                                    tabIndex={1}
                                                    autoComplete="username"
                                                    name="username"
                                                    placeholder="username"
                                                    className={`pl-9 ${['taken', 'short'].includes(usernameStatus) ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                                    value={username}
                                                    aria-invalid={
                                                        Boolean(errors.name) ||
                                                        undefined
                                                    }
                                                    onChange={(e) => {
                                                        const val =
                                                            e.currentTarget.value.replace(
                                                                /[^a-zA-Z0-9._]/g,
                                                                '',
                                                            );
                                                        setUsernameAvailability(
                                                            null,
                                                        );
                                                        setUsername(val);
                                                    }}
                                                />
                                            </div>
                                            {errors.name && (
                                                <p className="text-sm text-destructive">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </Field>
                                        <Field
                                            data-invalid={Boolean(errors.email)}
                                        >
                                            <FieldLabel
                                                htmlFor="email"
                                                className="flex items-center"
                                            >
                                                Email{' '}
                                                <span className="ml-1 text-destructive">
                                                    *
                                                </span>
                                                {isSocialRegistration && (
                                                    <Badge
                                                        variant="ghost"
                                                        className="ml-auto gap-1"
                                                    >
                                                        Terverifikasi via{' '}
                                                        {socialUser!
                                                            .provider ===
                                                        'google' ? (
                                                            <svg
                                                                viewBox="0 0 24 24"
                                                                className="size-3"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                aria-hidden="true"
                                                            >
                                                                <path
                                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                                    fill="#4285F4"
                                                                />
                                                                <path
                                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                                    fill="#34A853"
                                                                />
                                                                <path
                                                                    d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z"
                                                                    fill="#FBBC05"
                                                                />
                                                                <path
                                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.53 7.79-4.53z"
                                                                    fill="#EA4335"
                                                                />
                                                            </svg>
                                                        ) : (
                                                            <svg
                                                                viewBox="0 0 24 24"
                                                                className="size-3"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="currentColor"
                                                                aria-hidden="true"
                                                            >
                                                                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                                                            </svg>
                                                        )}
                                                        {capitalizeProvider(
                                                            socialUser!
                                                                .provider,
                                                        )}
                                                    </Badge>
                                                )}
                                            </FieldLabel>
                                            <div className="relative">
                                                {isSocialRegistration ? (
                                                    <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                ) : (
                                                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                )}
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="email"
                                                    name="email"
                                                    placeholder="email@domain.com"
                                                    className={`pl-9 ${isSocialRegistration ? 'cursor-not-allowed bg-muted text-muted-foreground' : ''}`}
                                                    aria-invalid={
                                                        Boolean(errors.email) ||
                                                        undefined
                                                    }
                                                    readOnly={
                                                        isSocialRegistration
                                                    }
                                                    defaultValue={
                                                        socialUser?.email ?? ''
                                                    }
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="text-sm text-destructive">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </Field>
                                    </div>

                                    <Field
                                        data-invalid={Boolean(errors.password)}
                                    >
                                        <FieldLabel htmlFor="password">
                                            Kata Sandi{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>{' '}
                                        </FieldLabel>
                                        <PasswordInput
                                            id="password"
                                            required
                                            tabIndex={4}
                                            autoComplete="new-password"
                                            name="password"
                                            placeholder="Gunakan kata sandi yang kuat"
                                            aria-invalid={
                                                Boolean(errors.password) ||
                                                undefined
                                            }
                                            icon={<Lock className="size-4" />}
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(
                                                    event.currentTarget.value,
                                                )
                                            }
                                        />
                                        {errors.password && (
                                            <p className="text-sm text-destructive">
                                                {errors.password}
                                            </p>
                                        )}

                                        {/* Password Strength Indicator */}
                                        {password.length > 0 && (
                                            <div className="mt-1">
                                                <Progress
                                                    value={strength * 25}
                                                    className={`h-1.5 bg-muted/60 transition-colors ${getStrengthBarColor(strength)}`}
                                                    aria-label="Password strength"
                                                />
                                            </div>
                                        )}
                                        <Input
                                            type="hidden"
                                            name="password_confirmation"
                                            value={password}
                                        />
                                    </Field>

                                    <div className="flex items-start gap-2">
                                        <Checkbox
                                            id="terms"
                                            name="terms"
                                            tabIndex={6}
                                            required
                                            className="mt-0.5"
                                        />
                                        <FieldLabel
                                            htmlFor="terms"
                                            className="cursor-pointer leading-snug font-normal"
                                        >
                                            <span>
                                                Saya setuju dengan{' '}
                                                <Link
                                                    href="#"
                                                    className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                                                >
                                                    Ketentuan Layanan
                                                </Link>{' '}
                                                dan{' '}
                                                <Link
                                                    href="#"
                                                    className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                                                >
                                                    Kebijakan Privasi
                                                </Link>
                                            </span>
                                        </FieldLabel>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        tabIndex={7}
                                        data-test="register-user-button"
                                        disabled={processing}
                                    >
                                        {processing && (
                                            <LoaderCircle className="mr-2 -ml-1 size-4 animate-spin" />
                                        )}
                                        Daftar
                                    </Button>

                                    <div className="text-center text-sm">
                                        Sudah punya akun?{' '}
                                        <Link
                                            href={login()}
                                            tabIndex={8}
                                            className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                                        >
                                            Masuk
                                        </Link>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Register.layout = (page: React.ReactNode) => page;
