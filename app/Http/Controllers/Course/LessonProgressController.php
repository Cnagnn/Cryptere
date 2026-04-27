<?php

namespace App\Http\Controllers\Course;

use App\Concerns\FlashesAchievements;
use App\Events\CourseCompleted;
use App\Events\LessonCompleted;
use App\Events\XpAwarded;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Services\BadgeService;
use App\Services\LevelService;
use App\Services\XpService;
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
    public function store(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        abort_if($lesson->course_id !== $course->id, 404);

        $user = $request->user();

        $enrollment = Enrollment::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($course)
            ->first();

        if ($enrollment === null) {
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
                Inertia::flash('toast', [
                    'type' => 'warning',
                    'message' => __('Complete the previous lesson first.'),
                ]);

                return back();
            }
        }

        $previousXp = $user->xp;

        $result = DB::transaction(function () use ($course, $enrollment, $lesson, $user): bool {
            $progress = LessonProgress::query()->firstOrNew([
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
            ]);

            $alreadyCompleted = $progress->completed_at !== null;

            $progress->attempts = ($progress->attempts ?? 0) + 1;

            if (! $alreadyCompleted) {
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

            $enrollment->update([
                'progress_percentage' => $progressPercentage,
                'completed_at' => $progressPercentage === 100 ? now() : null,
            ]);

            // Course Completion Bonus — award extra XP + points when course reaches 100%
            if ($progressPercentage === 100 && ! $alreadyCompleted) {
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

        Inertia::flash('toast', [
            'type' => $result ? 'success' : 'info',
            'message' => $result
                ? __('Lesson marked complete. Keep going!')
                : __('This lesson was already completed.'),
        ]);

        return back();
    }
}
