<?php

use App\Models\User;

it('redirects the authenticated user to their own public profile', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.show.own'));

    $response->assertRedirect(route('profile.show', $user->username));
});

it('shows public profile data to visitors', function () {
    $owner = User::factory()->create([
        'profile_visibility' => 'public',
    ]);
    $visitor = User::factory()->create();

    $response = $this
        ->actingAs($visitor)
        ->get(route('profile.show', $owner));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('profile/show')
        ->where('isOwner', false)
        ->where('isPrivate', false)
        ->where('profileUser.name', $owner->name)
        ->where('profileUser.email', null)
    );
});

it('hides private profiles from non owners', function () {
    $owner = User::factory()->create([
        'profile_visibility' => 'private',
    ]);
    $visitor = User::factory()->create();

    $response = $this
        ->actingAs($visitor)
        ->get(route('profile.show', $owner));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('profile/show')
        ->where('isOwner', false)
        ->where('isPrivate', true)
    );
});

it('shows the dedicated edit profile page to the owner', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('profile/admin')
        ->where('profileUser.id', $user->id)
        ->where('profileUser.email', $user->email)
    );
});
