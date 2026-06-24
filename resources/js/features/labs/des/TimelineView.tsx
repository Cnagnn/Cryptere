import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import type { DesTrace } from '@/types/labs';

interface TimelineViewProps {
    trace: DesTrace;
    currentStep: number;
    onStepSelect: (step: number) => void;
}

export default function TimelineView({ currentStep, onStepSelect }: TimelineViewProps) {
    const steps = [
        { label: 'IP', title: 'Initial Permutation', step: 0 },
        ...Array.from({ length: 16 }, (_, i) => ({
            label: `${i + 1}`,
            title: `Feistel Round ${i + 1}`,
            step: i + 1,
        })),
        { label: 'FP', title: 'Final Permutation', step: 17 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
        >
            {steps.map((s) => {
                const isActive = s.step === currentStep;
                const isDone = s.step < currentStep;

                return (
                    <button
                        key={s.step}
                        onClick={() => onStepSelect(s.step)}
                        className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all text-xs',
                            isActive
                                ? 'bg-primary/10 border border-primary/30'
                                : isDone
                                  ? 'hover:bg-muted/30 border border-transparent'
                                  : 'hover:bg-muted/20 border border-transparent opacity-60',
                        )}
                    >
                        <span
                            className={cn(
                                'shrink-0 size-6 rounded-full flex items-center justify-center text-[9px] font-semibold',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : isDone
                                      ? 'bg-primary/15 text-primary border border-primary/30'
                                      : 'bg-muted/30 text-muted-foreground border border-border/30',
                            )}
                        >
                            {s.label}
                        </span>
                        <span className={cn('font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                            {s.title}
                        </span>
                    </button>
                );
            })}
        </motion.div>
    );
}
