<?php

use App\Models\User;
use App\Services\PixabotAvatarService;

test('pixabot options expose compact id list and base url', function (): void {
    $options = app(PixabotAvatarService::class)->options(User::factory()->make(['role' => 'member']));

    expect($options['baseUrl'])->toBe(asset('avatars/pixabots/png/480'))
        ->and($options['extension'])->toBe('png')
        ->and($options['ids'])->toHaveCount(2000)
        ->and($options['ids'])->toContain('4411');
});

test('pixabot service validates ids and resolves selected member avatar as png', function (): void {
    $service = app(PixabotAvatarService::class);
    $user = new User([
        'email' => 'avatar@example.com',
        'role' => 'member',
        'pixabot_avatar_id' => '4411',
    ]);

    expect($service->isValidId('4411'))->toBeTrue()
        ->and($service->isValidId('../4411'))->toBeFalse()
        ->and($service->urlForUser($user))->toBe(asset('avatars/pixabots/png/480/4411.png'));
});

test('pixabot service resolves admin avatars as webp', function (): void {
    $service = app(PixabotAvatarService::class);
    $admin = new User([
        'email' => 'admin@example.com',
        'role' => 'admin',
        'pixabot_avatar_id' => '4411',
    ]);

    $options = $service->options($admin);

    expect($options['baseUrl'])->toBe(asset('avatars/pixabots/webp/480'))
        ->and($options['extension'])->toBe('webp')
        ->and($service->urlForUser($admin))->toBe(asset('avatars/pixabots/webp/480/4411.webp'));
});

test('user avatar ignores legacy pixabot gif path for members', function (): void {
    $user = new User([
        'email' => 'legacy-avatar@example.com',
        'role' => 'member',
        'avatar_path' => 'avatars/pixabots/gif/480/4411.gif',
        'avatar_mime_type' => 'image/gif',
        'pixabot_avatar_id' => '4411',
    ]);

    expect($user->avatar)->toBe(asset('avatars/pixabots/png/480/4411.png'))
        ->and($user->hasCustomAvatar())->toBeFalse();
});

test('admin avatar ignores legacy pixabot gif path and resolves to webp', function (): void {
    $admin = new User([
        'email' => 'legacy-admin-avatar@example.com',
        'role' => 'admin',
        'avatar_path' => 'avatars/pixabots/gif/480/4411.gif',
        'avatar_mime_type' => 'image/gif',
        'pixabot_avatar_id' => '4411',
    ]);

    expect($admin->avatar)->toBe(asset('avatars/pixabots/webp/480/4411.webp'))
        ->and($admin->hasCustomAvatar())->toBeFalse();
});
