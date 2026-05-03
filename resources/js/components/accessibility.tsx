import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Skip-to-content link — WCAG 2.1 AA 2.4.1 (Bypass Blocks)
 * Visible on focus, allows keyboard users to skip navigation.
 */
export function SkipToContent({
    targetId = 'main-content',
}: {
    targetId?: string;
}) {
    return (
        <a
            href={`#${targetId}`}
            className={
                // Hidden visually by default for sighted users, becomes visible and positioned when focused
                // Uses Tailwind's `sr-only` + `focus:not-sr-only` pattern so keyboard users see the link
                'sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:transition-transform focus:outline-none'
            }
        >
            Skip to main content
        </a>
    );
}

/**
 * ARIA live region for route change announcements — WCAG 2.1 AA 4.1.3 (Status Messages)
 * Announces page changes to screen readers.
 */
export function RouteAnnouncer() {
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        const removeListener = router.on('navigate', (event) => {
            // Extract page title from the document after navigation
            requestAnimationFrame(() => {
                const title = document.title || 'Page loaded';
                setAnnouncement(`Navigated to ${title}`);
            });
        });

        return () => {
            removeListener();
        };
    }, []);

    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
        >
            {announcement}
        </div>
    );
}

/**
 * Focus management hook — WCAG 2.1 AA 2.4.3 (Focus Order)
 * Moves focus to main content after route changes and resets scroll
 * position to the top so every page starts at the beginning.
 */
export function useFocusOnNavigate(targetId = 'main-content') {
    useEffect(() => {
        const removeListener = router.on('navigate', () => {
            requestAnimationFrame(() => {
                // Reset scroll to top on every navigation
                window.scrollTo({ top: 0, left: 0 });

                const target = document.getElementById(targetId);

                if (target) {
                    // Use preventScroll so focus doesn't cause an
                    // unwanted scroll jump to the element's position
                    target.focus({ preventScroll: true });
                }
            });
        });

        return () => {
            removeListener();
        };
    }, [targetId]);
}

/**
 * Keyboard trap prevention — WCAG 2.1 AA 2.1.2 (No Keyboard Trap)
 * Ensures Escape key closes modals/dialogs.
 */
export function useEscapeKey(onEscape: () => void, enabled = true) {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                onEscape();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onEscape, enabled]);
}

/**
 * Reduced motion preference hook — WCAG 2.1 AA 2.3.3 (Animation from Interactions)
 */
export function usePrefersReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        );
        const handler = (e: MediaQueryListEvent) =>
            setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handler);

        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    return prefersReducedMotion;
}

/**
 * Visible focus indicator wrapper — WCAG 2.1 AA 2.4.7 (Focus Visible)
 * Adds a visible focus ring to interactive elements.
 */
export function FocusRing({ children }: { children: React.ReactNode }) {
    return (
        <div className="[&_:focus-visible]:ring-2 [&_:focus-visible]:ring-ring [&_:focus-visible]:ring-offset-2 [&_:focus-visible]:outline-none">
            {children}
        </div>
    );
}
