import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Home, Lock, ServerCrash, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type ErrorPageProps = {
    status: number;
    message?: string;
};

type ErrorConfig = {
    title: string;
    description: string;
    icon: LucideIcon;
};

const errorConfigs: Record<number, ErrorConfig> = {
    403: {
        title: 'Access Denied',
        description: 'You are not authorized to access this page.',
        icon: Lock,
    },
    404: {
        title: 'Page Not Found',
        description: 'The page you are looking for could not be found.',
        icon: AlertTriangle,
    },
    500: {
        title: 'Server Error',
        description: 'An unexpected error occurred. Please try again later.',
        icon: ServerCrash,
    },
    503: {
        title: 'Under Maintenance',
        description: 'We are currently performing maintenance. Please check back soon.',
        icon: Wrench,
    },
};

const defaultConfig: ErrorConfig = {
    title: 'Error',
    description: 'An unexpected error occurred.',
    icon: AlertTriangle,
};

export default function ErrorPage({ status, message }: ErrorPageProps) {
    const config = errorConfigs[status] ?? defaultConfig;
    const Icon = config.icon;

    return (
        <>
            <Head title={`${status} — ${config.title}`} />

            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader className="pb-4">
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                            <Icon className="size-8 text-muted-foreground" />
                        </div>
                        <p className="text-5xl font-bold tracking-tight text-foreground">
                            {status}
                        </p>
                        <CardTitle className="text-xl">{config.title}</CardTitle>
                        <CardDescription className="text-sm">
                            {message ?? config.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                            <ArrowLeft className="size-4" />
                            Go Back
                        </Button>
                        <Button size="sm" asChild>
                            <Link href="/">
                                <Home className="size-4" />
                                Home
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
