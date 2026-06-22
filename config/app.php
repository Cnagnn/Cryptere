<?php

$normalizeUrl = static function (string $url): string {
    return rtrim($url, '/');
};

$extractHost = static function (string $url): string {
    $host = parse_url($url, PHP_URL_HOST);

    if (is_string($host) && $host !== '') {
        return $host;
    }

    return parse_url('http://'.ltrim($url, '/'), PHP_URL_HOST) ?: $url;
};

$isLocalHost = static function (string $host): bool {
    return in_array($host, ['localhost', '127.0.0.1'], true);
};

$publicUrl = $normalizeUrl((string) env('APP_URL', 'http://127.0.0.1:8000'));
$authUrl = $normalizeUrl((string) env('AUTH_URL', $publicUrl));
$appHomeUrl = $normalizeUrl((string) env('APP_HOME_URL', $publicUrl));

$dashboardPath = parse_url($appHomeUrl, PHP_URL_PATH);
$appUrl = $dashboardPath === '/dashboard'
    ? $appHomeUrl
    : rtrim($appHomeUrl, '/').'/dashboard';

$publicHost = $extractHost($publicUrl);
$authHost = $extractHost($authUrl);
$appHost = $extractHost($appHomeUrl);

$sessionDomain = $isLocalHost($publicHost) ? null : '.'.$publicHost;

/*
 * In local development the app is typically served from a single host on a
 * non-standard port (e.g. `127.0.0.1:8000` via `php artisan serve`). PHP's
 * `parse_url(..., PHP_URL_HOST)` strips the port, so a route registered with
 * `Route::domain('127.0.0.1')` would generate links like `//127.0.0.1/login`
 * (no port) — unreachable from the dev browser. Symfony's host matcher also
 * strips the port from the request, so adding the port back to the constraint
 * does not work either.
 *
 * Solution: drop the per-route domain constraint entirely when running
 * locally. Routes match on path only, and Wayfinder emits relative URLs
 * (e.g. `/login`) that resolve against whatever host:port the browser used.
 *
 * Production is untouched — only the `local` and `testing` environments
 * bypass domain constraints (tests use Request::create which defaults to
 * Host: localhost, which would not match domain-bound routes).
 */
if (in_array(env('APP_ENV'), ['local', 'testing'], true) && $isLocalHost($publicHost)) {
    $publicHost = null;
    $authHost = null;
    $appHost = null;
}

return [

    /*
    |--------------------------------------------------------------------------
    | Application Name
    |--------------------------------------------------------------------------
    |
    | This value is the name of your application, which will be used when the
    | framework needs to place the application's name in a notification or
    | other UI elements where an application name needs to be displayed.
    |
    */

    'name' => env('APP_NAME', 'Laravel'),

    /*
    |--------------------------------------------------------------------------
    | Application Environment
    |--------------------------------------------------------------------------
    |
    | This value determines the "environment" your application is currently
    | running in. This may determine how you prefer to configure various
    | services the application utilizes. Set this in your ".env" file.
    |
    */

    'env' => env('APP_ENV', 'production'),

    /*
    |--------------------------------------------------------------------------
    | Application Debug Mode
    |--------------------------------------------------------------------------
    |
    | When your application is in debug mode, detailed error messages with
    | stack traces will be shown on every error that occurs within your
    | application. If disabled, a simple generic error page is shown.
    |
    */

    'debug' => (bool) env('APP_DEBUG', false),

    /*
    |--------------------------------------------------------------------------
    | Application URL
    |--------------------------------------------------------------------------
    |
    | This URL is used by the console to properly generate URLs when using
    | the Artisan command line tool. You should set this to the root of
    | the application so that it's available within Artisan commands.
    |
    */

    'url' => $publicUrl,

    'domains' => [
        'public' => $publicHost,
        'auth' => $authHost,
        'app' => $appHost,
    ],

    'urls' => [
        'public' => $publicUrl,
        'auth' => $authUrl,
        'app' => $appUrl,
    ],

    'session_domain' => $sessionDomain,

    /*
    |--------------------------------------------------------------------------
    | Application Timezone
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default timezone for your application, which
    | will be used by the PHP date and date-time functions. The timezone
    | is set to "Asia/Jakarta" (WIB, UTC+7) for Indonesian users.
    |
    */

    'timezone' => 'Asia/Jakarta',

    /*
    |--------------------------------------------------------------------------
    | Application Locale Configuration
    |--------------------------------------------------------------------------
    |
    | The application locale determines the default locale that will be used
    | by Laravel's translation / localization methods. This option can be
    | set to any locale for which you plan to have translation strings.
    |
    */

    'locale' => env('APP_LOCALE', 'en'),

    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),

    'faker_locale' => env('APP_FAKER_LOCALE', 'en_US'),

    /*
    |--------------------------------------------------------------------------
    | Encryption Key
    |--------------------------------------------------------------------------
    |
    | This key is utilized by Laravel's encryption services and should be set
    | to a random, 32 character string to ensure that all encrypted values
    | are secure. You should do this prior to deploying the application.
    |
    */

    'cipher' => 'AES-256-CBC',

    'key' => env('APP_KEY'),

    'previous_keys' => [
        ...array_filter(
            explode(',', (string) env('APP_PREVIOUS_KEYS', '')),
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Maintenance Mode Driver
    |--------------------------------------------------------------------------
    |
    | These configuration options determine the driver used to determine and
    | manage Laravel's "maintenance mode" status. The "cache" driver will
    | allow maintenance mode to be controlled across multiple machines.
    |
    | Supported drivers: "file", "cache"
    |
    */

    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],

];
