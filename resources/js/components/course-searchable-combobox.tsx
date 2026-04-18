import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import type { ComboboxOption } from '@/components/course-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface SearchableComboboxProps {
    value?: string;
    options: ComboboxOption[];
    placeholder: string;
    searchPlaceholder: string;
    emptyMessage: string;
    className?: string;
    onSelect: (value: string) => void;
}

export function SearchableCombobox({
    value,
    options,
    placeholder,
    searchPlaceholder,
    emptyMessage,
    className,
    onSelect,
}: SearchableComboboxProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    const selectedOption = options.find((option) => option.value === value);
    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(query.trim().toLowerCase()),
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('h-9 justify-between font-normal', className)}
                >
                    <span className="truncate">
                        {selectedOption?.label ?? placeholder}
                    </span>
                    <ChevronsUpDown className="size-4 opacity-60" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                align="start"
            >
                <div className="border-b p-2">
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={searchPlaceholder}
                        className="h-8"
                    />
                </div>

                <div className="max-h-64 overflow-auto p-1">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <Button
                                key={option.value}
                                type="button"
                                variant="ghost"
                                className="h-auto w-full justify-start px-2 py-1.5 text-sm font-normal"
                                onClick={() => {
                                    onSelect(option.value);
                                    setOpen(false);
                                    setQuery('');
                                }}
                            >
                                <Check
                                    className={cn(
                                        'size-4',
                                        option.value === value
                                            ? 'opacity-100'
                                            : 'opacity-0',
                                    )}
                                />
                                <span className="truncate">{option.label}</span>
                            </Button>
                        ))
                    ) : (
                        <p className="p-2 text-sm text-muted-foreground">
                            {emptyMessage}
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
