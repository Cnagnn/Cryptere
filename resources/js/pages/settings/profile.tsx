import { Head, Link, router, useForm } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Award,
    CalendarDays,
    Eye,
    EyeOff,
    Github,
    KeyRound,
    Link2,
    Link2Off,
    Loader2,
    MapPin,
    Monitor,
    Moon,
    Pencil,
    Save,
    Share2,
    ShieldCheck,
    ShieldOff,
    SlidersHorizontal,
    Sun,
    Users,
} from 'lucide-react';
import type { ComponentProps, FormEventHandler, ReactNode, Ref } from 'react';
import { useMemo, useState } from 'react';

import { update } from '@/actions/App/Http/Controllers/Settings/SecurityController';
import { destroy } from '@/actions/App/Http/Controllers/Settings/SocialAccountController';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { useInitials } from '@/hooks/use-initials';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { cn } from '@/lib/utils';
import { redirect as socialRedirect } from '@/routes/social';

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
import { disable } from '@/routes/two-factor';

type ProfileBadge = {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    tier: string;
    earned_at: string;
};

type ProfileUser = {
    id?: number;
    name: string;
    username: string | null;
    email?: string | null;
    avatar?: string | null;
    bio?: string | null;
    pronoun?: string | null;
    location?: string | null;
    profile_visibility?: 'public' | 'private';
    created_at?: string;
};

export type SocialAccount = {
    id: number;
    provider: string;
    provider_email: string | null;
    provider_name: string | null;
    created_at: string;
};

type Props = {
    profileUser: ProfileUser;
    badges: ProfileBadge[];
    mustVerifyEmail?: boolean;
    status?: string;
    // Security props
    canManageTwoFactor?: boolean;
    twoFactorEnabled?: boolean;
    requiresConfirmation?: boolean;
    // Social accounts props
    socialAccounts?: SocialAccount[];
    hasPassword?: boolean;
};

const socialProviders = [
    {
        key: 'google',
        label: 'Google',
        icon: () => (
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                />
                <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                />
                <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                />
                <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                />
            </svg>
        ),
    },
    {
        key: 'github',
        label: 'GitHub',
        icon: () => <Github className="size-5" />,
    },
] as const;

