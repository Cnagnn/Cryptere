import { Head, router } from '@inertiajs/react';
import { Github, Link2, Link2Off, Loader2 } from 'lucide-react';
import { useState } from 'react';

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
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { redirect as socialRedirect } from '@/routes/social';

export type SocialAccount = {
    id: number;
    provider: string;
    provider_email: string | null;
    provider_name: string | null;
    created_at: string;
};

type Props = {
    socialAccounts: SocialAccount[];
    hasPassword: boolean;
    errors?: Record<string, string>;
};

const providers = [
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

export default function SettingsSocialAccounts({
    socialAccounts,
    hasPassword,
    errors,
}: Props) {
    return (
        <>
            <Head title="Akun Terhubung" />

            <div className="flex flex-col gap-6">
                <SocialAccountsCard
                    socialAccounts={socialAccounts}
                    hasPassword={hasPassword}
                    errors={errors}
                />
            </div>
        </>
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
                    {providers.map((provider) => {
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
    provider: (typeof providers)[number];
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
