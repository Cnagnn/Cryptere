import { Form, Head, Link } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle, Lock } from 'lucide-react';
import type { ComponentProps, ReactNode, Ref } from 'react';
import { useState } from 'react';
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
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { update } from '@/routes/password';

function PasswordInput({
    className,
    ref,
    ...props
}: Omit<ComponentProps<'input'>, 'type'> & {
    ref?: Ref<HTMLInputElement>;
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <InputGroup>
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
    return (
        <>
            <Head title="Atur Ulang Kata Sandi" />

            <div className="flex min-h-screen items-center justify-center bg-background py-4 lg:h-screen">
                <Card className="mx-auto w-full max-w-sm">
                    <CardHeader>
                        <div>
                            <img
                                src="/images/Logo/Logomark.svg"
                                alt="Cryptere"
                                className="h-11 w-auto"
                            />
                        </div>
                        <CardTitle className="text-2xl">
                            Atur Ulang Kata Sandi
                        </CardTitle>
                        <CardDescription>
                            Silakan masukkan kata sandi baru Anda di bawah ini.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Form
                            {...update()}
                            transform={(data) => ({ ...data, token, email })}
                            resetOnSuccess={['password', 'password_confirmation']}
                            className="flex flex-col gap-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <Field data-invalid={Boolean(errors.email)}>
                                        <FieldLabel htmlFor="email">
                                            Email
                                        </FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            value={email}
                                            aria-invalid={
                                                Boolean(errors.email) || undefined
                                            }
                                            className="w-full"
                                            readOnly
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-destructive">
                                                {errors.email}
                                            </p>
                                        )}
                                    </Field>

                                    <Field data-invalid={Boolean(errors.password)}>
                                        <FieldLabel htmlFor="password">
                                            Kata Sandi Baru
                                        </FieldLabel>
                                        <div className="relative">
                                            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                autoComplete="new-password"
                                                aria-invalid={
                                                    Boolean(errors.password) ||
                                                    undefined
                                                }
                                                className="w-full pl-9"
                                                autoFocus
                                                placeholder="Masukkan kata sandi baru"
                                            />
                                        </div>
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
                                        <div className="relative">
                                            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <PasswordInput
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                autoComplete="new-password"
                                                aria-invalid={
                                                    Boolean(
                                                        errors.password_confirmation,
                                                    ) || undefined
                                                }
                                                className="w-full pl-9"
                                                placeholder="Konfirmasi kata sandi baru"
                                            />
                                        </div>
                                        {errors.password_confirmation && (
                                            <p className="text-sm text-destructive">
                                                {errors.password_confirmation}
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
                                </>
                            )}
                        </Form>
                    </CardContent>

                    <CardFooter className="justify-center">
                        <p className="text-sm">
                            Sudah ingat kata sandi?{' '}
                            <Link
                                href={login()}
                                className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                            >
                                Masuk
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}

ResetPassword.layout = (page: React.ReactNode) => page;
