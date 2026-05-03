<?php

namespace App\Notifications;

use App\Models\AssessmentSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AssessmentGradedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly AssessmentSubmission $submission,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $assessment = $this->submission->assessment;
        $passed = $this->submission->passed;

        return [
            'category' => 'assessment',
            'title' => $passed ? 'Assessment Passed!' : 'Assessment Graded',
            'message' => $passed
                ? "You passed \"{$assessment->title}\" with a score of {$this->submission->total_score}%!"
                : "Your submission for \"{$assessment->title}\" has been graded. Score: {$this->submission->total_score}%.",
            'url' => route('assessments.show', $assessment->slug),
            'metadata' => [
                'assessment_id' => $assessment->id,
                'submission_id' => $this->submission->id,
                'score' => $this->submission->total_score,
                'passed' => $passed,
                'bloom_level' => $assessment->bloom_level,
            ],
        ];
    }
}
