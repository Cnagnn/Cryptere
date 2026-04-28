<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'story_chapter_id', 'unlocked_at', 'read_at'])]
class UserStoryProgress extends Model
{
    protected $table = 'user_story_progress';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'unlocked_at' => 'datetime',
            'read_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns this progress entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the story chapter for this progress entry.
     */
    public function storyChapter(): BelongsTo
    {
        return $this->belongsTo(StoryChapter::class);
    }
}
