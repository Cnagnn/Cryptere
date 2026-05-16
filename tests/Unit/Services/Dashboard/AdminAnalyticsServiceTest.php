<?php

use App\Models\Badge;
use App\Models\User;
use App\Services\Dashboard\AdminAnalyticsService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

beforeEach(function (): void {
    Cache::flush();
});

test('cohort retention batches user activity into one query', function (): void {
    User::factory()->count(3)->create([
        'created_at' => now()->subWeek(),
        'last_active_date' => now(),
    ]);

    DB::enableQueryLog();

    $cohorts = app(AdminAnalyticsService::class)->getCohortRetention(4);

    $queryCount = count(DB::getQueryLog());
    DB::disableQueryLog();

    expect($cohorts)->not->toBeEmpty()
        ->and($cohorts[0]['signup_count'])->toBe(3)
        ->and($queryCount)->toBeLessThanOrEqual(1);
});

test('economy health batches user aggregates', function (): void {
    $users = User::factory()->count(2)->create([
        'xp' => 100,
        'points' => 50,
        'daily_xp_earned' => 10,
        'current_streak' => 2,
    ]);
    $badge = Badge::factory()->create();

    $users->each(fn (User $user) => $user->badges()->attach($badge, ['earned_at' => now()]));

    DB::enableQueryLog();

    $health = app(AdminAnalyticsService::class)->getEconomyHealth();

    $queryCount = count(DB::getQueryLog());
    DB::disableQueryLog();

    expect($health['total_xp_awarded_today'])->toBe(20)
        ->and($health['total_badges_earned'])->toBe(2)
        ->and($queryCount)->toBeLessThanOrEqual(3);
});
