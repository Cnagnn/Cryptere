<?php

use App\Models\Course;
use App\Models\User;

test('guest cannot search', function () {
    $this->getJson(route('search', ['q' => 'laravel']))
        ->assertUnauthorized();
});

test('search requires minimum 2 characters', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson(route('search', ['q' => 'a']))
        ->assertOk()
        ->assertJson(['results' => []]);
});

test('search returns matching courses', function () {
    $user = User::factory()->create();
    Course::factory()->create([
        'title' => 'Laravel Fundamentals',
        'is_published' => true,
    ]);
    Course::factory()->create([
        'title' => 'React Basics',
        'is_published' => true,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('search', ['q' => 'Laravel']));

    $response->assertOk();
    $results = $response->json('results');
    expect($results)->not->toBeEmpty();
    expect(collect($results)->pluck('title'))->toContain('Laravel Fundamentals');
});

test('search returns only public profiles for other users', function () {
    $viewer = User::factory()->create([
        'name' => 'Viewer Account',
        'username' => 'viewer_account',
        'profile_visibility' => 'private',
    ]);

    $publicUser = User::factory()->create([
        'name' => 'Public Learner',
        'username' => 'public_learner',
        'profile_visibility' => 'public',
    ]);

    User::factory()->create([
        'name' => 'Private Learner',
        'username' => 'private_learner',
        'profile_visibility' => 'private',
    ]);

    $response = $this->actingAs($viewer)
        ->getJson(route('search', ['q' => 'Learner']));

    $response->assertOk();

    $results = collect($response->json('results'));

    expect($results->where('type', 'user')->pluck('title')->all())
        ->toContain('Public Learner')
        ->not->toContain('Private Learner')
        ->not->toContain('Viewer Account');

    expect($results->firstWhere('title', 'Public Learner')['url'])
        ->toBe(route('profile.show', $publicUser->username));
});

test('search returns empty for no matches', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson(route('search', ['q' => 'xyznonexistent']))
        ->assertOk()
        ->assertJson(['results' => []]);
});
