import { Link, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    ChevronRight,
    Flag,
    FlaskConical,
    LayoutGrid,
    ScrollText,
    Swords,
    Trophy,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard } from '@/routes';
import { index as adminChallengesIndex } from '@/routes/admin/challenges';
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
        title: 'CTF Events',
        href: '/ctf',
        icon: Flag,
    },
    {
        title: 'Story',
        href: '/story',
        icon: ScrollText,
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
        title: 'Challenges',
        href: adminChallengesIndex(),
        icon: Swords,
    },
    {
        title: 'Users',
        href: adminUsersIndex(),
        icon: Users,
    },
];

export function AppSidebar() {
    const page = usePage<{ auth: Auth }>();
    const { auth } = page.props;
    const { isCurrentUrl } = useCurrentUrl();
    const isCourseManagementPage = isCurrentUrl(adminCoursesIndex(), undefined, true);
    const activeCourseSection = isCourseManagementPage
        ? (new URLSearchParams(page.url.split('?')[1] ?? '').get('section') ?? 'catalog')
        : null;

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
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <Collapsible defaultOpen={isCourseManagementPage} className="group/courses">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton
                                                isActive={isCourseManagementPage}
                                                tooltip={{ children: 'Courses' }}
                                            >
                                                <BookOpenCheck />
                                                <span>Courses</span>
                                                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/courses:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton asChild isActive={activeCourseSection === 'catalog'}>
                                                        <Link href={adminCoursesIndex.url({ query: { section: 'catalog' } })} prefetch>
                                                            <span>Title</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton asChild isActive={activeCourseSection === 'lesson'}>
                                                        <Link href={adminCoursesIndex.url({ query: { section: 'lesson' } })} prefetch>
                                                            <span>Topic</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton asChild isActive={activeCourseSection === 'task'}>
                                                        <Link href={adminCoursesIndex.url({ query: { section: 'task' } })} prefetch>
                                                            <span>Task</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>

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
                        </SidebarGroupContent>
                    </SidebarGroup>
                ) : null}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
