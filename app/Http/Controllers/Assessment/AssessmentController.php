<?php

namespace App\Http\Controllers\Assessment;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentSubmission;
use App\Services\MasteryAnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssessmentController extends Controller
{
    public function __construct(
        private readonly MasteryAnalyticsService $analyticsService,
    ) {}

    /**
     * Display the assessments catalog with mastery dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $assessments = Assessment::query()
            ->available()
            ->withCount('questions')
            ->orderBy('bloom_level')
            ->orderBy('sort_order')
            ->get()
            ->map(function (Assessment $assessment) use ($user) {
                $bestSubmission = AssessmentSubmission::query()
                    ->forUser($user)
                    ->where('assessment_id', $assessment->id)
                    ->graded()
                    ->orderByDesc('total_score')
                    ->first();

                $attemptCount = AssessmentSubmission::query()
                    ->forUser($user)
                    ->where('assessment_id', $assessment->id)
                    ->whereIn('status', ['submitted', 'grading', 'graded'])
                    ->count();

                return [
                    'id' => $assessment->id,
                    'slug' => $assessment->slug,
                    'title' => $assessment->title,
                    'description' => $assessment->description,
                    'bloomLevel' => $assessment->bloom_level,
                    'bloomLabel' => $assessment->bloom_label,
                    'gradingType' => $assessment->grading_type,
                    'passingScore' => $assessment->passing_score,
                    'maxAttempts' => $assessment->max_attempts,
                    'timeLimitMinutes' => $assessment->time_limit_minutes,
                    'questionsCount' => $assessment->questions_count,
                    'bestScore' => $bestSubmission?->total_score,
                    'passed' => $bestSubmission?->passed ?? false,
                    'attemptCount' => $attemptCount,
                    'canAttempt' => $assessment->canAttempt($user),
                ];
            });

        // Mastery radar data
        $radarData = $this->analyticsService->getBloomRadarData($user);

        // Statistics for sidebar
        $totalAssessments = $assessments->count();
        $completedCount = $assessments->where('passed', true)->count();
        $averageScore = $assessments->whereNotNull('bestScore')->avg('bestScore');

        $statistics = [
            ['label' => 'Total Assessments', 'value' => (string) $totalAssessments],
            ['label' => 'Completed', 'value' => "{$completedCount} / {$totalAssessments}"],
            ['label' => 'Average Score', 'value' => $averageScore !== null ? round($averageScore).'%' : '—'],
        ];

        return Inertia::render('assessments/index', [
            'assessments' => $assessments->values(),
            'radarData' => $radarData,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Show a specific assessment with questions (for taking the assessment).
     */
    public function show(Request $request, Assessment $assessment): Response
    {
        $this->authorize('view', $assessment);

        $user = $request->user();

        // Check for in-progress submission
        $activeSubmission = AssessmentSubmission::query()
            ->forUser($user)
            ->where('assessment_id', $assessment->id)
            ->where('status', AssessmentSubmission::STATUS_IN_PROGRESS)
            ->first();

        // Get past submissions
        $pastSubmissions = AssessmentSubmission::query()
            ->forUser($user)
            ->where('assessment_id', $assessment->id)
            ->whereIn('status', [
                AssessmentSubmission::STATUS_SUBMITTED,
                AssessmentSubmission::STATUS_GRADING,
                AssessmentSubmission::STATUS_GRADED,
            ])
            ->orderByDesc('attempt_number')
            ->get()
            ->map(fn (AssessmentSubmission $sub) => [
                'id' => $sub->id,
                'attemptNumber' => $sub->attempt_number,
                'status' => $sub->status,
                'totalScore' => $sub->total_score,
                'passed' => $sub->passed,
                'submittedAt' => $sub->submitted_at?->toIso8601String(),
                'gradedAt' => $sub->graded_at?->toIso8601String(),
            ]);

        // Load questions (hide correct answers for non-admin)
        $questions = $assessment->questions()
            ->get()
            ->map(fn ($q) => [
                'id' => $q->id,
                'bloomLevel' => $q->bloom_level,
                'questionType' => $q->question_type,
                'questionText' => $q->question_text,
                'options' => $q->options,
                'points' => $q->points,
                'gradingType' => $q->grading_type,
                'minWords' => $q->min_words,
                'maxWords' => $q->max_words,
                'sortOrder' => $q->sort_order,
            ]);

        // Load course context (if assessment belongs to a course)
        $courseContext = null;
        if ($assessment->course_id) {
            $course = $assessment->course;
            if ($course) {
                $courseContext = [
                    'slug' => $course->slug,
                    'title' => $course->title,
                ];
            }
        }

        return Inertia::render('assessments/show', [
            'assessment' => [
                'id' => $assessment->id,
                'slug' => $assessment->slug,
                'title' => $assessment->title,
                'description' => $assessment->description,
                'bloomLevel' => $assessment->bloom_level,
                'bloomLabel' => $assessment->bloom_label,
                'gradingType' => $assessment->grading_type,
                'passingScore' => $assessment->passing_score,
                'maxAttempts' => $assessment->max_attempts,
                'timeLimitMinutes' => $assessment->time_limit_minutes,
                'totalPoints' => $assessment->total_points,
                'canAttempt' => $assessment->canAttempt($user),
            ],
            'questions' => $questions,
            'activeSubmission' => $activeSubmission ? [
                'id' => $activeSubmission->id,
                'attemptNumber' => $activeSubmission->attempt_number,
                'startedAt' => $activeSubmission->started_at->toIso8601String(),
            ] : null,
            'pastSubmissions' => $pastSubmissions,
            'courseContext' => $courseContext,
        ]);
    }

    /**
     * Show the mastery dashboard for the current user.
     */
    public function mastery(Request $request): Response
    {
        $user = $request->user();
        $profile = $this->analyticsService->getUserMasteryProfile($user);
        $topicMastery = $this->analyticsService->getTopicMastery($user);

        return Inertia::render('assessments/mastery', [
            'profile' => $profile,
            'topicMastery' => $topicMastery,
        ]);
    }
}
