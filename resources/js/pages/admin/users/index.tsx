import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Shield, Trash2, UserRound } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { useInitials } from '@/hooks/use-initials';
import { dashboard } from '@/routes';
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

function splitEmail(email: string): { localPart: string; domain: string } {
    const [localPart, ...domainParts] = email.split('@');

    return {
        localPart,
        domain: domainParts.join('@') || 'unknown',
    };
}

export default function AdminUsersIndex({ users, filters }: Props) {
    const getInitials = useInitials();
    const pointsFormatter = useMemo(() => new Intl.NumberFormat('id-ID'), []);
    const [searchInput, setSearchInput] = useState(filters.search);
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>(
        filters.role === 'admin' || filters.role === 'member' ? filters.role : 'all',
    );

    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);
    const [editingRole, setEditingRole] = useState<'admin' | 'member'>('member');
    const [editingPoints, setEditingPoints] = useState('0');
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

    const hasInitializedAutoFilter = useRef(false);

    const syncFilters = useCallback((searchValue: string, roleValue: 'all' | 'admin' | 'member', page = 1, perPage = users.per_page): void => {
        router.get(
            usersIndex.url({
                query: {
                    page,
                    per_page: perPage,
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
    }, [users.per_page]);

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

    const handlePointsChange = (rawValue: string): void => {
        const digitsOnly = rawValue.replace(/\D/g, '');

        if (digitsOnly === '') {
            setEditingPoints('');

            return;
        }

        setEditingPoints(pointsFormatter.format(Number.parseInt(digitsOnly, 10)));
    };

    const submitEdit = (): void => {
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

    const submitDelete = (): void => {
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

    const columns = useMemo<ColumnDef<UserRow>[]>(() => [
        {
            accessorKey: 'name',
            header: 'User',
            cell: ({ row }) => (
                <div className="flex items-center gap-3 text-left">
                    <Avatar>
                        <AvatarImage src={row.original.avatar ?? undefined} alt={row.original.name} />
                        <AvatarFallback>{getInitials(row.original.username ?? row.original.name)}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm">
                        {row.original.username ? `@${row.original.username}` : '@unknown'}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Email Address',
            cell: ({ row }) => {
                const { localPart, domain } = splitEmail(row.original.email);

                return (
                    <span className="inline-grid grid-cols-[14ch_auto] items-baseline text-sm text-muted-foreground">
                        <span className="truncate text-right">{localPart}</span>
                        <span className="pl-1">@{domain}</span>
                    </span>
                );
            },
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <Badge variant="outline" className="capitalize">
                        {row.original.role === 'admin' ? <Shield /> : <UserRound />}
                        {row.original.role}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'points',
            header: 'Points',
            cell: ({ row }) => `${pointsFormatter.format(row.original.points)} pts`,
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon">
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => {
                                    setEditingUser(row.original);
                                    setEditingRole(row.original.role);
                                    setEditingPoints(pointsFormatter.format(row.original.points));
                                }}
                            >
                                <Shield data-icon="inline-start" />
                                Edit access
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                disabled={!row.original.can_delete}
                                onClick={() => {
                                    if (!row.original.can_delete) {
                                        return;
                                    }

                                    setDeletingUser(row.original);
                                }}
                            >
                                <Trash2 data-icon="inline-start" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ], [getInitials, pointsFormatter]);

    return (
        <>
            <Head title="Management - Users" />

            <div className="flex flex-col gap-6 px-4 pt-3 pb-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-col gap-0">
                        <TypographyH1>User Management</TypographyH1>
                        <TypographyMuted className="text-sm/6">
                            Manage user roles and point balances from a single workspace.
                        </TypographyMuted>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <div className="w-full sm:w-80">
                            <Input
                                id="user-search"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        syncFilters(searchInput, roleFilter, 1);
                                    }
                                }}
                                placeholder="Search username..."
                            />
                        </div>

                        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as 'all' | 'admin' | 'member')}>
                            <SelectTrigger id="role-filter" className="w-full sm:w-40">
                                <SelectValue placeholder="All roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="all">All roles</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="member">Member</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </header>

                <section className="grid gap-4">
                    <div className="flex flex-col gap-4">
                        {users.data.length === 0 ? (
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <UserRound />
                                    </EmptyMedia>
                                    <EmptyTitle>No users found</EmptyTitle>
                                    <EmptyDescription>
                                        Try different filters or keywords.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={users.data}
                                centered
                                showFilterInput={false}
                                showColumnToggle={false}
                                showPageInfo={false}
                                enableDefaultIdSort={false}
                                page={users.current_page}
                                pageCount={users.last_page}
                                pageSize={users.per_page}
                                onPageChange={(nextPage) => syncFilters(searchInput, roleFilter, nextPage)}
                                onPageSizeChange={(nextPageSize) => syncFilters(searchInput, roleFilter, 1, nextPageSize)}
                                footerInfo={`Showing ${users.from ?? 0} - ${users.to ?? 0} of ${users.total} users`}
                            />
                        )}
                    </div>
                </section>

                <AlertDialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <AlertDialogContent className="sm:max-w-lg">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Edit User Access</AlertDialogTitle>
                            <AlertDialogDescription>
                                Update role and points for {editingUser?.username ? `@${editingUser.username}` : editingUser?.name ?? 'this user'}.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <FieldGroup>
                            <Field>
                                <FieldLabel>Username</FieldLabel>
                                <Input value={editingUser?.username ?? '-'} readOnly />
                            </Field>

                            <Field>
                                <FieldLabel>Email</FieldLabel>
                                <Input value={editingUser?.email ?? ''} readOnly />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="edit-user-role">Role</FieldLabel>
                                <Select value={editingRole} onValueChange={(value: 'admin' | 'member') => setEditingRole(value)}>
                                    <SelectTrigger id="edit-user-role">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="member">Member</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="edit-user-points">Points</FieldLabel>
                                <Input
                                    id="edit-user-points"
                                    type="text"
                                    inputMode="numeric"
                                    value={editingPoints}
                                    onChange={(event) => handlePointsChange(event.target.value)}
                                    placeholder="0"
                                />
                                <FieldDescription>
                                    Numbers only. Values are formatted automatically.
                                </FieldDescription>
                            </Field>
                        </FieldGroup>

                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setEditingUser(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={submitEdit} disabled={isSubmittingEdit}>
                                {isSubmittingEdit ? 'Saving...' : 'Save changes'}
                            </AlertDialogAction>
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
                            <AlertDialogAction type="button" onClick={submitDelete} disabled={isSubmittingDelete}>
                                {isSubmittingDelete ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
}

AdminUsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Home',
            href: dashboard(),
        },
        {
            title: 'Management',
            href: usersIndex(),
        },
        {
            title: 'Users',
            href: usersIndex(),
        },
    ],
};
