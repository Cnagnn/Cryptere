<?php

use App\Models\User;

test('404 page renders an inertia error page', function () {
    $response = $this->get('/this-route-does-not-exist-at-all');

    $response->assertStatus(404);
});

test('403 page renders for unauthorized access', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/this-route-does-not-exist-at-all');

    $response->assertStatus(404);
});
