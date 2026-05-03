import { Lock } from 'lucide-react';

import { PageShell } from '@/components/page-shell';
import { Separator } from '@/components/ui/separator';

type Props = {
    user: {
        name: string;
        username: string | null;
        avatar?: string | null;
    };
};

/**
 * Shown when a non-owner visits a private profile.
 * Uses the shared PageShell with a muted gradient and a lock message.
 */
export function ProfilePrivate({ user }: Props) {
    return (
        <PageShell
            name={user.name}
            avatar={user.avatar}
            title={user.name}
            subtitle={user.username ? `@${user.username}` : undefined}
            gradient="muted"
        >
            <Separator />

            <div className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                    <Lock className="size-7 text-muted-foreground" />
                </div>
                <div className="flex max-w-xs flex-col gap-1.5">
                    <p className="text-base font-semibold">
                        This profile is private
                    </p>
                    <p className="text-sm text-muted-foreground">
                        This user has chosen to keep their profile private. Only
                        they can see their full profile details.
                    </p>
                </div>
            </div>
        </PageShell>
    );
}
