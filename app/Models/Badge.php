<?php

namespace App\Models;

use Database\Factories\BadgeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['slug', 'name', 'description', 'icon', 'category', 'tier', 'criteria_type', 'criteria_value', 'sort_order'])]
class Badge extends Model
{
    /** @use HasFactory<BadgeFactory> */
    use HasFactory;

    public const CATEGORY_MILESTONE = 'milestone';

    public const CATEGORY_COURSE = 'course';

    public const CATEGORY_CHALLENGE = 'challenge';

    public const CATEGORY_STREAK = 'streak';

    public const CATEGORY_LAB = 'lab';

    public const CATEGORY_SPECIAL = 'special';

    public const TIER_BRONZE = 'bronze';

    public const TIER_SILVER = 'silver';

    public const TIER_GOLD = 'gold';

    public const TIER_PLATINUM = 'platinum';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'criteria_value' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the users who have earned this badge.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_badges')
            ->withPivot('earned_at')
            ->withTimestamps();
    }
}
