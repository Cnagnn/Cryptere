import { Link, router } from '@inertiajs/react';
import { LogOut, Settings, User } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { destroy } from '@/routes/auth/login';
import settingsIndex from '@/routes/settings';
import { show as profileShow } from '@/routes/profile';
import type { User as UserType } from '@/types/auth';

type Props = {
    user: UserType;
};

export function UserMenuContent({ user }: Props) {
    const handleLogout = () => {
        router.post(destroy.url());
    };

    return (
        <>
            <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                    </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link href={profileShow.url({ user: user.username ?? user.id })}>
                        <User className="mr-2 size-4" />
                        <span>Profil</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={settingsIndex.url()}>
                        <Settings className="mr-2 size-4" />
                        <span>Pengaturan</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 size-4" />
                <span>Keluar</span>
            </DropdownMenuItem>
        </>
    );
}
