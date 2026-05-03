<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\AssessmentSubmission;
use App\Models\User;
use Illuminate\Support\Collection;

class MasteryAnalyticsService
{
    /**
     * Get the Bloom's Taxonomy radar chart data for a user.
     *
     * Returns scores (0-100) for each Bloom level based on best attempts.
     *
     * @return array<int, array{level: string, label: string, score: int, attempts: int, passed: int}>
     */
    public function getBloomRadarData(User $user): array
    {
        $levels = Assessment::BLOOM_LEVELS;
        $labels = Assessment::BLOOM_LABELS;

        $radarData = [];

        foreach ($levels as $level) {
            $submissions = AssessmentSubmission::query()
                ->forUser($user)
                ->graded()
                ->whereHas('assessment', fn ($q) => $q->where('bloom_level', $level))
                ->get();

            $bestScores = $submissions
                ->groupBy('assessment_id')
                ->map(fn (Collection $group) => $group->max('total_score'));

            $averageScore = $bestScores->isNotEmpty()
                ? (int) round($bestScores->average())
                : 0;

            $radarData[] = [
                'level' => $level,
                'label' => $labels[$level],
                'score' => $averageScore,
                'attempts' => $submissions->count(),
                'passed' => $submissions->where('passed', true)->count(),
            ];
        }

        return $radarData;
    }

    /**
     * Get detailed mastery data for a specific user.
     *
     * @return array{
     *     overallMastery: int,
     *     radarData: array,
     *     totalAssessments: int,
     *     totalCompleted: int,
     *     totalPassed: int,
     *     strengths: array<string>,
     *     weaknesses: array<string>,
     *     recentSubmissions: \Illuminate\Support\Collection,
     * }
     */
    public function getUserMasteryProfile(User $user): array
    {
        $radarData = $this->getBloomRadarData($user);

        $totalAssessments = Assessment::published()->count();
        $completedAssessments = AssessmentSubmission::query()
            ->forUser($user)
            ->graded()
            ->distinct('assessment_id')
            ->count('assessment_id');
        $passedAssessments = AssessmentSubmission::query()
            ->forUser($user)
            ->graded()
            ->where('passed', true)
            ->distinct('assessment_id')
            ->count('assessment_id');

        // Calculate overall mastery (average of all Bloom level scores)
        $scores = collect($radarData)->pluck('score')->filter(fn ($s) => $s > 0);
        $overallMastery = $scores->isNotEmpty() ? (int) round($scores->average()) : 0;

        // Identify strengths (≥70%) and weaknesses (<50%) — return level codes (BloomLevel)
        $strengths = collect($radarData)
            ->filter(fn ($data) => $data['score'] >= 70 && $data['attempts'] > 0)
            ->pluck('level')
            ->values()
            ->all();

        $weaknesses = collect($radarData)
            ->filter(fn ($data) => $data['score'] < 50 && $data['attempts'] > 0)
            ->pluck('level')
            ->values()
            ->all();

        // Recent submissions — transform to match frontend RecentAssessmentSubmission shape
        $recentSubmissions = AssessmentSubmission::query()
            ->forUser($user)
            ->with('assessment:id,title,bloom_level')
            ->whereIn('status', ['graded', 'submitted'])
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get()
            ->map(fn (AssessmentSubmission $sub) => [
                'assessmentTitle' => $sub->assessment?->title ?? 'Unknown',
                'bloomLevel' => $sub->assessment?->bloom_level ?? 'C1',
                'score' => $sub->total_score ?? 0,
                'passed' => (bool) $sub->passed,
                'gradedAt' => $sub->graded_at?->toIso8601String() ?? $sub->updated_at->toIso8601String(),
            ])
            ->values();

        return [
            'overallMastery' => $overallMastery,
            'radarData' => $radarData,
            'totalAssessments' => $totalAssessments,
            'totalCompleted' => $completedAssessments,
            'totalPassed' => $passedAssessments,
            'strengths' => $strengths,
            'weaknesses' => $weaknesses,
            'recentSubmissions' => $recentSubmissions,
        ];
    }

    /**
     * Get per-topic mastery breakdown for a user.
     *
     * @return Collection<int, array{topic_id: int, topic_name: string, score: int, bloom_breakdown: array}>
     */
    public function getTopicMastery(User $user): Collection
    {
        $submissions = AssessmentSubmission::query()
            ->forUser($user)
            ->graded()
            ->with('assessment:id,title,bloom_level,topic_id', 'assessment.topic:id,name')
            ->get();

        return $submissions
            ->groupBy('assessment.topic_id')
            ->filter(fn ($group, $key) => $key !== null)
            ->map(function (Collection $topicSubmissions) {
                $topic = $topicSubmissions->first()->assessment->topic;

                $bloomBreakdown = $topicSubmissions
                    ->groupBy('assessment.bloom_level')
                    ->map(fn (Collection $group) => (int) round($group->max('total_score')));

                $averageScore = $topicSubmissions->isNotEmpty()
                    ? (int) round($topicSubmissions->pluck('total_score')->average())
                    : 0;

                return [
                    'topicId' => $topic?->id,
                    'topicName' => $topic?->name ?? 'Unknown',
                    'averageScore' => $averageScore,
                    'assessmentCount' => $topicSubmissions->pluck('assessment_id')->unique()->count(),
                    'passedCount' => $topicSubmissions->where('passed', true)->pluck('assessment_id')->unique()->count(),
                ];
            })
            ->values();
    }

    /**
     * Get class-wide analytics for admin dashboard.
     *
     * @return array{
     *     total_submissions: int,
     *     pending_grading: int,
     *     average_score: int,
     *     pass_rate: int,
     *     bloom_distribution: array,
     *     recent_activity: Collection,
     * }
     */
    public function getClassAnalytics(): array
    {
        $gradedSubmissions = AssessmentSubmission::graded();

        $totalSubmissions = $gradedSubmissions->count();
        $pendingGrading = AssessmentSubmission::pendingGrading()->count();
        $averageScore = $totalSubmissions > 0
            ? (int) round(AssessmentSubmission::graded()->avg('total_score'))
            : 0;
        $passRate = $totalSubmissions > 0
            ? (int) round(AssessmentSubmission::graded()->where('passed', true)->count() / $totalSubmissions * 100)
            : 0;

        // Bloom level distribution of submissions
        $bloomDistribution = AssessmentSubmission::graded()
            ->join('assessments', 'assessment_submissions.assessment_id', '=', 'assessments.id')
            ->selectRaw('assessments.bloom_level, AVG(assessment_submissions.total_score) as avg_score, COUNT(*) as count')
            ->groupBy('assessments.bloom_level')
            ->get()
            ->keyBy('bloom_level')
            ->map(fn ($row) => [
                'avg_score' => (int) round($row->avg_score),
                'count' => $row->count,
            ])
            ->all();

        $recentActivity = AssessmentSubmission::query()
            ->with(['user:id,name', 'assessment:id,title,bloom_level'])
            ->orderByDesc('updated_at')
            ->limit(20)
            ->get();

        return [
            'total_submissions' => $totalSubmissions,
            'pending_grading' => $pendingGrading,
            'average_score' => $averageScore,
            'pass_rate' => $passRate,
            'bloom_distribution' => $bloomDistribution,
            'recent_activity' => $recentActivity,
        ];
    }
}
