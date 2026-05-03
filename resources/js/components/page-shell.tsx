import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

type Props = {
    /** User name for avatar fallback */
    name: string;
    /** Avatar image URL */
    avatar?: string | null;
    /** Page title displayed next to avatar */
    title: string;
    /** Optional subtitle / description */
    subtitle?: string;
    /** Actions rendered to the right of the title (buttons, badges, etc.) */
    actions?: React.ReactNode;
    /** Content rendered below the identity row (stats, meta info, etc.) */
    children?: React.ReactNode;
    /** Extra className for the outer container */
    className?: string;
    /** Gradient color — defaults to primary */
    gradient?: 'primary' | 'muted';
};

/**
 * Shared page shell used by both Profile and Settings pages.
 * Provides a consistent visual identity: gradient banner → avatar overlap → title.
 */
export function PageShell({
    name,
    avatar,
    title,
    subtitle,
    actions,
    children,
    className,
    gradient = 'primary',
}: Props) {
    const getInitials = useInitials();

    const gradientClass =
        gradient === 'primary'
            ? 'from-primary/20 via-primary/10 to-transparent'
            : 'from-muted via-muted/60 to-transparent';

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl border bg-card',
                className,
            )}
        >
            {/* Gradient banner */}
            <div
                className={cn('h-28 bg-linear-to-br sm:h-36', gradientClass)}
            />

            {/* Content area */}
            <div className="relative px-6 pb-6">
                {/* Avatar + title row */}
                <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end">
                    <Avatar className="size-24 shrink-0 rounded-full ring-4 ring-card sm:size-28">
                        <AvatarImage src={avatar ?? undefined} alt={name} />
                        <AvatarFallback className="bg-muted text-2xl font-semibold text-foreground sm:text-3xl">
                            {getInitials(name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex flex-col gap-0.5">
                            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-sm text-muted-foreground">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {actions && (
                            <div className="flex shrink-0 items-center gap-2">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>

                {/* Extra content (stats, meta, etc.) */}
                {children && <div className="mt-5">{children}</div>}
            </div>
        </div>
    );
}
