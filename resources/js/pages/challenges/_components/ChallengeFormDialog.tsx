import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
    time_start: string | null;
    time_end: string | null;
    expected_answer: string;
    is_published: boolean;
    time_limit_seconds: number;
    questions_per_session: number;
    max_points_per_question: number;
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
            time_start: challenge.time_start ?? '',
            time_end: challenge.time_end ?? '',
            expected_answer: challenge.expected_answer,
            is_published: challenge.is_published,
            time_limit_seconds: challenge.time_limit_seconds ?? 20,
            questions_per_session: challenge.questions_per_session ?? 10,
            max_points_per_question: challenge.max_points_per_question ?? 1000,
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
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogContent className="flex w-full flex-col overflow-y-auto sm:max-w-xl">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {mode === 'create' ? 'Create Challenge' : 'Edit Challenge'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {mode === 'create'
                            ? 'Add a new challenge to the catalog.'
                            : 'Update the challenge details and schedule.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex-1 py-6">
                    <ChallengeFormFields form={form} setForm={setForm} />
                </div>

                <AlertDialogFooter className="mt-auto sm:flex-row sm:justify-end">
                    <AlertDialogCancel
                        onClick={() => handleOpenChange(false)}
                        disabled={processing}
                    >
                        Cancel
                    </AlertDialogCancel>
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
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
