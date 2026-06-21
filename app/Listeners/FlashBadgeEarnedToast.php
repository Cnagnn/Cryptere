<?php

namespace App\Listeners;

use App\Events\BadgeEarned;
use Illuminate\Support\Facades\Inertia;

class FlashBadgeEarnedToast
{
    public function handle(BadgeEarned $event): void
    {
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Badge baru: {$event->badge->name}!",
        ]);
    }
}
