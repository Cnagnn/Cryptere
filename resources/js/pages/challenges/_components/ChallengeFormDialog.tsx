import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { store as storeChallenge, update as updateChallenge } from '@/routes/admin/challenges';
import {
    ChallengeFormFields,
    defaultChallengeForm,
} from './ChallengeFormFields';
import type { ChallengeFormData } from './ChallengeFormFields';

interface Challenge {
    id: number;
    title: string;
    slug: string;
    prompt: string;
    hint: string | null;
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | null;
    time_start: string | null;
    time_end: string | null;
    expected_answer: string;
    points_reward: number;
    is_published: boolean;
}

type Props = {
    mode: 'create' | 'edit';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    challenge?: Challenge;
};

function getInitialFormState(mode: Props['mode'], challenge?: Challenge): ChallengeFormData {
    if (mode === 'edit' && challenge) {
        return {
            title: challenge.title,
            prompt: challenge.prompt,
            thumbnail_name: '',
            hint: challenge.hint ?? '',
            difficulty: challenge.difficulty ?? 'beginner',
            time_start: challenge.time_start ?? '',
            time_end: challenge.time_end ?? '',
            expected_answer: challenge.expected_answer,
            points_reward: challenge.points_reward as any,
            is_published: challenge.is_published,
        };
    }

    return defaultChallengeForm;
}

export function ChallengeFormDialog({
    mode,
    open,
    onOpenChange,
    challenge,
}: Props) {
    const [form, setForm] = useState<ChallengeFormData>(() => getInitialFormState(mode, challenge));
    const [processing, setProcessing] = useState(false);

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setForm(getInitialFormState(mode, challenge));
        }

        onOpenChange(nextOpen);
    };

    const handleSubmit = () => {
        setProcessing(true);

        const { thumbnail_name, ...payload } = form;
        void thumbnail_name;

        const data = {
            ...payload,
            points_reward: Number(payload.points_reward),
            time_start: payload.time_start || null,
            time_end: payload.time_end || null,
        };

        if (mode === 'create') {
            router.post(storeChallenge(), data as any, {
                onSuccess: () => {
                    setProcessing(false);
                    handleOpenChange(false);
                    setForm(defaultChallengeForm);
                },
                onError: () => setProcessing(false),
            });
        } else if (mode === 'edit' && challenge) {
            router.patch(updateChallenge({ challenge: challenge.id }), data as any, {
                onSuccess: () => {
                    setProcessing(false);
                    handleOpenChange(false);
                },
                onError: () => setProcessing(false),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex w-full flex-col overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Create Challenge' : 'Edit Challenge'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create'
                            ? 'Add a new challenge to the catalog.'
                            : 'Update the challenge details and schedule.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 py-6">
                    <ChallengeFormFields form={form} setForm={setForm} />
                </div>

                <DialogFooter className="mt-auto sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={processing}
                    >
                        {processing && (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        )}
                        {mode === 'create' ? 'Create' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
