<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['slug', 'title', 'narrative', 'chapter_number', 'unlock_type', 'unlock_value', 'icon'])]
class StoryChapter extends Model
{
    public const UNLOCK_COURSE_COMPLETE = 'course_complete';

    public const UNLOCK_BADGE_EARNED = 'badge_earned';

    public const UNLOCK_LEVEL_REACHED = 'level_reached';

    public const UNLOCK_CHALLENGE_SOLVED = 'challenge_solved';

    public const UNLOCK_FIRST_ENROLLMENT = 'first_enrollment';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'chapter_number' => 'integer',
        ];
    }

    /**
     * Get the users who have unlocked this chapter.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_story_progress')
            ->withPivot(['unlocked_at', 'read_at'])
            ->withTimestamps();
    }
}
