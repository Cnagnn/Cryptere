import { usePage } from '@inertiajs/react';

type AppUrls = {
    public: string;
    auth: string;
    app: string;
    login: string;
    register: string;
    logout: string;
    dashboard: string;
};

export function useAppUrls(): AppUrls {
    return usePage<{ urls: AppUrls }>().props.urls;
}
