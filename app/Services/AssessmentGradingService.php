<?php

namespace App\Services;

use App\Events\CourseCompleted;
use App\Events\XpAwarded;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentSubmission;
use App\Models\Enrollment;
use App\Models\User;
use App\Notifications\AssessmentGradedNotification;
use Illuminate\Support\Facades\DB;

class AssessmentGradingService
{
    public function __construct(
        private readonly RubricScoringService $rubricService,
        private readonly XpService $xpService,
    ) {}

    /**
     * Process a submission after student submits.
     *
     * 1. Auto-grade all objective questions immediately
     * 2. If all questions are auto-gradable, finalize immediately
     * 3. Otherwise, queue for manual grading
     */
    public function processSubmission(AssessmentSubmission $submission): void
    {
        DB::transaction(function () use ($submission) {
            // Auto-grade objective answers
            $this->autoGradeObjectiveAnswers($submission);

            // Check if all answers are now graded
            if ($submission->isFullyGraded()) {
                $this->finalizeSubmission($submission);
            } else {
                // Queue for manual grading
                $submission->update(['status' => AssessmentSubmission::STATUS_SUBMITTED]);
            }
        });
    }

    /**
     * Auto-grade all objective (auto-gradable) answers in a submission.
     */
    public function autoGradeObjectiveAnswers(AssessmentSubmission $submission): int
    {
        $gradedCount = 0;

        $answers = $submission->answers()
            ->with('question')
            ->whereNull('points_awarded')
            ->get();

        foreach ($answers as $answer) {
            if ($answer->question->isAutoGradable()) {
                $answer->autoGrade();
                $gradedCount++;
            }
        }

        return $gradedCount;
    }

    /**
     * Manually grade a single answer using rubric scores.
     *
     * @param  array<string, array{score: int, feedback?: string}>  $rubricScores
     */
    public function gradeAnswer(
        AssessmentAnswer $answer,
        array $rubricScores,
        ?string $feedback,
        User $grader,
    ): void {
        DB::transaction(function () use ($answer, $rubricScores, $feedback, $grader) {
            $answer->manualGrade($rubricScores, $feedback);

            $submission = $answer->submission;

            // Update submission status to grading if not already
            if ($submission->status === AssessmentSubmission::STATUS_SUBMITTED) {
                $submission->update([
                    'status' => AssessmentSubmission::STATUS_GRADING,
                    'graded_by' => $grader->id,
                ]);
            }

            // Check if all answers are now graded
            if ($submission->fresh()->isFullyGraded()) {
                $this->finalizeSubmission($submission->fresh(), $grader);
            }
        });
    }

    /**
     * Finalize a fully-graded submission: calculate score, determine pass/fail, award XP.
     */
    public function finalizeSubmission(AssessmentSubmission $submission, ?User $grader = null): void
    {
        $submission->calculateScore();

        $submission->update([
            'status' => AssessmentSubmission::STATUS_GRADED,
            'graded_at' => now(),
            'graded_by' => $grader?->id ?? $submission->graded_by,
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

    /**
     * Get the admin grading queue: submissions awaiting manual grading.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, AssessmentSubmission>
     */
    public function getGradingQueue(int $limit = 20): \Illuminate\Database\Eloquent\Collection
    {
        return AssessmentSubmission::query()
            ->with(['user:id,name,email', 'assessment:id,title,bloom_level', 'answers.question'])
            ->whereIn('status', [
                AssessmentSubmission::STATUS_SUBMITTED,
                AssessmentSubmission::STATUS_GRADING,
            ])
            ->orderBy('submitted_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Provide overall feedback and finalize a submission that's being manually graded.
     */
    public function submitOverallFeedback(
        AssessmentSubmission $submission,
        string $feedback,
        User $grader,
    ): void {
        $submission->update([
            'overall_feedback' => $feedback,
            'graded_by' => $grader->id,
        ]);

        // If fully graded, finalize
        if ($submission->isFullyGraded()) {
            $this->finalizeSubmission($submission, $grader);
        }
    }
}
