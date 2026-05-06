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

test('search returns empty for no matches', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson(route('search', ['q' => 'xyznonexistent']))
        ->assertOk()
        ->assertJson(['results' => []]);
});
