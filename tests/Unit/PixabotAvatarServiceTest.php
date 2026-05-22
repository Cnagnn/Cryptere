<?php

use App\Models\User;
use App\Services\PixabotAvatarService;

test('pixabot options expose compact id list and base url', function (): void {
    $options = app(PixabotAvatarService::class)->options();

    expect($options['baseUrl'])->toBe(asset('avatars/pixabots/webp/480'))
        ->and($options['ids'])->toHaveCount(2000)
        ->and($options['ids'])->toContain('4411');
});

test('pixabot service validates ids and resolves selected avatar url', function (): void {
    $service = app(PixabotAvatarService::class);
    $user = new User([
        'email' => 'avatar@example.com',
        'pixabot_avatar_id' => '4411',
    ]);

    expect($service->isValidId('4411'))->toBeTrue()
        ->and($service->isValidId('../4411'))->toBeFalse()
        ->and($service->urlForUser($user))->toBe(asset('avatars/pixabots/webp/480/4411.webp'));
});
