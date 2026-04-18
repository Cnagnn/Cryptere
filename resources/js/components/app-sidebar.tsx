import { Link, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    FlaskConical,
    LayoutGrid,
    Swords,
    Trophy,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import { index as adminUsersIndex } from '@/routes/admin/users';
import { index as challengesIndex } from '@/routes/challenges';
import { index as coursesIndex } from '@/routes/courses';
import { index as labsIndex } from '@/routes/labs';
import { index as leaderboardIndex } from '@/routes/leaderboard';
import type { NavItem } from '@/types';
import type { Auth } from '@/types/auth';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Courses',
        href: coursesIndex(),
        icon: BookOpenCheck,
    },
    {
        title: 'Challenges',
        href: challengesIndex(),
        icon: Swords,
    },
    {
        title: 'Leaderboard',
        href: leaderboardIndex(),
        icon: Trophy,
    },
    {
        title: 'Labs',
        href: labsIndex(),
        icon: FlaskConical,
    },
];

const managementNavItems: NavItem[] = [
    {
        title: 'Courses',
        href: adminCoursesIndex(),
        icon: BookOpenCheck,
    },
    {
        title: 'Users',
        href: adminUsersIndex(),
        icon: Users,
    },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <div className="flex w-full justify-center">
                                    <AppLogo
                                        className="group-data-[collapsible=icon]:hidden"
                                        imageClassName="h-10"
                                    />
                                    <img
                                        src="/images/Logo/Logo-Black.svg"
                                        alt="Crypter"
                                        className="hidden h-7 w-auto group-data-[collapsible=icon]:block dark:group-data-[collapsible=icon]:hidden"
                                    />
                                    <img
                                        src="/images/Logo/Logo.svg"
                                        alt="Crypter"
                                        className="hidden h-7 w-auto dark:group-data-[collapsible=icon]:block"
                                    />
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Dashboard" />
                {auth.user.is_admin ? (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Management</SidebarGroupLabel>
                        <SidebarMenu>
                            {managementNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isCurrentUrl(item.href)}
                                        tooltip={{ children: item.title }}
                                    >
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                ) : null}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
