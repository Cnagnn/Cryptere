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

it('returns 404 for invalid social provider', function () {
    $this->get('/auth/twitter/redirect')->assertNotFound();
    $this->get('/auth/facebook/callback')->assertNotFound();
});

it('redirects new social users to register page with session data', function () {
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

    $response->assertRedirect(route('register'));
    $this->assertGuest();

    expect(session('social_user'))->toBe([
        'provider' => 'github',
        'id' => '999999',
        'email' => 'newuser@example.com',
        'name' => 'New Social User',
        'avatar' => 'avatar.jpg',
        'nickname' => 'newsocial',
    ]);
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

    expect($existingUser->socialAccounts()->count())->toBe(1);
    expect($existingUser->socialAccounts()->first()->provider)->toBe('google');
    expect($existingUser->fresh()?->email_verified_at)->not->toBeNull();
    expect($existingUser->fresh()?->avatar_image)->toBe('avatar-binary');
    expect($existingUser->fresh()?->avatar_mime_type)->toBe('image/jpeg');
    expect($existingUser->fresh()?->avatar_path)->toBeNull();
});

it('flashes status message when linking social account to existing user', function () {
    $existingUser = User::factory()->create([
        'email' => 'flash@example.com',
    ]);

    $socialUser = Mockery::mock(Laravel\Socialite\Two\User::class);
    $socialUser->shouldReceive('getId')->andReturn('flash-123');
    $socialUser->shouldReceive('getEmail')->andReturn('flash@example.com');
    $socialUser->shouldReceive('getName')->andReturn('Flash User');
    $socialUser->shouldReceive('getAvatar')->andReturn(null);

    $provider = Mockery::mock(GoogleProvider::class);
    $provider->shouldReceive('user')->andReturn($socialUser);

    Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

    $response = $this->get('/auth/google/callback');

    $response->assertSessionHas('status', 'Your Google account has been linked.');
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

it('handles denied OAuth grants gracefully', function () {
    $provider = Mockery::mock(GithubProvider::class);
    $provider->shouldReceive('user')->andThrow(new Exception('Access denied'));

    Socialite::shouldReceive('driver')->with('github')->andReturn($provider);

    $response = $this->get('/auth/github/callback');

    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors('email');
});

it('allows user to complete registration after social callback', function () {
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
    expect($user->socialAccounts()->first()->provider)->toBe('github');
    expect($user->hasVerifiedEmail())->toBeTrue();
    expect(session()->has('social_user'))->toBeFalse();
});

it('renders register page with socialUser prop from session', function () {
    $this->withSession([
        'social_user' => [
            'provider' => 'google',
            'id' => 'google-123',
            'email' => 'social@example.com',
            'name' => 'Social User',
            'avatar' => 'https://example.com/avatar.jpg',
            'nickname' => 'socialuser',
        ],
    ]);

    $response = $this->get(route('register'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('auth/register')
        ->has('socialUser')
        ->where('socialUser.provider', 'google')
        ->where('socialUser.email', 'social@example.com')
        ->where('socialUser.name', 'Social User')
    );
});

it('flashes social hint on failed login when user has social account', function () {
    $user = User::factory()->create([
        'email' => 'social@example.com',
        'password' => bcrypt('correct-password'),
    ]);

    $user->socialAccounts()->create([
        'provider' => 'google',
        'provider_user_id' => 'hint-123',
        'provider_email' => 'social@example.com',
        'provider_name' => 'Social User',
        'provider_avatar' => null,
    ]);

    $this->post('/login', [
        'email' => 'social@example.com',
        'password' => 'wrong-password',
    ]);

    $response = $this->get(route('login'));

    $response->assertInertia(fn ($page) => $page
        ->component('auth/login')
        ->where('socialHint', 'Google')
    );
});

it('does not flash social hint when user has no social account', function () {
    User::factory()->create([
        'email' => 'regular@example.com',
        'password' => bcrypt('correct-password'),
    ]);

    $this->post('/login', [
        'email' => 'regular@example.com',
        'password' => 'wrong-password',
    ]);

    $response = $this->get(route('login'));

    $response->assertInertia(fn ($page) => $page
        ->component('auth/login')
        ->where('socialHint', null)
    );
});
