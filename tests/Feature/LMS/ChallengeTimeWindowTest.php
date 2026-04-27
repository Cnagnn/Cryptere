<?php

use App\Models\Challenge;
use App\Models\User;

test('user can submit to challenge within time window', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_start' => now()->subHour(),
        'time_end' => now()->addHour(),
    ]);

    $this->actingAs($user)
        ->post(route('challenges.submit', $challenge), ['answer' => 'test'])
        ->assertRedirect();
});

test('user cannot submit to challenge before time window', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_start' => now()->addHour(),
        'time_end' => now()->addHours(2),
    ]);

    $this->actingAs($user)
        ->post(route('challenges.submit', $challenge), ['answer' => 'test'])
        ->assertRedirect();

    $this->assertDatabaseMissing('challenge_submissions', [
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
    ]);
});

test('user cannot submit to challenge after time window', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_start' => now()->subHours(2),
        'time_end' => now()->subHour(),
    ]);

    $this->actingAs($user)
        ->post(route('challenges.submit', $challenge), ['answer' => 'test'])
        ->assertRedirect();

    $this->assertDatabaseMissing('challenge_submissions', [
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
    ]);
});

test('user can submit to challenge with no time window', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create([
        'is_published' => true,
        'time_start' => null,
        'time_end' => null,
    ]);

    $this->actingAs($user)
        ->post(route('challenges.submit', $challenge), ['answer' => 'test'])
        ->assertRedirect();
});
