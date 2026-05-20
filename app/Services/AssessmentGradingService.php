<?php

namespace App\Services;

use App\Events\CourseCompleted;
use App\Events\XpAwarded;
use App\Models\AssessmentSubmission;
use App\Models\Enrollment;
use App\Notifications\AssessmentGradedNotification;
use Illuminate\Support\Facades\DB;

class AssessmentGradingService
{
    public function __construct(
        private readonly XpService $xpService,
    ) {}

    /**
     * Process a submission after a learner submits.
     *
     * Every supported question type is auto-gradable, so every submission is
     * finalized inline.
     */
    public function processSubmission(AssessmentSubmission $submission): void
    {
        DB::transaction(function () use ($submission) {
            $this->autoGradeAllAnswers($submission);
            $this->finalizeSubmission($submission);
        });
    }

    /**
     * Auto-grade every answer in the submission. Returns how many were graded.
     */
    public function autoGradeAllAnswers(AssessmentSubmission $submission): int
    {
        $gradedCount = 0;

        $answers = $submission->answers()
            ->with('question')
            ->whereNull('points_awarded')
            ->get();

        foreach ($answers as $answer) {
            if ($answer->question === null) {
                continue;
            }

            $answer->autoGrade();
            $gradedCount++;
        }

        return $gradedCount;
    }

    /**
     * Finalize a fully-graded submission: calculate score, determine pass/fail, award XP.
     */
    public function finalizeSubmission(AssessmentSubmission $submission): void
    {
        $submission->calculateScore();

        $submission->update([
            'status' => AssessmentSubmission::STATUS_GRADED,
            'graded_at' => now(),
        ]);

        // Award XP if passed
        if ($submission->passed) {
            $this->awardCompletionXp($submission);
            $this->checkCourseCompletion($submission);
        }

        // Notify the student
        $submission->user->notify(new AssessmentGradedNotification($submission));
    }

    /**
     * When a course-linked assessment is passed, mark the course as completed
     * if all lessons are already done.
     */
    private function checkCourseCompletion(AssessmentSubmission $submission): void
    {
        $assessment = $submission->assessment;

        if ($assessment->course_id === null) {
            return;
        }

        $enrollment = Enrollment::query()
            ->where('user_id', $submission->user_id)
            ->where('course_id', $assessment->course_id)
            ->first();

        if (! $enrollment || $enrollment->progress_percentage < 100) {
            return;
        }

        // All lessons done + assessment passed → course completed
        if ($enrollment->completed_at === null) {
            $enrollment->update(['completed_at' => now()]);

            $user = $submission->user;
            $course = $assessment->course;

            // Award course completion bonus
            $completionXp = (int) config('rewards.course_completion_xp', 100);
            $completionPoints = (int) config('rewards.course_completion_points', 200);
            $awardedCompletionPoints = $this->xpService->applyLevelBonus($user, $completionPoints);

            $this->xpService->awardXp($user, $completionXp);
            $user->increment('points', $awardedCompletionPoints);

            XpAwarded::dispatch($user, $completionXp, $awardedCompletionPoints, 'course_completion');
            CourseCompleted::dispatch($user, $course);
        }
    }

    /**
     * Award XP for passing an assessment.
     * XP scales with Bloom level: C1=10, C2=20, C3=30, C4=40, C5=50, C6=60
     */
    private function awardCompletionXp(AssessmentSubmission $submission): void
    {
        $bloomMultiplier = match ($submission->assessment->bloom_level) {
            'C1' => 10,
            'C2' => 20,
            'C3' => 30,
            'C4' => 40,
            'C5' => 50,
            'C6' => 60,
            default => 10,
        };

        // Only award XP on first passing attempt
        $previousPasses = AssessmentSubmission::query()
            ->where('user_id', $submission->user_id)
            ->where('assessment_id', $submission->assessment_id)
            ->where('id', '!=', $submission->id)
            ->where('passed', true)
            ->exists();

        if (! $previousPasses) {
            $this->xpService->awardXpAndPoints(
                $submission->user,
                $bloomMultiplier,
            );
        }
    }
}
