<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'username' => 'testuser',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('first registered user is automatically admin', function () {
    $this->post(route('register.store'), [
        'name' => 'First User',
        'email' => 'first@example.com',
        'username' => 'firstuser',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect(route('dashboard', absolute: false));

    $registeredUser = User::query()->where('email', 'first@example.com')->first();

    expect($registeredUser)->not->toBeNull();
    expect($registeredUser?->is_admin)->toBeTrue();
    expect($registeredUser?->role)->toBe('admin');
    expect($registeredUser?->status)->toBe('active');
});

test('second registered user is not admin by default', function () {
    User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
        'status' => 'active',
    ]);

    $this->post(route('register.store'), [
        'name' => 'Second User',
        'email' => 'second@example.com',
        'username' => 'seconduser',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect(route('dashboard', absolute: false));

    $registeredUser = User::query()->where('email', 'second@example.com')->first();

    expect($registeredUser)->not->toBeNull();
    expect($registeredUser?->is_admin)->toBeFalse();
    expect($registeredUser?->role)->toBe('member');
    expect($registeredUser?->status)->toBe('active');
});

test('users registering from social sign-up are auto email verified', function () {
    Http::fake([
        'https://example.com/avatar.png' => Http::response('avatar-binary', 200, ['Content-Type' => 'image/png']),
    ]);

    $this->withSession([
        'social_user' => [
            'provider' => 'google',
            'id' => 'google-user-123',
            'email' => 'social.signup@example.com',
            'name' => 'Social Signup',
            'avatar' => 'https://example.com/avatar.png',
        ],
    ]);

    $response = $this->post(route('register.store'), [
        'name' => 'Social Signup',
        'email' => 'social.signup@example.com',
        'username' => 'socialsignup',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticated();

    $registeredUser = User::query()->where('email', 'social.signup@example.com')->first();

    expect($registeredUser)->not->toBeNull();
    expect($registeredUser?->email_verified_at)->not->toBeNull();
    expect($registeredUser?->socialAccounts()->where('provider', 'google')->exists())->toBeTrue();
    expect($registeredUser?->avatar_image)->toBe('avatar-binary');
    expect($registeredUser?->avatar_mime_type)->toBe('image/png');
    expect($registeredUser?->avatar_path)->toBeNull();
});
