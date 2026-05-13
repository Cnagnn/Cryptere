<?php

namespace App\Services;

use App\Models\Course;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CourseCatalogBuilder
{
    /**
     * @param  array{search: string, enrollment: string, sort: string, per_page: int}  $filters
     */
    public function build(User $user, array $filters): LengthAwarePaginator
    {
        $enrolledCourseIds = $user->enrollments()->pluck('course_id');
        $progressByCourse = $user->enrollments()->pluck('progress_percentage', 'course_id');

        $query = Course::query()
            ->published()
            ->withCount(['lessons', 'enrollments'])
            ->when($filters['search'] !== '', function ($query) use ($filters): void {
                $query->where(function ($builder) use ($filters): void {
                    $builder
                        ->where('title', 'like', '%'.$filters['search'].'%')
                        ->orWhere('summary', 'like', '%'.$filters['search'].'%')
                        ->orWhere('category', 'like', '%'.$filters['search'].'%');
                });
            })
            ->when($filters['enrollment'] === 'enrolled', fn ($query) => $query->whereIn('id', $enrolledCourseIds))
            ->when($filters['enrollment'] === 'not-enrolled', fn ($query) => $query->whereNotIn('id', $enrolledCourseIds));

        match ($filters['sort']) {
            'progress' => $query->orderByRaw('id in ('.($enrolledCourseIds->implode(',') ?: '0').') desc')->orderBy('title'),
            'newest' => $query->latest(),
            default => $query->orderBy('title'),
        };

        return $query
            ->paginate($filters['per_page'])
            ->withQueryString()
            ->through(function (Course $course) use ($enrolledCourseIds, $progressByCourse, $user): array {
                $isEnrolled = $enrolledCourseIds->contains($course->id);

                return [
                    'id' => $course->id,
                    'slug' => $course->slug,
                    'title' => $course->title,
                    'summary' => $course->summary,
                    'coverImage' => $course->cover,
                    'category' => $course->category,
                    'difficulty' => $course->difficulty,
                    'estimatedMinutes' => $course->estimated_minutes,
                    'lessonCount' => $course->lessons_count,
                    'enrollmentCount' => $course->enrollments_count,
                    'isEnrolled' => $isEnrolled,
                    'progressPercentage' => $isEnrolled ? (int) $progressByCourse[$course->id] : null,
                    'isLocked' => ! $course->isUnlockedFor($user),
                ];
            });
    }
}
