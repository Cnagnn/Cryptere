<?php

namespace App\Listeners;

use App\Events\LeaderboardUpdated;
use App\Events\XpAwarded;
use App\Features\RealtimeLeaderboard;
use App\Services\LeaderboardService;
use Laravel\Pennant\Feature;

class BroadcastLeaderboardUpdate
{
    public function __construct(
        private readonly LeaderboardService $leaderboardService,
    ) {}

    public function handle(XpAwarded $event): void
    {
        // R11: Check feature flag before broadcasting
        if (! Feature::active(RealtimeLeaderboard::class)) {
            return;
        }

        // Fetch the current top 3 for each active timeframe and broadcast
        foreach (['weekly', 'monthly', 'all'] as $timeframe) {
            $top3 = $this->leaderboardService
                ->getTop3Users($timeframe)
                ->map(fn ($user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'points' => $timeframe === 'all'
                        ? $user->points
                        : (int) ($user->period_points ?? $user->points),
                ])
                ->all();

            LeaderboardUpdated::dispatch($timeframe, $top3);
        }
    }
}
