<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Services\CacheService;
use App\Services\CourseDetailBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function __construct(
        private readonly CourseDetailBuilder $detailBuilder,
    ) {}

    /**
     * Show the published course catalog.
     */
    public function index(Request $request): Response
    {
        $catalogBase = Cache::remember('courses:catalog', CacheService::TTL_MEDIUM, fn () => Course::query()
            ->published()
            ->withCount(['lessons', 'enrollments'])
            ->orderBy('sort_order')
            ->orderBy('title')
            ->get()
            ->map(fn (Course $course): array => [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'summary' => $course->summary,
                'coverImage' => $course->cover,
                'estimatedMinutes' => $course->estimated_minutes,
                'lessonCount' => $course->lessons_count,
                'enrollmentCount' => $course->enrollments_count,
            ])->values()->all());

        $progressByCourse = $request->user()
            ->enrollments()
            ->pluck('progress_percentage', 'course_id');

        $courses = collect($catalogBase)->map(function (array $course) use ($progressByCourse): array {
            $isEnrolled = $progressByCourse->has($course['id']);

            return [
                ...$course,
                'isEnrolled' => $isEnrolled,
                'progressPercentage' => $isEnrolled ? $progressByCourse[$course['id']] : null,
            ];
        })->values();

        return Inertia::render('courses/index', [
            'courses' => $courses,
        ]);
    }

    /**
     * Show a single course detail page.
     */
    public function show(Request $request, Course $course): Response
    {
        $this->authorize('view', $course);

        $user = $request->user();
        $isAdmin = (bool) $user->isAdmin();

        $course->load([
            'lessons' => fn ($query) => $query
                ->with(['tasks.quizQuestions'])
                ->orderBy('position'),
        ])->loadCount('enrollments');

        $enrollment = $user->enrollments()
            ->whereBelongsTo($course)
            ->first();

        $lessons = $this->detailBuilder->buildLessons($course, $user, $isAdmin);
        $assessmentsData = $this->detailBuilder->buildAssessments($course, $user);

        return Inertia::render('courses/show', [
            'course' => [
                'id' => $course->id,
                'slug' => $course->slug,
                'title' => $course->title,
                'summary' => $course->summary,
                'estimatedMinutes' => $course->estimated_minutes,
                'enrollmentCount' => $course->enrollments_count,
            ],
            'lessons' => $lessons,
            'enrollment' => $enrollment ? [
                'progressPercentage' => $enrollment->progress_percentage,
                'completedAt' => optional($enrollment->completed_at)->toIso8601String(),
            ] : null,
            'assessments' => $assessmentsData,
        ]);
    }
}
