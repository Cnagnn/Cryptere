import { RouteAnnouncer, SkipToContent, useFocusOnNavigate } from '@/components/accessibility';
import { AchievementToast } from '@/components/achievement-toast';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { InstallPrompt } from '@/components/install-prompt';
import { OfflineIndicator } from '@/components/offline-indicator';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    useFocusOnNavigate();

    return (
        <AppShell variant="sidebar">
            <OfflineIndicator />
            <SkipToContent />
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <main id="main-content" tabIndex={-1} className="outline-none">
                    {children}
                </main>
            </AppContent>
            <AchievementToast />
            <InstallPrompt />
            <RouteAnnouncer />
        </AppShell>
    );
}
