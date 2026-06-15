import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<any>;
    }
}

const isBrowser = typeof window !== 'undefined';

const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER || 'ap1';

function createEcho(): Echo<any> | null {
    if (!isBrowser) {
        return null;
    }

    window.Pusher = Pusher;

    const instance = new Echo({
        broadcaster: 'pusher',
        key: pusherKey || 'local',
        cluster: pusherCluster,
        forceTLS: true,
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: {
                'X-CSRF-TOKEN':
                    document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content') || '',
                Accept: 'application/json',
            },
        },
    });

    window.Echo = instance;
    return instance;
}

export const echo = createEcho();

export const getConnectionState = () => {
    return echo?.connector?.pusher?.connection?.state || 'disconnected';
};

export const onConnectionChange = (
    callback: (state: string) => void,
): (() => void) => {
    if (!echo) {
        return () => {};
    }

    const handler = (states: { current: string; previous: string }) => {
        callback(states.current);
    };

    echo.connector?.pusher?.connection?.bind('state_change', handler);

    return () => {
        echo.connector?.pusher?.connection?.unbind('state_change', handler);
    };
};

if (isBrowser && echo && import.meta.env.DEV) {
    echo.connector?.pusher?.connection?.bind('connected', () => {
        console.log('Echo: Connected to WebSocket');
    });

    echo.connector?.pusher?.connection?.bind('disconnected', () => {
        console.log('Echo: Disconnected from WebSocket');
    });

    echo.connector?.pusher?.connection?.bind('error', (error: unknown) => {
        console.error('Echo: Connection error', error);
    });
}
