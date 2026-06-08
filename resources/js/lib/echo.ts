import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<any>;
    }
}

window.Pusher = Pusher;

const reverbHost = import.meta.env.VITE_REVERB_HOST;
const reverbPort = Number(import.meta.env.VITE_REVERB_PORT || 8080);
const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'https';
const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1';
const forceTls =
    reverbScheme === 'https' ||
    (import.meta.env.VITE_PUSHER_FORCE_TLS || 'true') === 'true';

window.Echo = new Echo({
    broadcaster: 'pusher',
    key:
        import.meta.env.VITE_REVERB_APP_KEY ||
        import.meta.env.VITE_PUSHER_APP_KEY ||
        'local',
    cluster: pusherCluster,
    forceTLS: forceTls,
    wsHost: reverbHost || undefined,
    wsPort: reverbPort,
    wssPort: reverbPort,
    enabledTransports: ['ws', 'wss'],
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

    return () => {
        echo.connector?.pusher?.connection?.unbind('state_change', handler);
    };
};

if (import.meta.env.DEV) {
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
