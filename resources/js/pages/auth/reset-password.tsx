import { Form, Head, Link } from '@inertiajs/react';
import {
    Eye,
    EyeOff,
    LoaderCircle,
    Lock,
    Mail,
    Monitor,
    Moon,
    Sun,
} from 'lucide-react';
import type { ComponentProps, ReactNode, Ref } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import AppLogo from '@/components/app-logo';
import { update } from '@/routes/password';

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

type Props = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: Props) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <>
            <Head title="Atur Ulang Kata Sandi" />

            <div className="flex min-h-screen items-center justify-center bg-background py-4 lg:h-screen">
                <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
                    <div className="flex items-center justify-center select-none">
                        <AppLogo className="pointer-events-auto h-11 w-auto" />
                    </div>
                    <Card className="w-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl">
                                    Atur Ulang Kata Sandi
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
                            <CardDescription>
                                Silakan masukkan kata sandi baru Anda di bawah
                                ini.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <Form
                                action={update.url()}
                                method="post"
                                transform={(data) => ({
                                    ...data,
                                    token,
                                    email,
                                })}
                                resetOnSuccess={[
                                    'password',
                                    'password_confirmation',
                                ]}
                                className="flex flex-col gap-6"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <Field
                                            data-invalid={Boolean(errors.email)}
                                        >
                                            <FieldLabel htmlFor="email">
                                                Email
                                            </FieldLabel>
                                            <div className="relative">
                                                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    autoComplete="email"
                                                    value={email}
                                                    aria-invalid={
                                                        Boolean(errors.email) ||
                                                        undefined
                                                    }
                                                    className="w-full pl-9"
                                                    readOnly
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="text-sm text-destructive">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </Field>

                                        <Field
                                            data-invalid={Boolean(
                                                errors.password,
                                            )}
                                        >
                                            <FieldLabel htmlFor="password">
                                                Kata Sandi Baru
                                            </FieldLabel>
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                autoComplete="new-password"
                                                aria-invalid={
                                                    Boolean(errors.password) ||
                                                    undefined
                                                }
                                                className="w-full"
                                                autoFocus
                                                placeholder="Masukkan kata sandi baru"
                                                icon={
                                                    <Lock className="size-4 text-muted-foreground" />
                                                }
                                            />
                                            {errors.password && (
                                                <p className="text-sm text-destructive">
                                                    {errors.password}
                                                </p>
                                            )}
                                        </Field>

                                        <Field
                                            data-invalid={Boolean(
                                                errors.password_confirmation,
                                            )}
                                        >
                                            <FieldLabel htmlFor="password_confirmation">
                                                Konfirmasi Kata Sandi
                                            </FieldLabel>
                                            <PasswordInput
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                autoComplete="new-password"
                                                aria-invalid={
                                                    Boolean(
                                                        errors.password_confirmation,
                                                    ) || undefined
                                                }
                                                className="w-full"
                                                placeholder="Konfirmasi kata sandi baru"
                                                icon={
                                                    <Lock className="size-4 text-muted-foreground" />
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

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={processing}
                                            data-test="reset-password-button"
                                        >
                                            {processing && (
                                                <LoaderCircle className="mr-2 -ml-1 size-4 animate-spin" />
                                            )}
                                            Atur Ulang Kata Sandi
                                        </Button>

                                        <div className="text-center text-sm">
                                            Sudah ingat kata sandi?{' '}
                                            <Link
                                                href={login()}
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

ResetPassword.layout = (page: React.ReactNode) => page;
