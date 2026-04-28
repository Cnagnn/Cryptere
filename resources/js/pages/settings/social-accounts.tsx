import { Head, router } from '@inertiajs/react';
import { Link2, Link2Off, LoaderCircle, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import SocialAccountController from '@/actions/App/Http/Controllers/Settings/SocialAccountController';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TypographyLarge, TypographyMuted } from '@/components/ui/typography';
import { dashboard } from '@/routes';
import { edit as editSecurity } from '@/routes/security';
import { redirect as socialRedirect } from '@/routes/social';
import { edit as editSocialAccounts } from '@/routes/social-accounts';

type SocialAccount = {
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

const PROVIDERS = [
    {
        key: 'google',
        name: 'Google',
        icon: (
            <svg
                viewBox="0 0 24 24"
                className="size-5"
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
        ),
    },
    {
        key: 'github',
        name: 'GitHub',
        icon: (
            <svg
                viewBox="0 0 24 24"
                className="size-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                aria-hidden="true"
            >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
        ),
    },
] as const;

export default function SocialAccounts({
    socialAccounts,
    hasPassword,
    errors,
}: Props) {
    const [disconnecting, setDisconnecting] = useState<number | null>(null);

    function handleDisconnect(accountId: number) {
        setDisconnecting(accountId);
        router.delete(SocialAccountController.destroy.url(accountId), {
            preserveScroll: true,
            onFinish: () => setDisconnecting(null),
        });
    }

    function getConnectedAccount(
        providerKey: string,
    ): SocialAccount | undefined {
        return socialAccounts.find(
            (account) => account.provider === providerKey,
        );
    }

    return (
        <>
            <Head title="Social accounts" />

            <h1 className="sr-only">Social accounts</h1>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-0.5">
                    <TypographyLarge className="text-base leading-snug font-medium">
                        Connected accounts
                    </TypographyLarge>
                    <TypographyMuted className="text-sm/6">
                        Manage your connected social accounts for quick sign-in
                    </TypographyMuted>
                </div>

                {errors?.social && (
                    <Alert variant="destructive">
                        <ShieldAlert className="size-4" />
                        <AlertDescription>{errors.social}</AlertDescription>
                    </Alert>
                )}

                {!hasPassword && socialAccounts.length > 0 && (
                    <Alert>
                        <ShieldAlert className="size-4" />
                        <AlertDescription>
                            You don't have a password set. Set a password in{' '}
                            <a
                                href={editSecurity.url()}
                                className="text-primary underline underline-offset-4 hover:text-primary/80"
                            >
                                Security settings
                            </a>{' '}
                            before disconnecting your last social account.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col gap-4">
                    {PROVIDERS.map((provider) => {
                        const connected = getConnectedAccount(provider.key);
                        const isLastAccount = socialAccounts.length <= 1;
                        const canDisconnect = hasPassword || !isLastAccount;

                        return (
                            <div
                                key={provider.key}
                                className="flex items-center justify-between gap-4 rounded-lg border p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-md border bg-muted/50">
                                        {provider.icon}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                {provider.name}
                                            </span>
                                            {connected && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    Connected
                                                </Badge>
                                            )}
                                        </div>
                                        {connected ? (
                                            <span className="text-xs text-muted-foreground">
                                                {connected.provider_email ??
                                                    connected.provider_name ??
                                                    'Connected'}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                Not connected
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {connected ? (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={
                                                    !canDisconnect ||
                                                    disconnecting ===
                                                        connected.id
                                                }
                                            >
                                                {disconnecting ===
                                                connected.id ? (
                                                    <LoaderCircle className="size-4 animate-spin" />
                                                ) : (
                                                    <Link2Off className="size-4" />
                                                )}
                                                Disconnect
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Disconnect {provider.name}?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    You will no longer be able
                                                    to sign in with your{' '}
                                                    {provider.name} account.
                                                    {!hasPassword &&
                                                        ' Make sure you have a password set before disconnecting.'}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() =>
                                                        handleDisconnect(
                                                            connected.id,
                                                        )
                                                    }
                                                >
                                                    Disconnect
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={socialRedirect.url(
                                                provider.key,
                                            )}
                                        >
                                            <Link2 className="size-4" />
                                            Connect
                                        </a>
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

SocialAccounts.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: dashboard(),
        },
        {
            title: 'Social accounts',
            href: editSocialAccounts(),
        },
    ],
};
