<?php

use App\Events\BadgeEarned;
use App\Models\Badge;
use App\Models\Enrollment;
use App\Models\LabVisit;
use App\Models\LessonProgress;
use App\Models\User;
use App\Services\BadgeService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->service = app(BadgeService::class);
});

test('awards badge when first_enrollment criteria met', function () {
    Event::fake([BadgeEarned::class]);
    $user = User::factory()->create();
    Badge::factory()->create([
        'criteria_type' => 'first_enrollment',
        'criteria_value' => 1,
    ]);
    Enrollment::factory()->create(['user_id' => $user->id]);

    Cache::forget('badge_definitions');
    $awarded = $this->service->checkAndAward($user, 'first_enrollment');

    expect($awarded)->toHaveCount(1);
    Event::assertDispatched(BadgeEarned::class);
});

test('does not re-award already earned badge', function () {
    Event::fake([BadgeEarned::class]);
    $user = User::factory()->create();
    $badge = Badge::factory()->create([
        'criteria_type' => 'first_enrollment',
        'criteria_value' => 1,
    ]);
    Enrollment::factory()->create(['user_id' => $user->id]);
    $user->badges()->attach($badge->id, ['earned_at' => now()]);

    Cache::forget('badge_definitions');
    $awarded = $this->service->checkAndAward($user, 'first_enrollment');

    expect($awarded)->toHaveCount(0);
    Event::assertNotDispatched(BadgeEarned::class);
});

test('awards streak_days badge when streak sufficient', function () {
    Event::fake([BadgeEarned::class]);
    $user = User::factory()->create(['current_streak' => 7, 'longest_streak' => 7]);
    Badge::factory()->create([
        'criteria_type' => 'streak_days',
        'criteria_value' => 7,
    ]);

    Cache::forget('badge_definitions');
    $awarded = $this->service->checkAndAward($user, 'streak_days');

    expect($awarded)->toHaveCount(1);
});

test('does not award streak badge when streak insufficient', function () {
    Event::fake([BadgeEarned::class]);
    $user = User::factory()->create(['current_streak' => 3, 'longest_streak' => 3]);
    Badge::factory()->create([
        'criteria_type' => 'streak_days',
        'criteria_value' => 7,
    ]);

    Cache::forget('badge_definitions');
    $awarded = $this->service->checkAndAward($user, 'streak_days');

    expect($awarded)->toHaveCount(0);
});

test('awards points_earned badge when threshold met', function () {
    Event::fake([BadgeEarned::class]);
    $user = User::factory()->create(['points' => 500]);
    Badge::factory()->create([
        'criteria_type' => 'points_earned',
        'criteria_value' => 100,
    ]);

    Cache::forget('badge_definitions');
    $awarded = $this->service->checkAndAward($user, 'points_earned');

    expect($awarded)->toHaveCount(1);
});

test('awards lessons_completed badge', function () {
    Event::fake([BadgeEarned::class]);
    $user = User::factory()->create();
    Badge::factory()->create([
        'criteria_type' => 'lessons_completed',
        'criteria_value' => 3,
    ]);
    LessonProgress::factory()->count(3)->create([
        'user_id' => $user->id,
        'completed_at' => now(),
    ]);

    Cache::forget('badge_definitions');
    $awarded = $this->service->checkAndAward($user, 'lessons_completed');

    expect($awarded)->toHaveCount(1);
});

test('awards labs_visited badge', function () {
    Event::fake([BadgeEarned::class]);
    $user = User::factory()->create();
    Badge::factory()->create([
        'criteria_type' => 'labs_visited',
        'criteria_value' => 2,
    ]);
    LabVisit::factory()->create(['user_id' => $user->id, 'lab_slug' => 'caesar']);
    LabVisit::factory()->create(['user_id' => $user->id, 'lab_slug' => 'vigenere']);

    Cache::forget('badge_definitions');
    $awarded = $this->service->checkAndAward($user, 'labs_visited');

    expect($awarded)->toHaveCount(1);
});

test('checkAndAward only checks specified criteria types', function () {
    Event::fake([BadgeEarned::class]);
    $user = User::factory()->create(['points' => 1000, 'current_streak' => 30]);
    Badge::factory()->create(['criteria_type' => 'points_earned', 'criteria_value' => 100]);
    Badge::factory()->create(['criteria_type' => 'streak_days', 'criteria_value' => 7]);

    Cache::forget('badge_definitions');
    // Only check streak_days — should not award points_earned badge
    $awarded = $this->service->checkAndAward($user, 'streak_days');

    expect($awarded)->toHaveCount(1);
    expect($awarded->first()->criteria_type)->toBe('streak_days');
});

test('checkAndAward batches repeated criteria statistics', function () {
    Event::fake([BadgeEarned::class]);
    $user = User::factory()->create();
    Badge::factory()->count(3)->create([
        'criteria_type' => 'lessons_completed',
        'criteria_value' => 2,
    ]);
    LessonProgress::factory()->count(2)->create([
        'user_id' => $user->id,
        'completed_at' => now(),
    ]);

    Cache::forget('badge_definitions');
    DB::enableQueryLog();

    $awarded = $this->service->checkAndAward($user, 'lessons_completed');

    $lessonProgressQueries = collect(DB::getQueryLog())
        ->pluck('query')
        ->filter(fn (string $query): bool => str_contains($query, 'lesson_progress'))
        ->count();
    DB::disableQueryLog();

    expect($awarded)->toHaveCount(3)
        ->and($lessonProgressQueries)->toBeLessThanOrEqual(1);
});

test('clearCache forgets badge definitions', function () {
    Cache::put('badge_definitions', 'cached_value', 3600);

    BadgeService::clearCache();

    expect(Cache::has('badge_definitions'))->toBeFalse();
});
