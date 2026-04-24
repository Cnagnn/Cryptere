<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('decay command reduces points for inactive users', function () {
    $inactiveDays = (int) config('rewards.decay_inactive_days');

    $user = User::factory()->create([
        'points' => 1000,
        'last_active_date' => now()->subDays($inactiveDays + 1)->toDateString(),
    ]);

    $this->artisan('app:decay-inactive-points')
        ->assertSuccessful();

    $fresh = $user->fresh();
    // 1000 * (1 - 0.01) = 990
    expect($fresh->points)->toBe(990);
});

test('decay command does not affect active users', function () {
    $user = User::factory()->create([
        'points' => 1000,
        'last_active_date' => now()->toDateString(),
    ]);

    $this->artisan('app:decay-inactive-points')
        ->assertSuccessful();

    expect($user->fresh()->points)->toBe(1000);
});

test('decay command does not reduce points below minimum', function () {
    $inactiveDays = (int) config('rewards.decay_inactive_days');
    $minPoints = (int) config('rewards.decay_min_points');

    $user = User::factory()->create([
        'points' => $minPoints + 1,
        'last_active_date' => now()->subDays($inactiveDays + 1)->toDateString(),
    ]);

    $this->artisan('app:decay-inactive-points')
        ->assertSuccessful();

    $fresh = $user->fresh();
    expect($fresh->points)->toBeGreaterThanOrEqual($minPoints);
});

test('decay command skips users at or below minimum points', function () {
    $inactiveDays = (int) config('rewards.decay_inactive_days');
    $minPoints = (int) config('rewards.decay_min_points');

    $user = User::factory()->create([
        'points' => $minPoints,
        'last_active_date' => now()->subDays($inactiveDays + 5)->toDateString(),
    ]);

    $this->artisan('app:decay-inactive-points')
        ->assertSuccessful();

    expect($user->fresh()->points)->toBe($minPoints);
});

test('decay command skips users with null last_active_date', function () {
    $user = User::factory()->create([
        'points' => 500,
        'last_active_date' => null,
    ]);

    $this->artisan('app:decay-inactive-points')
        ->assertSuccessful();

    expect($user->fresh()->points)->toBe(500);
});
