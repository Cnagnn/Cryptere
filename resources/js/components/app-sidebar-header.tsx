import { router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    BookOpenCheck,
    ClipboardList,
    FlaskConical,
    KeyRound,
    LayoutGrid,
    Search,
    Settings,
    ShieldCheck,
    Trophy,
    User,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { buildBreadcrumbsFromUrl, withHomeBreadcrumb } from '@/lib/breadcrumbs';
import { dashboard, search as searchRoute } from '@/routes';
import { index as adminCoursesIndex } from '@/routes/admin/courses';
import { index as adminUsersIndex } from '@/routes/admin/users';
import {
    index as assessmentsIndex,
    mastery as assessmentsMastery,
} from '@/routes/assessments';
import { index as coursesIndex } from '@/routes/courses';
import { index as labsIndex, show as labsShow } from '@/routes/labs';
import { index as leaderboardIndex } from '@/routes/leaderboard';
import {
    settings as profileSettings,
    show as profileShow,
} from '@/routes/profile';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import type { Auth, User as UserType } from '@/types/auth';

type Props = {
    breadcrumbs?: BreadcrumbItemType[];
};

type SearchResult = {
    type: string;
    title: string;
    description: string;
    url: string;
};

type CommandMenuItem = {
    title: string;
    description: string;
    url: string;
    icon: LucideIcon;
};

const navigationItems: CommandMenuItem[] = [
    {
        title: 'Dashboard',
        description: 'Overview of learning progress and activity.',
        url: dashboard().url,
        icon: LayoutGrid,
    },
    {
        title: 'Courses',
        description: 'Browse structured lessons and learning paths.',
        url: coursesIndex.url(),
        icon: BookOpenCheck,
    },
    {
        title: 'Labs',
        description: 'Explore interactive cryptography simulations.',
        url: labsIndex.url(),
        icon: FlaskConical,
    },
    {
        title: 'Leaderboard',
        description: 'Compare rankings and learning progress.',
        url: leaderboardIndex.url(),
        icon: Trophy,
    },
    {
        title: 'Assessments',
        description: 'Practice mastery checks and skill evaluations.',
        url: assessmentsIndex.url(),
        icon: ClipboardList,
    },
    {
        title: 'Mastery',
        description: 'Review assessment mastery and knowledge progress.',
        url: assessmentsMastery.url(),
        icon: BarChart3,
    },
];

const managementItems: CommandMenuItem[] = [
    {
        title: 'Course Management Overview',
        description: 'Manage catalog, topics, tasks, and assessments.',
        url: adminCoursesIndex.url(),
        icon: BookOpenCheck,
    },
    {
        title: 'Manage Course Titles',
        description: 'Create, publish, archive, and reorder courses.',
        url: adminCoursesIndex.url({ query: { section: 'catalog' } }),
        icon: BookOpenCheck,
    },
    {
        title: 'Manage Topics',
        description: 'Organize lessons and course topic structure.',
        url: adminCoursesIndex.url({ query: { section: 'lesson' } }),
        icon: BookOpenCheck,
    },
    {
        title: 'Manage Tasks',
        description: 'Edit lesson tasks, videos, readings, and quizzes.',
        url: adminCoursesIndex.url({ query: { section: 'task' } }),
        icon: ClipboardList,
    },
    {
        title: 'Manage Course Assessments',
        description: 'Attach and manage assessments inside courses.',
        url: adminCoursesIndex.url({ query: { section: 'assessment' } }),
        icon: ClipboardList,
    },
    {
        title: 'Assessment Management',
        description: 'Manage standalone assessments from the course workspace.',
        url: adminCoursesIndex.url({ query: { section: 'assessment' } }),
        icon: ClipboardList,
    },
    {
        title: 'User Management',
        description: 'Manage user accounts and roles.',
        url: adminUsersIndex.url(),
        icon: Users,
    },
];

function accountItems(user?: UserType): CommandMenuItem[] {
    if (!user) {
        return [];
    }

    const profileRouteParameter = user.username ?? String(user.id);

    return [
        {
            title: 'Profile',
            description: 'Open your profile page.',
            url: profileShow.url({ user: profileRouteParameter }),
            icon: User,
        },
        {
            title: 'Settings',
            description: 'Manage profile visibility, account, and appearance.',
            url: profileSettings.url({ user: profileRouteParameter }),
            icon: Settings,
        },
    ];
}

const labItems: CommandMenuItem[] = [
    {
        title: 'Caesar Cipher',
        description: 'Classic alphabet shift with a numeric key.',
        url: labsShow.url('caesar-cipher-lab'),
        icon: KeyRound,
    },
    {
        title: 'Vigenere Cipher',
        description: 'Polyalphabetic cipher powered by a keyword.',
        url: labsShow.url('vigenere-cipher-lab'),
        icon: KeyRound,
    },
    {
        title: 'AES-128',
        description: 'Block cipher concepts and symmetric keys.',
        url: labsShow.url('aes-lab'),
        icon: ShieldCheck,
    },
    {
        title: 'DES',
        description: 'Classic Feistel cipher with key rounds.',
        url: labsShow.url('des-lab'),
        icon: ShieldCheck,
    },
    {
        title: 'RSA-256',
        description: 'Public keys, private keys, and modular arithmetic.',
        url: labsShow.url('rsa-lab'),
        icon: KeyRound,
    },
    {
        title: 'Digital Signature',
        description: 'Digital signing and verification workflow.',
        url: labsShow.url('digital-signature-lab'),
        icon: ShieldCheck,
    },
];

const resultIcons: Record<string, LucideIcon> = {
    course: BookOpenCheck,
    lesson: BookOpenCheck,
    lab: FlaskConical,
    assessment: ClipboardList,
    user: User,
};

const getResultIcon = (type: string): LucideIcon => resultIcons[type] ?? Search;

export function AppSidebarHeader({ breadcrumbs = [] }: Props) {
    const { props, url } = usePage<{ auth: Auth }>();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const isAdmin = Boolean(props.auth?.user?.is_admin);
    const visibleAccountItems = useMemo(
        () => accountItems(props.auth?.user),
        [props.auth?.user],
    );
    const resolvedBreadcrumbs = withHomeBreadcrumb(
        breadcrumbs.length > 0 ? breadcrumbs : buildBreadcrumbsFromUrl(url),
    );
    const visibleManagementItems = useMemo(
        () => (isAdmin ? managementItems : []),
        [isAdmin],
    );

    const visit = (targetUrl: string) => {
        setIsSearchOpen(false);
        setQuery('');
        router.visit(targetUrl);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === 'k'
            ) {
                event.preventDefault();
                setIsSearchOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const trimmedQuery = query.trim();

        if (trimmedQuery.length < 2) {
            setResults([]);
            setIsSearching(false);

            return;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => {
            setIsSearching(true);

            fetch(searchRoute.url({ query: { q: trimmedQuery } }), {
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                },
            })
                .then((response) => {
                    if (!response.ok) {
                        return { results: [] };
                    }

                    return response.json() as Promise<{
                        results: SearchResult[];
                    }>;
                })
                .then((payload) => setResults(payload.results ?? []))
                .catch((error: unknown) => {
                    if (
                        error instanceof DOMException &&
                        error.name === 'AbortError'
                    ) {
                        return;
                    }

                    setResults([]);
                })
                .finally(() => setIsSearching(false));
        }, 250);

        return () => {
            window.clearTimeout(timeoutId);
            controller.abort();
        };
    }, [query]);

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex w-full min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <SidebarTrigger className="-ml-1" />
                    {resolvedBreadcrumbs.length > 1 ? (
                        <div className="min-w-0 [&_ol]:flex-nowrap [&_ol]:overflow-hidden [&_span[aria-current='page']]:truncate">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {resolvedBreadcrumbs.map((item, index) => {
                                        const isLast =
                                            index ===
                                            resolvedBreadcrumbs.length - 1;
                                        const href =
                                            typeof item.href === 'string'
                                                ? item.href
                                                : item.href?.url;

                                        return (
                                            <Fragment key={href ?? index}>
                                                <BreadcrumbItem>
                                                    {isLast ? (
                                                        <BreadcrumbPage>
                                                            {item.title}
                                                        </BreadcrumbPage>
                                                    ) : (
                                                        <BreadcrumbLink
                                                            href={href}
                                                        >
                                                            {item.title}
                                                        </BreadcrumbLink>
                                                    )}
                                                </BreadcrumbItem>
                                                {!isLast ? (
                                                    <BreadcrumbSeparator />
                                                ) : null}
                                            </Fragment>
                                        );
                                    })}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    ) : null}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="hidden h-9 w-72 shrink-0 justify-between gap-3 rounded-lg bg-muted/30 px-3 text-sm font-normal text-muted-foreground shadow-none md:flex lg:w-80"
                    onClick={() => setIsSearchOpen(true)}
                >
                    <span className="flex min-w-0 items-center gap-2">
                        <Search className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                            Search pages, courses, profiles...
                        </span>
                    </span>
                    <kbd className="shrink-0 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        Ctrl K
                    </kbd>
                </Button>
                <CommandDialog
                    open={isSearchOpen}
                    onOpenChange={setIsSearchOpen}
                    title="Search"
                    description="Search pages, courses, lessons, labs, or public profiles."
                    className="max-w-xl sm:w-[min(38rem,calc(100vw-2rem))]"
                >
                    <Command shouldFilter>
                        <CommandInput
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Search pages, courses, lessons, labs, or profiles..."
                        />
                        <CommandList className="max-h-96">
                            <CommandEmpty>
                                {isSearching
                                    ? 'Searching...'
                                    : 'No matching results found.'}
                            </CommandEmpty>

                            <CommandGroup heading="Navigation">
                                {navigationItems.map((item) => (
                                    <CommandItem
                                        key={item.url}
                                        value={`${item.title} ${item.description}`}
                                        onSelect={() => visit(item.url)}
                                    >
                                        <item.icon className="size-4 text-muted-foreground" />
                                        <div className="flex min-w-0 flex-col">
                                            <span>{item.title}</span>
                                            <span className="truncate text-xs text-muted-foreground">
                                                {item.description}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>

                            {visibleAccountItems.length > 0 ? (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading="Account">
                                        {visibleAccountItems.map((item) => (
                                            <CommandItem
                                                key={item.url}
                                                value={`${item.title} ${item.description}`}
                                                onSelect={() => visit(item.url)}
                                            >
                                                <item.icon className="size-4 text-muted-foreground" />
                                                <div className="flex min-w-0 flex-col">
                                                    <span>{item.title}</span>
                                                    <span className="truncate text-xs text-muted-foreground">
                                                        {item.description}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            ) : null}

                            {visibleManagementItems.length > 0 ? (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading="Management">
                                        {visibleManagementItems.map((item) => (
                                            <CommandItem
                                                key={item.url}
                                                value={`${item.title} ${item.description}`}
                                                onSelect={() => visit(item.url)}
                                            >
                                                <item.icon className="size-4 text-muted-foreground" />
                                                <div className="flex min-w-0 flex-col">
                                                    <span>{item.title}</span>
                                                    <span className="truncate text-xs text-muted-foreground">
                                                        {item.description}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            ) : null}

                            <CommandSeparator />
                            <CommandGroup heading="Labs">
                                {labItems.map((item) => (
                                    <CommandItem
                                        key={item.url}
                                        value={`${item.title} ${item.description}`}
                                        onSelect={() => visit(item.url)}
                                    >
                                        <item.icon className="size-4 text-muted-foreground" />
                                        <div className="flex min-w-0 flex-col">
                                            <span>{item.title}</span>
                                            <span className="truncate text-xs text-muted-foreground">
                                                {item.description}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>

                            {results.length > 0 ? (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading="Search Results">
                                        {results.map((item) => {
                                            const ResultIcon = getResultIcon(
                                                item.type,
                                            );

                                            return (
                                                <CommandItem
                                                    key={`${item.type}-${item.url}`}
                                                    value={`${item.title} ${item.description} ${item.type}`}
                                                    onSelect={() =>
                                                        visit(item.url)
                                                    }
                                                >
                                                    <ResultIcon className="size-4 text-muted-foreground" />
                                                    <div className="flex min-w-0 flex-col">
                                                        <span>
                                                            {item.title}
                                                        </span>
                                                        <span className="truncate text-xs text-muted-foreground">
                                                            {item.description}
                                                        </span>
                                                    </div>
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </>
                            ) : null}
                        </CommandList>
                    </Command>
                </CommandDialog>
            </div>
        </header>
    );
}
