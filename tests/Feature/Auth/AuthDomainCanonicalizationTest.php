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
