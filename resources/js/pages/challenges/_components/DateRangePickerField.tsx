import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldLabel } from '@/components/ui/field';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerFieldProps {
    startValue: string;
    endValue: string;
    onChange: (start: string, end: string) => void;
}

export function DateRangePickerField({
    startValue,
    endValue,
    onChange,
}: DateRangePickerFieldProps) {
    const initialRange = useMemo<DateRange | undefined>(() => {
        if (!startValue) {
            return undefined;
        }

        const from = new Date(startValue);

        if (Number.isNaN(from.getTime())) {
            return undefined;
        }

        if (!endValue) {
            return { from };
        }

        const to = new Date(endValue);

        if (Number.isNaN(to.getTime())) {
            return { from };
        }

        return { from, to };
    }, [startValue, endValue]);

    const [date, setDate] = useState<DateRange | undefined>(initialRange);
    const [month, setMonth] = useState<Date>(initialRange?.from ?? new Date());

    const label = useMemo(() => {
        if (!date?.from) {
            return 'Pick a date';
        }

        if (!date.to) {
            return format(date.from, 'LLL dd, y');
        }

        return `${format(date.from, 'LLL dd, y')} - ${format(date.to, 'LLL dd, y')}`;
    }, [date]);

    const mapToDateTimeString = (date: Date, endOfDay = false): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const time = endOfDay ? '23:59' : '00:00';

        return `${year}-${month}-${day}T${time}`;
    };

    const handleSelect = (range: DateRange | undefined): void => {
        setDate(range);

        if (range?.from) {
            setMonth(range.from);
        }

        const start = range?.from ? mapToDateTimeString(range.from, false) : '';
        const end = range?.to ? mapToDateTimeString(range.to, true) : '';

        onChange(start, end);
    };

    return (
        <Field className="w-full">
            <FieldLabel htmlFor="date-picker-range">Challenge Schedule</FieldLabel>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" id="date-picker-range" className="justify-start px-2.5 font-normal">
                        <CalendarIcon />
                        <span className={date?.from ? '' : 'text-muted-foreground'}>{label}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        month={month}
                        onMonthChange={setMonth}
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        pagedNavigation
                    />
                </PopoverContent>
            </Popover>
        </Field>
    );
}
