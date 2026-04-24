<?php

namespace App\Listeners;

use App\Events\XpAwarded;
use Illuminate\Support\Facades\Log;

class LogXpAward
{
    public function handle(XpAwarded $event): void
    {
        Log::info('XP awarded', [
            'user_id' => $event->user->id,
            'xp' => $event->xp,
            'points' => $event->points,
            'source' => $event->source,
        ]);
    }
}
