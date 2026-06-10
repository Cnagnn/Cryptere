<?php

use Symfony\Component\Process\Process;

function routeListForProductionDomains(string $path): array
{
    $process = new Process(['php', 'artisan', 'route:list', '--path='.$path, '--json'], base_path(), [
        'APP_URL' => 'https://cryptere.com',
        'AUTH_URL' => 'https://auth.cryptere.com',
        'APP_HOME_URL' => 'https://app.cryptere.com',
    ]);

    $process->mustRun();

    return json_decode($process->getOutput(), true, flags: JSON_THROW_ON_ERROR);
}

test('public domain auth page paths are canonical redirects to auth domain', function (): void {
    $loginRoutes = json_encode(routeListForProductionDomains('login'), JSON_THROW_ON_ERROR);
    $registerRoutes = json_encode(routeListForProductionDomains('register'), JSON_THROW_ON_ERROR);
    $forgotPasswordRoutes = json_encode(routeListForProductionDomains('forgot-password'), JSON_THROW_ON_ERROR);
    $resetPasswordRoutes = json_encode(routeListForProductionDomains('reset-password'), JSON_THROW_ON_ERROR);

    expect($loginRoutes)->toContain('"domain":"cryptere.com"')
        ->toContain('"uri":"login"')
        ->toContain('public.auth.login')
        ->toContain('"domain":"auth.cryptere.com"')
        ->toContain('login.store');

    expect($registerRoutes)->toContain('"domain":"cryptere.com"')
        ->toContain('"uri":"register"')
        ->toContain('public.auth.register')
        ->toContain('"domain":"auth.cryptere.com"')
        ->toContain('register.store');

    expect($forgotPasswordRoutes)->toContain('"domain":"cryptere.com"')
        ->toContain('"uri":"forgot-password"')
        ->toContain('public.auth.forgot-password')
        ->toContain('"domain":"auth.cryptere.com"')
        ->toContain('password.email');

    expect($resetPasswordRoutes)->toContain('"domain":"cryptere.com"')
        ->toContain('"uri":"reset-password\\/{token}"')
        ->toContain('public.auth.reset-password')
        ->toContain('"domain":"auth.cryptere.com"')
        ->toContain('password.update');
});

test('public domain logout post is blocked while auth domain logout exists', function (): void {
    $logoutRoutes = json_encode(routeListForProductionDomains('logout'), JSON_THROW_ON_ERROR);

    expect($logoutRoutes)->toContain('"domain":"cryptere.com"')
        ->toContain('"uri":"logout"')
        ->toContain('"domain":"auth.cryptere.com"')
        ->toContain('logout');
});

test('public htaccess optimizes auth canonicalization before Laravel bootstrap', function (): void {
    $htaccess = file_get_contents(public_path('.htaccess'));

    expect($htaccess)->toContain('RewriteCond %{REQUEST_METHOD} !^(GET|HEAD)$ [NC]')
        ->toContain('RewriteRule ^(login|register|forgot-password|logout|reset-password(/.*)?)/?$ - [R=404,L]')
        ->toContain('RewriteRule ^(login|register|forgot-password)/?$ https://auth.cryptere.com/$1 [R=301,L,NE]')
        ->toContain('RewriteRule ^reset-password/(.*)$ https://auth.cryptere.com/reset-password/$1 [R=302,L,NE]')
        ->toContain('SetEnvIf Request_URI "^/build/assets/.+\.(css|js)$" vite_asset=1')
        ->toContain('Header set Cache-Control "public, max-age=31536000, immutable" env=vite_asset');
});
