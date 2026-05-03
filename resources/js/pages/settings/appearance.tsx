import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function SettingsAppearance() {
    return (
        <>
            <Head title="Pengaturan Tampilan" />

            <Card>
                <CardHeader>
                    <CardTitle>Tampilan</CardTitle>
                    <CardDescription>
                        Pilih tampilan Crypter sesuai keinginan Anda. Pilih tema
                        yang sesuai dengan preferensi Anda.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <AppearanceTabs />
                </CardContent>
            </Card>
        </>
    );
}
