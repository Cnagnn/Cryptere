<?php

use App\Models\User;

test('login page renders', function () {
    $this->get('/login')
        ->assertSuccessful();
});

test('register page renders', function () {
    $this->get('/register')
        ->assertSuccessful();
});

test('user can login with valid credentials', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password'),
    ]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect('/dashboard');

    $this->assertAuthenticatedAs($user);
});

test('user cannot login with invalid password', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password'),
    ]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('login failure can return Indonesian auth message', function () {
    $this
        ->withHeader('Accept-Language', 'id-ID,id;q=0.9')
        ->post('/login', [
            'email' => 'missing@example.com',
            'password' => 'wrong-password',
        ])
        ->assertSessionHasErrors([
            'email' => 'Masuk gagal. Periksa kredensial atau atur ulang kata sandi.',
        ]);
});

test('user can register', function () {
    $this->post('/register', [
        'name' => 'Test User',
        'username' => 'testuser123',
        'email' => 'test@example.com',
        'password' => 'CryptereTestUser2026!',
        'password_confirmation' => 'CryptereTestUser2026!',
        'terms' => 'on',
    ])->assertRedirect('/verify');

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
});

test('user can logout', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/logout')
        ->assertRedirect('/');

    $this->assertGuest();
});

test('unauthenticated user is redirected to login', function () {
    $this->get('/dashboard')
        ->assertRedirect('/login');
});

test('unverified user is redirected to verification notice', function () {
    $user = User::factory()->unverified()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertRedirect('/verify');
});
