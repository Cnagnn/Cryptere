<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'lab_slug', 'visit_count', 'first_visited_at', 'last_visited_at'])]
class LabVisit extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'visit_count' => 'integer',
            'first_visited_at' => 'datetime',
            'last_visited_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the lab visit.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
