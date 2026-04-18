import { createInertiaApp } from '@inertiajs/react';
import { DirectionProvider } from '@/components/ui/direction';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName =
    (typeof document !== 'undefined'
        ? document.querySelector('title')?.textContent?.trim()
        : null) ||
    import.meta.env.VITE_APP_NAME ||
    'App';

createInertiaApp({
    title: () => appName,
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
                return null;
            case ['auth/login', 'auth/register', 'auth/forgot-password'].includes(
                name,
            ):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <DirectionProvider dir="ltr">
                <TooltipProvider delayDuration={0}>
                    {app}
                    <Toaster />
                </TooltipProvider>
            </DirectionProvider>
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
