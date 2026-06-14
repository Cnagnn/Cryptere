<?php

use App\Http\Middleware\PublicPageCacheHeaders;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

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

    config()->set('app.domains.public', 'cryptere.com');
    config()->set('app.domains.auth', 'auth.cryptere.com');
    config()->set('app.domains.app', 'app.cryptere.com');
    config()->set('app.urls.public', 'https://cryptere.com');
    config()->set('app.urls.auth', 'https://auth.cryptere.com');
    config()->set('app.urls.app', 'https://app.cryptere.com/dashboard');
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

test('public landing page is cacheable at the edge and does not emit session cookies', function (): void {
    $middleware = new PublicPageCacheHeaders;
    $request = Request::create('https://cryptere.com/', 'GET');

    $response = $middleware->handle($request, function (): Response {
        $response = new Response('<html><body>Landing</body></html>', 200);
        $response->headers->setCookie(cookie('appearance', 'dark'));
        $response->headers->setCookie(cookie('sidebar_state', 'false'));

        return $response;
    });

    expect($response->headers->get('Cloudflare-CDN-Cache-Control'))->toBe('public, max-age=300, stale-while-revalidate=86400')
        ->and($response->headers->get('Cache-Control'))->toContain('public')
        ->toContain('max-age=60')
        ->toContain('s-maxage=300')
        ->toContain('stale-while-revalidate=86400')
        ->and($response->headers->all('Set-Cookie'))->toBeEmpty()
        ->and($response->getContent())->not->toContain('"user":');
});

test('auth pages remain private and dynamic', function (): void {
    $middleware = new PublicPageCacheHeaders;
    $request = Request::create('https://auth.cryptere.com/login', 'GET');

    $response = $middleware->handle($request, function (): Response {
        $response = new Response('<html><body>Login</body></html>', 200);
        $response->headers->set('Cache-Control', 'no-cache, private');
        $response->headers->setCookie(cookie('laravel_session', 'test-session'));

        return $response;
    });

    expect($response->headers->get('Cloudflare-CDN-Cache-Control'))->toBeNull()
        ->and($response->headers->get('Cache-Control'))->toBe('no-cache, private')
        ->and($response->headers->all('Set-Cookie'))->not->toBeEmpty();
});

test('public landing page 5xx response is forced to no-store and never cached at the edge', function (): void {
    // Regression: a transient 5xx on `/` was getting pinned in the LiteSpeed
    // edge cache for s-maxage=300s because the success-only guard let the
    // default response Cache-Control through. The middleware must override
    // it to no-store so the next request always re-hits origin.
    $middleware = new PublicPageCacheHeaders;
    $request = Request::create('https://cryptere.com/', 'GET');

    $response = $middleware->handle($request, fn (): Response => new Response('Service Unavailable', 503));

    $cacheControl = (string) $response->headers->get('Cache-Control');

    expect($response->getStatusCode())->toBe(503)
        ->and($cacheControl)->toContain('no-store')
        ->and($cacheControl)->toContain('no-cache')
        ->and($cacheControl)->toContain('must-revalidate')
        ->and($cacheControl)->toContain('max-age=0')
        ->and($response->headers->get('CDN-Cache-Control'))->toBe('no-store')
        ->and($response->headers->get('Cloudflare-CDN-Cache-Control'))->toBe('no-store');
});

test('public landing page 500 response is forced to no-store', function (): void {
    $middleware = new PublicPageCacheHeaders;
    $request = Request::create('https://cryptere.com/', 'GET');

    $response = $middleware->handle($request, fn (): Response => new Response('Boom', 500));

    $cacheControl = (string) $response->headers->get('Cache-Control');

    expect($cacheControl)->toContain('no-store')
        ->and($cacheControl)->toContain('no-cache')
        ->and($cacheControl)->toContain('must-revalidate')
        ->and($cacheControl)->toContain('max-age=0');
});

test('non-landing 5xx still flows through normal pipeline (no override)', function (): void {
    // The no-store override is scoped to the public landing path. A 5xx on
    // some other path (e.g. /terms) shouldn't be touched by this middleware
    // because PublicPageCacheHeaders is intentionally `/`-only.
    $middleware = new PublicPageCacheHeaders;
    $request = Request::create('https://cryptere.com/terms', 'GET');

    $response = $middleware->handle($request, function (): Response {
        $response = new Response('Boom', 503);
        $response->headers->set('Cache-Control', 'private');

        return $response;
    });

    expect($response->headers->get('Cache-Control'))->toBe('private')
        ->and($response->headers->get('Cloudflare-CDN-Cache-Control'))->toBeNull();
});

test('security policy allows production font styles without relaxing scripts', function (): void {
    $originalEnv = app()->environment();
    app()->detectEnvironment(fn () => 'production');

    try {
        $middleware = new SecurityHeaders;
        $request = Request::create('https://auth.cryptere.com/reset-password/test-token?email=test@example.com', 'GET');

        $response = $middleware->handle($request, fn (): Response => new Response('<html><body>Reset Password</body></html>', 200));
    } finally {
        app()->detectEnvironment(fn () => $originalEnv);
    }

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

test('vite hot reload tags receive the active csp nonce', function (): void {
    File::put(public_path('hot'), 'http://127.0.0.1:5173');

    try {
        $middleware = new SecurityHeaders;
        $request = Request::create('https://cryptere.com/', 'GET');

        $response = $middleware->handle($request, function (Request $request): Response {
            $nonce = $request->attributes->get('csp-nonce');
            Vite::useCspNonce($nonce);
            app()->instance('request', $request);

            $html = view('app', [
                'page' => [
                    'component' => 'welcome',
                    'props' => [],
                    'url' => '/',
                    'version' => 'test-version',
                    'clearHistory' => false,
                    'encryptHistory' => false,
                ],
                'appearance' => 'system',
            ])->render();

            return new Response($html, 200);
        });
    } finally {
        File::delete(public_path('hot'));
    }

    $policy = (string) $response->headers->get('Content-Security-Policy');
    preg_match("/script-src 'self' 'nonce-([^']+)'/", $policy, $matches);

    expect($matches[1] ?? null)->not->toBeNull();

    $nonce = $matches[1];
    $content = $response->getContent();

    expect($policy)
        ->toContain('http://127.0.0.1:5173')
        ->and($content)
        ->toContain('src="http://127.0.0.1:5173/@vite/client" nonce="'.$nonce.'"')
        ->toContain('href="http://127.0.0.1:5173/resources/css/app.css" nonce="'.$nonce.'"')
        ->toContain('src="http://127.0.0.1:5173/resources/js/app.tsx" nonce="'.$nonce.'"');
});
