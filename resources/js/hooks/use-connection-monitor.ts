import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getConnectionState, onConnectionChange } from '@/lib/echo';

export function useConnectionMonitor() {
    const [isConnected, setIsConnected] = useState(
        () => getConnectionState() === 'connected',
    );
    const [isOffline, setIsOffline] = useState(
        () => typeof navigator !== 'undefined' && !navigator.onLine,
    );
    const toastIdRef = useRef<string | number | null>(null);

    useEffect(() => {
        const dismissOfflineToast = () => {
            if (toastIdRef.current !== null) {
                toast.dismiss(toastIdRef.current);
                toastIdRef.current = null;
            }
        };

        const syncInternetState = () => {
            const offline = !navigator.onLine;

            setIsOffline(offline);

            if (offline) {
                if (toastIdRef.current === null) {
                    toastIdRef.current = toast.warning(
                        'Koneksi internet terputus',
                        {
                            description:
                                'Periksa jaringan Anda untuk melanjutkan sinkronisasi data.',
                            duration: Infinity,
                        },
                    );
                }

                return;
            }

            dismissOfflineToast();
        };

        syncInternetState();

        const cleanup = onConnectionChange((state) => {
            setIsConnected(state === 'connected');
        });

        window.addEventListener('online', syncInternetState);
        window.addEventListener('offline', syncInternetState);

        return () => {
            cleanup();
            window.removeEventListener('online', syncInternetState);
            window.removeEventListener('offline', syncInternetState);
            dismissOfflineToast();
        };
    }, []);

    return { isConnected, isOffline };
}
