import { Link, usePage } from '@inertiajs/react';
import { Palette, ShieldCheck, User, WalletCards } from 'lucide-react';

import { cn } from '@/lib/utils';
import { edit as settingsAppearanceEdit } from '@/routes/settings/appearance';
import { edit as settingsProfileEdit } from '@/routes/settings/profile';
import { edit as settingsSecurityEdit } from '@/routes/settings/security';
import { edit as settingsSocialAccountsEdit } from '@/routes/settings/social-accounts';

const items = [
    { label: 'Profile', href: settingsProfileEdit.url(), icon: User },
    { label: 'Security', href: settingsSecurityEdit.url(), icon: ShieldCheck },
    {
        label: 'Connected Accounts',
        href: settingsSocialAccountsEdit.url(),
        icon: WalletCards,
    },
    { label: 'Appearance', href: settingsAppearanceEdit.url(), icon: Palette },
];

export function SettingsNavigation() {
    const { url } = usePage();
    const currentPath = url.split('?')[0];

    return (
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Settings">
            {items.map((item) => {
                const active = currentPath.startsWith(item.href);
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition-colors',
                            active
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                    >
                        <Icon className="size-4" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
