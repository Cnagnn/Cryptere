import { createInertiaApp } from '@inertiajs/react';
import * as Sentry from '@sentry/react';
import { DirectionProvider } from '@/components/ui/direction';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        tracesSampleRate: 0.2,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,
        enabled: import.meta.env.PROD,
    });
}

const appName =
    (typeof document !== 'undefined'
        ? document.querySelector('title')?.textContent?.trim()
        : null) ||
    import.meta.env.VITE_APP_NAME ||
    'App';

createInertiaApp({
    pages: {
        path: './pages',
        extension: '.tsx',
        lazy: true,
    },
    title: () => appName,
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case [
                'auth/login',
                'auth/register',
                'auth/forgot-password',
                'auth/reset-password',
            ].includes(name):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <Sentry.ErrorBoundary>
                <DirectionProvider dir="ltr">
                    <TooltipProvider delayDuration={0}>
                        {app}
                        <Toaster />
                    </TooltipProvider>
                </DirectionProvider>
            </Sentry.ErrorBoundary>
        );
    },
    progress: {
        color: 'hsl(var(--foreground))',
    },
});

// This will set light / dark mode on load...
if (typeof window !== 'undefined') {
    initializeTheme();
}
