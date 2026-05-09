<?php

use App\Models\User;
use App\Models\UserBalanceChange;
use App\Services\Dashboard\EarningsHistoryAggregator;

test('user balance changes are recorded when xp or points change', function () {
    $user = User::factory()->create([
        'xp' => 0,
        'points' => 0,
    ]);

    $user->increment('xp', 40);
    $user->increment('points', 12);
    $user->decrement('points', 5);

    $changes = UserBalanceChange::query()
        ->whereBelongsTo($user)
        ->orderBy('id')
        ->get();

    expect($changes)->toHaveCount(3);
    expect($changes->first()->xp_delta)->toBe(40);
    expect($changes->first()->points_delta)->toBe(0);
    expect($changes->last()->points_delta)->toBe(-5);
});

test('earnings history aggregates recorded balance changes', function () {
    $user = User::factory()->create();

    UserBalanceChange::factory()->for($user)->create([
        'xp_delta' => 30,
        'points_delta' => 18,
        'source' => 'course_completion',
        'created_at' => now()->subDays(1),
        'updated_at' => now()->subDays(1),
    ]);

    UserBalanceChange::factory()->for($user)->create([
        'xp_delta' => 45,
        'points_delta' => 22,
        'source' => 'challenge_session',
        'created_at' => now()->subMonths(1),
        'updated_at' => now()->subMonths(1),
    ]);

    $history = app(EarningsHistoryAggregator::class)->build($user);

    $weeklyEntry = collect($history['weekly'])->firstWhere('label', now()->subDays(1)->format('D'));
    $monthlyEntry = collect($history['monthly'])->firstWhere('label', now()->subMonths(1)->startOfMonth()->format('M'));

    expect($weeklyEntry['xp'])->toBe(30);
    expect($weeklyEntry['points'])->toBe(18);
    expect($monthlyEntry['xp'])->toBe(45);
    expect($monthlyEntry['points'])->toBe(22);
});
