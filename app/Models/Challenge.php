<?php

namespace App\Models;

use Database\Factories\ChallengeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'title', 'prompt', 'hint', 'expected_answer', 'sort_order', 'is_published', 'category', 'is_daily', 'daily_date', 'time_start', 'time_end', 'time_limit_seconds', 'questions_per_session', 'max_points_per_question'])]
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
            'is_daily' => 'boolean',
            'daily_date' => 'date',
            'time_start' => 'datetime',
            'time_end' => 'datetime',
            'time_limit_seconds' => 'integer',
            'questions_per_session' => 'integer',
            'max_points_per_question' => 'integer',
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
     * Scope to today's daily challenge.
     */
    public function scopeDaily(Builder $query): Builder
    {
        return $query->where('is_daily', true)
            ->whereDate('daily_date', now()->toDateString());
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
     * Get questions for the challenge.
     */
    public function questions(): HasMany
    {
        return $this->hasMany(ChallengeQuestion::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Get submissions for the challenge.
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(ChallengeSubmission::class);
    }

    /**
     * Pick N random questions for a quiz session.
     *
     * @return Collection<int, ChallengeQuestion>
     */
    public function getRandomQuestions(?int $count = null): Collection
    {
        $limit = $count ?? $this->questions_per_session ?? 10;

        return $this->questions()->inRandomOrder()->limit($limit)->get();
    }

    /**
     * Determine whether this challenge has a question bank (quiz mode).
     */
    public function hasQuestionBank(): bool
    {
        return $this->questions()->exists();
    }
}
