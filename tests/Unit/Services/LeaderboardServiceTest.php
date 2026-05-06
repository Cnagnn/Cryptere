<?php

use App\Models\User;
use App\Services\LeaderboardService;

beforeEach(function () {
    $this->service = app(LeaderboardService::class);
});

// --- Validation Helpers ---

test('resolvePerPage returns valid option', function () {
    expect($this->service->resolvePerPage(10))->toBe(10);
    expect($this->service->resolvePerPage(25))->toBe(25);
    expect($this->service->resolvePerPage(50))->toBe(50);
    expect($this->service->resolvePerPage(100))->toBe(100);
});

test('resolvePerPage defaults for invalid value', function () {
    expect($this->service->resolvePerPage(7))->toBe(LeaderboardService::PER_PAGE);
    expect($this->service->resolvePerPage(999))->toBe(LeaderboardService::PER_PAGE);
});

test('resolveTimeframe returns valid timeframe', function () {
    expect($this->service->resolveTimeframe('weekly'))->toBe('weekly');
    expect($this->service->resolveTimeframe('monthly'))->toBe('monthly');
    expect($this->service->resolveTimeframe('all'))->toBe('all');
});

test('resolveTimeframe defaults for invalid value', function () {
    expect($this->service->resolveTimeframe('yearly'))->toBe('all');
    expect($this->service->resolveTimeframe(''))->toBe('all');
});

// --- All-Time Leaderboard ---

test('allTimeLeaders returns paginated users ordered by points', function () {
    User::factory()->create(['points' => 100, 'name' => 'Alice']);
    User::factory()->create(['points' => 300, 'name' => 'Bob']);
    User::factory()->create(['points' => 200, 'name' => 'Charlie']);

    $result = $this->service->allTimeLeaders(10);

    expect($result->items())->toHaveCount(3);
    expect($result->items()[0]->name)->toBe('Bob');
    expect($result->items()[1]->name)->toBe('Charlie');
    expect($result->items()[2]->name)->toBe('Alice');
});

test('allTimeLeaders respects per page', function () {
    User::factory()->count(15)->create(['points' => 50]);

    $result = $this->service->allTimeLeaders(10);

    expect($result->items())->toHaveCount(10);
    expect($result->total())->toBe(15);
});

// --- User Points ---

test('getUserPoints returns user points for all-time', function () {
    $user = User::factory()->create(['points' => 500]);

    expect($this->service->getUserPoints($user, 'all'))->toBe(500);
});

// --- User Rank ---

test('getUserRank returns correct position', function () {
    User::factory()->create(['points' => 300]);
    User::factory()->create(['points' => 200]);
    $user = User::factory()->create(['points' => 100]);

    $rank = $this->service->getUserRank($user, 'all');

    expect($rank)->toBe(3);
});

test('getUserRank returns 0 for user with no points', function () {
    $user = User::factory()->create(['points' => 0]);

    $rank = $this->service->getUserRank($user, 'all');

    expect($rank)->toBe(0);
});

// --- Top Score ---

test('getTopScore returns highest points for all-time', function () {
    User::factory()->create(['points' => 100]);
    User::factory()->create(['points' => 500]);
    User::factory()->create(['points' => 250]);

    expect($this->service->getTopScore('all'))->toBe(500);
});
