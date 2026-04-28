<?php

use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use App\Services\Dashboard\AnalyticsBuilder;

beforeEach(function () {
    $this->service = new AnalyticsBuilder;
});

// ─── heatmap ─────────────────────────────────────────────────────────

it('returns 365+ days of heatmap data', function () {
    $user = User::factory()->create();

    $result = $this->service->heatmap($user->id);

    // Should cover ~366 days (last year to today inclusive)
    expect($result)->toBeArray()
        ->and(count($result))->toBeGreaterThanOrEqual(365);

    // Each entry should have date and count
    expect($result[0])->toHaveKeys(['date', 'count']);
});

it('counts lesson completions in heatmap', function () {
    $user = User::factory()->create();
    $lessons = Lesson::factory()->count(3)->create();

    foreach ($lessons as $lesson) {
        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);
    }

    $result = $this->service->heatmap($user->id);

    $today = collect($result)->firstWhere('date', now()->toDateString());
    expect($today['count'])->toBe(3);
});

it('counts challenge submissions in heatmap', function () {
    $user = User::factory()->create();

    ChallengeSubmission::factory()->count(2)->create([
        'user_id' => $user->id,
        'submitted_at' => now(),
    ]);

    $result = $this->service->heatmap($user->id);

    $today = collect($result)->firstWhere('date', now()->toDateString());
    expect($today['count'])->toBe(2);
});

it('combines lesson and challenge activity in heatmap', function () {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'completed_at' => now(),
    ]);
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'submitted_at' => now(),
    ]);

    $result = $this->service->heatmap($user->id);

    $today = collect($result)->firstWhere('date', now()->toDateString());
    expect($today['count'])->toBe(2);
});

it('returns zero counts for days with no activity', function () {
    $user = User::factory()->create();

    $result = $this->service->heatmap($user->id);

    $yesterday = collect($result)->firstWhere('date', now()->subDay()->toDateString());
    expect($yesterday['count'])->toBe(0);
});

it('does not include other users activity in heatmap', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    LessonProgress::factory()->create([
        'user_id' => $otherUser->id,
        'completed_at' => now(),
    ]);

    $result = $this->service->heatmap($user->id);

    $today = collect($result)->firstWhere('date', now()->toDateString());
    expect($today['count'])->toBe(0);
});

// ─── skillRadar ──────────────────────────────────────────────────────

it('returns empty skill radar when no enrollments', function () {
    $user = User::factory()->create();

    $result = $this->service->skillRadar($user->id);

    expect($result)->toBeArray()->toBeEmpty();
});

it('calculates skill radar scores by category', function () {
    $user = User::factory()->create();

    $blockchainCourse = Course::factory()->create(['category' => 'Blockchain']);
    $securityCourse = Course::factory()->create(['category' => 'Security']);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $blockchainCourse->id,
        'progress_percentage' => 80,
    ]);
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $securityCourse->id,
        'progress_percentage' => 60,
    ]);

    $result = $this->service->skillRadar($user->id);

    expect($result)->toHaveCount(2);

    $blockchain = collect($result)->firstWhere('category', 'Blockchain');
    $security = collect($result)->firstWhere('category', 'Security');

    expect($blockchain['score'])->toBe(80)
        ->and($security['score'])->toBe(60);
});

it('averages progress across multiple courses in same category', function () {
    $user = User::factory()->create();

    $course1 = Course::factory()->create(['category' => 'Blockchain']);
    $course2 = Course::factory()->create(['category' => 'Blockchain']);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course1->id,
        'progress_percentage' => 100,
    ]);
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course2->id,
        'progress_percentage' => 50,
    ]);

    $result = $this->service->skillRadar($user->id);

    $blockchain = collect($result)->firstWhere('category', 'Blockchain');
    expect($blockchain['score'])->toBe(75); // (100 + 50) / 2
});

it('excludes courses with null category from skill radar', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create(['category' => null]);
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 80,
    ]);

    $result = $this->service->skillRadar($user->id);

    expect($result)->toBeEmpty();
});

