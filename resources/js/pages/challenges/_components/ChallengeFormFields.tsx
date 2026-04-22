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
    time_start: string;
    time_end: string;
    expected_answer: string;
    is_published: boolean;
    time_limit_seconds: number;
    questions_per_session: number;
    max_points_per_question: number;
};

export const defaultChallengeForm: ChallengeFormData = {
    title: '',
    prompt: '',
    thumbnail_name: '',
    hint: '',
    time_start: '',
    time_end: '',
    expected_answer: '',
    is_published: true,
    time_limit_seconds: 20,
    questions_per_session: 10,
    max_points_per_question: 1000,
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

            <div className="flex flex-col gap-1.5">
                <Label>Quiz Settings</Label>
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Timer (sec)</Label>
                        <Input
                            type="number"
                            min={5}
                            max={300}
                            value={form.time_limit_seconds}
                            onChange={(e) => setForm((prev) => ({ ...prev, time_limit_seconds: Number(e.target.value) || 20 }))}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Questions/Session</Label>
                        <Input
                            type="number"
                            min={1}
                            max={50}
                            value={form.questions_per_session}
                            onChange={(e) => setForm((prev) => ({ ...prev, questions_per_session: Number(e.target.value) || 10 }))}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Max Pts/Question</Label>
                        <Input
                            type="number"
                            min={100}
                            max={5000}
                            step={100}
                            value={form.max_points_per_question}
                            onChange={(e) => setForm((prev) => ({ ...prev, max_points_per_question: Number(e.target.value) || 1000 }))}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
