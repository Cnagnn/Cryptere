<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

beforeEach(function (): void {
    Config::set('app.domains.public', 'cryptere.com');
    Config::set('app.domains.auth', 'auth.cryptere.com');
    Config::set('app.domains.app', 'app.cryptere.com');
    Config::set('app.urls.public', 'https://cryptere.com');
    Config::set('app.urls.auth', 'https://auth.cryptere.com');
    Config::set('app.urls.app', 'https://app.cryptere.com/dashboard');
    Config::set('fortify.redirects.login', 'https://app.cryptere.com/dashboard');
    Config::set('fortify.redirects.register', 'https://app.cryptere.com/dashboard');
});

test('inertia registration uses location redirect across auth and app subdomains', function (): void {
    $response = $this
        ->withHeader('X-Inertia', 'true')
        ->withHeader('X-Inertia-Version', '')
        ->post('https://auth.cryptere.com/register', [
            'name' => 'Student Example',
            'username' => 'student_example',
            'email' => 'student@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'terms' => 'on',
        ]);

    $response
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', 'https://app.cryptere.com/dashboard');

    $this->assertAuthenticated();
});

test('inertia login uses location redirect across auth and app subdomains', function (): void {
    $user = User::factory()->create([
        'password' => bcrypt('Password123!'),
    ]);

    $response = $this
        ->withHeader('X-Inertia', 'true')
        ->withHeader('X-Inertia-Version', '')
        ->post('https://auth.cryptere.com/login', [
            'email' => $user->email,
            'password' => 'Password123!',
        ]);

    $response
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', 'https://app.cryptere.com/dashboard');

    $this->assertAuthenticatedAs($user);
});

test('inertia guest app request uses location redirect to auth login across subdomains', function (): void {
    $request = Request::create('https://app.cryptere.com/dashboard');
    $inertiaVersion = app(HandleInertiaRequests::class)->version($request) ?? '';

    $response = $this
        ->withHeader('X-Inertia', 'true')
        ->withHeader('X-Inertia-Version', $inertiaVersion)
        ->get('https://app.cryptere.com/dashboard');

    $response
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', 'https://auth.cryptere.com/login');
});

test('app shell exposes csrf token meta for full form posts across subdomains', function (): void {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('https://app.cryptere.com/dashboard');

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
