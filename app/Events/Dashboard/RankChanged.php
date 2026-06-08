<?php

namespace App\Events\Dashboard;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RankChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly int $oldRank,
        public readonly int $newRank,
        public readonly string $direction,
        public readonly int $change,
        public readonly string $timeframe,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("user.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'rank.changed';
    }

    public function broadcastWith(): array
    {
        return [
            'oldRank' => $this->oldRank,
            'newRank' => $this->newRank,
            'direction' => $this->direction,
            'change' => $this->change,
            'timeframe' => $this->timeframe,
        ];
    }
}
