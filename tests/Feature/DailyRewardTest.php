<?php

use App\Models\DailyReward;
use App\Models\User;
use Carbon\Carbon;

beforeEach(function () {
    $this->user = User::factory()->create(['xp' => 100, 'points' => 50]);
});

test('user can view daily reward status', function () {
    $response = $this->actingAs($this->user)
        ->getJson(route('daily-rewards.index'))
        ->assertSuccessful();

    $data = $response->json();

    expect($data)
        ->claimed_today->toBeFalse()
        ->day_number->toBe(1)
        ->tiers->toHaveCount(7);
});

test('user can claim daily reward', function () {
    $this->user->update(['last_active_date' => now()->subDay()]);

    $response = $this->actingAs($this->user)
        ->postJson(route('daily-rewards.claim'))
        ->assertSuccessful();

    $data = $response->json();

    expect($data)
        ->success->toBeTrue()
        ->day_number->toBe(1)
        ->xp_earned->toBe(10)
        ->points_earned->toBe(2);

    // Verify a DailyReward record was created
    $this->assertDatabaseHas('daily_rewards', [
        'user_id' => $this->user->id,
        'day_number' => 1,
        'xp_earned' => 10,
        'points_earned' => 2,
    ]);
});

test('user cannot claim reward twice in same day', function () {
    DailyReward::create([
        'user_id' => $this->user->id,
        'claimed_date' => Carbon::today()->toDateString(),
        'day_number' => 1,
        'xp_earned' => 10,
        'points_earned' => 2,
    ]);

    $this->actingAs($this->user)
        ->postJson(route('daily-rewards.claim'))
        ->assertStatus(409);
});

test('consecutive days increment day number', function () {
    // Claim yesterday as day 1
    DailyReward::create([
        'user_id' => $this->user->id,
        'claimed_date' => Carbon::yesterday()->toDateString(),
        'day_number' => 1,
        'xp_earned' => 10,
        'points_earned' => 2,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson(route('daily-rewards.claim'))
        ->assertSuccessful();

    expect($response->json('day_number'))->toBe(2);
});

test('broken streak resets to day 1', function () {
    // Claim 3 days ago (streak broken)
    DailyReward::create([
        'user_id' => $this->user->id,
        'claimed_date' => Carbon::today()->subDays(3)->toDateString(),
        'day_number' => 5,
        'xp_earned' => 35,
        'points_earned' => 10,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson(route('daily-rewards.claim'))
        ->assertSuccessful();

    expect($response->json('day_number'))->toBe(1);
});

test('day 7 gives maximum reward', function () {
    // Set up 6 consecutive days
    DailyReward::create([
        'user_id' => $this->user->id,
        'claimed_date' => Carbon::yesterday()->toDateString(),
        'day_number' => 6,
        'xp_earned' => 50,
        'points_earned' => 15,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson(route('daily-rewards.claim'))
        ->assertSuccessful();

    expect($response->json())
        ->day_number->toBe(7)
        ->xp_earned->toBe(100)
        ->points_earned->toBe(25);
});

test('cycle resets after day 7', function () {
    // Yesterday was day 7
    DailyReward::create([
        'user_id' => $this->user->id,
        'claimed_date' => Carbon::yesterday()->toDateString(),
        'day_number' => 7,
        'xp_earned' => 100,
        'points_earned' => 25,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson(route('daily-rewards.claim'))
        ->assertSuccessful();

    expect($response->json('day_number'))->toBe(1);
});

test('daily rewards require authentication', function () {
    $this->getJson(route('daily-rewards.index'))
        ->assertUnauthorized();

    $this->postJson(route('daily-rewards.claim'))
        ->assertUnauthorized();
});

test('calendar shows current month claims', function () {
    DailyReward::create([
        'user_id' => $this->user->id,
        'claimed_date' => Carbon::today()->toDateString(),
        'day_number' => 1,
        'xp_earned' => 10,
        'points_earned' => 2,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson(route('daily-rewards.index'))
        ->assertSuccessful();

    expect($response->json('calendar'))->toHaveCount(1)
        ->and($response->json('claimed_today'))->toBeTrue();
});
