<?php

use App\Models\User;

test('guest is redirected to login', function () {
    $response = $this->get(route('dashboard'));

    $response->assertRedirect(route('login'));
});

test('learner can access dashboard', function () {
    $user = User::factory()->create(['role' => 'member']);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('dashboard'));
});

test('admin can access dashboard with admin data', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->has('admin')
    );
});

test('learner dashboard does not have admin key', function () {
    $user = User::factory()->create(['role' => 'member']);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->missing('admin')
    );
});

test('learner dashboard has stats', function () {
    $user = User::factory()->create(['role' => 'member']);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->has('stats')
        ->has('level')
    );
});
