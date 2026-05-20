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
            $top3 = collect($this->leaderboardService->getTop3($timeframe))
                ->map(fn (array $user): array => [
                    'id' => (int) $user['id'],
                    'name' => (string) ($user['name'] ?? ''),
                    'username' => $user['username'] ?? null,
                    'points' => (int) ($user['points'] ?? 0),
                ])
                ->all();

            LeaderboardUpdated::dispatch($timeframe, $top3);
        }
    }
}