export default function SettingsProfile({
    profileUser,
    badges,
    mustVerifyEmail,
    status,
    canManageTwoFactor = false,
    twoFactorEnabled = false,
    requiresConfirmation = false,
    socialAccounts = [],
    hasPassword = true,
}: Props) {
    const getInitials = useInitials();

    return (
        <>
            <Head title="Pengaturan Profil" />

            <Tabs defaultValue="profile" className="w-full">
                {/* Centered tabs at the top */}
                <div className="flex justify-center">
                    <TabsList>
                        <TabsTrigger value="profile">
                            <Users className="size-4" />
                            Profil
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <KeyRound className="size-4" />
                            Pengaturan
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Profile tab */}
                <TabsContent value="profile" className="mt-6">
                    <div className="grid gap-6 lg:grid-cols-10">
                        <div className="lg:col-span-3">
                            <Card className="sticky top-24">
                                <CardHeader className="space-y-4">
                                    <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
                                        <Avatar className="size-28 rounded-full ring-4 ring-card sm:size-32">
                                            <AvatarImage
                                                src={
                                                    profileUser.avatar ??
                                                    undefined
                                                }
                                                alt={profileUser.name}
                                            />
                                            <AvatarFallback className="bg-muted text-2xl font-semibold text-foreground sm:text-3xl">
                                                {getInitials(profileUser.name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex flex-col gap-1">
                                            <CardTitle className="text-2xl">
                                                {profileUser.name}
                                            </CardTitle>
                                            {profileUser.username && (
                                                <p className="text-sm text-muted-foreground">
                                                    @{profileUser.username}
                                                </p>
                                            )}
                                            {profileUser.created_at && (
                                                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <CalendarDays className="size-3.5 shrink-0" />
                                                    Bergabung{' '}
                                                    {new Date(
                                                        profileUser.created_at,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            year: 'numeric',
                                                            month: 'long',
                                                        },
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="flex-9"
                                            asChild
                                        >
                                            <Link href="#edit-profile">
                                                <Pencil className="size-3.5" />
                                                Edit Profil
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    window.location.origin +
                                                        '/profile/' +
                                                        (profileUser.username ??
                                                            profileUser.id),
                                                );
                                            }}
                                        >
                                            <Share2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex flex-col gap-4">
                                    {profileUser.bio && (
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            {profileUser.bio}
                                        </p>
                                    )}

                                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                        {profileUser.pronoun && (
                                            <span>{profileUser.pronoun}</span>
                                        )}
                                        {profileUser.location && (
                                            <span className="inline-flex items-center gap-2">
                                                <MapPin className="size-3.5 shrink-0" />
                                                {profileUser.location}
                                            </span>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-7">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Lencana publik</CardTitle>
                                    <CardDescription>
                                        Lencana ini terlihat di profil publik
                                        Anda.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ProfileBadges badges={badges} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Settings tab - one-page scroll with all sections inline */}
                <TabsContent value="settings" className="mt-6">
                    <div className="mx-auto flex max-w-2xl flex-col gap-6">
                        {/* Appearance section */}
                        <AppearanceCard />

                        {/* Security section */}
                        <PasswordCard />

                        {canManageTwoFactor && (
                            <TwoFactorCard
                                enabled={twoFactorEnabled}
                                requiresConfirmation={requiresConfirmation}
                            />
                        )}

                        {/* Connected accounts section */}
                        <SocialAccountsCard
                            socialAccounts={socialAccounts}
                            hasPassword={hasPassword}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
}

/* ── Appearance Card ── */
function AppearanceCard() {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
    ];

    const handleValueChange = (value: string): void => {
        if (value === 'light' || value === 'dark' || value === 'system') {
            updateAppearance(value);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tampilan</CardTitle>
                <CardDescription>
                    Pilih tema yang Anda sukai untuk antarmuka.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ToggleGroup
                    type="single"
                    value={appearance}
                    onValueChange={handleValueChange}
                    variant="outline"
                    size="sm"
                    className="inline-flex gap-1 rounded-lg border bg-muted p-1"
                >
                    {tabs.map(({ value, icon: Icon, label }) => (
                        <ToggleGroupItem
                            key={value}
                            value={value}
                            className="gap-1.5 px-3"
                        >
                            <Icon className="size-4" />
                            <span>{label}</span>
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </CardContent>
        </Card>
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

                            <TwoFactorRecoveryCodes
                                recoveryCodesList={twoFactor.recoveryCodesList}
                                fetchRecoveryCodes={
                                    twoFactor.fetchRecoveryCodes
                                }
                                errors={twoFactor.errors}
                            />

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

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={handleCloseModal}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={isEnabled}
                qrCodeSvg={twoFactor.qrCodeSvg}
                manualSetupKey={twoFactor.manualSetupKey}
                clearSetupData={twoFactor.clearSetupData}
                fetchSetupData={twoFactor.fetchSetupData}
                errors={twoFactor.errors}
            />
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

/* ── Social Accounts Card ── */
type SocialAccountsCardProps = {
    socialAccounts: SocialAccount[];
    hasPassword: boolean;
    errors?: Record<string, string>;
};

function SocialAccountsCard({
    socialAccounts,
    hasPassword,
    errors,
}: SocialAccountsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
                <CardDescription>
                    Link your social accounts for faster sign-in.
                </CardDescription>
            </CardHeader>

            <CardContent>
                {errors?.social && (
                    <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                        {errors.social}
                    </div>
                )}

                <div className="flex flex-col gap-3">
                    {socialProviders.map((provider) => {
                        const connected = socialAccounts.find(
                            (a) => a.provider === provider.key,
                        );

                        return (
                            <ProviderRow
                                key={provider.key}
                                provider={provider}
                                account={connected}
                                hasPassword={hasPassword}
                                totalAccounts={socialAccounts.length}
                            />
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

/* ── Provider Row ── */
function ProviderRow({
    provider,
    account,
    hasPassword,
    totalAccounts,
}: {
    provider: (typeof socialProviders)[number];
    account?: SocialAccount;
    hasPassword: boolean;
    totalAccounts: number;
}) {
    const [showDisconnect, setShowDisconnect] = useState(false);
    const [processing, setProcessing] = useState(false);
    const Icon = provider.icon;

    const canDisconnect = hasPassword || totalAccounts > 1;

    const handleDisconnect = () => {
        if (!account) {
            return;
        }

        setProcessing(true);
        router.delete(destroy.url(account.id), {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setShowDisconnect(false);
            },
        });
    };

    const connectedDate = account
        ? new Date(account.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : null;

    return (
        <>
            <div className="flex items-center justify-between rounded-xl border bg-card p-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <Icon />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                            {provider.label}
                        </span>
                        {account ? (
                            <span className="text-xs text-muted-foreground">
                                {account.provider_email ??
                                    account.provider_name ??
                                    `Connected ${connectedDate}`}
                            </span>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                Not connected
                            </span>
                        )}
                    </div>
                </div>

                {account ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDisconnect(true)}
                        disabled={!canDisconnect}
                    >
                        <Link2Off className="size-3.5" />
                        Disconnect
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" asChild>
                        <a href={socialRedirect.url(provider.key)}>
                            <Link2 className="size-3.5" />
                            Connect
                        </a>
                    </Button>
                )}
            </div>

            {/* Disconnect confirmation */}
            <AlertDialog open={showDisconnect} onOpenChange={setShowDisconnect}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Disconnect {provider.label}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You will no longer be able to sign in with your{' '}
                            {provider.label} account. You can reconnect it
                            later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDisconnect}
                            disabled={processing}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {processing && (
                                <Loader2 className="size-4 animate-spin" />
                            )}
                            Disconnect
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ============================================================================
// ProfileBadges Component (inlined)
// ============================================================================

const tierRing: Record<string, string> = {
    bronze: 'ring-amber-400/60 dark:ring-amber-500/40',
    silver: 'ring-slate-400/60 dark:ring-slate-400/40',
    gold: 'ring-yellow-400/60 dark:ring-yellow-500/40',
    platinum: 'ring-cyan-400/60 dark:ring-cyan-400/40',
};

const tierBg: Record<string, string> = {
    bronze: 'bg-amber-50 dark:bg-amber-950/30',
    silver: 'bg-slate-50 dark:bg-slate-900/30',
    gold: 'bg-yellow-50 dark:bg-yellow-950/30',
    platinum: 'bg-cyan-50 dark:bg-cyan-950/30',
};

const tierLabel: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
};

const categoryLabels: Record<string, string> = {
    all: 'All',
    milestone: 'Milestone',
    course: 'Course',
    streak: 'Streak',
    lab: 'Lab',
    special: 'Special',
};

type SortMode = 'newest' | 'oldest' | 'name';

const sortLabels: Record<SortMode, string> = {
    newest: 'Newest',
    oldest: 'Oldest',
    name: 'A → Z',
};

function ProfileBadges({ badges }: { badges: ProfileBadge[] }) {
    const [sortMode, setSortMode] = useState<SortMode>('newest');
    const [activeCategory, setActiveCategory] = useState('all');

    const categories = useMemo(() => {
        const cats = new Set(badges.map((b) => b.category));

        return ['all', ...Array.from(cats).sort()];
    }, [badges]);

    const cycleSortMode = () => {
        setSortMode((prev) => {
            if (prev === 'newest') {
                return 'oldest';
            }

            if (prev === 'oldest') {
                return 'name';
            }

            return 'newest';
        });
    };

    const filteredAndSorted = useMemo(() => {
        const result =
            activeCategory === 'all'
                ? [...badges]
                : badges.filter((b) => b.category === activeCategory);

        result.sort((a, b) => {
            if (sortMode === 'newest') {
                return (
                    new Date(b.earned_at).getTime() -
                    new Date(a.earned_at).getTime()
                );
            }

            if (sortMode === 'oldest') {
                return (
                    new Date(a.earned_at).getTime() -
                    new Date(b.earned_at).getTime()
                );
            }

            return a.name.localeCompare(b.name);
        });

        return result;
    }, [badges, activeCategory, sortMode]);

    if (badges.length === 0) {
        return (
            <Empty className="rounded-2xl border">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        <Award />
                    </EmptyMedia>
                    <EmptyTitle>No badges yet</EmptyTitle>
                    <EmptyDescription>
                        Complete courses and milestones to earn badges.
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    {categories.map((cat) => {
                        const count =
                            cat === 'all'
                                ? badges.length
                                : badges.filter((b) => b.category === cat)
                                      .length;

                        return (
                            <Button
                                key={cat}
                                variant={
                                    activeCategory === cat
                                        ? 'default'
                                        : 'outline'
                                }
                                size="sm"
                                className="h-7 rounded-full px-3 text-xs"
                                onClick={() => setActiveCategory(cat)}
                            >
                                {categoryLabels[cat] ?? cat}
                                <span className="ml-1 opacity-60">{count}</span>
                            </Button>
                        );
                    })}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-muted-foreground"
                    onClick={cycleSortMode}
                >
                    <SlidersHorizontal className="size-3.5" />
                    {sortLabels[sortMode]}
                </Button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                <TooltipProvider>
                    {filteredAndSorted.map((badge) => (
                        <BadgeItem key={badge.id} badge={badge} />
                    ))}
                </TooltipProvider>
            </div>

            {filteredAndSorted.length === 0 && badges.length > 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    No badges in this category.
                </p>
            )}
        </div>
    );
}

function BadgeItem({ badge }: { badge: ProfileBadge }) {
    const earnedDate = new Date(badge.earned_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="group flex cursor-default flex-col items-center gap-2.5 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
                    <div
                        className={cn(
                            'flex size-14 items-center justify-center rounded-full ring-2 transition-transform group-hover:scale-110',
                            tierRing[badge.tier] ?? 'ring-border',
                            tierBg[badge.tier] ?? 'bg-muted',
                        )}
                    >
                        <span className="text-2xl">{badge.icon}</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-center">
                        <p className="text-xs leading-tight font-medium">
                            {badge.name}
                        </p>
                        <Badge
                            variant="secondary"
                            className="h-4 px-1.5 text-[10px] capitalize"
                        >
                            {tierLabel[badge.tier] ?? badge.tier}
                        </Badge>
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
                <div className="flex flex-col gap-1">
                    <p className="font-medium">{badge.name}</p>
                    <p className="text-xs opacity-80">{badge.description}</p>
                    <p className="mt-0.5 text-[10px] opacity-60">
                        Earned {earnedDate}
                    </p>
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
