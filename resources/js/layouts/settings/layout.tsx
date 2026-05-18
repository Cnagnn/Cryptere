import type { PropsWithChildren } from 'react';

import { SettingsNavigation } from '@/features/settings/settings-navigation';

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-6 pb-4 sm:px-6 lg:px-8">
            <SettingsNavigation />
            {children}
        </div>
    );
}
