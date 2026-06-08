<?php

use App\Events\Dashboard\BadgeUnlocked;
use App\Events\Dashboard\LevelUp;
use App\Events\Dashboard\RankChanged;
use App\Events\Dashboard\UserStatsUpdated;
use Illuminate\Broadcasting\PrivateChannel;

it('broadcasts dashboard events on private user channels', function (string $eventClass, array $arguments) {
    $event = new $eventClass(...$arguments);
    $channels = $event->broadcastOn();

    expect($channels)->toHaveCount(1)
        ->and($channels[0])->toBeInstanceOf(PrivateChannel::class)
        ->and($channels[0]->name)->toBe('private-user.42');
})->with([
    [
        UserStatsUpdated::class,
        [
            'userId' => 42,
            'xp' => 100,
            'points' => 200,
            'level' => 3,
            'streak' => 5,
        ],
    ],
    [
        LevelUp::class,
        [
            'userId' => 42,
            'oldLevel' => 2,
            'newLevel' => 3,
            'xp' => 100,
            'unlockedFeatures' => ['Advanced Courses'],
        ],
    ],
    [
        BadgeUnlocked::class,
        [
            'userId' => 42,
            'badge' => ['name' => 'Starter'],
            'earnedAt' => now()->toIso8601String(),
        ],
    ],
    [
        RankChanged::class,
        [
            'userId' => 42,
            'oldRank' => 10,
            'newRank' => 5,
            'direction' => 'up',
            'change' => 5,
            'timeframe' => 'weekly',
        ],
    ],
]);
