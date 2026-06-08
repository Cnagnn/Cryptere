<?php

namespace App\Events\Dashboard;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BadgeUnlocked implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly array $badge,
        public readonly string $earnedAt,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel("user.{$this->userId}")];
    }

    public function broadcastAs(): string
    {
        return 'badge.unlocked';
    }

    public function broadcastWith(): array
    {
        return [
            'badge' => $this->badge,
            'earnedAt' => $this->earnedAt,
        ];
    }
}
