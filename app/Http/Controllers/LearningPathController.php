<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\LearningPathBuilder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LearningPathController extends Controller
{
    public function __construct(
        private readonly LearningPathBuilder $learningPathBuilder,
    ) {}

    /**
     * Display the visual learning path / skill tree.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $learningPath = $this->learningPathBuilder->build($user);

        // Compute summary stats
        $nodes = collect($learningPath['nodes']);
        $totalCourses = $nodes->count();
        $completedCourses = $nodes->where('isCompleted', true)->count();
        $inProgressCourses = $nodes->where('isEnrolled', true)->where('isCompleted', false)->count();
        $lockedCourses = $nodes->where('isLocked', true)->count();
        $overallProgress = $totalCourses > 0
            ? round($nodes->avg('progressPercentage'), 1)
            : 0;

        return Inertia::render('learning-path', [
            'learningPath' => $learningPath,
            'summary' => [
                'totalCourses' => $totalCourses,
                'completedCourses' => $completedCourses,
                'inProgressCourses' => $inProgressCourses,
                'lockedCourses' => $lockedCourses,
                'overallProgress' => $overallProgress,
            ],
        ]);
    }
}
