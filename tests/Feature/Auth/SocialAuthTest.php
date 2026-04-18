<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GithubProvider;
use Laravel\Socialite\Two\GoogleProvider;

it('can redirect to social provider', function () {
    $response = $this->get('/auth/google/redirect');
    $response->assertRedirect();
});

it('auto-registers new social users and logs them in', function () {
    $socialUser = Mockery::mock(Laravel\Socialite\Two\User::class);
    $socialUser->shouldReceive('getId')->andReturn('999999');
    $socialUser->shouldReceive('getEmail')->andReturn('newuser@example.com');
    $socialUser->shouldReceive('getName')->andReturn('New Social User');
    $socialUser->shouldReceive('getNickname')->andReturn('newsocial');
    $socialUser->shouldReceive('getAvatar')->andReturn('avatar.jpg');

    $provider = Mockery::mock(GithubProvider::class);
    $provider->shouldReceive('user')->andReturn($socialUser);

    Socialite::shouldReceive('driver')->with('github')->andReturn($provider);

    $response = $this->get('/auth/github/callback');

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticated();

    $user = Auth::user();
    expect($user->email)->toBe('newuser@example.com');
    expect($user->username)->toBe('new_social_user');
    expect($user->socialAccounts()->count())->toBe(1);
    expect($user->socialAccounts()->first()->provider)->toBe('github');
    expect($user->hasVerifiedEmail())->toBeTrue();
});

it('seamlessly links social account to existing email', function () {
    Http::fake([
        'https://example.com/avatar.jpg' => Http::response('avatar-binary', 200, ['Content-Type' => 'image/jpeg']),
    ]);

    $existingUser = User::factory()->create([
        'email' => 'existing@example.com',
        'email_verified_at' => null,
    ]);

    $socialUser = Mockery::mock(Laravel\Socialite\Two\User::class);
    $socialUser->shouldReceive('getId')->andReturn('888888');
    $socialUser->shouldReceive('getEmail')->andReturn('existing@example.com');
    $socialUser->shouldReceive('getName')->andReturn('Existing User');
    $socialUser->shouldReceive('getAvatar')->andReturn('https://example.com/avatar.jpg');

    $provider = Mockery::mock(GoogleProvider::class);
    $provider->shouldReceive('user')->andReturn($socialUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get('/auth/google/callback');

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticatedAs($existingUser);

    // Check if social account was created
    expect($existingUser->socialAccounts()->count())->toBe(1);
    expect($existingUser->socialAccounts()->first()->provider)->toBe('google');
    expect($existingUser->fresh()?->email_verified_at)->not->toBeNull();
    expect($existingUser->fresh()?->avatar_image)->toBe('avatar-binary');
    expect($existingUser->fresh()?->avatar_mime_type)->toBe('image/jpeg');
    expect($existingUser->fresh()?->avatar_path)->toBeNull();
});

it('marks previously linked social users as verified when logging in', function () {
    $user = User::factory()->unverified()->create([
        'email' => 'linked@example.com',
    ]);

    $user->socialAccounts()->create([
        'provider' => 'github',
        'provider_user_id' => 'linked-123',
        'provider_email' => 'linked@example.com',
        'provider_name' => 'Linked User',
        'provider_avatar' => 'avatar.jpg',
    ]);

    $socialUser = Mockery::mock(Laravel\Socialite\Two\User::class);
    $socialUser->shouldReceive('getId')->andReturn('linked-123');
    $socialUser->shouldReceive('getEmail')->andReturn('linked@example.com');
    $socialUser->shouldReceive('getName')->andReturn('Linked User');
    $socialUser->shouldReceive('getAvatar')->andReturn('avatar.jpg');

    $provider = Mockery::mock(GithubProvider::class);
    $provider->shouldReceive('user')->andReturn($socialUser);

    Socialite::shouldReceive('driver')->with('github')->andReturn($provider);

    $response = $this->get('/auth/github/callback');

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticatedAs($user);
    expect($user->fresh()?->email_verified_at)->not->toBeNull();
});

it('allows user to submit standard register and auto-links them', function () {
    session()->put('social_user', [
        'provider' => 'github',
        'id' => '777777',
        'email' => 'setup@example.com',
        'name' => 'Setup User',
        'avatar' => 'avatar.jpg',
    ]);

    $response = $this->post('/register', [
        'name' => 'mysetupname',
        'email' => 'setup@example.com',
        'username' => 'mysetupname',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'terms' => true,
    ]);

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticated();

    $user = Auth::user();
    expect($user->email)->toBe('setup@example.com');
    expect($user->username)->toBe('mysetupname');
    expect($user->socialAccounts()->count())->toBe(1);
    expect(session()->has('social_user'))->toBeFalse();
});
