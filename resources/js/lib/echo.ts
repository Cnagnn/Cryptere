import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
    interface Window {
        Pusher: typeof Pusher;
        Echo: Echo<any>;
    }
}

window.Pusher = Pusher;

const reverbHostRaw = (import.meta.env.VITE_REVERB_HOST ?? '').toString();
const reverbPort = Number(import.meta.env.VITE_REVERB_PORT || 8080);
const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'https';
const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1';
const forceTls =
    reverbScheme === 'https' ||
    (import.meta.env.VITE_PUSHER_FORCE_TLS || 'true') === 'true';

// Production safety: never let a stale dev `.env` (REVERB_HOST=127.0.0.1)
// leak into the prod bundle and force the browser to attempt
// `wss://127.0.0.1:8080`. That request is (a) impossible on the user's
// machine and (b) blocked by our CSP. If the build was made with a
// loopback host but we're shipping to a real origin, fall back to Pusher.
const looksLikeLoopback =
    reverbHostRaw === '' ||
    /^(localhost|127\.0\.0\.1|::1|0\.0\.0\.0)$/i.test(reverbHostRaw);

const useReverb =
    !!reverbHostRaw && !(import.meta.env.PROD && looksLikeLoopback);

const echoConfig: Record<string, unknown> = {
    broadcaster: 'pusher',
    key: useReverb ? reverbKey || pusherKey || 'local' : pusherKey || 'local',
    cluster: pusherCluster,
    forceTLS: forceTls,
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
};

if (useReverb) {
    echoConfig.wsHost = reverbHostRaw;
    echoConfig.wsPort = reverbPort;
    echoConfig.wssPort = reverbPort;
}

window.Echo = new Echo(echoConfig);

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
