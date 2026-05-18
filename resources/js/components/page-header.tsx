import type { ReactNode } from 'react';

import { TypographyH1, TypographyMuted } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
};

export function PageHeader({
    title,
    description,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <header
            className={cn(
                'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
                className,
            )}
        >
            <div className="flex min-w-0 flex-col gap-1">
                <TypographyH1>{title}</TypographyH1>
                {description ? (
                    <TypographyMuted>{description}</TypographyMuted>
                ) : null}
            </div>

            {actions ? (
                <div className="flex shrink-0 items-center justify-end gap-2">
                    {actions}
                </div>
            ) : null}
        </header>
    );
}
