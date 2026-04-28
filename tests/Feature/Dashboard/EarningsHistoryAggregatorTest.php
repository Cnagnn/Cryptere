<?php

use App\Models\ChallengeSubmission;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use App\Services\Dashboard\EarningsHistoryAggregator;

beforeEach(function () {
    $this->service = new EarningsHistoryAggregator;
});

// ─── build ───────────────────────────────────────────────────────────

it('returns correct structure with weekly and monthly series', function () {
    $user = User::factory()->create();

    $result = $this->service->build($user);

    expect($result)->toHaveKeys(['deltaFromPrevious', 'weekly', 'monthly'])
        ->and($result['weekly'])->toHaveCount(7)
        ->and($result['monthly'])->toHaveCount(12);
});

it('returns zero earnings when user has no activity', function () {
    $user = User::factory()->create();

    $result = $this->service->build($user);

    expect($result['deltaFromPrevious'])->toBe(0.0);

    foreach ($result['weekly'] as $day) {
        expect($day)->toHaveKeys(['label', 'points', 'xp'])
            ->and($day['points'])->toBe(0)
            ->and($day['xp'])->toBe(0);
    }

    foreach ($result['monthly'] as $month) {
        expect($month)->toHaveKeys(['label', 'points', 'xp'])
            ->and($month['points'])->toBe(0)
            ->and($month['xp'])->toBe(0);
    }
});

it('calculates weekly lesson earnings correctly', function () {
    $user = User::factory()->create();
    $lessons = Lesson::factory()->count(2)->create();

    // Complete 2 lessons today (each with unique lesson)
    foreach ($lessons as $lesson) {
        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);
    }

    $result = $this->service->build($user);

    $xpPerLesson = (int) config('rewards.lesson_completion_xp', 30);
    $todayEntry = $result['weekly']->last();

    expect($todayEntry['xp'])->toBe(2 * $xpPerLesson)
        ->and($todayEntry['points'])->toBeGreaterThanOrEqual(2 * $xpPerLesson);
});

it('calculates weekly challenge earnings correctly', function () {
    $user = User::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'is_correct' => true,
        'score' => 75,
        'submitted_at' => now(),
    ]);

    $result = $this->service->build($user);

    $todayEntry = $result['weekly']->last();
    expect($todayEntry['points'])->toBeGreaterThanOrEqual(75);
});

it('does not count incorrect challenge submissions', function () {
    $user = User::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'is_correct' => false,
        'score' => 0,
        'submitted_at' => now(),
    ]);

    $result = $this->service->build($user);

    $todayEntry = $result['weekly']->last();
    expect($todayEntry['points'])->toBe(0);
});

it('calculates monthly earnings correctly', function () {
    $user = User::factory()->create();
    $lessons = Lesson::factory()->count(3)->create();

    // Complete lessons this month (each with unique lesson)
    foreach ($lessons as $lesson) {
        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);
    }

    $result = $this->service->build($user);

    $xpPerLesson = (int) config('rewards.lesson_completion_xp', 30);
    $currentMonth = $result['monthly']->last();

    expect($currentMonth['xp'])->toBe(3 * $xpPerLesson)
        ->and($currentMonth['points'])->toBeGreaterThanOrEqual(3 * $xpPerLesson);
});

it('calculates positive delta when current month exceeds previous', function () {
    $user = User::factory()->create();

    // 1 lesson last month
    $lastMonthLesson = Lesson::factory()->create();
    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lastMonthLesson->id,
        'completed_at' => now()->subMonth(),
    ]);

    // 3 lessons this month (each with unique lesson)
    $thisMonthLessons = Lesson::factory()->count(3)->create();
    foreach ($thisMonthLessons as $lesson) {
        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);
    }

    $result = $this->service->build($user);

    expect($result['deltaFromPrevious'])->toBeGreaterThan(0);
});

it('calculates negative delta when current month is less than previous', function () {
    $user = User::factory()->create();

    // 5 lessons last month (each with unique lesson)
    $lastMonthLessons = Lesson::factory()->count(5)->create();
    foreach ($lastMonthLessons as $lesson) {
        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now()->subMonth(),
        ]);
    }

    // 1 lesson this month
    $thisMonthLesson = Lesson::factory()->create();
    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $thisMonthLesson->id,
        'completed_at' => now(),
    ]);

    $result = $this->service->build($user);

    expect($result['deltaFromPrevious'])->toBeLessThan(0);
});

it('returns 100% delta when only current month has activity', function () {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'completed_at' => now(),
    ]);

    $result = $this->service->build($user);

    expect($result['deltaFromPrevious'])->toBe(100.0);
});

it('does not include other users earnings', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    LessonProgress::factory()->count(5)->create([
        'user_id' => $otherUser->id,
        'completed_at' => now(),
    ]);

    $result = $this->service->build($user);

    $todayEntry = $result['weekly']->last();
    expect($todayEntry['points'])->toBe(0);
});

it('weekly series has day-of-week labels', function () {
    $user = User::factory()->create();

    $result = $this->service->build($user);

    $labels = $result['weekly']->pluck('label')->toArray();
    $validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    foreach ($labels as $label) {
        expect($validDays)->toContain($label);
    }
});

it('monthly series has month abbreviation labels', function () {
    $user = User::factory()->create();

    $result = $this->service->build($user);

    $labels = $result['monthly']->pluck('label')->toArray();
    $validMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    foreach ($labels as $label) {
        expect($validMonths)->toContain($label);
    }
});
