<?php

namespace App\Models;

use Database\Factories\ChallengeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'title', 'prompt', 'hint', 'difficulty', 'expected_answer', 'points_reward', 'is_published', 'time_start', 'time_end'])]
#[Hidden(['expected_answer'])]
class Challenge extends Model
{
    /** @use HasFactory<ChallengeFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'time_start' => 'datetime',
            'time_end' => 'datetime',
        ];
    }

    /**
     * Scope the query to published challenges.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    /**
     * Scope admin listing query by search keyword.
     */
    public function scopeSearchManagement(Builder $query, string $search): Builder
    {
        $keyword = trim($search);

        if ($keyword === '') {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($keyword): void {
            $builder
                ->where('title', 'like', "%{$keyword}%")
                ->orWhere('prompt', 'like', "%{$keyword}%");
        });
    }

    /**
     * Get submissions for the challenge.
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(ChallengeSubmission::class);
    }
}
