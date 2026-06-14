<?php

use App\Http\Middleware\SecurityHeaders;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

test('production security policy does not allow localhost development origins', function (): void {
    $originalEnv = $this->app['env'];
    $this->app['env'] = 'production';

    try {
        $middleware = new SecurityHeaders;
        $request = Request::create('https://cryptere.com/', 'GET');

        $response = $middleware->handle($request, fn (Request $request): Response => new Response('ok', 200));
    } finally {
        $this->app['env'] = $originalEnv;
    }

    $policy = (string) $response->headers->get('Content-Security-Policy');

    expect($policy)
        ->not->toContain('http://localhost:5173')
        ->not->toContain('http://127.0.0.1:5173')
        ->not->toContain('http://[::1]:5173')
        ->not->toContain('ws://localhost:5173')
        ->not->toContain('ws://127.0.0.1:5173')
        ->not->toContain('ws://[::1]:5173')
        ->not->toContain('http://localhost:8080')
        ->not->toContain('ws://localhost:8080');
});

function runSecurityHeaders(string $url = 'https://cryptere.com/'): Response
{
    $middleware = new SecurityHeaders;
    $request = Request::create($url, 'GET');
    $upstream = new Response('ok', 200);
    // Simulate that an upstream server set fingerprinting headers — middleware
    // must remove them.
    $upstream->headers->set('X-Powered-By', 'PHP/8.4.21');
    $upstream->headers->set('X-Turbo-Charged-By', 'LiteSpeed');
    $upstream->headers->set('Server', 'LiteSpeed');

    return $middleware->handle($request, fn (Request $r): Response => $upstream);
}

test('every web response carries the baseline security headers', function (): void {
    $response = runSecurityHeaders();

    expect($response->headers->get('X-Content-Type-Options'))->toBe('nosniff');
    expect($response->headers->get('X-Frame-Options'))->toBe('DENY');
    expect($response->headers->get('Referrer-Policy'))->toBe('strict-origin-when-cross-origin');
    expect($response->headers->get('Permissions-Policy'))
        ->toContain('camera=()')
        ->toContain('microphone=()')
        ->toContain('geolocation=()');
});

test('HSTS is emitted on HTTPS requests with a 1-year max-age and preload', function (): void {
    $response = runSecurityHeaders('https://cryptere.com/');

    $hsts = (string) $response->headers->get('Strict-Transport-Security');

    expect($hsts)
        ->toContain('max-age=31536000')
        ->toContain('includeSubDomains')
        ->toContain('preload');
});

test('HSTS is NOT emitted on plain-HTTP requests (would break local dev)', function (): void {
    $response = runSecurityHeaders('http://localhost/');

    expect($response->headers->has('Strict-Transport-Security'))->toBeFalse();
});

test('HSTS is decoupled from APP_ENV — emits even on staging/local-over-HTTPS', function (): void {
    $originalEnv = $this->app['env'];
    $this->app['env'] = 'staging';

    try {
        $response = runSecurityHeaders('https://cryptere.com/');
        expect($response->headers->get('Strict-Transport-Security'))->toContain('max-age=31536000');
    } finally {
        $this->app['env'] = $originalEnv;
    }
});

test('CSP uses a per-request nonce instead of unsafe-inline for scripts', function (): void {
    $response = runSecurityHeaders();

    $csp = (string) $response->headers->get('Content-Security-Policy');

    expect($csp)
        ->toContain("default-src 'self'")
        ->toContain("frame-ancestors 'none'")
        ->toContain("object-src 'none'")
        ->toMatch("/script-src 'self' 'nonce-[A-Za-z0-9+\\/=]+' https:\\/\\/\\*\\.sentry\\.io/");

    expect($csp)
        ->not->toContain("script-src 'self' 'unsafe-inline'")
        ->not->toContain("'unsafe-eval'");
});

test('upstream fingerprinting headers are stripped from the response', function (): void {
    $response = runSecurityHeaders();

    expect($response->headers->has('X-Powered-By'))->toBeFalse();
    expect($response->headers->has('X-Turbo-Charged-By'))->toBeFalse();
    expect($response->headers->has('Server'))->toBeFalse();
});

test('CSP nonce is stable for the duration of one request and propagated', function (): void {
    $middleware = new SecurityHeaders;
    $request = Request::create('https://cryptere.com/', 'GET');
    $capturedNonce = null;

    $response = $middleware->handle($request, function (Request $r) use (&$capturedNonce): Response {
        $capturedNonce = $r->attributes->get('csp-nonce');

        return new Response('ok', 200);
    });

    expect($capturedNonce)->toBeString()->not->toBeEmpty();

    $csp = (string) $response->headers->get('Content-Security-Policy');
    expect($csp)->toContain("'nonce-{$capturedNonce}'");
});

test('two consecutive requests get distinct CSP nonces', function (): void {
    $middleware = new SecurityHeaders;
    $extract = function () use ($middleware): string {
        $request = Request::create('https://cryptere.com/', 'GET');
        $response = $middleware->handle($request, fn (Request $r): Response => new Response('ok', 200));
        $csp = (string) $response->headers->get('Content-Security-Policy');
        preg_match("/'nonce-([^']+)'/", $csp, $m);

        return $m[1] ?? '';
    };

    expect($extract())->not->toBe($extract());
});
