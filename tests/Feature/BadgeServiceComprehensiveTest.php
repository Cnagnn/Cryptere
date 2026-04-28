<?php

use App\Events\BadgeEarned;
use App\Models\Badge;
use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LabVisit;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use App\Services\BadgeService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->service = new BadgeService;
    BadgeService::clearCache();
});

// ============================================================
// courses_completed criteria — Positive Scenarios
// ============================================================

test('awards courses completed badge at exact threshold', function () {
    $user = User::factory()->create();
    $badge = Badge::factory()->create([
        'slug' => 'courses-3',
        'criteria_type' => 'courses_completed',
        'criteria_value' => 3,
    ]);

    // Create exactly 3 completed enrollments
    Enrollment::factory()->count(3)->for($user)->create([
        'completed_at' => now(),
    ]);

    $awarded = $this->service->checkAndAward($user, 'courses_completed');

    expect($awarded)->toHaveCount(1)
        ->and($awarded->first()->slug)->toBe('courses-3');
});

test('awards courses completed badge when exceeding threshold', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'courses-3',
        'criteria_type' => 'courses_completed',
        'criteria_value' => 3,
    ]);

    Enrollment::factory()->count(5)->for($user)->create([
        'completed_at' => now(),
    ]);

    $awarded = $this->service->checkAndAward($user, 'courses_completed');

    expect($awarded)->toHaveCount(1);
});

// ============================================================
// courses_completed criteria — Negative Scenarios
// ============================================================

test('does not award courses completed badge for incomplete enrollments', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'courses-3',
        'criteria_type' => 'courses_completed',
        'criteria_value' => 3,
    ]);

    // 2 completed, 2 incomplete
    Enrollment::factory()->count(2)->for($user)->create(['completed_at' => now()]);
    Enrollment::factory()->count(2)->for($user)->create(['completed_at' => null]);

    $awarded = $this->service->checkAndAward($user, 'courses_completed');

    expect($awarded)->toHaveCount(0);
});

// ============================================================
// lessons_completed criteria — Positive Scenarios
// ============================================================

test('awards lessons completed badge', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'lessons-10',
        'criteria_type' => 'lessons_completed',
        'criteria_value' => 10,
    ]);

    $course = Course::factory()->create(['is_published' => true]);
    $lessons = Lesson::factory()->count(10)->create(['course_id' => $course->id]);

    foreach ($lessons as $lesson) {
        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);
    }

    $awarded = $this->service->checkAndAward($user, 'lessons_completed');

    expect($awarded)->toHaveCount(1);
});

// ============================================================
// lessons_completed criteria — Negative Scenarios
// ============================================================

test('does not award lessons badge for incomplete lessons', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'lessons-10',
        'criteria_type' => 'lessons_completed',
        'criteria_value' => 10,
    ]);

    $course = Course::factory()->create(['is_published' => true]);
    $lessons = Lesson::factory()->count(5)->create(['course_id' => $course->id]);

    foreach ($lessons as $lesson) {
        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);
    }

    $awarded = $this->service->checkAndAward($user, 'lessons_completed');

    expect($awarded)->toHaveCount(0);
});

// ============================================================
// challenges_solved criteria — Positive Scenarios
// ============================================================

test('awards challenges solved badge for distinct challenges', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'challenges-5',
        'criteria_type' => 'challenges_solved',
        'criteria_value' => 5,
    ]);

    // 5 different challenges, each solved correctly
    for ($i = 0; $i < 5; $i++) {
        $challenge = Challenge::factory()->create();
        ChallengeSubmission::factory()->create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'is_correct' => true,
        ]);
    }

    $awarded = $this->service->checkAndAward($user, 'challenges_solved');

    expect($awarded)->toHaveCount(1);
});

// ============================================================
// challenges_solved criteria — Negative Scenarios
// ============================================================

test('does not count duplicate challenge solves', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'challenges-5',
        'criteria_type' => 'challenges_solved',
        'criteria_value' => 5,
    ]);

    // Same challenge solved 5 times — should count as 1
    $challenge = Challenge::factory()->create();
    ChallengeSubmission::factory()->count(5)->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
    ]);

    $awarded = $this->service->checkAndAward($user, 'challenges_solved');

    expect($awarded)->toHaveCount(0);
});

test('does not count incorrect challenge submissions', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'challenges-3',
        'criteria_type' => 'challenges_solved',
        'criteria_value' => 3,
    ]);

    for ($i = 0; $i < 5; $i++) {
        $challenge = Challenge::factory()->create();
        ChallengeSubmission::factory()->create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'is_correct' => false,
        ]);
    }

    $awarded = $this->service->checkAndAward($user, 'challenges_solved');

    expect($awarded)->toHaveCount(0);
});

// ============================================================
// speed_demon criteria — Positive Scenarios
// ============================================================

test('awards speed demon badge for fast correct answer', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'speed-demon',
        'criteria_type' => 'speed_demon',
        'criteria_value' => 1,
    ]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'is_correct' => true,
        'elapsed_ms' => 3000, // Under 5000ms threshold
    ]);

    $awarded = $this->service->checkAndAward($user, 'speed_demon');

    expect($awarded)->toHaveCount(1);
});

// ============================================================
// speed_demon criteria — Negative Scenarios
// ============================================================

test('does not award speed demon for slow answer', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'speed-demon',
        'criteria_type' => 'speed_demon',
        'criteria_value' => 1,
    ]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'is_correct' => true,
        'elapsed_ms' => 6000, // Over 5000ms threshold
    ]);

    $awarded = $this->service->checkAndAward($user, 'speed_demon');

    expect($awarded)->toHaveCount(0);
});

