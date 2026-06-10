<?php

use Illuminate\Support\Arr;

function loadAppConfigWithEnv(array $overrides): array
{
    $keys = [
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
