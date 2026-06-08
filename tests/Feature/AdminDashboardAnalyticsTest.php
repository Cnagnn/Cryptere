<?php

use App\Models\User;
use App\Services\Dashboard\AdminAnalyticsService;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    Cache::flush();
});

test('economy health reports average streak with an accurate key', function () {
    User::factory()->create([
        'current_streak' => 2,
        'xp' => 80,
        'points' => 30,
        'daily_xp_earned' => 20,
    ]);
    User::factory()->create([
        'current_streak' => 6,
        'xp' => 120,
        'points' => 70,
        'daily_xp_earned' => 40,
    ]);

    $economy = app(AdminAnalyticsService::class)->getEconomyHealth();

    expect($economy)
        ->toHaveKey('avg_streak', 4.0)
        ->not->toHaveKey('median_streak');
});

test('cohort retention leaves future weeks unset instead of reporting churn', function () {
    User::factory()->create([
        'created_at' => now(),
        'last_active_date' => now(),
    ]);

    $retention = app(AdminAnalyticsService::class)->getCohortRetention(4);

    expect($retention[0]['retention']['week_0'])->toBe(100.0)
        ->and($retention[0]['retention']['week_1'])->toBeNull()
        ->and($retention[0]['retention']['week_2'])->toBeNull()
        ->and($retention[0]['retention']['week_3'])->toBeNull();
});
