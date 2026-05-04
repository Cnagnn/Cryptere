import type { ReactNode } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type TaskCardProps = {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    headerAction?: ReactNode;
};

export function TaskCard({
    title,
    description,
    children,
    className,
    headerAction,
}: TaskCardProps) {
    return (
        <Card className={cn('w-full', className)}>
            <CardHeader className="space-y-1">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl">{title}</CardTitle>
                        {description && (
                            <CardDescription className="text-base">
                                {description}
                            </CardDescription>
                        )}
                    </div>
                    {headerAction && (
                        <div className="flex-shrink-0">{headerAction}</div>
                    )}
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
