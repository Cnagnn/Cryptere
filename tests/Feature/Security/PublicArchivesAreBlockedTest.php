<?php

/**
 * Static test to lock in the .htaccess archive/dotfile blocks. We can't
 * exercise the Apache rewrite engine in CI, but we *can* assert the file
 * still contains the blocking rules — so a future careless .htaccess edit
 * doesn't silently re-open the public.zip / .env path.
 *
 * Original incident: cryptere.com/public.zip (619 KB) was publicly
 * downloadable for ~1 month because a build artifact was left in public/.
 * Even after the file was removed, this test keeps any future archive
 * dropped in public/ denied at the web-server layer.
 */
test('public/.htaccess blocks archive and backup file extensions', function (): void {
    $htaccess = file_get_contents(base_path('public/.htaccess'));
    expect($htaccess)->toBeString()->not->toBeEmpty();

    expect($htaccess)
        ->toContain('RewriteCond %{REQUEST_URI}')
        ->toContain('zip|tar')
        ->toContain('sql|sqlite')
        ->toContain('bak|backup')
        ->toContain('env|ini|conf')
        ->toContain('RewriteRule ^ - [F,L]');
});

test('public/.htaccess blocks dotfile access (except .well-known/)', function (): void {
    $htaccess = file_get_contents(base_path('public/.htaccess'));

    expect($htaccess)
        ->toContain('(^|/)\\.(?!well-known/)')
        ->toContain('RewriteRule ^ - [F,L]');
});

test('public/.htaccess strips upstream fingerprinting headers', function (): void {
    $htaccess = file_get_contents(base_path('public/.htaccess'));

    expect($htaccess)
        ->toContain('Header always unset X-Powered-By')
        ->toContain('Header always unset X-Turbo-Charged-By');
});

test('public/ directory has no archive or backup files committed', function (): void {
    $publicDir = base_path('public');
    $iter = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($publicDir, RecursiveDirectoryIterator::SKIP_DOTS),
    );

    $blocked = '/\.(zip|tar|tar\.gz|tgz|tar\.bz2|tbz2|7z|rar|gz|bz2|sql|sqlite|sqlite3|db|sql\.gz|bak|backup|old|orig|swp|swo|env)$/i';

    $offenders = [];
    foreach ($iter as $file) {
        if ($file->isFile() && preg_match($blocked, $file->getFilename())) {
            $offenders[] = $file->getPathname();
        }
    }

    expect($offenders)->toBe(
        [],
        "public/ contains files with blocked extensions:\n  ".implode("\n  ", $offenders)
            ."\n\nMove these out of public/ — they are blocked by .htaccess but should not be tracked.",
    );
});
