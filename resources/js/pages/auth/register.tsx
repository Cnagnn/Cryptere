import { Form, Head, Link } from '@inertiajs/react';
import {
    AtSign,
    CheckCircle2,
    Eye,
    EyeOff,
    LoaderCircle,
    Lock,
    LockKeyhole,
    Mail,
    Monitor,
    Moon,
    Sun,
    User,
    XCircle,
} from 'lucide-react';
import type { ComponentProps, ReactNode, Ref } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { login, privacy, terms } from '@/routes';
import { store } from '@/routes/register';
import { redirect as socialRedirect } from '@/routes/social';
import { checkEmail, checkUsername } from '@/routes/users';

function PasswordInput({
    className,
    ref,
    icon,
    ...props
}: Omit<ComponentProps<'input'>, 'type'> & {
    ref?: Ref<HTMLInputElement>;
    icon?: ReactNode;
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <InputGroup>
            {icon ? (
                <InputGroupAddon align="inline-start">{icon}</InputGroupAddon>
            ) : null}

            <InputGroupInput
                type={showPassword ? 'text' : 'password'}
                className={cn(className)}
                ref={ref}
                {...props}
            />

            <InputGroupAddon align="inline-end">
                <InputGroupButton
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                    }
                    tabIndex={-1}
                >
                    {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
            </InputGroupAddon>
        </InputGroup>
    );
}

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
    const { appearance, updateAppearance } = useAppearance();
    const isSocialRegistration = Boolean(socialUser);
    const [username, setUsername] = useState(() =>
        socialUser?.name ? slugifyUsername(socialUser.name) : '',
    );
    const [password, setPassword] = useState('');
    const [usernameAvailability, setUsernameAvailability] = useState<
        'available' | 'taken' | null
    >(null);
    const [email, setEmail] = useState(() => socialUser?.email ?? '');
    const [emailAvailability, setEmailAvailability] = useState<
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

    const emailStatus = useMemo<
        'idle' | 'invalid' | 'checking' | 'available' | 'taken'
    >(() => {
        if (!email) {
            return 'idle';
        }

        if (email.length < 5 || !email.includes('@') || !email.includes('.')) {
            return 'invalid';
        }

        return emailAvailability ?? 'checking';
    }, [email, emailAvailability]);

    useEffect(() => {
        if (!username || username.trim().length < 4) {
            return;
        }

        const timer = setTimeout(() => {
            fetch(checkUsername.url({ query: { username } }))
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

    useEffect(() => {
        if (isSocialRegistration) {
            return;
        }

        if (
            !email ||
            email.length < 5 ||
            !email.includes('@') ||
            !email.includes('.')
        ) {
            return;
        }

        const timer = setTimeout(() => {
            fetch(checkEmail.url({ query: { email } }))
                .then((res) => res.json())
                .then((data) => {
                    setEmailAvailability(
                        data.available ? 'available' : 'taken',
                    );
                })
                .catch(() => setEmailAvailability(null));
        }, 500);

        return () => clearTimeout(timer);
    }, [email, isSocialRegistration]);

    return (
        <>
            <Head title="Daftar" />

            <div className="flex min-h-screen items-center justify-center bg-background px-4 py-4 lg:h-screen">
                <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
                    <div
                        className="flex items-center justify-center select-none"
                        aria-label="Cryptere"
                    >
                        <svg
                            viewBox="0 0 203 51"
                            xmlns="http://www.w3.org/2000/svg"
                            role="img"
                            aria-hidden="true"
                            onContextMenu={(event) => event.preventDefault()}
                            onDragStart={(event) => event.preventDefault()}
                            className="pointer-events-auto h-11 w-auto"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M5.53117 1.60618C4.66159 0.905113 3.50574 0.804068 2.54612 1.34525C1.5865 1.88643 0.987916 2.97682 1.00019 4.16132C1.09112 12.9259 1.25306 28.5232 1.32189 35.1561C1.34264 37.16 2.0724 39.0764 3.35689 40.5001C5.41092 42.7769 8.58118 46.2909 10.5866 48.5138C11.7865 49.8439 13.4157 50.6004 15.1206 50.6191C22.0847 50.696 40.9086 50.9037 49.6201 50.9999C50.2228 51.0066 50.7583 50.5786 50.9379 49.9469C51.1174 49.3151 50.8987 48.6287 50.3995 48.2577C46.666 45.4829 41.1268 41.3661 38.4841 39.402C37.5005 38.6711 36.3402 38.2804 35.1526 38.2804H20.4005C18.7488 38.2804 17.1662 37.552 16.0081 36.2588C14.85 34.9656 14.2133 33.2158 14.241 31.4023C14.2415 31.3751 14.2419 31.348 14.2423 31.3207C14.2995 27.5856 17.0733 24.5905 20.4753 24.5905C23.3468 24.5905 26.7124 24.5905 29.373 24.5905C30.0344 24.5905 30.6208 24.1239 30.8267 23.4338C31.0326 22.7438 30.8114 21.9865 30.2783 21.5568C24.1739 16.6355 12.1324 6.92805 5.53117 1.60618Z"
                                className="fill-[#2816FF] dark:fill-[#A6A6A6]"
                            />
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M4.53117 0.606182C3.66159 -0.094887 2.50574 -0.195932 1.54612 0.34525C0.586495 0.886432 -0.0120842 1.97682 0.000185082 3.16132C0.0911224 11.9259 0.253058 27.5232 0.321892 34.1561C0.342642 36.16 1.0724 38.0764 2.35689 39.5001C4.41092 41.7769 7.58118 45.2909 9.58659 47.5138C10.7865 48.8439 12.4157 49.6004 14.1206 49.6191C21.0847 49.696 39.9086 49.9037 48.6201 49.9999C49.2228 50.0066 49.7583 49.5786 49.9379 48.9469C50.1174 48.3151 49.8987 47.6287 49.3995 47.2577C45.666 44.4829 40.1268 40.3661 37.4841 38.402C36.5005 37.6711 35.3402 37.2804 34.1526 37.2804H19.4005C17.7488 37.2804 16.1662 36.552 15.0081 35.2588C13.85 33.9656 13.2133 32.2158 13.241 30.4023C13.2415 30.3751 13.2419 30.348 13.2423 30.3207C13.2995 26.5856 16.0733 23.5905 19.4753 23.5905C22.3468 23.5905 25.7124 23.5905 28.373 23.5905C29.0344 23.5905 29.6208 23.1239 29.8267 22.4338C30.0326 21.7438 29.8114 20.9865 29.2783 20.5568C23.1739 15.6355 11.1324 5.92805 4.53117 0.606182Z"
                                className="fill-[#0170FF] dark:fill-white"
                            />
                            <path
                                d="M75.48 14.92L72.48 19.28L71.32 18.52C69.88 17.6133 68.2533 17.16 66.44 17.16C63.7733 17.16 61.5467 18.0667 59.76 19.88C57.9733 21.6933 57.08 23.9467 57.08 26.64C57.08 29.3867 57.96 31.68 59.72 33.52C61.5067 35.3333 63.7333 36.24 66.4 36.24C67.0133 36.24 67.6267 36.1867 68.24 36.08C68.88 35.9467 69.44 35.7733 69.92 35.56C70.4267 35.32 70.8533 35.0933 71.2 34.88C71.5467 34.6667 71.9733 34.36 72.48 33.96L75.4 38.36C74.6533 38.92 74.0533 39.3333 73.6 39.6C73.1733 39.8667 72.6933 40.12 72.16 40.36C70.08 41.2133 67.9067 41.64 65.64 41.64C61.4267 41.64 57.9467 40.24 55.2 37.44C52.4533 34.64 51.08 31.0667 51.08 26.72C51.08 22.4267 52.4933 18.84 55.32 15.96C58.1467 13.08 61.6667 11.64 65.88 11.64C66.8667 11.64 67.7733 11.72 68.6 11.88C69.4533 12.0133 70.3333 12.2533 71.24 12.6C72.1467 12.92 72.8133 13.2 73.24 13.44C73.6667 13.68 74.4133 14.1733 75.48 14.92ZM77.5022 41V21.36H83.2622V24.68C83.6089 23.4533 84.2489 22.5067 85.1822 21.84C86.1155 21.1733 87.3022 20.84 88.7422 20.84C89.0889 20.84 89.3822 20.8533 89.6222 20.88C89.8889 20.9067 90.2355 20.9733 90.6622 21.08L89.6222 26.64C88.9022 26.4533 88.2222 26.36 87.5822 26.36C86.1955 26.36 85.0889 26.8533 84.2622 27.84C83.8889 28.2933 83.6222 28.7867 83.4622 29.32C83.3289 29.8267 83.2622 30.5333 83.2622 31.44V41H77.5022ZM88.3712 21.36H94.4913L97.9713 30.8C98.0513 31.0933 98.1446 31.4 98.2513 31.72C98.3579 32.0133 98.4379 32.3067 98.4913 32.6C98.5446 32.8933 98.5979 33.2267 98.6513 33.6C98.7313 33.9467 98.7713 34.3067 98.7713 34.68L99.1313 32.6L99.6513 30.84L103.091 21.36H109.291L100.611 42.44L100.131 43.48C99.6513 44.5733 99.2646 45.36 98.9713 45.84C98.7046 46.32 98.3846 46.7733 98.0113 47.2C97.4779 47.7333 96.7313 48.1733 95.7713 48.52C94.8113 48.8667 93.8379 49.04 92.8513 49.04C91.7579 49.04 90.6913 48.8533 89.6513 48.48L90.5713 43.68C91.1846 43.9467 91.7713 44.08 92.3313 44.08C93.1846 44.08 93.8379 43.8267 94.2913 43.32C94.7446 42.8133 95.2646 41.7067 95.8513 40L88.3712 21.36ZM109.692 48.48V21.36H115.452V24.32C116.492 22 118.505 20.84 121.492 20.84C124.132 20.84 126.278 21.7867 127.932 23.68C129.585 25.5733 130.412 28.04 130.412 31.08C130.412 34.1733 129.572 36.6933 127.892 38.64C126.212 40.5867 124.038 41.56 121.372 41.56C118.545 41.56 116.572 40.4533 115.452 38.24V48.48H109.692ZM120.052 25.68C118.585 25.68 117.398 26.1867 116.492 27.2C115.585 28.2133 115.132 29.5467 115.132 31.2C115.132 32.88 115.585 34.24 116.492 35.28C117.398 36.32 118.598 36.84 120.092 36.84C121.505 36.84 122.652 36.3333 123.532 35.32C124.438 34.28 124.892 32.9467 124.892 31.32C124.892 29.6667 124.438 28.32 123.532 27.28C122.652 26.2133 121.492 25.68 120.052 25.68ZM131.044 26.12V21.36H133.964V16.48H139.684V21.36H144.524V26.12H139.684V33.4L139.724 34.96C139.911 36.2667 140.738 36.92 142.204 36.92C142.764 36.92 143.431 36.8 144.204 36.56L145.004 40.8C143.298 41.28 141.764 41.52 140.404 41.52C138.138 41.52 136.404 40.7867 135.204 39.32C134.698 38.68 134.364 38.0533 134.204 37.44C134.044 36.8 133.964 35.7733 133.964 34.36V26.12H131.044ZM165.737 33H151.017C151.23 34.36 151.764 35.44 152.617 36.24C153.497 37.0133 154.564 37.4 155.817 37.4C156.75 37.4 157.697 37.12 158.657 36.56C159.644 36 160.444 35.2667 161.057 34.36L165.137 37.16C163.857 38.7333 162.497 39.8667 161.057 40.56C159.617 41.2533 157.884 41.6 155.857 41.6C152.737 41.6 150.204 40.6667 148.257 38.8C146.337 36.9067 145.377 34.4533 145.377 31.44C145.377 28.4 146.35 25.8667 148.297 23.84C150.244 21.8133 152.71 20.8 155.697 20.8C158.684 20.8 161.11 21.7867 162.977 23.76C164.844 25.7333 165.777 28.32 165.777 31.52L165.737 33ZM155.657 24.96C153.124 24.96 151.577 26.4 151.017 29.28H160.097C159.937 27.9467 159.457 26.8933 158.657 26.12C157.884 25.3467 156.884 24.96 155.657 24.96ZM168.596 41V21.36H174.356V24.68C174.703 23.4533 175.343 22.5067 176.276 21.84C177.209 21.1733 178.396 20.84 179.836 20.84C180.183 20.84 180.476 20.8533 180.716 20.88C180.983 20.9067 181.329 20.9733 181.756 21.08L180.716 26.64C179.996 26.4533 179.316 26.36 178.676 26.36C177.289 26.36 176.183 26.8533 175.356 27.84C174.983 28.2933 174.716 28.7867 174.556 29.32C174.423 29.8267 174.356 30.5333 174.356 31.44V41H168.596ZM201.401 33H186.681C186.894 34.36 187.428 35.44 188.281 36.24C189.161 37.0133 190.228 37.4 191.481 37.4C192.414 37.4 193.361 37.12 194.321 36.56C195.308 36 196.108 35.2667 196.721 34.36L200.801 37.16C199.521 38.7333 198.161 39.8667 196.721 40.56C195.281 41.2533 193.548 41.6 191.521 41.6C188.401 41.6 185.868 40.6667 183.921 38.8C182.001 36.9067 181.041 34.4533 181.041 31.44C181.041 28.4 182.014 25.8667 183.961 23.84C185.908 21.8133 188.374 20.8 191.361 20.8C194.348 20.8 196.774 21.7867 198.641 23.76C200.508 25.7333 201.441 28.32 201.441 31.52L201.401 33ZM191.321 24.96C188.788 24.96 187.241 26.4 186.681 29.28H195.761C195.601 27.9467 195.121 26.8933 194.321 26.12C193.548 25.3467 192.548 24.96 191.321 24.96Z"
                                className="fill-black dark:fill-white"
                            />
                        </svg>
                    </div>
                    <Card className="w-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl">
                                    Daftar
                                </CardTitle>
                                <Tabs
                                    value={appearance}
                                    onValueChange={(value) =>
                                        updateAppearance(
                                            value as
                                                | 'light'
                                                | 'dark'
                                                | 'system',
                                        )
                                    }
                                >
                                    <TabsList>
                                        <TabsTrigger
                                            value="light"
                                            aria-label="Light theme"
                                        >
                                            <Sun className="size-4" />
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="dark"
                                            aria-label="Dark theme"
                                        >
                                            <Moon className="size-4" />
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="system"
                                            aria-label="System theme"
                                        >
                                            <Monitor className="size-4" />
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {status && (
                                <Alert className="mb-4 text-center">
                                    <AlertDescription>
                                        {status}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Form
                                action={store.url()}
                                method="post"
                                resetOnSuccess={[
                                    'password',
                                    'password_confirmation',
                                ]}
                                disableWhileProcessing
                                className="grid gap-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        {!isSocialRegistration && (
                                            <>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        type="button"
                                                        onClick={() =>
                                                            window.open(
                                                                socialRedirect.url(
                                                                    'google',
                                                                    {
                                                                        query: {
                                                                            popup: '1',
                                                                        },
                                                                    },
                                                                ),
                                                                'social-auth',
                                                                'popup,width=600,height=700',
                                                            )
                                                        }
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
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        type="button"
                                                        onClick={() =>
                                                            window.open(
                                                                socialRedirect.url(
                                                                    'github',
                                                                    {
                                                                        query: {
                                                                            popup: '1',
                                                                        },
                                                                    },
                                                                ),
                                                                'social-auth',
                                                                'popup,width=600,height=700',
                                                            )
                                                        }
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
                                                data-invalid={Boolean(
                                                    errors.name,
                                                )}
                                            >
                                                <FieldLabel
                                                    htmlFor="name"
                                                    className="flex items-center"
                                                >
                                                    Nama Tampilan{' '}
                                                    <span className="ml-1 text-destructive">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <div className="relative">
                                                    <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                    <Input
                                                        id="name"
                                                        type="text"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        autoComplete="name"
                                                        name="name"
                                                        placeholder="Nama lengkap"
                                                        className="pl-9"
                                                        defaultValue={
                                                            socialUser?.name ??
                                                            ''
                                                        }
                                                        aria-invalid={
                                                            Boolean(
                                                                errors.name,
                                                            ) || undefined
                                                        }
                                                    />
                                                </div>
                                                {errors.name && (
                                                    <p className="text-sm text-destructive">
                                                        {errors.name}
                                                    </p>
                                                )}
                                            </Field>

                                            <Field
                                                data-invalid={Boolean(
                                                    errors.username,
                                                )}
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
                                                        tabIndex={2}
                                                        autoComplete="username"
                                                        name="username"
                                                        placeholder="username"
                                                        className={`pl-9 ${['taken', 'short'].includes(usernameStatus) ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                                        value={username}
                                                        aria-invalid={
                                                            Boolean(
                                                                errors.username,
                                                            ) || undefined
                                                        }
                                                        onChange={(e) => {
                                                            const val =
                                                                e.currentTarget.value
                                                                    .replace(
                                                                        /[^a-zA-Z0-9._]/g,
                                                                        '',
                                                                    )
                                                                    .toLowerCase();
                                                            setUsernameAvailability(
                                                                null,
                                                            );
                                                            setUsername(val);
                                                        }}
                                                    />
                                                </div>
                                                {errors.username && (
                                                    <p className="text-sm text-destructive">
                                                        {errors.username}
                                                    </p>
                                                )}
                                            </Field>
                                            <Field
                                                data-invalid={Boolean(
                                                    errors.email,
                                                )}
                                            >
                                                <FieldLabel
                                                    htmlFor="email"
                                                    className="flex items-center"
                                                >
                                                    Email{' '}
                                                    <span className="ml-1 text-destructive">
                                                        *
                                                    </span>
                                                    {!isSocialRegistration && (
                                                        <div className="ml-auto flex items-center">
                                                            {emailStatus ===
                                                                'checking' && (
                                                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                                                    <LoaderCircle className="size-3 animate-spin" />{' '}
                                                                    Memeriksa...
                                                                </span>
                                                            )}
                                                            {emailStatus ===
                                                                'available' && (
                                                                <span className="flex items-center gap-1 text-sm text-foreground">
                                                                    <CheckCircle2 className="size-3" />{' '}
                                                                    Tersedia
                                                                </span>
                                                            )}
                                                            {emailStatus ===
                                                                'taken' && (
                                                                <span className="flex items-center gap-1 text-sm text-destructive">
                                                                    <XCircle className="size-3" />{' '}
                                                                    Email sudah
                                                                    terdaftar
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
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
                                                        tabIndex={3}
                                                        autoComplete="email"
                                                        name="email"
                                                        placeholder="email@domain.com"
                                                        className={`pl-9 ${isSocialRegistration ? 'cursor-not-allowed bg-muted text-muted-foreground' : ''} ${emailStatus === 'taken' ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                                        aria-invalid={
                                                            Boolean(
                                                                errors.email,
                                                            ) || undefined
                                                        }
                                                        readOnly={
                                                            isSocialRegistration
                                                        }
                                                        value={email}
                                                        onChange={(e) => {
                                                            setEmailAvailability(
                                                                null,
                                                            );
                                                            setEmail(
                                                                e.currentTarget
                                                                    .value,
                                                            );
                                                        }}
                                                    />
                                                </div>
                                                {errors.email && (
                                                    <p className="text-sm text-destructive">
                                                        {errors.email}
                                                    </p>
                                                )}
                                                {!isSocialRegistration &&
                                                    emailStatus === 'taken' && (
                                                        <p className="text-sm text-destructive">
                                                            Email sudah
                                                            terdaftar.{' '}
                                                            <Link
                                                                href={login()}
                                                                className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                                                            >
                                                                Masuk
                                                            </Link>
                                                        </p>
                                                    )}
                                            </Field>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            <Field
                                                data-invalid={Boolean(
                                                    errors.password,
                                                )}
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
                                                        Boolean(
                                                            errors.password,
                                                        ) || undefined
                                                    }
                                                    icon={
                                                        <Lock className="size-4" />
                                                    }
                                                    value={password}
                                                    onChange={(event) =>
                                                        setPassword(
                                                            event.currentTarget
                                                                .value,
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
                                                            value={
                                                                strength * 25
                                                            }
                                                            className={`h-1.5 bg-muted/60 transition-colors ${getStrengthBarColor(strength)}`}
                                                            aria-label="Password strength"
                                                        />
                                                    </div>
                                                )}
                                            </Field>

                                            <Field
                                                data-invalid={Boolean(
                                                    errors.password_confirmation,
                                                )}
                                            >
                                                <FieldLabel htmlFor="password_confirmation">
                                                    Konfirmasi Kata Sandi{' '}
                                                    <span className="text-destructive">
                                                        *
                                                    </span>
                                                </FieldLabel>
                                                <PasswordInput
                                                    id="password_confirmation"
                                                    required
                                                    tabIndex={5}
                                                    autoComplete="new-password"
                                                    name="password_confirmation"
                                                    placeholder="Ulangi kata sandi"
                                                    aria-invalid={
                                                        Boolean(
                                                            errors.password_confirmation,
                                                        ) || undefined
                                                    }
                                                    icon={
                                                        <Lock className="size-4" />
                                                    }
                                                />
                                                {errors.password_confirmation && (
                                                    <p className="text-sm text-destructive">
                                                        {
                                                            errors.password_confirmation
                                                        }
                                                    </p>
                                                )}
                                            </Field>
                                        </div>

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
                                                        href={terms()}
                                                        className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                                                    >
                                                        Ketentuan Layanan
                                                    </Link>{' '}
                                                    dan{' '}
                                                    <Link
                                                        href={privacy()}
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
            </div>
        </>
    );
}

Register.layout = (page: React.ReactNode) => page;
