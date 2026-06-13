<?php

use Illuminate\Support\Arr;

function loadAppConfigWithEnv(array $overrides): array
{
    $keys = [
        'APP_ENV',
        'APP_URL',
        'AUTH_URL',
        'APP_HOME_URL',
        'PUBLIC_DOMAIN',
        'AUTH_DOMAIN',
        'APP_DOMAIN',
    ];

    $original = [];

    foreach ($keys as $key) {
        $original[$key] = getenv($key) === false ? null : getenv($key);
        putenv($key);
        unset($_ENV[$key], $_SERVER[$key]);
    }

    foreach ($overrides as $key => $value) {
        putenv("{$key}={$value}");
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }

    try {
        return require base_path('config/app.php');
    } finally {
        foreach ($keys as $key) {
            putenv($key);
            unset($_ENV[$key], $_SERVER[$key]);

            if ($original[$key] !== null) {
                putenv("{$key}={$original[$key]}");
                $_ENV[$key] = $original[$key];
                $_SERVER[$key] = $original[$key];
            }
        }
    }
}

test('app config derives domains and urls from simplified subdomain env variables', function (): void {
    $config = loadAppConfigWithEnv([
        'APP_ENV' => 'production',
        'APP_URL' => 'https://cryptere.com',
        'AUTH_URL' => 'https://auth.cryptere.com',
        'APP_HOME_URL' => 'https://app.cryptere.com',
    ]);

    expect(Arr::get($config, 'domains.public'))->toBe('cryptere.com')
        ->and(Arr::get($config, 'domains.auth'))->toBe('auth.cryptere.com')
        ->and(Arr::get($config, 'domains.app'))->toBe('app.cryptere.com')
        ->and(Arr::get($config, 'urls.public'))->toBe('https://cryptere.com')
        ->and(Arr::get($config, 'urls.auth'))->toBe('https://auth.cryptere.com')
        ->and(Arr::get($config, 'urls.app'))->toBe('https://app.cryptere.com/dashboard')
        ->and(Arr::get($config, 'session_domain'))->toBe('.cryptere.com');
});

/*
 * Local-environment behavior: when APP_ENV=local AND the configured public
 * URL points at a localhost address, we deliberately collapse the per-route
 * domain constraints to NULL.
 *
 * Why: `php artisan serve` runs on a non-standard port (e.g. :8000), but PHP's
 * parse_url(host) and Symfony's host matcher both strip ports. That leaves us
 * with `Route::domain('127.0.0.1')` constraints and Wayfinder URLs like
 * `//127.0.0.1/login` — the link in the browser ends up pointing at port 80,
 * which has no server. Collapsing to NULL makes routes match any host and
 * Wayfinder emit relative URLs that resolve against the browser's current
 * host:port (the correct behavior for single-host local dev).
 *
 * Production must NEVER take this branch.
 */

test('local env on 127.0.0.1 collapses domain constraints to null for any-port dev', function (): void {
    $config = loadAppConfigWithEnv([
        'APP_ENV' => 'local',
        'APP_URL' => 'http://127.0.0.1:8000',
    ]);

    expect(Arr::get($config, 'domains.public'))->toBeNull()
        ->and(Arr::get($config, 'domains.auth'))->toBeNull()
        ->and(Arr::get($config, 'domains.app'))->toBeNull()
        ->and(Arr::get($config, 'session_domain'))->toBeNull();
});

test('local env on localhost also collapses domain constraints', function (): void {
    $config = loadAppConfigWithEnv([
        'APP_ENV' => 'local',
        'APP_URL' => 'http://localhost:3000',
    ]);

    expect(Arr::get($config, 'domains.public'))->toBeNull()
        ->and(Arr::get($config, 'domains.auth'))->toBeNull()
        ->and(Arr::get($config, 'domains.app'))->toBeNull();
});

test('local env pointing at real subdomains keeps domain constraints', function (): void {
    // A developer using Caddy/Valet/`/etc/hosts` to mirror the prod
    // multi-subdomain setup locally still needs domain constraints to work.
    $config = loadAppConfigWithEnv([
        'APP_ENV' => 'local',
        'APP_URL' => 'http://cryptere.test',
        'AUTH_URL' => 'http://auth.cryptere.test',
        'APP_HOME_URL' => 'http://app.cryptere.test',
    ]);

    expect(Arr::get($config, 'domains.public'))->toBe('cryptere.test')
        ->and(Arr::get($config, 'domains.auth'))->toBe('auth.cryptere.test')
        ->and(Arr::get($config, 'domains.app'))->toBe('app.cryptere.test');
});

test('non-local env never collapses domains even when APP_URL is localhost', function (): void {
    // Defense-in-depth: production / staging must always enforce host
    // matching, even if APP_URL is misconfigured to a localhost address
    // (e.g. health-check probe leaking through). Better to fail visibly than
    // to silently drop the multi-subdomain auth boundary.
    $config = loadAppConfigWithEnv([
        'APP_ENV' => 'production',
        'APP_URL' => 'http://127.0.0.1',
    ]);

    expect(Arr::get($config, 'domains.public'))->toBe('127.0.0.1');
});
