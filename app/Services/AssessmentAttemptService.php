<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentSubmission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AssessmentAttemptService
{
    public function start(User $user, Assessment $assessment): AssessmentSubmission
    {
        if (! $assessment->canAttempt($user)) {
            throw ValidationException::withMessages([
                'assessment' => __('This assessment is not available.'),
            ]);
        }

        $existing = AssessmentSubmission::query()
            ->forUser($user)
            ->where('assessment_id', $assessment->id)
            ->where('status', AssessmentSubmission::STATUS_IN_PROGRESS)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        if ($assessment->questions()->count() === 0) {
            throw ValidationException::withMessages([
                'assessment' => __('This assessment has no questions.'),
            ]);
        }

        $attemptNumber = (int) AssessmentSubmission::query()
            ->forUser($user)
            ->where('assessment_id', $assessment->id)
            ->max('attempt_number') + 1;

        return DB::transaction(function () use ($user, $assessment, $attemptNumber): AssessmentSubmission {
            $submission = AssessmentSubmission::query()->create([
                'user_id' => $user->id,
                'assessment_id' => $assessment->id,
                'attempt_number' => $attemptNumber,
                'status' => AssessmentSubmission::STATUS_IN_PROGRESS,
                'started_at' => now(),
            ]);

            $assessment->questions()->get()->each(function ($question) use ($submission): void {
                AssessmentAnswer::query()->create([
                    'submission_id' => $submission->id,
                    'question_id' => $question->id,
                    'max_points' => $question->points,
                ]);
            });

            return $submission;
        });
    }

    /**
     * @param  array{answer_text?: string|null, selected_option?: string|null}  $payload
     */
    public function saveAnswer(User $user, Assessment $assessment, int $questionId, array $payload): AssessmentAnswer
    {
        $submission = $this->activeSubmission($user, $assessment);

        $answer = AssessmentAnswer::query()
            ->where('submission_id', $submission->id)
            ->where('question_id', $questionId)
            ->firstOrFail();

        $answer->update([
            'answer_text' => array_key_exists('answer_text', $payload) ? $payload['answer_text'] : $answer->answer_text,
            'selected_option' => array_key_exists('selected_option', $payload) ? $payload['selected_option'] : $answer->selected_option,
        ]);

        return $answer;
    }

    public function activeSubmission(User $user, Assessment $assessment): AssessmentSubmission
    {
        return AssessmentSubmission::query()
            ->forUser($user)
            ->where('assessment_id', $assessment->id)
            ->where('status', AssessmentSubmission::STATUS_IN_PROGRESS)
            ->firstOrFail();
    }

    public function assertWithinTimeLimit(AssessmentSubmission $submission): void
    {
        $minutes = $submission->assessment->time_limit_minutes;

        if ($minutes === null) {
            return;
        }

        if ($submission->started_at->addMinutes($minutes)->isPast()) {
            throw ValidationException::withMessages([
                'assessment' => __('Assessment time limit has expired.'),
            ]);
        }
    }
}
