import { cn } from '@/lib/utils';

interface StepBarProps {
    currentStep: number;
    totalSteps: number;
    onStepSelect: (step: number) => void;
}

export default function StepBar({ currentStep, onStepSelect }: StepBarProps) {
    return (
        <div className="flex items-center gap-0.5 py-3 overflow-x-auto">
            <StepDot label="IP" step={0} currentStep={currentStep} onSelect={onStepSelect} />
            <StepConnector done={currentStep > 0} />

            {Array.from({ length: 16 }, (_, i) => {
                const step = i + 1;

                return (
                    <span key={i} className="contents">
                        <StepDot label={`${step}`} step={step} currentStep={currentStep} onSelect={onStepSelect} />
                        {i < 15 && <StepConnector done={currentStep > step} />}
                    </span>
                );
            })}

            <StepConnector done={currentStep > 16} />
            <StepDot label="FP" step={17} currentStep={currentStep} onSelect={onStepSelect} />
        </div>
    );
}

function StepDot({
    label,
    step,
    currentStep,
    onSelect,
}: {
    label: string;
    step: number;
    currentStep: number;
    onSelect: (step: number) => void;
}) {
    const isActive = step === currentStep;
    const isDone = step < currentStep;

    return (
        <button
            onClick={() => onSelect(step)}
            className={cn(
                'shrink-0 size-7 rounded-full text-[10px] font-semibold transition-all',
                isActive && 'bg-primary text-primary-foreground shadow-sm scale-110',
                !isActive && isDone && 'bg-primary/15 text-primary border border-primary/30',
                !isActive && !isDone && 'bg-muted text-muted-foreground border border-border hover:bg-muted/80',
            )}
            title={label === 'IP' ? 'Initial Permutation' : label === 'FP' ? 'Final Permutation' : `Round ${label}`}
        >
            {label}
        </button>
    );
}

function StepConnector({ done }: { done: boolean }) {
    return (
        <div
            className={cn(
                'h-px flex-1 min-w-2 transition-colors',
                done ? 'bg-primary/40' : 'bg-border',
            )}
        />
    );
}