// ─── streakCalendar ──────────────────────────────────────────────────

it('returns 35 days of streak calendar data', function () {
    $user = User::factory()->create();

    $result = $this->service->streakCalendar($user->id);

    // 5 weeks = 35 days
    expect($result)->toHaveCount(35);

    // Each entry should have required keys
    expect($result[0])->toHaveKeys(['date', 'active', 'isToday', 'isOutOfRange', 'isFuture']);
});

it('marks today correctly in streak calendar', function () {
    $user = User::factory()->create();

    $result = $this->service->streakCalendar($user->id);

    $todayEntries = collect($result)->where('isToday', true);
    expect($todayEntries)->toHaveCount(1);

    $today = $todayEntries->first();
    expect($today['date'])->toBe(now()->toDateString());
});

it('marks future dates correctly in streak calendar', function () {
    $user = User::factory()->create();

    $result = $this->service->streakCalendar($user->id);

    $futureDates = collect($result)->where('isFuture', true);
    foreach ($futureDates as $entry) {
        expect($entry['active'])->toBeFalse();
    }
});

it('marks active dates from lesson completions', function () {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();

    $yesterday = now()->subDay();
    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'completed_at' => $yesterday,
    ]);

    $result = $this->service->streakCalendar($user->id);

    $yesterdayEntry = collect($result)->firstWhere('date', $yesterday->toDateString());
    expect($yesterdayEntry['active'])->toBeTrue();
});

it('marks active dates from streak data', function () {
    $user = User::factory()->create([
        'current_streak' => 3,
        'last_active_date' => now(),
    ]);

    $result = $this->service->streakCalendar($user->id);

    // Today and 2 days before should be active
    $today = collect($result)->firstWhere('date', now()->toDateString());
    $yesterday = collect($result)->firstWhere('date', now()->subDay()->toDateString());
    $twoDaysAgo = collect($result)->firstWhere('date', now()->subDays(2)->toDateString());

    expect($today['active'])->toBeTrue()
        ->and($yesterday['active'])->toBeTrue()
        ->and($twoDaysAgo['active'])->toBeTrue();
});

// ─── progressTrend ───────────────────────────────────────────────────

it('returns 12 weeks of progress trend data', function () {
    $user = User::factory()->create();

    $result = $this->service->progressTrend($user->id);

    expect($result)->toHaveCount(12);
    expect($result[0])->toHaveKeys(['week', 'points']);
});

it('calculates lesson points in progress trend', function () {
    $user = User::factory()->create();
    $lessons = Lesson::factory()->count(2)->create();

    // Complete 2 lessons this week (each with unique lesson)
    foreach ($lessons as $lesson) {
        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);
    }

    $result = $this->service->progressTrend($user->id);

    $currentWeek = $result[11]; // Last entry is current week
    $xpPerLesson = (int) config('rewards.lesson_completion_xp', 30);
    expect($currentWeek['points'])->toBeGreaterThanOrEqual(2 * $xpPerLesson);
});

it('includes challenge scores in progress trend', function () {
    $user = User::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'is_correct' => true,
        'score' => 100,
        'submitted_at' => now(),
    ]);

    $result = $this->service->progressTrend($user->id);

    $currentWeek = $result[11];
    expect($currentWeek['points'])->toBeGreaterThanOrEqual(100);
});

it('returns zero points for weeks with no activity', function () {
    $user = User::factory()->create();

    $result = $this->service->progressTrend($user->id);

    // All weeks should have 0 points when no activity
    foreach ($result as $week) {
        expect($week['points'])->toBe(0);
    }
});

it('does not count incorrect challenge submissions in progress trend', function () {
    $user = User::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'is_correct' => false,
        'score' => 0,
        'submitted_at' => now(),
    ]);

    $result = $this->service->progressTrend($user->id);

    $currentWeek = $result[11];
    expect($currentWeek['points'])->toBe(0);
});
