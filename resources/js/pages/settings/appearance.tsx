import { Head } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';

export default function SettingsAppearance() {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
    ];

    const handleValueChange = (value: string): void => {
        if (value === 'light' || value === 'dark' || value === 'system') {
            updateAppearance(value);
        }
    };

    return (
        <>
            <Head title="Pengaturan Tampilan" />

            <Card>
                <CardHeader>
                    <CardTitle>Tampilan</CardTitle>
                    <CardDescription>
                        Pilih tampilan Cryptere sesuai keinginan Anda. Pilih
                        tema yang sesuai dengan preferensi Anda.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <ToggleGroup
                        type="single"
                        value={appearance}
                        onValueChange={handleValueChange}
                        variant="outline"
                        size="sm"
                        className="inline-flex gap-1 rounded-lg border bg-muted p-1"
                    >
                        {tabs.map(({ value, icon: Icon, label }) => (
                            <ToggleGroupItem
                                key={value}
                                value={value}
                                className="gap-1.5 px-3"
                            >
                                <Icon className="size-4" />
                                <span>{label}</span>
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </CardContent>
            </Card>
        </>
    );
}
