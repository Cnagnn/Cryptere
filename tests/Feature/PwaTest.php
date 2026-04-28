<?php

use App\Models\User;

test('manifest.json is accessible and valid', function () {
    $response = $this->get('/manifest.json');
    $response->assertOk();

    $manifest = json_decode($response->getContent(), true);
    expect($manifest)->toBeArray();
    expect($manifest)->toHaveKey('name');
    expect($manifest)->toHaveKey('short_name');
    expect($manifest)->toHaveKey('start_url');
    expect($manifest)->toHaveKey('display');
    expect($manifest)->toHaveKey('icons');
    expect($manifest['name'])->toBe('Crypter — Learn Cryptography');
    expect($manifest['short_name'])->toBe('Crypter');
    expect($manifest['start_url'])->toBe('/dashboard');
    expect($manifest['display'])->toBe('standalone');
    expect($manifest['icons'])->toBeArray()->not->toBeEmpty();
});

test('service worker is accessible', function () {
    $response = $this->get('/sw.js');
    $response->assertOk();
});

test('app.blade.php includes manifest link and PWA meta tags', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertOk();

    $content = $response->getContent();
    expect($content)->toContain('manifest.json');
    expect($content)->toContain('theme-color');
    expect($content)->toContain('apple-mobile-web-app-capable');
    expect($content)->toContain('apple-mobile-web-app-title');
});

test('manifest icons reference existing files', function () {
    $manifest = json_decode(file_get_contents(public_path('manifest.json')), true);

    foreach ($manifest['icons'] as $icon) {
        $iconPath = public_path($icon['src']);
        expect(file_exists($iconPath))
            ->toBeTrue("Icon file {$icon['src']} does not exist at {$iconPath}");
    }
});

test('service worker contains required cache strategies', function () {
    $swContent = file_get_contents(public_path('sw.js'));

    expect($swContent)->toContain('cacheFirst');
    expect($swContent)->toContain('networkFirst');
    expect($swContent)->toContain('staleWhileRevalidate');
    expect($swContent)->toContain('APP_SHELL_CACHE');
    expect($swContent)->toContain('CONTENT_CACHE');
    expect($swContent)->toContain("self.addEventListener('install'");
    expect($swContent)->toContain("self.addEventListener('activate'");
    expect($swContent)->toContain("self.addEventListener('fetch'");
});
