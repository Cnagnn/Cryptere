import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type FallbackProps = {
    error: unknown;
    componentStack: string;
    eventId: string;
    resetError: () => void;
};

export function ErrorBoundaryFallback({ resetError }: FallbackProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader className="pb-4">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                        <AlertTriangle className="size-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl">Something went wrong</CardTitle>
                    <CardDescription className="text-sm">
                        An unexpected error occurred. Our team has been notified.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <Button variant="outline" size="sm" onClick={resetError}>
                        <RotateCcw className="size-4" />
                        Try Again
                    </Button>
                    <Button size="sm" onClick={() => (window.location.href = '/')}>
                        <Home className="size-4" />
                        Home
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
