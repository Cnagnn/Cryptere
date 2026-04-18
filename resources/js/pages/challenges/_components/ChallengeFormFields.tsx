import type { Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DateRangePickerField } from './DateRangePickerField';

export type ChallengeFormData = {
    title: string;
    prompt: string;
    thumbnail_name: string;
    hint: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    time_start: string;
    time_end: string;
    expected_answer: string;
    points_reward: number;
    is_published: boolean;
};

export const defaultChallengeForm: ChallengeFormData = {
    title: '',
    prompt: '',
    thumbnail_name: '',
    hint: '',
    difficulty: 'beginner',
    time_start: '',
    time_end: '',
    expected_answer: '',
    points_reward: 75,
    is_published: true,
};

interface ChallengeFormFieldsProps {
    form: ChallengeFormData;
    setForm: Dispatch<SetStateAction<ChallengeFormData>>;
}

export function ChallengeFormFields({ form, setForm }: ChallengeFormFieldsProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
                <Label>Title</Label>
                <Input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Description</Label>
                <Textarea
                    value={form.prompt}
                    onChange={(e) => setForm((prev) => ({ ...prev, prompt: e.target.value }))}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Upload Thumbnail</Label>
                <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const nextFile = e.target.files?.[0];

                        setForm((prev) => ({ ...prev, thumbnail_name: nextFile?.name ?? '' }));
                    }}
                />
                <p className="text-xs text-muted-foreground">
                    Placeholder upload for challenge thumbnail.
                </p>
            </div>

            <DateRangePickerField
                startValue={form.time_start}
                endValue={form.time_end}
                onChange={(start, end) => setForm((prev) => ({ ...prev, time_start: start, time_end: end }))}
            />
        </div>
    );
}
