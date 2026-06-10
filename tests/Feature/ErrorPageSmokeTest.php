<?php

beforeEach(function (): void {
    $keys = ['APP_URL', 'AUTH_URL', 'APP_HOME_URL', 'APP_ENV'];

    $this->originalEnvironment = [];

    foreach ($keys as $key) {
        $this->originalEnvironment[$key] = getenv($key) === false ? null : getenv($key);
    }

    putenv('APP_URL=https://cryptere.com');
    putenv('AUTH_URL=https://auth.cryptere.com');
    putenv('APP_HOME_URL=https://app.cryptere.com');
    putenv('APP_ENV=production');

    $_ENV['APP_URL'] = 'https://cryptere.com';
    $_ENV['AUTH_URL'] = 'https://auth.cryptere.com';
    $_ENV['APP_HOME_URL'] = 'https://app.cryptere.com';
    $_ENV['APP_ENV'] = 'production';
    $_SERVER['APP_URL'] = 'https://cryptere.com';
    $_SERVER['AUTH_URL'] = 'https://auth.cryptere.com';
    $_SERVER['APP_HOME_URL'] = 'https://app.cryptere.com';
    $_SERVER['APP_ENV'] = 'production';

    $this->refreshApplication();
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

test('missing public page renders the inertia error page in production mode', function (): void {
    $response = $this->get('https://cryptere.com/this-page-should-not-exist');

    $response->assertStatus(404);

    expect($response->getContent())
        ->toContain('The page you are looking for could not be found.')
        ->toContain('error');
});
