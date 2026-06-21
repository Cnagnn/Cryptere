<?php

namespace App\Http\Controllers\Course;

use App\Concerns\FlashesAchievements;
use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LessonTask;
use App\Models\QuizSubmission;
use App\Models\TaskProgress;
use App\Services\BadgeService;
use App\Services\LevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EnrollmentController extends Controller
{
    use FlashesAchievements;

    public function __construct(
        private readonly BadgeService $badgeService,
        private readonly LevelService $levelService,
    ) {}

    /**
     * Enroll the current user into a course.
     */
    public function store(Request $request, Course $course): RedirectResponse|JsonResponse
    {
        $this->authorize('enroll', $course);

        if (! $course->isUnlockedFor($request->user())) {
            $prerequisite = $course->prerequisite;

            $message = __('You must complete ":course" before enrolling in this course.', [
                'course' => $prerequisite?->title ?? 'the prerequisite course',
            ]);

            if ($request->wantsJson()) {
                return response()->json(['message' => $message], 403);
            }

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => $message,
            ]);

            return back();
        }

        $enrollment = Enrollment::query()->firstOrCreate(
            [
                'user_id' => $request->user()->id,
                'course_id' => $course->id,
            ],
            [
                'enrolled_at' => now(),
            ],
        );

        if ($enrollment->wasRecentlyCreated) {
            $this->checkAndFlashAchievements(
                $this->badgeService,
                $this->levelService,
                $request->user(),
                'first_enrollment',
            );
        }

        $message = $enrollment->wasRecentlyCreated
            ? __('You are enrolled in this course.')
            : __('You are already enrolled in this course.');

        if ($request->wantsJson()) {
            return response()->json([
                'message' => $message,
                'enrollment' => [
                    'progressPercentage' => $enrollment->progress_percentage,
                    'completedAt' => optional($enrollment->completed_at)->toIso8601String(),
                ],
            ]);
        }

        Inertia::flash('toast', [
            'type' => $enrollment->wasRecentlyCreated ? 'success' : 'info',
            'message' => $message,
        ]);

        return back();
    }

    /**
     * Reset the current user's course progress.
     */
    public function reset(Request $request, Course $course): RedirectResponse
    {
        $user = $request->user();

        $enrollment = Enrollment::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($course)
            ->firstOrFail();

        $this->authorize('reset', $enrollment);

        if ((int) $enrollment->progress_percentage === 0) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => __('Course progress is already at 0%.'),
            ]);

            return back();
        }

        DB::transaction(function () use ($course, $enrollment, $user): void {
            $lessonIds = Lesson::query()
                ->whereBelongsTo($course)
                ->pluck('id');

            $completedLessonIds = LessonProgress::query()
                ->whereBelongsTo($user)
                ->whereIn('lesson_id', $lessonIds)
                ->whereNotNull('completed_at')
                ->pluck('lesson_id');

            $lessonXpPerLesson = (int) config('rewards.lesson_completion_xp', 30);
            $pointsToRevert = $completedLessonIds->count() * $lessonXpPerLesson;
            $xpToRevert = $completedLessonIds->count() * $lessonXpPerLesson;

            LessonProgress::query()
                ->whereBelongsTo($user)
                ->whereIn('lesson_id', $lessonIds)
                ->delete();

            // Delete task progress and quiz submissions
            $taskIds = LessonTask::query()
                ->whereIn('lesson_id', $lessonIds)
                ->pluck('id');

            TaskProgress::query()
                ->where('user_id', $user->id)
                ->whereIn('lesson_task_id', $taskIds)
                ->delete();

            // Revert quiz XP before deleting submissions
            $quizXpToRevert = QuizSubmission::query()
                ->where('user_id', $user->id)
                ->whereIn('lesson_task_id', $taskIds)
                ->sum('xp_earned');

            $quizPointsToRevert = QuizSubmission::query()
                ->where('user_id', $user->id)
                ->whereIn('lesson_task_id', $taskIds)
                ->sum('points_earned');

            QuizSubmission::query()
                ->where('user_id', $user->id)
                ->whereIn('lesson_task_id', $taskIds)
                ->delete();

            if ($quizXpToRevert > 0 || $quizPointsToRevert > 0) {
                $user->forceFill([
                    'xp' => max((int) $user->xp - (int) $quizXpToRevert, 0),
                    'points' => max((int) $user->points - (int) $quizPointsToRevert, 0),
                ])->save();
            }

            if ($pointsToRevert > 0) {
                $user->forceFill([
                    'points' => max((int) $user->points - $pointsToRevert, 0),
                    'xp' => max((int) $user->xp - $xpToRevert, 0),
                ])->save();
            }

            // Delete assessment submissions and answers
            $assessmentIds = Assessment::query()
                ->where('course_id', $course->id)
                ->pluck('id');

            $assessmentSubmissionIds = AssessmentSubmission::query()
                ->where('user_id', $user->id)
                ->whereIn('assessment_id', $assessmentIds)
                ->pluck('id');

            AssessmentAnswer::query()
                ->whereIn('submission_id', $assessmentSubmissionIds)
                ->delete();

            AssessmentSubmission::query()
                ->whereIn('id', $assessmentSubmissionIds)
                ->delete();

            // Revert course completion bonus if it was completed
            if ($enrollment->completed_at !== null) {
                $completionXp = (int) config('rewards.course_completion_xp', 100);
                $completionPoints = (int) config('rewards.course_completion_points', 20);
                $user->forceFill([
                    'points' => max((int) $user->points - $completionPoints, 0),
                    'xp' => max((int) $user->xp - $completionXp, 0),
                ])->save();
            }

            $enrollment->update([
                'progress_percentage' => 0,
                'completed_at' => null,
            ]);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Course progress has been reset.'),
        ]);

        return back();
    }
}
