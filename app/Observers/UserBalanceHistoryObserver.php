<?php

namespace App\Observers;

use App\Models\User;
use App\Models\UserBalanceChange;

class UserBalanceHistoryObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        $xp = (int) ($user->xp ?? 0);
        $points = (int) ($user->points ?? 0);

        if ($xp === 0 && $points === 0) {
            return;
        }

        UserBalanceChange::create([
            'user_id' => $user->id,
            'xp_delta' => $xp,
            'points_delta' => $points,
            'source' => 'opening_balance',
        ]);
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        $changes = $user->getChanges();

        if (! array_key_exists('xp', $changes) && ! array_key_exists('points', $changes)) {
            return;
        }

        $xpDelta = (int) ($changes['xp'] ?? 0) - (int) ($user->getOriginal('xp') ?? 0);
        $pointsDelta = (int) ($changes['points'] ?? 0) - (int) ($user->getOriginal('points') ?? 0);

        if ($xpDelta === 0 && $pointsDelta === 0) {
            return;
        }

        UserBalanceChange::create([
            'user_id' => $user->id,
            'xp_delta' => $xpDelta,
            'points_delta' => $pointsDelta,
            'source' => 'model_update',
        ]);
    }
}
