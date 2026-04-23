import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();
    const usernameLabel = user.username ? `@${user.username}` : user.name;

    return (
        <>
            <Avatar className="size-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-muted text-foreground rounded-lg">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{usernameLabel}</span>
                {showEmail && (
                    <span className="truncate text-sm text-muted-foreground">
                        {user.email}
                    </span>
                )}
                {user.level && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Lv.{user.level.level}</span>
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${user.level.progress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
