<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'claimed_date', 'day_number', 'xp_earned', 'points_earned'])]
class DailyReward extends Model
{
    protected function casts(): array
    {
        return [
            'claimed_date' => 'date',
            'day_number' => 'integer',
            'xp_earned' => 'integer',
            'points_earned' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
