<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\TaskProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskHeartbeatController extends Controller
{
    /**
     * Maximum seconds allowed per single heartbeat interval.
     * Prevents spoofing large time values in a single request.
     */
    private const MAX_HEARTBEAT_SECONDS = 60;

    /**
     * Record a heartbeat for video watch time or reading time.
     *
     * Accepts periodic pings from the frontend to accumulate
     * actual engagement time, preventing instant-completion cheats.
     */
    public function store(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $validated = $request->validate([
            'task_id' => ['required', 'integer', 'exists:lesson_tasks,id'],
            'type' => ['required', 'in:video,reading'],
            'seconds' => ['required', 'integer', 'min:1', 'max:'.self::MAX_HEARTBEAT_SECONDS],
            'current_time' => ['nullable', 'integer', 'min:0'], // Video playback position in seconds
        ]);

        abort_if($lesson->course_id !== $course->id, 404);

        $user = $request->user();

        // Must be enrolled
        $enrolled = Enrollment::query()
            ->whereBelongsTo($user)
            ->whereBelongsTo($course)
            ->exists();

        if (! $enrolled) {
            return response()->json(['message' => 'Not enrolled.'], 403);
        }

        // Verify task belongs to this lesson
        $task = LessonTask::query()
            ->where('id', $validated['task_id'])
            ->where('lesson_id', $lesson->id)
            ->first();

        if ($task === null) {
            return response()->json(['message' => 'Invalid task.'], 422);
        }

        if (! $course->isPublished() || ! $lesson->isPublished() || ! $task->canAccess($user)) {
            return response()->json(['message' => 'Task is locked.'], 403);
        }

        $seconds = min((int) $validated['seconds'], self::MAX_HEARTBEAT_SECONDS);
        $column = $validated['type'] === 'video' ? 'watch_seconds' : 'reading_seconds';

        $progress = TaskProgress::query()->firstOrCreate(
            [
                'user_id' => $user->id,
                'lesson_task_id' => $validated['task_id'],
            ],
            [
                'started_at' => now(),
            ]
        );

        // Set started_at if not already set
        if ($progress->started_at === null) {
            $progress->started_at = now();
        }

        // Increment accumulated time
        $progress->increment($column, $seconds);

        // Store video position if provided (for resume playback)
        if ($validated['type'] === 'video' && isset($validated['current_time'])) {
            $progress->video_position_seconds = (int) $validated['current_time'];
            $progress->save();
        }

        return response()->json([
            'success' => true,
            'accumulated' => $progress->fresh()->$column,
        ]);
    }
}
