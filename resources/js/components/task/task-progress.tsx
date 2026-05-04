import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type TaskProgressProps = {
    current: number;
    total: number;
    label?: string;
    showPercentage?: boolean;
    className?: string;
};

export function TaskProgress({
    current,
    total,
    label,
    showPercentage = true,
    className,
}: TaskProgressProps) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className={cn('space-y-2', className)}>
            {(label || showPercentage) && (
                <div className="flex items-center justify-between text-sm">
                    {label && (
                        <span className="text-muted-foreground">{label}</span>
                    )}
                    {showPercentage && (
                        <span className="font-medium">
                            {current} / {total} ({percentage}%)
                        </span>
                    )}
                </div>
            )}
            <Progress value={percentage} className="h-2" />
        </div>
    );
}
