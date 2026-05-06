<?php

use App\Models\DailyReward;
use App\Models\User;

test('daily rewards index returns reward status', function () {
    $user = User::factory()->create(['current_streak' => 3]);

    $this->actingAs($user)
        ->getJson(route('daily-rewards.index'))
        ->assertSuccessful()
        ->assertJsonStructure([
            'claimed_today',
            'day_number',
            'today_reward',
            'tiers',
            'calendar',
            'current_streak',
        ]);
});

test('user can claim daily reward', function () {
    $user = User::factory()->create(['xp' => 0, 'points' => 0]);

    $response = $this->actingAs($user)
        ->postJson(route('daily-rewards.claim'))
        ->assertSuccessful()
        ->assertJson(['success' => true]);

    expect($response->json('xp_earned'))->toBeGreaterThan(0);
    $this->assertDatabaseHas('daily_rewards', [
        'user_id' => $user->id,
    ]);
});

test('user cannot claim daily reward twice', function () {
    $user = User::factory()->create();

    DailyReward::create([
        'user_id' => $user->id,
        'claimed_date' => today()->toDateString(),
        'day_number' => 1,
        'xp_earned' => 10,
        'points_earned' => 5,
    ]);

    $this->actingAs($user)
        ->postJson(route('daily-rewards.claim'))
        ->assertStatus(409)
        ->assertJson(['success' => false]);
});

test('daily reward increments user xp and points', function () {
    $user = User::factory()->create(['xp' => 100, 'points' => 50]);

    $this->actingAs($user)
        ->postJson(route('daily-rewards.claim'))
        ->assertSuccessful();

    $fresh = $user->fresh();
    expect($fresh->xp)->toBeGreaterThan(100);
    expect($fresh->points)->toBeGreaterThan(50);
});

test('daily reward requires authentication', function () {
    $this->postJson(route('daily-rewards.claim'))
        ->assertUnauthorized();
});
