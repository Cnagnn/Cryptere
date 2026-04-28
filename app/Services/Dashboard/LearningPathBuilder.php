<?php

namespace App\Services\Dashboard;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Collection;

class LearningPathBuilder
{
    /**
     * Build the full prerequisite-based learning path skill tree.
     *
     * @return array{nodes: Collection, categories: Collection}
     */
    public function build(User $user): array
    {
        $pathCourses = Course::query()
            ->published()
            ->with('prerequisite:id,title,slug')
            ->withCount('lessons')
            ->orderBy('path_position')
            ->orderBy('sort_order')
            ->get([
                'id',
                'slug',
                'title',
                'summary',
                'category',
                'difficulty',
                'path_position',
                'prerequisite_course_id',
                'estimated_minutes',
                'cover_path',
            ]);

        $pathEnrollments = Enrollment::query()
            ->whereBelongsTo($user)
            ->get(['course_id', 'progress_percentage', 'completed_at'])
            ->keyBy('course_id');

        $nodes = $pathCourses->map(function (Course $course) use ($pathEnrollments): array {
            $enrollment = $pathEnrollments->get($course->id);
            $prerequisiteCompleted = true;

            if ($course->prerequisite_course_id !== null) {
                $prereqEnrollment = $pathEnrollments->get($course->prerequisite_course_id);
                $prerequisiteCompleted = $prereqEnrollment !== null && $prereqEnrollment->completed_at !== null;
            }

            return [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'summary' => $course->summary,
                'category' => $course->category,
                'difficulty' => $course->difficulty,
                'pathPosition' => $course->path_position,
                'prerequisiteId' => $course->prerequisite_course_id,
                'prerequisiteTitle' => $course->prerequisite?->title,
                'lessonCount' => $course->lessons_count,
                'estimatedMinutes' => $course->estimated_minutes,
                'cover' => $course->cover,
                'isEnrolled' => $enrollment !== null,
                'progressPercentage' => $enrollment?->progress_percentage ?? 0,
                'isCompleted' => $enrollment?->completed_at !== null,
                'isLocked' => ! $prerequisiteCompleted,
            ];
        })->values();

        $categories = $pathCourses->pluck('category')->filter()->unique()->values();

        return [
            'nodes' => $nodes,
            'categories' => $categories,
        ];
    }
}
