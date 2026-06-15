<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

beforeEach(function (): void {
    $keys = ['APP_URL', 'AUTH_URL', 'APP_HOME_URL', 'APP_ENV'];

    $this->originalEnvironment = [];

    foreach ($keys as $key) {
        $this->originalEnvironment[$key] = getenv($key) === false ? null : getenv($key);
    }

    putenv('APP_URL=https://cryptere.com');
    putenv('AUTH_URL=https://auth.cryptere.com');
    putenv('APP_HOME_URL=https://app.cryptere.com');

    $_ENV['APP_URL'] = 'https://cryptere.com';
    $_ENV['AUTH_URL'] = 'https://auth.cryptere.com';
    $_ENV['APP_HOME_URL'] = 'https://app.cryptere.com';
    $_SERVER['APP_URL'] = 'https://cryptere.com';
    $_SERVER['AUTH_URL'] = 'https://auth.cryptere.com';
    $_SERVER['APP_HOME_URL'] = 'https://app.cryptere.com';

    $this->refreshApplication();
    $this->artisan('migrate', ['--no-interaction' => true]);

    Config::set('app.domains.public', 'cryptere.com');
    Config::set('app.domains.auth', 'auth.cryptere.com');
    Config::set('app.domains.app', 'app.cryptere.com');
    Config::set('app.urls.public', 'https://cryptere.com');
    Config::set('app.urls.auth', 'https://auth.cryptere.com');
    Config::set('app.urls.app', 'https://app.cryptere.com/dashboard');
    Config::set('fortify.redirects.login', 'https://app.cryptere.com/dashboard');
    Config::set('fortify.redirects.register', 'https://app.cryptere.com/dashboard');
});

afterEach(function (): void {
    foreach ($this->originalEnvironment as $key => $value) {
        putenv($value === null ? $key : "{$key}={$value}");

        if ($value === null) {
            unset($_ENV[$key], $_SERVER[$key]);

            continue;
        }

        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }

    $this->refreshApplication();
});

test('inertia registration redirects to email verification on same auth domain', function (): void {
    $response = $this
        ->withServerVariables(['HTTP_HOST' => 'auth.cryptere.com', 'HTTPS' => 'on'])
        ->withHeader('X-Inertia', 'true')
        ->withHeader('X-Inertia-Version', '')
        ->post('/register', [
            'name' => 'Student Example',
            'username' => 'student_example',
            'email' => 'student@example.com',
            'password' => 'CryptereTestUser2026!',
            'password_confirmation' => 'CryptereTestUser2026!',
            'terms' => 'on',
        ]);

    $response->assertRedirect('/verify');

    $this->assertAuthenticated();
});

test('inertia login uses location redirect across auth and app subdomains', function (): void {
    $user = User::factory()->create([
        'password' => bcrypt('CryptereTestUser2026!'),
    ]);

    $response = $this
        ->withServerVariables(['HTTP_HOST' => 'auth.cryptere.com', 'HTTPS' => 'on'])
        ->withHeader('X-Inertia', 'true')
        ->withHeader('X-Inertia-Version', '')
        ->post('/login', [
            'email' => $user->email,
            'password' => 'CryptereTestUser2026!',
        ]);

    $response
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', 'https://app.cryptere.com/dashboard');

    $this->assertAuthenticatedAs($user);
});

test('inertia social registration uses location redirect across auth and app subdomains', function (): void {
    // Stash a social_user session entry — this is what SocialAuthController
    // does after a successful Google/GitHub callback for a brand-new email.
    // CreateNewUser will detect this on register and mark the email verified,
    // which causes RegisterResponse to skip /verify and target /dashboard.
    session([
        'social_user' => [
            'provider' => 'google',
            'id' => 'g-cross-domain',
            'email' => 'crossdomain.social@example.com',
            'name' => 'Cross Domain Social',
            'avatar' => 'https://example.test/avatar.png',
            'nickname' => null,
            'expires_at' => now()->addMinutes(5)->timestamp,
        ],
    ]);

    $response = $this
        ->withServerVariables(['HTTP_HOST' => 'auth.cryptere.com', 'HTTPS' => 'on'])
        ->withHeader('X-Inertia', 'true')
        ->withHeader('X-Inertia-Version', '')
        ->post('/register', [
            'name' => 'Cross Domain Social',
            'username' => 'cross_domain_social',
            'email' => 'crossdomain.social@example.com',
            'password' => 'CryptereTestUser2026!',
            'password_confirmation' => 'CryptereTestUser2026!',
            'terms' => 'on',
        ]);

    // Cross-subdomain (auth → app) under Inertia: must respond with 409
    // + X-Inertia-Location header so the React client performs a hard
    // window.location navigation. A plain 302 silently breaks Inertia
    // and leaves the user stuck on the register page.
    $response
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', 'https://app.cryptere.com/dashboard');

    $this->assertAuthenticated();
});

test('inertia guest app request uses location redirect to auth login across subdomains', function (): void {
    $request = Request::create('https://app.cryptere.com/dashboard');
    $inertiaVersion = app(HandleInertiaRequests::class)->version($request) ?? '';

    $response = $this
        ->withServerVariables(['HTTP_HOST' => 'app.cryptere.com', 'HTTPS' => 'on'])
        ->withHeader('X-Inertia', 'true')
        ->withHeader('X-Inertia-Version', $inertiaVersion)
        ->get('/dashboard');

    $response
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', 'https://auth.cryptere.com/login');
});

test('app shell exposes csrf token meta for full form posts across subdomains', function (): void {
    $user = User::factory()->create();

    $response = $this
        ->withServerVariables(['HTTP_HOST' => 'app.cryptere.com', 'HTTPS' => 'on'])
        ->actingAs($user)
        ->get('/dashboard');

    $response
        ->assertOk()
        ->assertSee('name="csrf-token"', false)
        ->assertInertia(fn ($page) => $page
            ->where('urls.login', 'https://auth.cryptere.com/login')
            ->where('urls.register', 'https://auth.cryptere.com/register')
            ->where('urls.logout', 'https://auth.cryptere.com/logout')
            ->where('urls.dashboard', 'https://app.cryptere.com/dashboard')
        );
});
