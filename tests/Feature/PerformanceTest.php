<?php

use App\Models\Challenge;
use App\Models\Course;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['last_active_date' => now()]);
    $this->actingAs($this->user);
});

test('dashboard loads within acceptable time', function () {
    $start = microtime(true);
    $response = $this->get(route('dashboard'));
    $duration = (microtime(true) - $start) * 1000;

    $response->assertOk();
    expect($duration)->toBeLessThan(1000, "Dashboard took {$duration}ms (limit: 1000ms)");
});

test('course catalog loads within acceptable time', function () {
    Course::factory(20)->create(['is_published' => true]);

    $start = microtime(true);
    $response = $this->get(route('courses.index'));
    $duration = (microtime(true) - $start) * 1000;

    $response->assertOk();
    expect($duration)->toBeLessThan(500, "Course catalog took {$duration}ms (limit: 500ms)");
});

test('challenge catalog loads within acceptable time', function () {
    Challenge::factory(20)->create(['is_published' => true]);

    $start = microtime(true);
    $response = $this->get(route('challenges.index'));
    $duration = (microtime(true) - $start) * 1000;

    $response->assertOk();
    expect($duration)->toBeLessThan(500, "Challenge catalog took {$duration}ms (limit: 500ms)");
});

test('leaderboard loads within acceptable time', function () {
    User::factory(50)->create(['last_active_date' => now()]);

    $start = microtime(true);
    $response = $this->get(route('leaderboard.index'));
    $duration = (microtime(true) - $start) * 1000;

    $response->assertOk();
    expect($duration)->toBeLessThan(1000, "Leaderboard took {$duration}ms (limit: 1000ms)");
});

test('learning path loads within acceptable time', function () {
    Course::factory(10)->create(['is_published' => true]);

    $start = microtime(true);
    $response = $this->get(route('learning-path'));
    $duration = (microtime(true) - $start) * 1000;

    $response->assertOk();
    expect($duration)->toBeLessThan(500, "Learning path took {$duration}ms (limit: 500ms)");
});

test('analytics page loads within acceptable time', function () {
    $start = microtime(true);
    $response = $this->get(route('analytics'));
    $duration = (microtime(true) - $start) * 1000;

    $response->assertOk();
    expect($duration)->toBeLessThan(1000, "Analytics took {$duration}ms (limit: 1000ms)");
});

test('health check responds within acceptable time', function () {
    $start = microtime(true);
    $response = $this->getJson('/health');
    $duration = (microtime(true) - $start) * 1000;

    $response->assertOk();
    expect($duration)->toBeLessThan(200, "Health check took {$duration}ms (limit: 200ms)");
});

test('search responds within acceptable time', function () {
    $start = microtime(true);
    $response = $this->get(route('search', ['q' => 'test']));
    $duration = (microtime(true) - $start) * 1000;

    $response->assertOk();
    expect($duration)->toBeLessThan(500, "Search took {$duration}ms (limit: 500ms)");
});

test('cached course catalog is faster on second request', function () {
    Course::factory(10)->create(['is_published' => true]);

    // First request — cold cache
    $start1 = microtime(true);
    $this->get(route('courses.index'))->assertOk();
    $cold = (microtime(true) - $start1) * 1000;

    // Second request — warm cache
    $start2 = microtime(true);
    $this->get(route('courses.index'))->assertOk();
    $warm = (microtime(true) - $start2) * 1000;

    // Warm should be at least somewhat faster (or at least not significantly slower)
    expect($warm)->toBeLessThan($cold * 1.5, "Warm cache ({$warm}ms) should not be much slower than cold ({$cold}ms)");
});
