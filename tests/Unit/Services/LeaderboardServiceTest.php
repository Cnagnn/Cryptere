<?php

use App\Models\User;
use App\Services\LeaderboardService;
use Illuminate\Support\Facades\Cache;

test('leaderboard payload uses selected pixabot avatars', function (): void {
    Cache::flush();

    $leader = User::factory()->create([
        'name' => 'Pixabot Leader',
        'points' => 900,
        'pixabot_avatar_id' => '4411',
    ]);

    User::factory()->create([
        'name' => 'Second Place',
        'points' => 100,
        'pixabot_avatar_id' => '5b58',
    ]);

    $service = app(LeaderboardService::class);
    $leaders = $service->getLeaders('all', 10);
    $top3 = $service->getTop3('all');

    expect($leaders->items()[0]['id'])->toBe($leader->id)
        ->and($leaders->items()[0]['avatar'])->toContain('/avatars/pixabots/webp/480/4411.webp')
        ->and($top3[0]['avatar'])->toContain('/avatars/pixabots/webp/480/4411.webp');
});
