<?php

namespace App\Models;

use Database\Factories\UserBalanceChangeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'xp_delta', 'points_delta', 'source'])]
class UserBalanceChange extends Model
{
    /** @use HasFactory<UserBalanceChangeFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'xp_delta' => 'integer',
            'points_delta' => 'integer',
        ];
    }

    /**
     * Get the user that owns the balance change.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
