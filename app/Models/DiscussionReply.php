<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['discussion_id', 'user_id', 'body', 'upvote_count'])]
class DiscussionReply extends Model
{
    use SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'upvote_count' => 'integer',
        ];
    }

    /**
     * Get the discussion this reply belongs to.
     */
    public function discussion(): BelongsTo
    {
        return $this->belongsTo(Discussion::class);
    }

    /**
     * Get the user who wrote this reply.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the upvotes for this reply.
     */
    public function upvotes(): HasMany
    {
        return $this->hasMany(DiscussionUpvote::class, 'upvotable_id')
            ->where('upvotable_type', 'reply');
    }
}
