<?php

use App\Models\SocialAccount;
use App\Models\User;
use App\Services\SocialAvatarService;
use Illuminate\Support\Facades\Config;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;

/**
 * Build a stub Socialite user. Avatar is a tiny http URL because the
 * controller hands it off to SocialAvatarService for download which we
 * stub via the container in tests that need it.
 */
function fakeSocialiteUser(?string $email, string $id = '12345', ?string $name = 'Jane Doe'): SocialiteUser
{
    $user = Mockery::mock(SocialiteUser::class);
    $user->shouldReceive('getId')->andReturn($id);
    $user->shouldReceive('getEmail')->andReturn($email);
    $user->shouldReceive('getName')->andReturn($name);
    $user->shouldReceive('getNickname')->andReturn(null);
    $user->shouldReceive('getAvatar')->andReturn('https://example.test/avatar.png');

    return $user;
}

function bypassSocialAvatarSync(): void
{
    $svc = Mockery::mock(SocialAvatarService::class);
    $svc->shouldReceive('syncUserAvatarFromUrl')->andReturnNull();
    app()->instance(SocialAvatarService::class, $svc);
}

beforeEach(function (): void {
    Config::set('app.urls.auth', 'http://localhost');
    Config::set('services.google.client_id', 'g-id');
    Config::set('services.google.client_secret', 'g-secret');
    Config::set('services.google.redirect', '/auth/google/callback');
    Config::set('services.github.client_id', 'gh-id');
    Config::set('services.github.client_secret', 'gh-secret');
    Config::set('services.github.redirect', '/auth/github/callback');
});

test('callback rejects unknown provider with 404', function (): void {
    $this->get('/auth/twitter/callback')->assertNotFound();
});

test('callback shows error when provider returns error parameter', function (): void {
    $response = $this->get('/auth/google/callback?error=access_denied&error_description=User+denied');

    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('/login');
    $response->assertSessionHasErrors('email');
    expect(session('errors')->first('email'))->toContain('dibatalkan');
});

test('callback redirects already-authenticated user to dashboard', function (): void {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/auth/google/callback?code=any');

    $response->assertRedirect(route('dashboard'));
});

test('callback handles invalid state exception with friendly error', function (): void {
    Socialite::shouldReceive('driver->redirectUrl->user')
        ->andThrow(new InvalidStateException('bad state'));

    $response = $this->get('/auth/google/callback?code=abc');

    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('/login');
    $response->assertSessionHasErrors('email');
    expect(session('errors')->first('email'))->toContain('Sesi otentikasi');
});

test('callback handles generic token exchange failure', function (): void {
    Socialite::shouldReceive('driver->redirectUrl->user')
        ->andThrow(new RuntimeException('boom'));

    $response = $this->get('/auth/google/callback?code=abc');

    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('/login');
    $response->assertSessionHasErrors('email');
    expect(session('errors')->first('email'))->toContain('Gagal menghubungi');
});

test('callback shows GitHub-specific message when email is missing', function (): void {
    Socialite::shouldReceive('driver->redirectUrl->user')
        ->andReturn(fakeSocialiteUser(email: null));

    $response = $this->get('/auth/github/callback?code=abc');

    $response->assertRedirect();
    $response->assertSessionHasErrors('email');
    $msg = session('errors')->first('email');
    expect($msg)->toContain('GitHub')->toContain('private');
});

