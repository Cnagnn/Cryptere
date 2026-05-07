import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import type { ComponentProps, ReactNode, Ref } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
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
    return (
        <>
            <Head title="Atur Ulang Kata Sandi" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <Field data-invalid={Boolean(errors.email)}>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                aria-invalid={
                                    Boolean(errors.email) || undefined
                                }
                                className="block w-full"
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
                                Kata Sandi
                            </FieldLabel>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                aria-invalid={
                                    Boolean(errors.password) || undefined
                                }
                                className="block w-full"
                                autoFocus
                                placeholder="Kata Sandi"
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">
                                    {errors.password}
                                </p>
                            )}
                        </Field>

                        <Field
                            data-invalid={Boolean(errors.password_confirmation)}
                        >
                            <FieldLabel htmlFor="password_confirmation">
                                Konfirmasi Kata Sandi
                            </FieldLabel>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                aria-invalid={
                                    Boolean(errors.password_confirmation) ||
                                    undefined
                                }
                                className="block w-full"
                                placeholder="Konfirmasi Kata Sandi"
                            />
                            {errors.password_confirmation && (
                                <p className="text-sm text-destructive">
                                    {errors.password_confirmation}
                                </p>
                            )}
                        </Field>

                        <Button
                            type="submit"
                            className="mt-4 w-full"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            Atur Ulang Kata Sandi
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Atur Ulang Kata Sandi',
    description: 'Silakan masukkan kata sandi baru Anda di bawah ini',
};
