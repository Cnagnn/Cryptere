import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Loader2, Save, ShieldCheck, ShieldOff } from 'lucide-react';
import type { ComponentProps, FormEventHandler, ReactNode, Ref } from 'react';
import { useState } from 'react';

import { update } from '@/actions/App/Http/Controllers/Settings/SecurityController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { cn } from '@/lib/utils';
import { disable } from '@/routes/two-factor';

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
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function SettingsSecurity({
    canManageTwoFactor = false,
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: Props) {
    return (
        <>
            <Head title="Pengaturan Keamanan" />

            <div className="flex flex-col gap-6">
                <PasswordCard />
                {canManageTwoFactor && (
                    <TwoFactorCard
                        enabled={twoFactorEnabled}
                        requiresConfirmation={requiresConfirmation}
                    />
                )}
            </div>
        </>
    );
}

/* ── Password Card ── */
function PasswordCard() {
    const {
        data,
        setData,
        put,
        errors,
        processing,
        recentlySuccessful,
        reset,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(update.url(), {
            onSuccess: () => reset(),
            preserveScroll: true,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Update Password</CardTitle>
                <CardDescription>
                    Use a strong, unique password to protect your account.
                </CardDescription>
            </CardHeader>

            <form onSubmit={submit}>
                <CardContent className="flex flex-col gap-4">
                    <Field>
                        <FieldLabel htmlFor="current_password">
                            Current Password
                        </FieldLabel>
                        <PasswordInput
                            id="current_password"
                            value={data.current_password}
                            onChange={(e) =>
                                setData('current_password', e.target.value)
                            }
                            autoComplete="current-password"
                            placeholder="Enter current password"
                        />
                        <FieldError>{errors.current_password}</FieldError>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="password">New Password</FieldLabel>
                        <PasswordInput
                            id="password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            autoComplete="new-password"
                            placeholder="Enter new password"
                        />
                        <FieldError>{errors.password}</FieldError>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="password_confirmation">
                            Confirm Password
                        </FieldLabel>
                        <PasswordInput
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            autoComplete="new-password"
                            placeholder="Confirm new password"
                        />
                        <FieldError>{errors.password_confirmation}</FieldError>
                    </Field>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t pt-6">
                    <div>
                        {recentlySuccessful && (
                            <p className="text-sm text-green-600 dark:text-green-400">
                                Password updated.
                            </p>
                        )}
                    </div>
                    <Button type="submit" disabled={processing}>
                        {processing ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Save className="size-4" />
                        )}
                        Update Password
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

/* ── Two Factor Card ── */
type TwoFactorCardProps = {
    enabled: boolean;
    requiresConfirmation: boolean;
};

function TwoFactorCard({ enabled, requiresConfirmation }: TwoFactorCardProps) {
    const [isEnabled, setIsEnabled] = useState(enabled);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const twoFactor = useTwoFactorAuth();

    const handleEnable = async () => {
        setShowSetupModal(true);
    };

    const handleCloseModal = () => {
        setShowSetupModal(false);
        twoFactor.clearSetupData();
    };

    const handleDisable = () => {
        setIsEnabled(false);
        twoFactor.clearTwoFactorAuthData();
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1.5">
                            <CardTitle className="flex items-center gap-2">
                                Two-Factor Authentication
                                {isEnabled ? (
                                    <Badge
                                        variant="default"
                                        className="bg-green-600 text-xs hover:bg-green-700"
                                    >
                                        Enabled
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        Disabled
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Add an extra layer of security with a time-based
                                one-time password (TOTP).
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {isEnabled ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                                <ShieldCheck className="size-5 text-green-600 dark:text-green-400" />
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    Two-factor authentication is active. Your
                                    account has an extra layer of protection.
                                </p>
                            </div>

                            <Separator />

                            {/* TODO: Implement TwoFactorRecoveryCodes component */}
                            {/* <TwoFactorRecoveryCodes
                                recoveryCodesList={twoFactor.recoveryCodesList}
                                fetchRecoveryCodes={
                                    twoFactor.fetchRecoveryCodes
                                }
                                errors={twoFactor.errors}
                            /> */}

                            <Separator />

                            <div className="flex justify-end">
                                <DisableTwoFactorButton
                                    onDisabled={handleDisable}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                                <ShieldOff className="size-6 text-muted-foreground" />
                            </div>
                            <div className="flex max-w-sm flex-col gap-1">
                                <p className="text-sm font-medium">
                                    Not yet enabled
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Protect your account by requiring a
                                    verification code from your authenticator
                                    app when signing in.
                                </p>
                            </div>
                            <Button onClick={handleEnable}>
                                <ShieldCheck className="size-4" />
                                Enable 2FA
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* TODO: Implement TwoFactorSetupModal component */}
            {/* <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={handleCloseModal}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={isEnabled}
                qrCodeSvg={twoFactor.qrCodeSvg}
                manualSetupKey={twoFactor.manualSetupKey}
                clearSetupData={twoFactor.clearSetupData}
                fetchSetupData={twoFactor.fetchSetupData}
                errors={twoFactor.errors}
            /> */}
        </>
    );
}

/* ── Disable 2FA Button ── */
function DisableTwoFactorButton({ onDisabled }: { onDisabled: () => void }) {
    const { delete: deleteAction, processing } = useForm({});

    const handleDisable = () => {
        deleteAction(disable.url(), {
            preserveScroll: true,
            onSuccess: () => onDisabled(),
        });
    };

    return (
        <Button
            variant="destructive"
            size="sm"
            onClick={handleDisable}
            disabled={processing}
        >
            {processing ? (
                <Loader2 className="size-4 animate-spin" />
            ) : (
                <ShieldOff className="size-4" />
            )}
            Disable 2FA
        </Button>
    );
}
