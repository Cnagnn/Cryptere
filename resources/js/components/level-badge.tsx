import { Shield } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

import type { UserLevel } from '@/types/auth';

interface LevelBadgeProps {
    level?: UserLevel;
    variant?: 'compact' | 'full';
    className?: string;
}

export function LevelBadge({
    level,
    variant = 'compact',
    className,
}: LevelBadgeProps) {
    if (!level) {
        return null;
    }

    if (variant === 'compact') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span
                            className={`inline-flex items-center gap-1 text-sm font-medium ${className ?? ''}`}
                        >
                            <Shield className="size-4 text-primary" />
                            <span>Lv.{level.level}</span>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-center">
                        <p className="font-semibold">Level {level.level}</p>
                        <p className="text-xs text-muted-foreground">
                            {level.next_level_xp
                                ? `${level.current_xp} / ${level.next_level_xp} XP`
                                : 'Max Level'}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <div className={`space-y-1.5 ${className ?? ''}`}>
            <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    <Shield className="size-4 text-primary" />
                    Lv.{level.level}
                </span>
                <span className="text-xs text-muted-foreground">
                    {level.next_level_xp
                        ? `${level.current_xp} / ${level.next_level_xp} XP`
                        : 'Max Level'}
                </span>
            </div>
            <Progress value={level.progress} className="h-2" />
        </div>
    );
}
