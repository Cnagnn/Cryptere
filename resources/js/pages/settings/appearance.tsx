import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import { TypographyLarge, TypographyMuted } from '@/components/ui/typography';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance settings</h1>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-0.5">
                    <TypographyLarge className="text-base font-medium leading-snug">
                        Appearance settings
                    </TypographyLarge>
                    <TypographyMuted className="text-sm/6">
                        Update your account's appearance settings
                    </TypographyMuted>
                </div>
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
