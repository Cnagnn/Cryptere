import { Link, usePage } from '@inertiajs/react';
import {
    BookOpenCheck,
    Flag,
    FlaskConical,
    LayoutGrid,
    Menu,
    ScrollText,
    Search,
    Swords,
    Trophy,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { CommandPalette } from '@/components/command-palette';
import { DailyRewards } from '@/components/daily-rewards';
import { NotificationCenter } from '@/components/notification-center';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { buildBreadcrumbsFromUrl, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as challengesIndex } from '@/routes/challenges';
import { index as coursesIndex } from '@/routes/courses';
import { index as labsIndex } from '@/routes/labs';
import { index as leaderboardIndex } from '@/routes/leaderboard';
import type { Auth, BreadcrumbItem, NavItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

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

const activeItemStyles = 'bg-accent text-accent-foreground';

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage<{ auth: Auth }>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const resolvedBreadcrumbs = withHomeBreadcrumb(
        breadcrumbs.length > 0 ? breadcrumbs : buildBreadcrumbsFromUrl(page.url),
    );

    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="mr-2 size-8.5"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="size-5" />
                        </Button>

                        <AlertDialog
                            open={isMobileMenuOpen}
                            onOpenChange={setIsMobileMenuOpen}
                        >
                            <AlertDialogContent className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar sm:max-w-64">
                                <AlertDialogTitle className="sr-only">
                                    Navigation menu
                                </AlertDialogTitle>
                                <AlertDialogHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="size-6 fill-current text-black dark:text-white" />
                                </AlertDialogHeader>
                                <div className="flex h-full flex-1 flex-col gap-4 p-4">
                                    <div className="flex h-full flex-col text-sm">
                                        <div className="flex flex-col gap-4">
                                            {mainNavItems.map((item) => (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    className="flex items-center gap-2 font-medium"
                                                    onClick={() =>
                                                        setIsMobileMenuOpen(
                                                            false,
                                                        )
                                                    }
                                                >
                                                    {item.icon && (
                                                        <item.icon className="size-5" />
                                                    )}
                                                    <span>{item.title}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    <Link
                        href={dashboard()}
                        prefetch
                        className="flex items-center gap-2"
                    >
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="ml-6 hidden h-full items-center gap-6 lg:flex">
                        <NavigationMenu className="flex h-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch gap-2">
                                {mainNavItems.map((item, index) => (
                                    <NavigationMenuItem
                                        key={index}
                                        className="relative flex h-full items-center"
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                whenCurrentUrl(
                                                    item.href,
                                                    activeItemStyles,
                                                ),
                                                'h-9 cursor-pointer px-3',
                                            )}
                                        >
                                            {item.icon && (
                                                <item.icon className="mr-2 size-4" />
                                            )}
                                            {item.title}
                                        </Link>
                                        {isCurrentUrl(item.href) && (
                                            <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                                        )}
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <CommandPalette />
                        <DailyRewards />
                        <NotificationCenter />
                        <div className="relative flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="group size-9 cursor-pointer"
                                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                            >
                                <Search className="size-5! opacity-80 group-hover:opacity-100" />
                            </Button>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="size-10 rounded-full p-1"
                                >
                                    <Avatar className="size-8 overflow-hidden rounded-full">
                                        <AvatarImage
                                            src={auth.user?.avatar}
                                            alt={auth.user?.name}
                                        />
                                        <AvatarFallback className="bg-muted text-foreground rounded-lg">
                                            {getInitials(auth.user?.name ?? '')}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                {auth.user && (
                                    <UserMenuContent user={auth.user} />
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            {resolvedBreadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className="text-muted-foreground mx-auto flex h-12 w-full items-center justify-start px-4 text-sm md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={resolvedBreadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
