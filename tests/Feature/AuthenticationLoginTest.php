<?php

use App\Models\User;

test('user can login with username credentials', function () {
    $user = User::factory()->create([
        'username' => 'developer',
        'password' => bcrypt('password'),
    ]);

    $this->post('/login', [
        'email' => 'developer',
        'password' => 'password',
    ])->assertRedirect('/dashboard');

    $this->assertAuthenticatedAs($user);
});

test('user can login with mixed case username credentials', function () {
    $user = User::factory()->create([
        'username' => 'developer',
        'password' => bcrypt('password'),
    ]);

    $this->post('/login', [
        'email' => 'Developer',
        'password' => 'password',
    ])->assertRedirect('/dashboard');

    $this->assertAuthenticatedAs($user);
});

test('user can be remembered when logging in', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password'),
    ]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
        'remember' => 'on',
    ])->assertRedirect('/dashboard');

    $this->assertAuthenticatedAs($user);
    expect($user->fresh()->remember_token)->not->toBeNull();
});
