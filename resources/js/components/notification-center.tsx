import {
    Award,
    Bell,
    BookOpenCheck,
    CheckCheck,
    Flame,
    Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
    index as fetchNotifications,
    markAsRead,
    markAllAsRead,
} from '@/actions/App/Http/Controllers/NotificationController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type NotificationItem = {
    id: string;
    type: string;
    data: {
        category?: string;
        title: string;
        message: string;
        url?: string;
        icon?: string;
        tier?: string;
    };
    read_at: string | null;
    created_at: string;
};

const categoryIcons: Record<string, React.ElementType> = {
    achievement: Award,
    course: BookOpenCheck,
    streak: Flame,
    default: Sparkles,
};

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60_000);

    if (diffMin < 1) {
return 'Just now';
}

    if (diffMin < 60) {
return `${diffMin}m ago`;
}

    const diffHr = Math.floor(diffMin / 60);

    if (diffHr < 24) {
return `${diffHr}h ago`;
}

    const diffDay = Math.floor(diffHr / 24);

    if (diffDay < 7) {
return `${diffDay}d ago`;
}

    return new Date(dateStr).toLocaleDateString();
}

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const loadNotifications = useCallback(async () => {
        setLoading(true);

        try {
            const response = await fetch(fetchNotifications.url(), {
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
return;
}

            const data = await response.json();
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unread_count ?? 0);
        } catch {
            // Silently fail
        } finally {
            setLoading(false);
        }
    }, []);

    // Load on mount and poll every 60s
    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 60_000);

        return () => clearInterval(interval);
    }, [loadNotifications]);

    // Reload when dropdown opens
    useEffect(() => {
        if (open) {
            loadNotifications();
        }
    }, [open, loadNotifications]);

    async function handleMarkAsRead(id: string) {
        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            await fetch(markAsRead.url(id), {
                method: 'PATCH',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken ?? '',
                },
            });

            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === id
                        ? { ...n, read_at: new Date().toISOString() }
                        : n,
                ),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
            // Silently fail
        }
    }

    async function handleMarkAllAsRead() {
        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            await fetch(markAllAsRead.url(), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken ?? '',
                },
            });

            setNotifications((prev) =>
                prev.map((n) => ({
                    ...n,
                    read_at: n.read_at ?? new Date().toISOString(),
                })),
            );
            setUnreadCount(0);
        } catch {
            // Silently fail
        }
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-9 cursor-pointer"
                >
                    <Bell className="size-5 opacity-80 group-hover:opacity-100" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-xs"
                            onClick={(e) => {
                                e.preventDefault();
                                handleMarkAllAsRead();
                            }}
                        >
                            <CheckCheck data-icon="inline-start" />
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {loading && notifications.length === 0 ? (
                    <div className="flex flex-col gap-3 p-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <Skeleton className="size-8 rounded-full" />
                                <div className="flex flex-1 flex-col gap-1.5">
                                    <Skeleton className="h-3 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                        <Bell className="size-8 opacity-30" />
                        <p>No notifications yet</p>
                        <p className="text-xs">
                            Complete courses and challenges to earn
                            notifications!
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-80">
                        <DropdownMenuGroup>
                            {notifications.map((notification, index) => {
                                const category =
                                    notification.data.category ?? 'default';
                                const Icon =
                                    categoryIcons[category] ??
                                    categoryIcons.default;
                                const isUnread = !notification.read_at;

                                return (
                                    <div key={notification.id}>
                                        {index > 0 && <Separator />}
                                        <DropdownMenuItem
                                            className={cn(
                                                'flex cursor-pointer items-start gap-3 p-3',
                                                isUnread && 'bg-accent/50',
                                            )}
                                            onClick={() => {
                                                if (isUnread) {
                                                    handleMarkAsRead(
                                                        notification.id,
                                                    );
                                                }

                                                if (notification.data.url) {
                                                    window.location.href =
                                                        notification.data.url;
                                                }
                                            }}
                                        >
                                            <div
                                                className={cn(
                                                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                                                    isUnread
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'bg-muted text-muted-foreground',
                                                )}
                                            >
                                                <Icon className="size-4" />
                                            </div>
                                            <div className="flex flex-1 flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">
                                                        {
                                                            notification.data
                                                                .title
                                                        }
                                                    </span>
                                                    {isUnread && (
                                                        <Badge
                                                            variant="default"
                                                            className="h-4 px-1 text-[10px]"
                                                        >
                                                            New
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        notification.data
                                                            .message
                                                    }
                                                </p>
                                                <span className="text-[10px] text-muted-foreground/70">
                                                    {timeAgo(
                                                        notification.created_at,
                                                    )}
                                                </span>
                                            </div>
                                        </DropdownMenuItem>
                                    </div>
                                );
                            })}
                        </DropdownMenuGroup>
                    </ScrollArea>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
