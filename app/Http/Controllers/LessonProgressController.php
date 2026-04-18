<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LessonProgressController extends Controller
{
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
                $user->increment('points', $lesson->xp_reward);
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

            return ! $alreadyCompleted;
        });

        Inertia::flash('toast', [
            'type' => $result ? 'success' : 'info',
            'message' => $result
                ? __('Lesson marked complete. Keep going!')
                : __('This lesson was already completed.'),
        ]);

        return back();
    }
}
