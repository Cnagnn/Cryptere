<?php

use App\Models\User;
use App\Services\SocialAvatarService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->service = new SocialAvatarService;
    Storage::fake('public');
});

// ============================================================
// syncUserAvatarFromUrl — Positive Scenarios
// ============================================================

test('downloads and stores avatar from valid URL', function () {
    Http::fake([
        'https://example.com/avatar.png' => Http::response('fake-image-data', 200, [
            'Content-Type' => 'image/png',
        ]),
    ]);

    $user = User::factory()->create();

    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/avatar.png');

    $user->refresh();

    expect($user->avatar_path)->toBe("avatars/{$user->id}/avatar.png");
    Storage::disk('public')->assertExists("avatars/{$user->id}/avatar.png");
});

test('stores avatar with jpeg extension for jpeg content type', function () {
    Http::fake([
        'https://example.com/photo.jpg' => Http::response('fake-jpeg-data', 200, [
            'Content-Type' => 'image/jpeg',
        ]),
    ]);

    $user = User::factory()->create();

    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/photo.jpg');

    $user->refresh();

    expect($user->avatar_path)->toBe("avatars/{$user->id}/avatar.jpg");
    Storage::disk('public')->assertExists("avatars/{$user->id}/avatar.jpg");
});

test('stores avatar with gif extension for gif content type', function () {
    Http::fake([
        'https://example.com/avatar.gif' => Http::response('fake-gif-data', 200, [
            'Content-Type' => 'image/gif',
        ]),
    ]);

    $user = User::factory()->create();

    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/avatar.gif');

    $user->refresh();

    expect($user->avatar_path)->toBe("avatars/{$user->id}/avatar.gif");
});

test('stores avatar with webp extension for webp content type', function () {
    Http::fake([
        'https://example.com/avatar.webp' => Http::response('fake-webp-data', 200, [
            'Content-Type' => 'image/webp',
        ]),
    ]);

    $user = User::factory()->create();

    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/avatar.webp');

    $user->refresh();

    expect($user->avatar_path)->toBe("avatars/{$user->id}/avatar.webp");
});

test('falls back to URL extension when content type is not image', function () {
    Http::fake([
        'https://example.com/avatar.png' => Http::response('fake-data', 200, [
            'Content-Type' => 'application/octet-stream',
        ]),
    ]);

    $user = User::factory()->create();

    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/avatar.png');

    $user->refresh();

    expect($user->avatar_path)->toBe("avatars/{$user->id}/avatar.png");
});

test('defaults to jpeg when no content type and no URL extension', function () {
    Http::fake([
        'https://example.com/avatar' => Http::response('fake-data', 200, [
            'Content-Type' => 'application/octet-stream',
        ]),
    ]);

    $user = User::factory()->create();

    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/avatar');

    $user->refresh();

    expect($user->avatar_path)->toBe("avatars/{$user->id}/avatar.jpg");
});

// ============================================================
// syncUserAvatarFromUrl — Negative Scenarios
// ============================================================

test('does nothing for null URL', function () {
    $user = User::factory()->create(['avatar_path' => null]);

    $this->service->syncUserAvatarFromUrl($user, null);

    $user->refresh();

    expect($user->avatar_path)->toBeNull();
    Http::assertNothingSent();
});

test('does nothing for empty string URL', function () {
    $user = User::factory()->create(['avatar_path' => null]);

    $this->service->syncUserAvatarFromUrl($user, '');

    $user->refresh();

    expect($user->avatar_path)->toBeNull();
    Http::assertNothingSent();
});

test('does nothing for whitespace-only URL', function () {
    $user = User::factory()->create(['avatar_path' => null]);

    $this->service->syncUserAvatarFromUrl($user, '   ');

    $user->refresh();

    expect($user->avatar_path)->toBeNull();
    Http::assertNothingSent();
});

test('does nothing when HTTP request fails', function () {
    Http::fake([
        'https://example.com/avatar.png' => Http::response('Not Found', 404),
    ]);

    $user = User::factory()->create(['avatar_path' => null]);

    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/avatar.png');

    $user->refresh();

    expect($user->avatar_path)->toBeNull();
});

test('does nothing when HTTP response body is empty', function () {
    Http::fake([
        'https://example.com/avatar.png' => Http::response('', 200, [
            'Content-Type' => 'image/png',
        ]),
    ]);

    $user = User::factory()->create(['avatar_path' => null]);

    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/avatar.png');

    $user->refresh();

    expect($user->avatar_path)->toBeNull();
});

test('does nothing when HTTP request throws exception', function () {
    Http::fake([
        'https://example.com/avatar.png' => Http::response(fn () => throw new \Exception('Connection timeout')),
    ]);

    $user = User::factory()->create(['avatar_path' => null]);

    // Should not throw — exception is caught internally
    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/avatar.png');

    $user->refresh();

    expect($user->avatar_path)->toBeNull();
});

test('does not crash when server returns 500', function () {
    Http::fake([
        'https://example.com/avatar.png' => Http::response('Server Error', 500),
    ]);

    $user = User::factory()->create(['avatar_path' => null]);

    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/avatar.png');

    $user->refresh();

    expect($user->avatar_path)->toBeNull();
});

// ============================================================
// Content-Type Resolution Edge Cases
// ============================================================

test('handles content type with charset parameter', function () {
    Http::fake([
        'https://example.com/avatar.png' => Http::response('fake-data', 200, [
            'Content-Type' => 'image/png; charset=utf-8',
        ]),
    ]);

    $user = User::factory()->create();

    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/avatar.png');

    $user->refresh();

    expect($user->avatar_path)->toBe("avatars/{$user->id}/avatar.png");
});

test('handles uppercase content type', function () {
    Http::fake([
        'https://example.com/avatar.png' => Http::response('fake-data', 200, [
            'Content-Type' => 'IMAGE/PNG',
        ]),
    ]);

    $user = User::factory()->create();

    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/avatar.png');

    $user->refresh();

    expect($user->avatar_path)->toBe("avatars/{$user->id}/avatar.png");
});

test('handles SVG content type', function () {
    Http::fake([
        'https://example.com/avatar.svg' => Http::response('<svg></svg>', 200, [
            'Content-Type' => 'image/svg+xml',
        ]),
    ]);

    $user = User::factory()->create();

    $this->service->syncUserAvatarFromUrl($user, 'https://example.com/avatar.svg');

    $user->refresh();

    expect($user->avatar_path)->toBe("avatars/{$user->id}/avatar.svg");
});
