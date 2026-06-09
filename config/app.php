<?php

$normalizeHost = static function (string $domain): string {
    return parse_url('http://'.ltrim($domain, '/'), PHP_URL_HOST) ?: $domain;
};

$isLocalHost = static function (string $host): bool {
    return in_array($host, ['localhost', '127.0.0.1'], true);
};

$buildUrl = static function (string $domain) use ($normalizeHost, $isLocalHost): string {
    $host = $normalizeHost($domain);
    $scheme = $isLocalHost($host) ? 'http' : 'https';

    return $scheme.'://'.trim($domain, '/');
};

$publicDomainValue = (string) (env('PUBLIC_DOMAIN') ?: '127.0.0.1:8000');
$authDomainValue = (string) (env('AUTH_DOMAIN') ?: $publicDomainValue);
$appDomainValue = (string) (env('APP_DOMAIN') ?: $publicDomainValue);

$publicHost = $normalizeHost($publicDomainValue);
$authHost = $normalizeHost($authDomainValue);
$appHost = $normalizeHost($appDomainValue);

$publicUrl = $buildUrl($publicDomainValue);
$authUrl = $buildUrl($authDomainValue);
$appUrl = $buildUrl($appDomainValue);

$sessionDomain = $isLocalHost($publicHost) ? null : '.'.$publicHost;

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
        'app' => rtrim($appUrl, '/').'/dashboard',
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
