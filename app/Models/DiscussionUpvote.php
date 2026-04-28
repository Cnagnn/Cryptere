<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'upvotable_type', 'upvotable_id'])]
class DiscussionUpvote extends Model
{
    /**
     * Indicates if the model should be timestamped.
     *
     * Only created_at is used (no updated_at).
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable dates.
     */
    protected $dates = ['created_at'];

    /**
     * Boot the model — auto-set created_at on creation.
     */
    protected static function booted(): void
    {
        static::creating(function (DiscussionUpvote $upvote): void {
            $upvote->created_at ??= now();
        });
    }

    /**
     * Get the user who upvoted.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
