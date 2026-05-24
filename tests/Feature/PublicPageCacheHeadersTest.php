<?php

use App\Models\User;
use Illuminate\Support\Facades\Config;

beforeEach(function (): void {
    Config::set('app.domains.public', 'cryptere.com');
    Config::set('app.domains.auth', 'auth.cryptere.com');
    Config::set('app.domains.app', 'app.cryptere.com');
    Config::set('app.urls.public', 'https://cryptere.com');
    Config::set('app.urls.auth', 'https://auth.cryptere.com');
    Config::set('app.urls.app', 'https://app.cryptere.com/dashboard');
});

test('public landing page is cacheable at the edge and does not emit session cookies', function (): void {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->withCookie('appearance', 'dark')
        ->withCookie('sidebar_state', 'false')
        ->get('https://cryptere.com/');

    $response
        ->assertOk()
        ->assertHeader('Cloudflare-CDN-Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');

    expect($response->headers->get('Cache-Control'))->toContain('public')
        ->toContain('max-age=60')
        ->toContain('s-maxage=300')
        ->toContain('stale-while-revalidate=86400')
        ->and($response->headers->all('Set-Cookie'))->toBeEmpty()
        ->and($response->content())->not->toContain('"user":{"id":'.$user->id);
});

test('auth pages remain private and dynamic', function (): void {
    $response = $this->get('https://auth.cryptere.com/login');

    $response
        ->assertOk()
        ->assertHeader('Cache-Control', 'no-cache, private');

    expect($response->headers->all('Set-Cookie'))->not->toBeEmpty();
});

test('security policy allows production font styles without relaxing scripts', function (): void {
    $response = $this->get('https://auth.cryptere.com/reset-password/test-token?email=test@example.com');

    $response->assertOk();

    $policy = (string) $response->headers->get('Content-Security-Policy');

    expect($policy)
        ->toContain("script-src 'self' 'nonce-")
        ->not->toContain("script-src 'self' 'unsafe-inline'")
        ->toContain("style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com")
        ->toContain('https://fonts.googleapis.com')
        ->toContain("style-src-attr 'unsafe-inline'")
        ->toContain('https://fonts.gstatic.com')
        ->toContain('https://deifkwefumgah.cloudfront.net');
});
