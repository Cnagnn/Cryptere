<?php

use App\Models\User;
use App\Services\BadgeService;
use App\Services\StreakService;
use App\Services\XpService;
use Carbon\CarbonImmutable;

beforeEach(function () {
    $this->xpService = Mockery::mock(XpService::class);
    $this->xpService->shouldReceive('trackDailyGoal')->andReturn(0);
    $this->badgeService = Mockery::mock(BadgeService::class);
    $this->badgeService->shouldReceive('checkAndAward')->andReturn(collect());
    $this->service = new StreakService($this->xpService, $this->badgeService);
});

test('no-ops if user already active today', function () {
    $user = User::factory()->create([
        'last_active_date' => CarbonImmutable::today(),
        'current_streak' => 5,
    ]);

    $result = $this->service->updateDailyStreak($user);

    expect($result['xp'])->toBe(0)
        ->and($result['bonuses'])->toBeEmpty();
});

test('increments streak for consecutive day', function () {
    $this->xpService->shouldReceive('getStreakDailyXp')->andReturn(10);

    $user = User::factory()->create([
        'last_active_date' => CarbonImmutable::yesterday(),
        'current_streak' => 3,
        'longest_streak' => 5,
        'daily_xp_earned' => 50,
    ]);

    $result = $this->service->updateDailyStreak($user);

    $user->refresh();
    expect($user->current_streak)->toBe(4)
        ->and($result['xp'])->toBeGreaterThan(0);
});

test('resets streak after gap', function () {
    $this->xpService->shouldReceive('getStreakDailyXp')->andReturn(5);

    $user = User::factory()->create([
        'last_active_date' => CarbonImmutable::today()->subDays(3),
        'current_streak' => 10,
        'longest_streak' => 10,
    ]);

    $this->service->updateDailyStreak($user);

    $user->refresh();
    expect($user->current_streak)->toBe(1);
});

test('awards first login bonus for new user', function () {
    $this->xpService->shouldReceive('getStreakDailyXp')->andReturn(5);

    $user = User::factory()->create([
        'last_active_date' => null,
        'current_streak' => 0,
        'longest_streak' => 0,
    ]);

    $result = $this->service->updateDailyStreak($user);

    expect($result['bonuses'])->toContain('first_login');
});

test('awards comeback bonus after long gap', function () {
    config(['rewards.comeback_gap_days' => 7]);

    $this->xpService->shouldReceive('getStreakDailyXp')->andReturn(5);

    $user = User::factory()->create([
        'last_active_date' => CarbonImmutable::today()->subDays(10),
        'current_streak' => 5,
        'longest_streak' => 5,
    ]);

    $result = $this->service->updateDailyStreak($user);

    expect($result['bonuses'])->toContain('comeback');
});

test('awards weekly active bonus at 7 day streak', function () {
    $this->xpService->shouldReceive('getStreakDailyXp')->andReturn(5);

    $user = User::factory()->create([
        'last_active_date' => CarbonImmutable::yesterday(),
        'current_streak' => 6,
        'longest_streak' => 6,
    ]);

    $result = $this->service->updateDailyStreak($user);

    expect($result['bonuses'])->toContain('weekly_active');
});

test('updates longest streak when current exceeds it', function () {
    $this->xpService->shouldReceive('getStreakDailyXp')->andReturn(5);

    $user = User::factory()->create([
        'last_active_date' => CarbonImmutable::yesterday(),
        'current_streak' => 5,
        'longest_streak' => 5,
    ]);

    $this->service->updateDailyStreak($user);

    $user->refresh();
    expect($user->longest_streak)->toBe(6);
});