test('callback logs in existing social account user', function (): void {
    bypassSocialAvatarSync();

    $user = User::factory()->unverified()->create(['email' => 'jane@example.com']);
    SocialAccount::create([
        'user_id' => $user->id,
        'provider' => 'google',
        'provider_user_id' => 'g-12345',
        'provider_email' => 'jane@example.com',
        'provider_name' => 'Jane Doe',
        'provider_avatar' => null,
    ]);

    Socialite::shouldReceive('driver->redirectUrl->user')
        ->andReturn(fakeSocialiteUser(email: 'jane@example.com', id: 'g-12345'));

    $response = $this->get('/auth/google/callback?code=abc');

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticatedAs($user->fresh());
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

test('callback prompts existing-email user to login first instead of auto-linking', function (): void {
    User::factory()->create(['email' => 'jane@example.com']);

    Socialite::shouldReceive('driver->redirectUrl->user')
        ->andReturn(fakeSocialiteUser(email: 'jane@example.com', id: 'g-12345'));

    $response = $this->get('/auth/google/callback?code=abc');

    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('/login');
    $response->assertSessionHasErrors('email');
    expect(session('errors')->first('email'))->toContain('sudah terdaftar');
    $this->assertGuest();
});

test('callback for new user stashes social session and redirects to register', function (): void {
    Socialite::shouldReceive('driver->redirectUrl->user')
        ->andReturn(fakeSocialiteUser(email: 'newcomer@example.com', id: 'g-99'));

    $response = $this->get('/auth/google/callback?code=abc');

    $response->assertRedirect(route('register'));
    $this->assertGuest();

    $stashed = session('social_user');
    expect($stashed)->toBeArray()
        ->and($stashed['provider'])->toBe('google')
        ->and($stashed['email'])->toBe('newcomer@example.com')
        ->and($stashed['id'])->toBe('g-99')
        ->and($stashed['expires_at'])->toBeGreaterThan(now()->timestamp);
});

test('register flow uses stashed social session to mark email verified', function (): void {
    bypassSocialAvatarSync();

    session([
        'social_user' => [
            'provider' => 'google',
            'id' => 'g-555',
            'email' => 'social.signup@example.com',
            'name' => 'Social Signup',
            'avatar' => 'https://example.test/avatar.png',
            'nickname' => null,
            'expires_at' => now()->addMinutes(5)->timestamp,
        ],
    ]);

    $this->post('/register', [
        'name' => 'Social Signup',
        'username' => 'social_signup',
        'email' => 'social.signup@example.com',
        'password' => 'CryptereTestUser2026!',
        'password_confirmation' => 'CryptereTestUser2026!',
        'terms' => 'on',
    ]);

    $user = User::query()->where('email', 'social.signup@example.com')->firstOrFail();

    expect($user->hasVerifiedEmail())->toBeTrue()
        ->and($user->socialAccounts()->where('provider', 'google')->where('provider_user_id', 'g-555')->exists())->toBeTrue();
});

test('social register auto-redirects to dashboard (verified email skips verify page)', function (): void {
    bypassSocialAvatarSync();

    session([
        'social_user' => [
            'provider' => 'github',
            'id' => 'gh-777',
            'email' => 'social.dashboard@example.com',
            'name' => 'Social Dashboard',
            'avatar' => 'https://example.test/avatar.png',
            'nickname' => null,
            'expires_at' => now()->addMinutes(5)->timestamp,
        ],
    ]);

    $response = $this->post('/register', [
        'name' => 'Social Dashboard',
        'username' => 'social_dashboard',
        'email' => 'social.dashboard@example.com',
        'password' => 'CryptereTestUser2026!',
        'password_confirmation' => 'CryptereTestUser2026!',
        'terms' => 'on',
    ]);

    // Social users have email already verified, so they skip the /verify page
    // and land directly on the dashboard.
    $response->assertRedirect();
    expect($response->headers->get('Location'))
        ->not->toContain('/verify')
        ->toContain(config('fortify.home', '/dashboard'));

    $this->assertAuthenticated();
});

test('regular register (no social context) redirects to email verification', function (): void {
    // No 'social_user' in session — this is a plain manual registration.
    $response = $this->post('/register', [
        'name' => 'Regular User',
        'username' => 'regular_user',
        'email' => 'regular.user@example.com',
        'password' => 'CryptereTestUser2026!',
        'password_confirmation' => 'CryptereTestUser2026!',
        'terms' => 'on',
    ]);

    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('/verify');

    $user = User::query()->where('email', 'regular.user@example.com')->firstOrFail();
    expect($user->hasVerifiedEmail())->toBeFalse();
});
