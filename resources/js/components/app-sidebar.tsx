import { Link, router, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    ChevronsUpDown,
    ChevronRight,
    FlaskConical,
    LayoutGrid,
    LogOut,
    Settings,
    Trophy,
    User,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
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
import { useAppearance } from '@/hooks/use-appearance';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { dashboard, logout } from '@/routes';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import { index as adminUsersIndex } from '@/routes/admin/users';
import { index as coursesIndex } from '@/routes/courses';
import { index as labsIndex } from '@/routes/labs';
import { index as leaderboardIndex } from '@/routes/leaderboard';
import { show as profileShow } from '@/routes/profile';
import { edit as settingsProfileEdit } from '@/routes/settings/profile';
import type { NavItem } from '@/types';
import type { Auth, User as UserType } from '@/types/auth';

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
        title: 'Users',
        href: adminUsersIndex(),
        icon: Users,
    },
];

export function UserMenuContent({ user }: { user: UserType }) {
    const handleLogout = () => {
        router.post(logout.url());
    };
    const level = user.level;
    const levelProgress = level
        ? Math.round(Math.min(Math.max(level.progress, 0), 100))
        : 0;
    const hasNextLevel =
        level?.next_level_xp !== null && level?.next_level_xp !== undefined;
    const levelXpLabel =
        level && hasNextLevel
            ? `${level.current_xp}/${level.next_level_xp} XP`
            : `${level?.current_xp ?? user.xp} XP`;

    return (
        <>
            <DropdownMenuLabel className="text-popover-foreground">
                <div className="flex items-center gap-2">
                    <Avatar className="size-8 rounded-lg">
                        <AvatarImage
                            src={user.avatar ?? undefined}
                            alt={user.name}
                        />
                        <AvatarFallback className="rounded-lg">
                            {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                            @{user.username ?? user.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                            {user.email}
                        </span>
                    </div>
                </div>
            </DropdownMenuLabel>
            {level ? (
                <div className="flex flex-col gap-2 px-1.5 py-2">
                    <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium text-popover-foreground">
                            Level {level.level}
                        </span>
                        <span className="text-muted-foreground">
                            {levelXpLabel}
                        </span>
                    </div>
                    <Progress
                        value={levelProgress}
                        aria-label={`Level ${level.level} progress`}
                    />
                </div>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        href={profileShow.url({
                            user: user.username ?? String(user.id),
                        })}
                    >
                        <User className="mr-2 size-4" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={settingsProfileEdit.url()}>
                        <Settings className="mr-2 size-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 size-4" />
                <span>Log out</span>
            </DropdownMenuItem>
        </>
    );
}

export function AppSidebar() {
    const page = usePage<{ auth: Auth }>();
    const { resolvedAppearance } = useAppearance();
    const { auth } = page.props;
    const { isCurrentUrl } = useCurrentUrl();

    // Guard: if auth or user not available, don't render
    if (!auth?.user) {
        return null;
    }

    const isCourseManagementPage = isCurrentUrl(
        adminCoursesIndex(),
        undefined,
        true,
    );
    const activeCourseSection = isCourseManagementPage
        ? (new URLSearchParams(page.url.split('?')[1] ?? '').get('section') ??
          'catalog')
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
                                        src={
                                            resolvedAppearance === 'light'
                                                ? '/images/Logo/Logomark-Black.svg'
                                                : '/images/Logo/Logomark.svg'
                                        }
                                        alt="Cryptere"
                                        className="hidden h-7 w-auto group-data-[collapsible=icon]:block"
                                    />
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNavItems.map((item) => {
                                const href =
                                    typeof item.href === 'string'
                                        ? item.href
                                        : item.href.url;

                                return (
                                    <SidebarMenuItem key={href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isCurrentUrl(item.href)}
                                        >
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                {auth.user.is_admin ? (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Management</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <Collapsible
                                    defaultOpen={isCourseManagementPage}
                                    className="group/courses"
                                >
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton
                                                isActive={
                                                    isCourseManagementPage
                                                }
                                                tooltip={{
                                                    children: 'Courses',
                                                }}
                                            >
                                                <BookOpenCheck />
                                                <span>Courses</span>
                                                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/courses:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={
                                                            activeCourseSection ===
                                                            'catalog'
                                                        }
                                                    >
                                                        <Link
                                                            href={adminCoursesIndex.url(
                                                                {
                                                                    query: {
                                                                        section:
                                                                            'catalog',
                                                                    },
                                                                },
                                                            )}
                                                            prefetch
                                                        >
                                                            <span>Title</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={
                                                            activeCourseSection ===
                                                            'lesson'
                                                        }
                                                    >
                                                        <Link
                                                            href={adminCoursesIndex.url(
                                                                {
                                                                    query: {
                                                                        section:
                                                                            'lesson',
                                                                    },
                                                                },
                                                            )}
                                                            prefetch
                                                        >
                                                            <span>Topic</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={
                                                            activeCourseSection ===
                                                            'task'
                                                        }
                                                    >
                                                        <Link
                                                            href={adminCoursesIndex.url(
                                                                {
                                                                    query: {
                                                                        section:
                                                                            'task',
                                                                    },
                                                                },
                                                            )}
                                                            prefetch
                                                        >
                                                            <span>Task</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={
                                                            activeCourseSection ===
                                                            'assessment'
                                                        }
                                                    >
                                                        <Link
                                                            href={adminCoursesIndex.url(
                                                                {
                                                                    query: {
                                                                        section:
                                                                            'assessment',
                                                                    },
                                                                },
                                                            )}
                                                            prefetch
                                                        >
                                                            <span>
                                                                Assessment
                                                            </span>
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
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="size-8 rounded-lg">
                                        <AvatarImage
                                            src={auth.user.avatar ?? undefined}
                                            alt={auth.user.name}
                                        />
                                        <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                            {auth.user.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                        <span className="truncate font-semibold">
                                            @
                                            {auth.user.username ??
                                                auth.user.name}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {auth.user.email}
                                        </span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                side="top"
                                align="end"
                                sideOffset={4}
                            >
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
