import { useCallback, useEffect, useState } from 'react';

const DISMISS_KEY = 'crypter-install-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user previously dismissed the prompt
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
            const elapsed = Date.now() - parseInt(dismissedAt, 10);
            if (elapsed < DISMISS_DURATION_MS) {
                return; // Still within the dismiss window
            }
            localStorage.removeItem(DISMISS_KEY);
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener(
                'beforeinstallprompt',
                handleBeforeInstallPrompt,
            );
        };
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsVisible(false);
        }

        setDeferredPrompt(null);
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setIsVisible(false);
        setDeferredPrompt(null);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }, []);

    if (!isVisible) return null;

    return (
        <div
            role="complementary"
            aria-label="Install app prompt"
            className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-xl sm:left-auto sm:right-4"
        >
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                    <span className="text-lg" aria-hidden="true">
                        🔐
                    </span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-100">
                        Install Crypter
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                        Add to your home screen for a better experience &
                        offline access.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <button
                            onClick={handleInstall}
                            className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 transition-opacity hover:opacity-90"
                        >
                            Install
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                        >
                            Not now
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="shrink-0 text-zinc-500 transition-colors hover:text-zinc-300"
                    aria-label="Dismiss install prompt"
                >
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}
