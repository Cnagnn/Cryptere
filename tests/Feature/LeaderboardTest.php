<?php

use App\Models\User;

test('leaderboard page renders for authenticated user', function () {
    $user = User::factory()->create();
    User::factory()->count(5)->create(['points' => fake()->numberBetween(50, 500)]);

    $this->actingAs($user)
        ->get(route('leaderboard.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('leaderboard/index')
            ->has('leaders.data')
            ->has('topScore')
            ->has('currentUser')
        );
});

test('leaderboard accepts timeframe parameter', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('leaderboard.index', ['timeframe' => 'weekly']))
        ->assertSuccessful();
});

test('leaderboard accepts per_page parameter', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('leaderboard.index', ['per_page' => 25]))
        ->assertSuccessful();
});

test('leaderboard requires authentication', function () {
    $this->get(route('leaderboard.index'))
        ->assertRedirect('/login');
});
