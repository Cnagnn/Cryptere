import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

type Props = {
    className?: string;
};

export default function AppearanceToggleTab({
    className = '',
}: Props) {
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
        <ToggleGroup
            type="single"
            value={appearance}
            onValueChange={handleValueChange}
            variant="outline"
            size="sm"
            className={cn(
                'inline-flex gap-1 rounded-lg border bg-muted p-1',
                className,
            )}
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
    );
}
