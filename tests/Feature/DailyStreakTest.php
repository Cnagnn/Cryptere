<?php

use App\Models\User;
use App\Services\XpService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// --- updateDailyStreak: first-ever login ---

test('first login sets streak to 1 and awards first_login bonus', function () {
    $user = User::factory()->create([
        'current_streak' => 0,
        'longest_streak' => 0,
        'last_active_date' => null,
        'xp' => 0,
        'daily_xp_earned' => 0,
    ]);

    $result = app(XpService::class)->updateDailyStreak($user);

    $fresh = $user->fresh();
    expect($fresh->current_streak)->toBe(1)
        ->and($fresh->longest_streak)->toBe(1)
        ->and($fresh->last_active_date->toDateString())->toBe(CarbonImmutable::today()->toDateString())
        ->and($result['bonuses'])->toContain('first_login')
        ->and($result['xp'])->toBeGreaterThan(0);
});

// --- updateDailyStreak: same-day no-op ---

test('calling updateDailyStreak twice on the same day is a no-op', function () {
    $user = User::factory()->create([
        'current_streak' => 3,
        'longest_streak' => 5,
        'last_active_date' => CarbonImmutable::today(),
        'xp' => 100,
        'daily_xp_earned' => 10,
    ]);

    $result = app(XpService::class)->updateDailyStreak($user);

    expect($result)->toBe(['xp' => 0, 'bonuses' => []])
        ->and($user->fresh()->current_streak)->toBe(3)
        ->and($user->fresh()->daily_xp_earned)->toBe(10);
});

// --- updateDailyStreak: consecutive day increments streak ---

test('consecutive day login increments streak by 1', function () {
    $yesterday = CarbonImmutable::today()->subDay();

    $user = User::factory()->create([
        'current_streak' => 4,
        'longest_streak' => 10,
        'last_active_date' => $yesterday,
        'xp' => 50,
        'daily_xp_earned' => 20,
    ]);

    $result = app(XpService::class)->updateDailyStreak($user);

    $fresh = $user->fresh();
    expect($fresh->current_streak)->toBe(5)
        ->and($fresh->longest_streak)->toBe(10)
        ->and($fresh->last_active_date->toDateString())->toBe(CarbonImmutable::today()->toDateString())
        ->and($fresh->daily_xp_earned)->toBe($result['xp']) // reset to 0 then streak XP tracked
        ->and($fresh->daily_goal_met_at)->toBeNull()
        ->and($result['xp'])->toBeGreaterThan(0);
});

// --- updateDailyStreak: updates longest streak ---

test('streak increment updates longest_streak when it exceeds previous record', function () {
    $yesterday = CarbonImmutable::today()->subDay();

    $user = User::factory()->create([
        'current_streak' => 5,
        'longest_streak' => 5,
        'last_active_date' => $yesterday,
        'xp' => 0,
    ]);

    app(XpService::class)->updateDailyStreak($user);

    $fresh = $user->fresh();
    expect($fresh->current_streak)->toBe(6)
        ->and($fresh->longest_streak)->toBe(6);
});

// --- updateDailyStreak: gap resets streak ---

test('gap of more than 1 day resets streak to 1', function () {
    $twoDaysAgo = CarbonImmutable::today()->subDays(2);

    $user = User::factory()->create([
        'current_streak' => 10,
        'longest_streak' => 15,
        'last_active_date' => $twoDaysAgo,
        'xp' => 0,
    ]);

    $result = app(XpService::class)->updateDailyStreak($user);

    $fresh = $user->fresh();
    expect($fresh->current_streak)->toBe(1)
        ->and($fresh->longest_streak)->toBe(15)
        ->and($fresh->last_active_date->toDateString())->toBe(CarbonImmutable::today()->toDateString());
});

// --- updateDailyStreak: comeback bonus ---

test('comeback bonus is awarded after 7+ days of inactivity', function () {
    $eightDaysAgo = CarbonImmutable::today()->subDays(8);

    $user = User::factory()->create([
        'current_streak' => 5,
        'longest_streak' => 5,
        'last_active_date' => $eightDaysAgo,
        'xp' => 0,
    ]);

    $result = app(XpService::class)->updateDailyStreak($user);

    expect($result['bonuses'])->toContain('comeback')
        ->and($user->fresh()->current_streak)->toBe(1);
});

test('no comeback bonus for gap less than 7 days', function () {
    $threeDaysAgo = CarbonImmutable::today()->subDays(3);

    $user = User::factory()->create([
        'current_streak' => 5,
        'longest_streak' => 5,
        'last_active_date' => $threeDaysAgo,
        'xp' => 0,
    ]);

    $result = app(XpService::class)->updateDailyStreak($user);

    expect($result['bonuses'])->not->toContain('comeback');
});

// --- updateDailyStreak: weekly active bonus ---

test('weekly active bonus is awarded when streak reaches exactly 7', function () {
    $yesterday = CarbonImmutable::today()->subDay();

    $user = User::factory()->create([
        'current_streak' => 6,
        'longest_streak' => 6,
        'last_active_date' => $yesterday,
        'xp' => 0,
    ]);

    $result = app(XpService::class)->updateDailyStreak($user);

    expect($result['bonuses'])->toContain('weekly_active')
        ->and($user->fresh()->current_streak)->toBe(7);
});

test('weekly active bonus is not awarded for streak != 7', function () {
    $yesterday = CarbonImmutable::today()->subDay();

    $user = User::factory()->create([
        'current_streak' => 7,
        'longest_streak' => 7,
        'last_active_date' => $yesterday,
        'xp' => 0,
    ]);

    $result = app(XpService::class)->updateDailyStreak($user);

    expect($result['bonuses'])->not->toContain('weekly_active')
        ->and($user->fresh()->current_streak)->toBe(8);
});

// --- Middleware integration: streak updates on authenticated page visit ---

test('visiting a page as authenticated user triggers streak update', function () {
    $yesterday = CarbonImmutable::today()->subDay();

    $user = User::factory()->create([
        'current_streak' => 2,
        'longest_streak' => 2,
        'last_active_date' => $yesterday,
        'xp' => 0,
        'daily_xp_earned' => 50,
    ]);

    $this->actingAs($user)->get('/dashboard');

    $fresh = $user->fresh();
    expect($fresh->current_streak)->toBe(3)
        ->and($fresh->longest_streak)->toBe(3)
        ->and($fresh->last_active_date->toDateString())->toBe(CarbonImmutable::today()->toDateString())
        ->and($fresh->daily_xp_earned)->toBeGreaterThan(0); // streak XP tracked after reset
});

test('visiting a page when already active today does not change streak', function () {
    $user = User::factory()->create([
        'current_streak' => 5,
        'longest_streak' => 10,
        'last_active_date' => CarbonImmutable::today(),
        'xp' => 100,
        'daily_xp_earned' => 30,
    ]);

    $this->actingAs($user)->get('/dashboard');

    $fresh = $user->fresh();
    expect($fresh->current_streak)->toBe(5)
        ->and($fresh->daily_xp_earned)->toBe(30);
});
