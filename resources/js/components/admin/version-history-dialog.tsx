import { router } from '@inertiajs/react';
import { History, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { restore as restoreVersion } from '@/routes/admin/versions';

export type VersionHistoryItem = {
    id: number;
    version_number: number;
    changed_fields: string[];
    change_summary: string | null;
    creator_name: string | null;
    created_at: string | null;
    restored_at: string | null;
};

type Props = {
    itemTitle: string;
    versions: VersionHistoryItem[];
    trigger?: ReactNode;
};

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export function VersionHistoryDialog({ itemTitle, versions, trigger }: Props) {
    const [restoreTarget, setRestoreTarget] =
        useState<VersionHistoryItem | null>(null);

    const submitRestore = () => {
        if (!restoreTarget) {
            return;
        }

        router.post(
            restoreVersion.url({ version: restoreTarget.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        `Versi ${restoreTarget.version_number} dipulihkan.`,
                    );
                    setRestoreTarget(null);
                },
                onError: (formErrors) => {
                    const messages = Object.values(formErrors)
                        .flat()
                        .join(', ');
                    toast.error(messages || 'Gagal memulihkan versi.');
                },
            },
        );
    };

    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    {trigger ?? (
                        <Button type="button" variant="outline" size="sm">
                            <History data-icon="inline-start" />
                            History
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Riwayat versi</DialogTitle>
                        <DialogDescription>{itemTitle}</DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                        {versions.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                Belum ada riwayat versi untuk item ini.
                            </div>
                        ) : (
                            versions.map((version) => (
                                <div
                                    key={version.id}
                                    className="rounded-lg border p-4"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="outline">
                                                    v{version.version_number}
                                                </Badge>
                                                {version.restored_at ? (
                                                    <Badge variant="secondary">
                                                        Restored
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <p className="text-sm font-medium">
                                                {version.change_summary ||
                                                    'Perubahan konten'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {version.creator_name ||
                                                    'System'}{' '}
                                                -{' '}
                                                {formatDate(version.created_at)}
                                            </p>
                                            {version.changed_fields.length >
                                            0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {version.changed_fields.map(
                                                        (field) => (
                                                            <Badge
                                                                key={field}
                                                                variant="outline"
                                                            >
                                                                {field}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setRestoreTarget(version)
                                            }
                                        >
                                            <RotateCcw data-icon="inline-start" />
                                            Restore
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={restoreTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setRestoreTarget(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Pulihkan versi?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Versi saat ini akan disimpan sebagai snapshot
                            sebelum item dikembalikan ke versi{' '}
                            {restoreTarget?.version_number}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={submitRestore}>
                            Pulihkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
