<?php

namespace App\Http\Controllers\Course;

use App\Concerns\FlashesAchievements;
use App\Events\CourseCompleted;
use App\Events\LessonCompleted;
use App\Events\XpAwarded;
use App\Http\Controllers\Controller;
use App\Models\AssessmentSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LessonTask;
use App\Models\TaskProgress;
use App\Services\BadgeService;
use App\Services\LevelService;
use App\Services\XpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LessonProgressController extends Controller
{
    use FlashesAchievements;

    public function __construct(
        private readonly BadgeService $badgeService,
        private readonly LevelService $levelService,
        private readonly XpService $xpService,
    ) {}

    /**
     * Mark a lesson as completed for the current user.
     */
    public function store(Request $request, Course $course, Lesson $lesson): RedirectResponse|JsonResponse
    {
        // Validate optional task_id if provided
        $validated = $request->validate([
            'task_id' => ['nullable', 'integer', 'exists:lesson_tasks,id'],
        ]);

        abort_if($lesson->course_id !== $course->id, 404);

        $user = $request->user();

        $enrollment = Enrollment::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($course)
            ->first();

        if ($enrollment === null) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => __('You must enroll in this course first.'),
                ], 403);
            }
            abort(403);
        }

        $previousLesson = Lesson::query()
            ->whereBelongsTo($course)
            ->where('position', '<', $lesson->position)
            ->orderByDesc('position')
            ->first();

        if ($previousLesson !== null) {
            $isPreviousLessonCompleted = LessonProgress::query()
                ->whereBelongsTo($user)
                ->whereBelongsTo($previousLesson)
                ->whereNotNull('completed_at')
                ->exists();

            if (! $isPreviousLessonCompleted) {
                if ($request->wantsJson() || $request->ajax()) {
                    return response()->json([
                        'success' => false,
                        'message' => __('Complete the previous lesson first.'),
                    ], 422);
                }

                Inertia::flash('toast', [
                    'type' => 'warning',
                    'message' => __('Complete the previous lesson first.'),
                ]);

                return back();
            }
        }

        // Anti-cheat: validate minimum engagement time for task
        if (isset($validated['task_id'])) {
            $antiCheatError = $this->validateAntiCheat($user, (int) $validated['task_id']);

            if ($antiCheatError !== null) {
                if ($request->wantsJson() || $request->ajax()) {
                    return response()->json([
                        'success' => false,
                        'message' => $antiCheatError,
                    ], 422);
                }

                Inertia::flash('toast', [
                    'type' => 'warning',
                    'message' => $antiCheatError,
                ]);

                return back();
            }
        }

        $previousXp = $user->xp;

        $result = DB::transaction(function () use ($course, $enrollment, $lesson, $user, $validated): bool {
            // Track task completion if task_id is provided
            if (isset($validated['task_id'])) {
                TaskProgress::query()->updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'lesson_task_id' => $validated['task_id'],
                    ],
                    [
                        'completed_at' => now(),
                    ]
                );
            }

            $progress = LessonProgress::query()->firstOrNew([
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
            ]);

            $alreadyCompleted = $progress->completed_at !== null;

            $progress->attempts = ($progress->attempts ?? 0) + 1;

            // Check if all tasks in the lesson are completed
            $totalTasks = $lesson->tasks()->count();
            $completedTasks = TaskProgress::query()
                ->where('user_id', $user->id)
                ->whereIn('lesson_task_id', $lesson->tasks()->pluck('id'))
                ->whereNotNull('completed_at')
                ->count();

            // Mark lesson as complete only if all tasks are completed
            if (! $alreadyCompleted && $totalTasks > 0 && $completedTasks >= $totalTasks) {
                $progress->completed_at = now();
            }

            $progress->save();

            if (! $alreadyCompleted) {
                $this->xpService->awardXpAndPoints($user, (int) config('rewards.lesson_completion_xp', 30));
                LessonCompleted::dispatch($user, $lesson);
            }

            $lessonIds = Lesson::query()->whereBelongsTo($course)->pluck('id');

            $completedLessonsCount = LessonProgress::query()
                ->whereBelongsTo($user)
                ->whereIn('lesson_id', $lessonIds)
                ->whereNotNull('completed_at')
                ->count();

            $totalLessons = max(1, $lessonIds->count());
            $progressPercentage = (int) round(($completedLessonsCount / $totalLessons) * 100);

            // Course is only "completed" when all lessons are done AND assessment is passed (if one exists)
            $hasAssessment = $course->assessment()->published()->exists();
            $assessmentPassed = false;

            if ($hasAssessment && $progressPercentage === 100) {
                $assessmentPassed = AssessmentSubmission::query()
                    ->where('user_id', $user->id)
                    ->whereHas('assessment', fn ($q) => $q->where('course_id', $course->id))
                    ->where('passed', true)
                    ->exists();
            }

            $courseCompleted = $progressPercentage === 100 && (! $hasAssessment || $assessmentPassed);

            $enrollment->update([
                'progress_percentage' => $progressPercentage,
                'completed_at' => $courseCompleted ? now() : null,
            ]);

            // Course Completion Bonus — award extra XP + points when course reaches 100%
            if ($courseCompleted && $progressPercentage === 100 && ! $alreadyCompleted) {
                $completionXp = (int) config('rewards.course_completion_xp', 100);
                $completionPoints = (int) config('rewards.course_completion_points', 200);
                $awardedCompletionPoints = $this->xpService->applyLevelBonus($user, $completionPoints);

                $this->xpService->awardXp($user, $completionXp);
                $user->increment('points', $awardedCompletionPoints);

                XpAwarded::dispatch($user, $completionXp, $awardedCompletionPoints, 'course_completion');
                CourseCompleted::dispatch($user, $course);
            }

            return ! $alreadyCompleted;
        });

        if ($result) {
            $user->refresh();
            $this->checkAndFlashAchievements(
                $this->badgeService,
                $this->levelService,
                $user,
                ['lessons_completed', 'courses_completed', 'points_earned'],
                $previousXp,
            );
        }

        // Return JSON for AJAX requests
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $result
                    ? __('Lesson marked complete. Keep going!')
                    : __('This lesson was already completed.'),
                'already_completed' => ! $result,
            ]);
        }

        Inertia::flash('toast', [
            'type' => $result ? 'success' : 'info',
            'message' => $result
                ? __('Lesson marked complete. Keep going!')
                : __('This lesson was already completed.'),
        ]);

        return back();
    }

    /**
     * Validate anti-cheat requirements for a task before allowing completion.
     *
     * Returns an error message string if validation fails, null if OK.
     */
    private function validateAntiCheat($user, int $taskId): ?string
    {
        $task = LessonTask::query()->find($taskId);

        if ($task === null) {
            return null; // Let normal validation handle missing task
        }

        $type = $task->type;

        // Quiz tasks don't need heartbeat validation (handled by QuizSubmissionController)
        if ($type === 'quiz') {
            return null;
        }

        $progress = TaskProgress::query()
            ->where('user_id', $user->id)
            ->where('lesson_task_id', $taskId)
            ->first();

        // Must have a heartbeat record (started_at) before completing
        if ($progress === null || $progress->started_at === null) {
            return __('You must engage with this content before marking it complete.');
        }

        // Video: require minimum 80% watch time (minimum 30 seconds)
        if ($type === 'video') {
            $minimumWatchSeconds = max(30, (int) config('anti_cheat.video_min_seconds', 30));

            if ($progress->watch_seconds < $minimumWatchSeconds) {
                return __('Please watch more of the video before completing.');
            }
        }

        // Server-side elapsed time check: started_at must be at least N seconds ago
        $elapsedSeconds = (int) abs(now()->diffInSeconds($progress->started_at));
        $minimumElapsed = (int) config('anti_cheat.min_elapsed_seconds', 10);

        if ($elapsedSeconds < $minimumElapsed) {
            return __('You must engage with this content before marking it complete.');
        }

        return null;
    }
}
