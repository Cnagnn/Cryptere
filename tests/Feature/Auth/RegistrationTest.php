<?php

use App\Models\User;

test('registration requires accepted terms', function (): void {
    $this->post('/register', [
        'name' => 'Student Example',
        'username' => 'student_example',
        'email' => 'student@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])
        ->assertSessionHasErrors('terms');

    $this->assertGuest();
});

test('registration stores the display name separately from username', function (): void {
    $this->post('/register', [
        'name' => 'Student Example',
        'username' => 'student_example',
        'email' => 'student@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'terms' => 'on',
    ])->assertRedirect('/dashboard');

    $user = User::query()->where('email', 'student@example.com')->firstOrFail();

    expect($user->name)->toBe('Student Example')
        ->and($user->username)->toBe('student_example')
        ->and($user->profile_visibility)->toBe('private');
});

test('registration requires password confirmation', function (): void {
    $this->post('/register', [
        'name' => 'Student Example',
        'username' => 'student_example',
        'email' => 'student@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Different123!',
        'terms' => 'on',
    ])
        ->assertSessionHasErrors('password');

    $this->assertGuest();
});
