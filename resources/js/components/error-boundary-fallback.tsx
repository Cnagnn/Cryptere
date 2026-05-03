import { useEffect } from 'react';

/**
 * Temporary fallback: perform a full-page reload so the server's
 * Laravel error page (Whoops) can be displayed for debugging.
 *
 * This intentionally avoids rendering the client-side React card
 * so developers can inspect the backend exception page.
 */
export function ErrorBoundaryFallback() {
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        // Only perform reload in development environment to avoid
        // exposing server error pages in production.
        const isDev = import.meta.env && import.meta.env.DEV;

        if (!isDev) {
            return;
        }

        // Prevent reload loops: only reload once per session.
        const key = 'crypter:error-reload-done';

        if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            // Use full reload to let server render its error page.
            window.location.reload();
        }
    }, []);

    return null;
}
