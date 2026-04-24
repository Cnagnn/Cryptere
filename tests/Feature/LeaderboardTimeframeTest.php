<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('leaderboard defaults to all-time timeframe', function () {
    $user = User::factory()->create(['points' => 100, 'last_active_date' => now()->toDateString()]);

    $this->actingAs($user)
        ->get(route('leaderboard.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('timeframe', 'all')
            ->has('timeframes', 3)
        );
});

test('leaderboard accepts weekly timeframe', function () {
    $user = User::factory()->create(['points' => 100, 'last_active_date' => now()->toDateString()]);

    $this->actingAs($user)
        ->get(route('leaderboard.index', ['timeframe' => 'weekly']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('timeframe', 'weekly')
        );
});

test('leaderboard accepts monthly timeframe', function () {
    $user = User::factory()->create(['points' => 100, 'last_active_date' => now()->toDateString()]);

    $this->actingAs($user)
        ->get(route('leaderboard.index', ['timeframe' => 'monthly']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('timeframe', 'monthly')
        );
});

test('leaderboard falls back to all for invalid timeframe', function () {
    $user = User::factory()->create(['points' => 100, 'last_active_date' => now()->toDateString()]);

    $this->actingAs($user)
        ->get(route('leaderboard.index', ['timeframe' => 'invalid']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('timeframe', 'all')
        );
});

test('weekly leaderboard shows only recent activity', function () {
    $activeUser = User::factory()->create(['points' => 500, 'last_active_date' => now()->toDateString()]);
    $challenge = Challenge::factory()->create(['is_published' => true]);

    // Recent submission (within 7 days)
    ChallengeSubmission::factory()->create([
        'user_id' => $activeUser->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 800,
        'streak_bonus' => 0,
        'submitted_at' => now()->subDays(2),
    ]);

    // Old user with only old submissions
    $oldUser = User::factory()->create(['points' => 1000, 'last_active_date' => now()->subDays(20)->toDateString()]);
    ChallengeSubmission::factory()->create([
        'user_id' => $oldUser->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 900,
        'streak_bonus' => 0,
        'submitted_at' => now()->subDays(20),
    ]);

    $response = $this->actingAs($activeUser)
        ->get(route('leaderboard.index', ['timeframe' => 'weekly']));

    $response->assertOk();

    $page = $response->original->getData()['page']['props'];
    $leaderData = $page['leaders']['data'];

    // Active user should appear, old user should not
    $userIds = collect($leaderData)->pluck('id')->all();
    expect($userIds)->toContain($activeUser->id);
    expect($userIds)->not->toContain($oldUser->id);
});
