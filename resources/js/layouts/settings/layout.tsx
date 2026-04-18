import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { Separator } from '@/components/ui/separator';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { TypographyH3, TypographyMuted } from '@/components/ui/typography';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: Array<NavItem & { value: 'profile' | 'security' | 'appearance' }> = [
    {
        value: 'profile',
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        value: 'security',
        title: 'Security',
        href: editSecurity(),
        icon: null,
    },
    {
        value: 'appearance',
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const activeTab = sidebarNavItems.find((item) =>
        isCurrentOrParentUrl(item.href)
    )?.value ?? 'profile';

    return (
        <div className="px-4 py-6">
            <div className="mb-8 flex flex-col gap-1">
                <TypographyH3 className="text-2xl leading-tight font-semibold tracking-tight">
                    Settings
                </TypographyH3>
                <TypographyMuted className="text-sm/6">
                    Manage your profile and account settings
                </TypographyMuted>
            </div>

            <Tabs value={activeTab} className="mt-6 w-full">
                <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
                    <aside className="w-full max-w-xl lg:w-48">
                        <TabsList
                            aria-label="Settings"
                            className="h-auto w-full flex-col items-stretch justify-start gap-1 bg-muted/50 p-1"
                        >
                            {sidebarNavItems.map((item, index) => (
                                <TabsTrigger
                                    key={`${toUrl(item.href)}-${index}`}
                                    value={item.value}
                                    asChild
                                    className="w-full justify-start"
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && (
                                            <item.icon className="size-4" />
                                        )}
                                        {item.title}
                                    </Link>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </aside>

                    <Separator className="my-6 lg:hidden" />

                    <div className="flex-1 md:max-w-2xl">
                        <TabsContent value={activeTab} className="mt-0">
                            <section className="flex max-w-xl flex-col gap-12">
                                {children}
                            </section>
                        </TabsContent>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
