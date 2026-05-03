<?php

namespace App\Models;

use Database\Factories\AssessmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'slug',
    'title',
    'description',
    'course_id',
    'topic_id',
    'bloom_level',
    'grading_type',
    'passing_score',
    'max_attempts',
    'time_limit_minutes',
    'is_published',
    'available_from',
    'available_until',
    'sort_order',
])]
class Assessment extends Model
{
    /** @use HasFactory<AssessmentFactory> */
    use HasFactory;

    // Bloom's Taxonomy levels
    public const BLOOM_C1 = 'C1'; // Remember

    public const BLOOM_C2 = 'C2'; // Understand

    public const BLOOM_C3 = 'C3'; // Apply

    public const BLOOM_C4 = 'C4'; // Analyze

    public const BLOOM_C5 = 'C5'; // Evaluate

    public const BLOOM_C6 = 'C6'; // Create

    public const BLOOM_LEVELS = [
        self::BLOOM_C1,
        self::BLOOM_C2,
        self::BLOOM_C3,
        self::BLOOM_C4,
        self::BLOOM_C5,
        self::BLOOM_C6,
    ];

    public const BLOOM_LABELS = [
        'C1' => 'Remember',
        'C2' => 'Understand',
        'C3' => 'Apply',
        'C4' => 'Analyze',
        'C5' => 'Evaluate',
        'C6' => 'Create',
    ];

    public const GRADING_AUTO = 'auto';

    public const GRADING_MANUAL = 'manual';

    public const GRADING_MIXED = 'mixed';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'passing_score' => 'integer',
            'max_attempts' => 'integer',
            'time_limit_minutes' => 'integer',
            'available_from' => 'datetime',
            'available_until' => 'datetime',
            'sort_order' => 'integer',
        ];
    }

    // ── Relationships ──

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(AssessmentQuestion::class)->orderBy('sort_order')->orderBy('id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(AssessmentSubmission::class);
    }

    // ── Scopes ──

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeAvailable(Builder $query): Builder
    {
        $now = now();

        return $query->where('is_published', true)
            ->where(function (Builder $q) use ($now) {
                $q->whereNull('available_from')
                    ->orWhere('available_from', '<=', $now);
            })
            ->where(function (Builder $q) use ($now) {
                $q->whereNull('available_until')
                    ->orWhere('available_until', '>=', $now);
            });
    }

    public function scopeBloomLevel(Builder $query, string $level): Builder
    {
        return $query->where('bloom_level', $level);
    }

    public function scopeSearchManagement(Builder $query, string $search): Builder
    {
        $keyword = trim($search);

        if ($keyword === '') {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($keyword): void {
            $builder
                ->where('title', 'like', "%{$keyword}%")
                ->orWhere('description', 'like', "%{$keyword}%");
        });
    }

    // ── Helpers ──

    /**
     * Get the human-readable Bloom level label.
     */
    public function getBloomLabelAttribute(): string
    {
        return self::BLOOM_LABELS[$this->bloom_level] ?? $this->bloom_level;
    }

    /**
     * Check if the assessment is currently available for students.
     */
    public function isAvailable(): bool
    {
        if (! $this->is_published) {
            return false;
        }

        $now = now();

        if ($this->available_from && $now->lt($this->available_from)) {
            return false;
        }

        if ($this->available_until && $now->gt($this->available_until)) {
            return false;
        }

        return true;
    }

    /**
     * Check if a user can still attempt this assessment.
     */
    public function canAttempt(User $user): bool
    {
        if (! $this->isAvailable()) {
            return false;
        }

        $attemptCount = $this->submissions()
            ->where('user_id', $user->id)
            ->whereIn('status', ['submitted', 'grading', 'graded'])
            ->count();

        return $attemptCount < $this->max_attempts;
    }

    /**
     * Get the total possible points for this assessment.
     */
    public function getTotalPointsAttribute(): int
    {
        return $this->questions()->sum('points');
    }

    /**
     * Determine if this assessment requires manual grading.
     */
    public function requiresManualGrading(): bool
    {
        return in_array($this->grading_type, [self::GRADING_MANUAL, self::GRADING_MIXED]);
    }
}
