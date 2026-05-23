<?php

use Symfony\Component\Process\Process;

function routeListForProductionDomains(string $path): string
{
    $process = new Process(['php', 'artisan', 'route:list', '--path='.$path], base_path(), [
        'PUBLIC_DOMAIN' => 'cryptere.com',
        'AUTH_DOMAIN' => 'auth.cryptere.com',
        'APP_DOMAIN' => 'app.cryptere.com',
        'AUTH_URL' => 'https://auth.cryptere.com',
    ]);

    $process->mustRun();

    return $process->getOutput();
}

test('public domain auth page paths are canonical redirects to auth domain', function (): void {
    expect(routeListForProductionDomains('login'))->toContain('cryptere.com/login')
        ->toContain('public.auth.login')
        ->toContain('auth.cryptere.com/login')
        ->toContain('login.store')
        ->and(routeListForProductionDomains('register'))->toContain('cryptere.com/register')
        ->toContain('public.auth.register')
        ->toContain('auth.cryptere.com/register')
        ->toContain('register.store')
        ->and(routeListForProductionDomains('forgot-password'))->toContain('cryptere.com/forgot-password')
        ->toContain('public.auth.forgot-password')
        ->toContain('auth.cryptere.com/forgot-password')
        ->toContain('password.email')
        ->and(routeListForProductionDomains('reset-password'))->toContain('cryptere.com/reset-password/{token}')
        ->toContain('public.auth.reset-password')
        ->toContain('auth.cryptere.com/reset-password/{token}')
        ->toContain('password.update');
});

test('public domain logout post is blocked while auth domain logout exists', function (): void {
    expect(routeListForProductionDomains('logout'))->toContain('cryptere.com/logout')
        ->toContain('auth.cryptere.com/logout')
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
