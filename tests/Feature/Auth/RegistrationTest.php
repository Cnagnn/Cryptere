<?php

use App\Models\User;
use App\Services\PixabotAvatarService;

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

test('registration stores username in lowercase', function (): void {
    $this->post('/register', [
        'name' => 'Mixed Case User',
        'username' => 'Mixed.Case_User',
        'email' => 'mixed-case@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'terms' => 'on',
    ])->assertRedirect('/dashboard');

    $user = User::query()->where('email', 'mixed-case@example.com')->firstOrFail();

    expect($user->username)->toBe('mixed.case_user');
});

test('registration assigns a static png pixabot avatar', function (): void {
    $pixabots = Mockery::mock(PixabotAvatarService::class);
    $pixabots->shouldReceive('randomId')->once()->andReturn('4411');
    $pixabots->shouldReceive('urlForUser')->andReturn(asset('avatars/pixabots/png/480/4411.png'));
    $this->app->instance(PixabotAvatarService::class, $pixabots);

    $this->post('/register', [
        'name' => 'Avatar Student',
        'username' => 'avatar_student',
        'email' => 'avatar-student@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'terms' => 'on',
    ])->assertRedirect('/dashboard');

    $user = User::query()->where('email', 'avatar-student@example.com')->firstOrFail();

    expect($user->pixabot_avatar_id)->not->toBeNull()
        ->and($user->pixabot_avatar_id)->toBe('4411')
        ->and($user->avatar_path)->toBeNull()
        ->and($user->avatar_mime_type)->toBeNull()
        ->and($user->avatar)->toContain('/avatars/pixabots/png/480/')
        ->and($user->avatar)->toEndWith('.png')
        ->and($user->avatar)->not->toContain('.webp')
        ->and($user->avatar)->not->toContain('.gif');
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
