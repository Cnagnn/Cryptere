<?php

use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['last_active_date' => now()]);
});

test('dashboard page renders with correct structure', function () {
    $this->actingAs($this->user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('dashboard'));
});

test('courses index page renders with correct structure', function () {
    $this->actingAs($this->user)
        ->get(route('courses.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('courses/index'));
});

test('challenges index page renders with correct structure', function () {
    $this->actingAs($this->user)
        ->get(route('challenges.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('challenges/index'));
});

test('leaderboard page renders with correct structure', function () {
    $this->actingAs($this->user)
        ->get(route('leaderboard.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('leaderboard/index'));
});

test('analytics page renders with correct structure', function () {
    $this->actingAs($this->user)
        ->get(route('analytics'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('analytics'));
});

test('learning path page renders with correct structure', function () {
    $this->actingAs($this->user)
        ->get(route('learning-path'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('learning-path'));
});

test('certificates page renders with correct structure', function () {
    $this->actingAs($this->user)
        ->get(route('certificates.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('certificates/index'));
});

test('notifications page renders with correct structure', function () {
    $this->actingAs($this->user)
        ->get(route('notifications.index'))
        ->assertOk();
});

test('login page renders for guests', function () {
    $this->get(route('login'))
        ->assertOk();
});

test('register page renders for guests', function () {
    $this->get(route('register'))
        ->assertOk();
});

test('all authenticated pages redirect guests to login', function () {
    $protectedRoutes = [
        'dashboard',
        'courses.index',
        'challenges.index',
        'leaderboard.index',
        'analytics',
        'learning-path',
        'certificates.index',
        'notifications.index',
    ];

    foreach ($protectedRoutes as $routeName) {
        $this->get(route($routeName))
            ->assertRedirect(route('login'));
    }
});

test('certificate verification page is publicly accessible', function () {
    $this->get(route('certificates.verify', 'test-code'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('certificates/verify')
            ->where('valid', false)
        );
});
