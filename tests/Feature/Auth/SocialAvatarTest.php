<?php

use App\Models\User;
use App\Services\SocialAvatarService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

test('social avatar sync does not replace the local pixabot profile avatar', function (): void {
    Storage::fake('public');
    Http::fake([
        'https://example.com/avatar.png' => Http::response('avatar-bytes', 200, [
            'Content-Type' => 'image/png',
        ]),
    ]);

    $user = User::factory()->create(['pixabot_avatar_id' => '4411']);

    app(SocialAvatarService::class)->syncUserAvatarFromUrl($user, 'https://example.com/avatar.png');

    $user->refresh();

    expect($user->avatar_path)->toBeNull()
        ->and($user->pixabot_avatar_id)->toBe('4411')
        ->and($user->avatar)->toContain('/avatars/pixabots/webp/480/4411.webp');
});
