import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DataTable,
} from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useInitials } from '@/hooks/use-initials';
import { destroy, index as usersIndex, update } from '@/routes/admin/users';

type UserRow = {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    username: string | null;
    points: number;
    role: 'admin' | 'member';
    created_at: string;
    can_delete: boolean;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type Props = {
    users: Paginated<UserRow>;
    filters: {
        search: string;
        role: string;
    };
};

export default function AdminUsersIndex({ users, filters }: Props) {
    const getInitials = useInitials();
    const pointsFormatter = useMemo(() => new Intl.NumberFormat('id-ID'), []);
    const [searchInput, setSearchInput] = useState(filters.search);
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>(
        filters.role === 'admin' || filters.role === 'member' ? filters.role : 'all'
    );
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);
    const [editingUsername, setEditingUsername] = useState('');
    const [editingEmail, setEditingEmail] = useState('');
    const [editingRole, setEditingRole] = useState<'admin' | 'member'>('member');
    const [editingPoints, setEditingPoints] = useState('0');
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
    const hasInitializedAutoFilter = useRef(false);

    const openEditDialog = useCallback((user: UserRow) => {
        setEditingUser(user);
        setEditingUsername(user.username ?? '');
        setEditingEmail(user.email);
        setEditingRole(user.role);
        setEditingPoints(pointsFormatter.format(user.points));
    }, [pointsFormatter]);

    const resolvePointsValue = (): number => {
        if (!editingUser) {
            return 0;
        }

        const parsedValue = Number.parseInt(editingPoints.replace(/\./g, '').trim(), 10);

        if (Number.isNaN(parsedValue)) {
            return editingUser.points;
        }

        return Math.max(0, parsedValue);
    };

    const incrementPoints = (delta: number) => {
        const current = Number.parseInt(editingPoints.replace(/\./g, ''), 10);
        const safeCurrent = Number.isNaN(current) ? 0 : current;

        setEditingPoints(pointsFormatter.format(Math.max(0, safeCurrent + delta)));
    };

    const handlePointsChange = (rawValue: string) => {
        const digitsOnly = rawValue.replace(/\D/g, '');

        if (digitsOnly === '') {
            setEditingPoints('');

            return;
        }

        setEditingPoints(pointsFormatter.format(Number.parseInt(digitsOnly, 10)));
    };

    const submitEdit = () => {
        if (!editingUser) {
            return;
        }

        setIsSubmittingEdit(true);
        router.patch(update.url({ user: editingUser.id }), {
            role: editingRole,
            points: resolvePointsValue(),
        }, {
            preserveScroll: true,
            onFinish: () => setIsSubmittingEdit(false),
            onSuccess: () => setEditingUser(null),
        });
    };

    const submitDelete = () => {
        if (!deletingUser) {
            return;
        }

        setIsSubmittingDelete(true);
        router.delete(destroy.url({ user: deletingUser.id }), {
            preserveScroll: true,
            onFinish: () => setIsSubmittingDelete(false),
            onSuccess: () => setDeletingUser(null),
        });
    };

    const syncFilters = useCallback((searchValue: string, roleValue: 'all' | 'admin' | 'member', page = 1): void => {
        router.get(
            usersIndex.url({
                query: {
                    page,
                    search: searchValue.trim() || undefined,
                    role: roleValue === 'all' ? undefined : roleValue,
                },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }, []);

    const handlePageChange = (nextPage: number): void => {
        syncFilters(searchInput, roleFilter, nextPage);
    };

    useEffect(() => {
        if (!hasInitializedAutoFilter.current) {
            hasInitializedAutoFilter.current = true;

            return;
        }

        const timer = window.setTimeout(() => {
            syncFilters(searchInput, roleFilter, 1);
        }, 300);

        return () => window.clearTimeout(timer);
    }, [roleFilter, searchInput, syncFilters]);

    const columns = useMemo<ColumnDef<UserRow>[]>(() => [
        {
            accessorKey: 'username',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    aria-sort={column.getIsSorted() === false ? 'none' : column.getIsSorted() === 'asc' ? 'ascending' : 'descending'}
                >
                    Username
                    <ArrowUpDown className="size-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <div className="grid w-64 grid-cols-[1.75rem_1fr] items-center gap-2 text-left">
                        <Avatar className="size-7 rounded-full">
                            <AvatarImage src={row.original.avatar ?? undefined} alt={row.original.name} />
                            <AvatarFallback>{getInitials(row.original.username ?? row.original.name)}</AvatarFallback>
                        </Avatar>
                        <p className="truncate font-medium">{row.original.username ? `@${row.original.username}` : '-'}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'email',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    aria-sort={column.getIsSorted() === false ? 'none' : column.getIsSorted() === 'asc' ? 'ascending' : 'descending'}
                >
                    Email
                    <ArrowUpDown className="size-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const [localPart, domainPart] = row.original.email.split('@');

                return (
                    <div className="flex justify-center">
                        <div className="grid w-80 grid-cols-[1fr_auto_1fr] items-center text-sm text-muted-foreground">
                            <span className="truncate text-right">{localPart}</span>
                            <span className="px-0.5">@</span>
                            <span className="truncate text-left">{domainPart ?? ''}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'points',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    aria-sort={column.getIsSorted() === false ? 'none' : column.getIsSorted() === 'asc' ? 'ascending' : 'descending'}
                >
                    Points
                    <ArrowUpDown className="size-4" />
                </Button>
            ),
            cell: ({ row }) => pointsFormatter.format(row.original.points),
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => <p className="capitalize">{row.original.role}</p>,
        },
        {
            id: 'actions',
            enableHiding: false,
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(row.original)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                disabled={!row.original.can_delete}
                                onClick={() => {
                                    if (!row.original.can_delete) {
                                        return;
                                    }

                                    setDeletingUser(row.original);
                                }}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], [getInitials, openEditDialog, pointsFormatter]);

    return (
        <>
            <Head title="Management - Users" />

            <div className="flex flex-col gap-6 px-4 py-6">
                <header className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <h1 className="text-2xl font-semibold tracking-tight">Users Management</h1>
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            Manage user access, roles, and point balances.
                        </p>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <Input
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        syncFilters(searchInput, roleFilter, 1);
                                    }
                                }}
                                placeholder="Search name, username, or email"
                                className="w-full sm:min-w-72"
                            />
                            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as 'all' | 'admin' | 'member')}>
                                <SelectTrigger className="w-full sm:w-40">
                                    <SelectValue placeholder="All roles" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectGroup>
                                        <SelectItem value="all">All roles</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="member">Member</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </header>

                <DataTable
                    columns={columns}
                    data={users.data}
                    showFilterInput={false}
                    showColumnToggle={false}
                    centered
                    showPageSizeSelector={false}
                    showPageInfo={false}
                    page={users.current_page}
                    pageCount={users.last_page}
                    pageSize={users.per_page}
                    onPageChange={handlePageChange}
                    footerInfo={`Showing ${users.from ?? 0} - ${users.to ?? 0} of ${users.total} users.`}
                />

                <AlertDialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <AlertDialogContent className="w-full overflow-y-auto sm:max-w-xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Edit User Access</AlertDialogTitle>
                            <AlertDialogDescription>
                                Update access for {editingUser?.username ? `@${editingUser.username}` : editingUser?.name ?? 'this user'}.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="flex flex-col gap-3 px-4">
                            <div className="flex flex-col gap-1.5">
                                <p className="text-sm font-medium">Username</p>
                                <Input value={editingUsername} readOnly className="bg-muted/40" />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <p className="text-sm font-medium">Email</p>
                                <Input type="email" value={editingEmail} readOnly className="bg-muted/40" />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <p className="text-sm font-medium">Role</p>
                                <Select value={editingRole} onValueChange={(value: 'admin' | 'member') => setEditingRole(value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="member">Member</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <p className="text-sm font-medium">Points</p>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={editingPoints}
                                    onChange={(event) => handlePointsChange(event.target.value)}
                                    placeholder="0"
                                />
                                <div className="flex flex-wrap gap-2 pt-1">
                                    <Button type="button" size="sm" variant="outline" onClick={() => incrementPoints(1)}>+1</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={() => incrementPoints(5)}>+5</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={() => incrementPoints(10)}>+10</Button>
                                    <Button type="button" size="sm" variant="outline" onClick={() => incrementPoints(50)}>+50</Button>
                                </div>
                            </div>
                        </div>

                        <AlertDialogFooter className="mt-4 sm:flex-row sm:justify-end">
                            <AlertDialogCancel onClick={() => setEditingUser(null)}>
                                Cancel
                            </AlertDialogCancel>
                            <Button type="button" onClick={submitEdit} disabled={isSubmittingEdit}>
                                {isSubmittingEdit ? 'Saving...' : 'Save changes'}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={Boolean(deletingUser)} onOpenChange={(open) => !open && setDeletingUser(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete user?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. {deletingUser?.username ? `@${deletingUser.username}` : deletingUser?.name ?? 'This user'} will lose access permanently.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <AlertDialogCancel type="button" onClick={() => setDeletingUser(null)}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                type="button"
                                onClick={submitDelete}
                                disabled={isSubmittingDelete}
                            >
                                {isSubmittingDelete ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
}
