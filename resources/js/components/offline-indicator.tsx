import { useEffect, useState } from 'react';

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(
        typeof navigator !== 'undefined' ? !navigator.onLine : false,
    );

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="fixed top-0 right-0 left-0 z-50 bg-amber-500 py-1.5 text-center text-sm font-medium text-amber-950"
        >
            📡 You're offline — some features may be limited
        </div>
    );
}
