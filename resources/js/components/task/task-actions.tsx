import { ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TaskActionsProps = {
    onPrevious?: () => void;
    onNext?: () => void;
    onSubmit?: () => void;
    onRetry?: () => void;
    previousLabel?: string;
    nextLabel?: string;
    submitLabel?: string;
    retryLabel?: string;
    isSubmitting?: boolean;
    isNextDisabled?: boolean;
    isPreviousDisabled?: boolean;
    isSubmitDisabled?: boolean;
    className?: string;
};

export function TaskActions({
    onPrevious,
    onNext,
    onSubmit,
    onRetry,
    previousLabel = 'Previous',
    nextLabel = 'Next',
    submitLabel = 'Submit',
    retryLabel = 'Retry',
    isSubmitting = false,
    isNextDisabled = false,
    isPreviousDisabled = false,
    isSubmitDisabled = false,
    className,
}: TaskActionsProps) {
    return (
        <div
            className={cn('flex items-center justify-between gap-4', className)}
        >
            <div>
                {onPrevious && (
                    <Button
                        variant="outline"
                        onClick={onPrevious}
                        disabled={isPreviousDisabled || isSubmitting}
                    >
                        <ChevronLeft className="mr-2 size-4" />
                        {previousLabel}
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2">
                {onRetry && (
                    <Button
                        variant="outline"
                        onClick={onRetry}
                        disabled={isSubmitting}
                    >
                        <RotateCcw className="mr-2 size-4" />
                        {retryLabel}
                    </Button>
                )}

                {onSubmit && (
                    <Button
                        onClick={onSubmit}
                        disabled={isSubmitDisabled || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            submitLabel
                        )}
                    </Button>
                )}

                {onNext && (
                    <Button
                        onClick={onNext}
                        disabled={isNextDisabled || isSubmitting}
                    >
                        {nextLabel}
                        <ChevronRight className="ml-2 size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
