<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['user_id', 'discussable_type', 'discussable_id', 'title', 'body', 'is_pinned', 'upvote_count', 'reply_count'])]
class Discussion extends Model
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
            'is_pinned' => 'boolean',
            'upvote_count' => 'integer',
            'reply_count' => 'integer',
        ];
    }

    /**
     * Get the user who created this discussion.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the replies for this discussion.
     */
    public function replies(): HasMany
    {
        return $this->hasMany(DiscussionReply::class);
    }

    /**
     * Get the upvotes for this discussion.
     */
    public function upvotes(): HasMany
    {
        return $this->hasMany(DiscussionUpvote::class, 'upvotable_id')
            ->where('upvotable_type', 'discussion');
    }

    /**
     * Scope discussions for a specific lesson.
     */
    public function scopeForLesson(Builder $query, int $lessonId): Builder
    {
        return $query->where('discussable_type', 'lesson')
            ->where('discussable_id', $lessonId);
    }

    /**
     * Scope discussions for a specific challenge.
     */
    public function scopeForChallenge(Builder $query, int $challengeId): Builder
    {
        return $query->where('discussable_type', 'challenge')
            ->where('discussable_id', $challengeId);
    }
}
