import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo;
    }
}

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'local',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1',
    forceTLS: (import.meta.env.VITE_PUSHER_FORCE_TLS || 'true') === 'true',
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

export const echo = window.Echo;

// Connection state helpers
export const getConnectionState = () => {
    return echo.connector?.pusher?.connection?.state || 'disconnected';
};

export const onConnectionChange = (
    callback: (state: string) => void,
): (() => void) => {
    const handler = (states: { current: string; previous: string }) => {
        callback(states.current);
    };

    echo.connector?.pusher?.connection?.bind('state_change', handler);

    // Return cleanup function
    return () => {
        echo.connector?.pusher?.connection?.unbind('state_change', handler);
    };
};

// Debug logging in development
if (import.meta.env.DEV) {
    echo.connector?.pusher?.connection?.bind('connected', () => {
        console.log('✅ Echo: Connected to WebSocket');
    });

    echo.connector?.pusher?.connection?.bind('disconnected', () => {
        console.log('❌ Echo: Disconnected from WebSocket');
    });

    echo.connector?.pusher?.connection?.bind('error', (error: any) => {
        console.error('❌ Echo: Connection error', error);
    });
}
