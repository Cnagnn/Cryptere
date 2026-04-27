<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class XpAwarded implements ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  string  $source  The source of the XP award (e.g. 'task', 'challenge', 'streak', 'bonus')
     */
    public function __construct(
        public readonly User $user,
        public readonly int $xp,
        public readonly int $points,
        public readonly string $source = 'task',
    ) {}
}
