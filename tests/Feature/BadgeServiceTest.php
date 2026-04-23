<?php

use App\Models\Badge;
use App\Models\Enrollment;
use App\Models\LabVisit;
use App\Models\User;
use App\Services\BadgeService;

beforeEach(function () {
    $this->service = new BadgeService;
});

test('awards first enrollment badge when user has enrollment', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'first-enrollment',
        'criteria_type' => 'first_enrollment',
        'criteria_value' => 1,
    ]);

    Enrollment::factory()->for($user)->create();
    BadgeService::clearCache();

    $awarded = $this->service->checkAndAward($user, 'first_enrollment');

    expect($awarded)->toHaveCount(1);
    expect($awarded->first()->slug)->toBe('first-enrollment');
    expect($user->badges)->toHaveCount(1);
});

test('does not award badge when criteria not met', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'courses-5',
        'criteria_type' => 'courses_completed',
        'criteria_value' => 5,
    ]);
    BadgeService::clearCache();

    $awarded = $this->service->checkAndAward($user, 'courses_completed');

    expect($awarded)->toHaveCount(0);
});

test('does not award same badge twice', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'first-enrollment',
        'criteria_type' => 'first_enrollment',
        'criteria_value' => 1,
    ]);

    Enrollment::factory()->for($user)->create();
    BadgeService::clearCache();

    $this->service->checkAndAward($user, 'first_enrollment');
    $secondAward = $this->service->checkAndAward($user, 'first_enrollment');

    expect($secondAward)->toHaveCount(0);
    expect($user->badges()->count())->toBe(1);
});

test('awards points earned badge when user has enough points', function () {
    $user = User::factory()->create(['points' => 600]);
    Badge::factory()->create([
        'slug' => 'points-500',
        'criteria_type' => 'points_earned',
        'criteria_value' => 500,
    ]);
    BadgeService::clearCache();

    $awarded = $this->service->checkAndAward($user, 'points_earned');

    expect($awarded)->toHaveCount(1);
});

test('awards streak badge when user has sufficient streak', function () {
    $user = User::factory()->create(['current_streak' => 7]);
    Badge::factory()->create([
        'slug' => 'streak-7',
        'criteria_type' => 'streak_days',
        'criteria_value' => 7,
    ]);
    BadgeService::clearCache();

    $awarded = $this->service->checkAndAward($user, 'streak_days');

    expect($awarded)->toHaveCount(1);
});

test('awards labs visited badge when user visited enough labs', function () {
    $user = User::factory()->create();
    Badge::factory()->create([
        'slug' => 'lab-explorer-3',
        'criteria_type' => 'labs_visited',
        'criteria_value' => 3,
    ]);

    foreach (['caesar', 'aes', 'rsa'] as $slug) {
        LabVisit::create([
            'user_id' => $user->id,
            'lab_slug' => $slug,
            'visit_count' => 1,
            'first_visited_at' => now(),
            'last_visited_at' => now(),
        ]);
    }
    BadgeService::clearCache();

    $awarded = $this->service->checkAndAward($user, 'labs_visited');

    expect($awarded)->toHaveCount(1);
});

test('checks multiple criteria types at once', function () {
    $user = User::factory()->create(['points' => 600, 'current_streak' => 7]);
    Badge::factory()->create([
        'slug' => 'points-500',
        'criteria_type' => 'points_earned',
        'criteria_value' => 500,
    ]);
    Badge::factory()->create([
        'slug' => 'streak-7',
        'criteria_type' => 'streak_days',
        'criteria_value' => 7,
    ]);
    BadgeService::clearCache();

    $awarded = $this->service->checkAndAward($user, ['points_earned', 'streak_days']);

    expect($awarded)->toHaveCount(2);
});
