<?php

namespace App\Events\Dashboard;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LevelUp implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly int $oldLevel,
        public readonly int $newLevel,
        public readonly int $xp,
        public readonly array $unlockedFeatures = [],
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("user.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'level.up';
    }

    public function broadcastWith(): array
    {
        return [
            'oldLevel' => $this->oldLevel,
            'newLevel' => $this->newLevel,
            'xp' => $this->xp,
            'unlockedFeatures' => $this->unlockedFeatures,
        ];
    }
}
