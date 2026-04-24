<?php

namespace App\Http\Controllers\Course;

use App\Concerns\FlashesAchievements;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Services\BadgeService;
use App\Services\LevelService;
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
    public function store(Request $request, Course $course): RedirectResponse
    {
        abort_unless($course->is_published, 404);

        if (! $course->isUnlockedFor($request->user())) {
            $prerequisite = $course->prerequisite;

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('You must complete ":course" before enrolling in this course.', [
                    'course' => $prerequisite?->title ?? 'the prerequisite course',
                ]),
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

        Inertia::flash('toast', [
            'type' => $enrollment->wasRecentlyCreated ? 'success' : 'info',
            'message' => $enrollment->wasRecentlyCreated
                ? __('You are enrolled in this course.')
                : __('You are already enrolled in this course.'),
        ]);

        return back();
    }

    /**
     * Reset the current user's course progress.
     */
    public function reset(Request $request, Course $course): RedirectResponse
    {
        abort_unless($course->is_published, 404);

        $user = $request->user();

        $enrollment = Enrollment::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($course)
            ->first();

        if ($enrollment === null) {
            abort(403);
        }

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

            $pointsToRevert = $completedLessonIds->isNotEmpty()
                ? (int) Lesson::query()->whereIn('id', $completedLessonIds)->sum('xp_reward')
                : 0;

            LessonProgress::query()
                ->whereBelongsTo($user)
                ->whereIn('lesson_id', $lessonIds)
                ->delete();

            if ($pointsToRevert > 0) {
                $user->update([
                    'points' => max((int) $user->points - $pointsToRevert, 0),
                ]);
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
