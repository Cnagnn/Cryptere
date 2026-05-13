<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Http\Requests\Course\CourseCatalogRequest;
use App\Models\Course;
use App\Services\CourseCatalogBuilder;
use App\Services\CourseDetailBuilder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function __construct(
        private readonly CourseDetailBuilder $detailBuilder,
        private readonly CourseCatalogBuilder $catalogBuilder,
    ) {}

    /**
     * Show the published course catalog.
     */
    public function index(CourseCatalogRequest $request): Response
    {
        $filters = $request->catalogFilters();
        $courses = $this->catalogBuilder->build($request->user(), $filters);

        return Inertia::render('courses/index', [
            'courses' => [
                'data' => $courses->items(),
                'meta' => [
                    'current_page' => $courses->currentPage(),
                    'last_page' => $courses->lastPage(),
                    'per_page' => $courses->perPage(),
                    'total' => $courses->total(),
                    'from' => $courses->firstItem(),
                    'to' => $courses->lastItem(),
                ],
                'links' => $courses->linkCollection(),
            ],
            'filters' => [
                'search' => $filters['search'],
                'enrollment' => $filters['enrollment'],
                'sort' => $filters['sort'],
            ],
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
                ->when(! $isAdmin, fn ($query) => $query->published())
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
                'progressPercentage' => number_format((float) $enrollment->progress_percentage, 2, '.', ''),
                'completedAt' => optional($enrollment->completed_at)->toIso8601String(),
            ] : null,
            'assessments' => $assessmentsData,
        ]);
    }
}