test('does not award speed demon for fast but incorrect answer', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'speed-demon',
        'criteria_type' => 'speed_demon',
        'criteria_value' => 1,
    ]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'is_correct' => false,
        'elapsed_ms' => 2000,
    ]);

    $awarded = $this->service->checkAndAward($user, 'speed_demon');

    expect($awarded)->toHaveCount(0);
});

// ============================================================
// streak_days criteria — Edge Scenarios
// ============================================================

test('awards streak badge based on longest streak even if current is lower', function () {
    $user = User::factory()->create([
        'current_streak' => 3,
        'longest_streak' => 14,
    ]);
    Badge::factory()->create([
        'slug' => 'streak-14',
        'criteria_type' => 'streak_days',
        'criteria_value' => 14,
    ]);

    $awarded = $this->service->checkAndAward($user, 'streak_days');

    expect($awarded)->toHaveCount(1);
});

test('does not award streak badge when both streaks are below threshold', function () {
    $user = User::factory()->create([
        'current_streak' => 3,
        'longest_streak' => 5,
    ]);
    Badge::factory()->create([
        'slug' => 'streak-7',
        'criteria_type' => 'streak_days',
        'criteria_value' => 7,
    ]);

    $awarded = $this->service->checkAndAward($user, 'streak_days');

    expect($awarded)->toHaveCount(0);
});

// ============================================================
// points_earned criteria — Edge Scenarios
// ============================================================

test('awards points badge at exact threshold', function () {
    $user = User::factory()->create(['points' => 1000]);
    Badge::factory()->create([
        'slug' => 'points-1000',
        'criteria_type' => 'points_earned',
        'criteria_value' => 1000,
    ]);

    $awarded = $this->service->checkAndAward($user, 'points_earned');

    expect($awarded)->toHaveCount(1);
});

test('does not award points badge one below threshold', function () {
    $user = User::factory()->create(['points' => 999]);
    Badge::factory()->create([
        'slug' => 'points-1000',
        'criteria_type' => 'points_earned',
        'criteria_value' => 1000,
    ]);

    $awarded = $this->service->checkAndAward($user, 'points_earned');

    expect($awarded)->toHaveCount(0);
});

// ============================================================
// Multiple badges — Progressive Awards
// ============================================================

test('awards multiple tiered badges at once', function () {
    $user = User::factory()->create(['points' => 1500]);
    Badge::factory()->create([
        'slug' => 'points-100',
        'criteria_type' => 'points_earned',
        'criteria_value' => 100,
    ]);
    Badge::factory()->create([
        'slug' => 'points-500',
        'criteria_type' => 'points_earned',
        'criteria_value' => 500,
    ]);
    Badge::factory()->create([
        'slug' => 'points-1000',
        'criteria_type' => 'points_earned',
        'criteria_value' => 1000,
    ]);

    $awarded = $this->service->checkAndAward($user, 'points_earned');

    expect($awarded)->toHaveCount(3);
});

// ============================================================
// Event Dispatching
// ============================================================

test('dispatches BadgeEarned event when badge is awarded', function () {
    Event::fake([BadgeEarned::class]);

    $user = User::factory()->create(['points' => 600]);
    Badge::factory()->create([
        'slug' => 'points-500',
        'criteria_type' => 'points_earned',
        'criteria_value' => 500,
    ]);

    $this->service->checkAndAward($user, 'points_earned');

    Event::assertDispatched(BadgeEarned::class, function ($event) use ($user) {
        return $event->user->id === $user->id;
    });
});

test('does not dispatch event when no badge awarded', function () {
    Event::fake([BadgeEarned::class]);

    $user = User::factory()->create(['points' => 10]);
    Badge::factory()->create([
        'slug' => 'points-500',
        'criteria_type' => 'points_earned',
        'criteria_value' => 500,
    ]);

    $this->service->checkAndAward($user, 'points_earned');

    Event::assertNotDispatched(BadgeEarned::class);
});

// ============================================================
// Cache Behavior
// ============================================================

test('clearCache removes badge definitions from cache', function () {
    Cache::put('badge_definitions', 'stale-data', 3600);

    BadgeService::clearCache();

    expect(Cache::has('badge_definitions'))->toBeFalse();
});

test('invalidates user badge count cache when badge awarded', function () {
    $user = User::factory()->create(['points' => 600]);
    Cache::put("user:{$user->id}:badge_count", 0, 3600);

    Badge::factory()->create([
        'slug' => 'points-500',
        'criteria_type' => 'points_earned',
        'criteria_value' => 500,
    ]);

    $this->service->checkAndAward($user, 'points_earned');

    expect(Cache::has("user:{$user->id}:badge_count"))->toBeFalse();
});

// ============================================================
// Unknown criteria type — Negative Scenario
// ============================================================

test('unknown criteria type does not award badge', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'unknown-badge',
        'criteria_type' => 'nonexistent_criteria',
        'criteria_value' => 1,
    ]);

    $awarded = $this->service->checkAndAward($user, 'nonexistent_criteria');

    expect($awarded)->toHaveCount(0);
});

// ============================================================
// Empty criteria types array
// ============================================================

test('empty criteria types array returns empty collection', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'points-100',
        'criteria_type' => 'points_earned',
        'criteria_value' => 100,
    ]);

    $awarded = $this->service->checkAndAward($user, []);

    expect($awarded)->toHaveCount(0);
});
