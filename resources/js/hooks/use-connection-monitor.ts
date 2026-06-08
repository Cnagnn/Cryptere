import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { onConnectionChange } from '@/lib/echo';

export function useConnectionMonitor() {
    const [isConnected, setIsConnected] = useState(true);
    const [toastId, setToastId] = useState<string | number | null>(null);

    useEffect(() => {
        const cleanup = onConnectionChange((state) => {
            if (state === 'connected') {
                setIsConnected(true);
                if (toastId) {
                    toast.dismiss(toastId);
                    setToastId(null);
                }
            } else if (state === 'disconnected' || state === 'failed') {
                setIsConnected(false);
                const id = toast.warning('Koneksi real-time terputus', {
                    description: 'Data diperbarui setiap beberapa detik.',
                    duration: Infinity,
                });
                setToastId(id);
            }
        });

        return cleanup;
    }, [toastId]);

    return { isConnected };
}
