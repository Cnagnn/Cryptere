import type { Auth } from '@/types/auth';

type FlashBadge = {
    name: string;
    description: string;
    icon: string | null;
    tier: string;
    category: string;
};

type FlashLevelUp = {
    level: number;
    name: string;
};

type FlashToast = {
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
};

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            flash?: {
                toast?: FlashToast;
                newBadges?: FlashBadge[];
                levelUp?: FlashLevelUp;
            };
            [key: string]: unknown;
        };
    }
}
