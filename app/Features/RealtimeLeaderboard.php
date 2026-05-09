<?php

namespace App\Features;

use App\Listeners\BroadcastLeaderboardUpdate;

/**
 * Controls whether the real-time WebSocket leaderboard updates are enabled.
 *
 * When active, leaderboard changes are broadcast via Laravel Reverb/WebSockets
 * to connected clients in real-time. When inactive, the leaderboard only
 * updates on page refresh.
 *
 * @see BroadcastLeaderboardUpdate
 */
class RealtimeLeaderboard
{
    /**
     * Resolve the initial value of the feature.
     */
    public function resolve(mixed $scope): bool
    {
        return true; // Enabled for all users by default
    }
}
