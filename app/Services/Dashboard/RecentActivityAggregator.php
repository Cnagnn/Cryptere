<?php

namespace App\Services\Dashboard;

use App\Models\Badge;
use App\Models\Enrollment;
use App\Models\LabVisit;
use App\Models\QuizSubmission;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class RecentActivityAggregator
{
    /**
     * Build recent activity feed from active sources, merged and sorted by date.
     *
     * @return Collection<int, array{id: string, title: string, tag: string, timestamp: string|null, isoDate: string|null}>
     */
    public function build(User $user): Collection
    {
        $lessonActivities = $user->lessonProgress()
            ->whereNotNull('completed_at')
            ->with('lesson:id,title')
            ->latest('completed_at')
            ->take(5)
            ->get()
            ->map(fn ($progress): array => [
                'id' => 'lesson-'.$progress->id,
                'title' => 'Completed lesson "'.$progress->lesson?->title.'"',
                'tag' => 'Lesson',
                'timestamp' => $progress->completed_at?->diffForHumans(),
                'isoDate' => $progress->completed_at?->toIso8601String(),
            ]);

        $enrollmentActivities = Enrollment::query()
            ->whereBelongsTo($user)
            ->with('course:id,title')
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(fn (Enrollment $enrollment): array => [
                'id' => 'enrollment-'.$enrollment->id,
                'title' => 'Enrolled in "'.$enrollment->course?->title.'"',
                'tag' => 'Course',
                'timestamp' => $enrollment->created_at?->diffForHumans(),
                'isoDate' => $enrollment->created_at?->toIso8601String(),
            ]);

        $badgeActivities = $user->badges()
            ->latest('user_badges.earned_at')
            ->take(5)
            ->get()
            ->map(function (Badge $badge): array {
                $earnedAt = $badge->pivot->earned_at ? Carbon::parse($badge->pivot->earned_at) : $badge->pivot->created_at;

                return [
                    'id' => 'badge-'.$badge->id,
                    'title' => 'Earned badge "'.$badge->name.'"',
                    'tag' => 'Badge',
                    'timestamp' => $earnedAt?->diffForHumans(),
                    'isoDate' => $earnedAt?->toIso8601String(),
                ];
            });

        $quizActivities = QuizSubmission::query()
            ->where('user_id', $user->id)
            ->whereNotNull('submitted_at')
            ->latest('submitted_at')
            ->take(5)
            ->get()
            ->map(fn (QuizSubmission $quiz): array => [
                'id' => 'quiz-'.$quiz->id,
                'title' => 'Completed quiz — scored '.$quiz->score.'/'.$quiz->total,
                'tag' => 'Quiz',
                'timestamp' => $quiz->submitted_at?->diffForHumans(),
                'isoDate' => $quiz->submitted_at?->toIso8601String(),
            ]);

        $labActivities = $user->labVisits()
            ->latest('last_visited_at')
            ->take(5)
            ->get()
            ->map(fn (LabVisit $visit): array => [
                'id' => 'lab-'.$visit->id,
                'title' => 'Mengunjungi lab "'.Str::of($visit->lab_slug)->replace('-', ' ')->title().'"',
                'tag' => 'Lab',
                'timestamp' => $visit->last_visited_at?->diffForHumans(),
                'isoDate' => $visit->last_visited_at?->toIso8601String(),
            ]);

        $accountActivities = $this->buildAccountActivities($user);

        $socialActivities = $user->socialAccounts()
            ->latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($social): array => [
                'id' => 'social-'.$social->id,
                'title' => 'Menghubungkan akun '.Str::of($social->provider)->title(),
                'tag' => 'Account',
                'timestamp' => $social->created_at?->diffForHumans(),
                'isoDate' => $social->created_at?->toIso8601String(),
            ]);

        return collect($lessonActivities->all())
            ->merge($enrollmentActivities->all())
            ->merge($badgeActivities->all())
            ->merge($quizActivities->all())
            ->merge($labActivities->all())
            ->merge($accountActivities->all())
            ->merge($socialActivities->all())
            ->filter(fn (array $activity): bool => ! empty($activity['isoDate']))
            ->sortByDesc('isoDate')
            ->take(15)
            ->values();
    }

    private function buildAccountActivities(User $user): Collection
    {
        $activities = collect();

        if ($user->email_verified_at) {
            $activities->push([
                'id' => 'account-email-verified',
                'title' => 'Memverifikasi alamat email',
                'tag' => 'Account',
                'timestamp' => $user->email_verified_at->diffForHumans(),
                'isoDate' => $user->email_verified_at->toIso8601String(),
            ]);
        }

        if ($user->two_factor_confirmed_at) {
            $activities->push([
                'id' => 'account-2fa-enabled',
                'title' => 'Enabled two-factor authentication',
                'tag' => 'Security',
                'timestamp' => $user->two_factor_confirmed_at->diffForHumans(),
                'isoDate' => $user->two_factor_confirmed_at->toIso8601String(),
            ]);
        }

        $activities->push([
            'id' => 'account-created',
            'title' => 'Bergabung dengan Cryptere',
            'tag' => 'Account',
            'timestamp' => $user->created_at?->diffForHumans(),
            'isoDate' => $user->created_at?->toIso8601String(),
        ]);

        return $activities;
    }
}
