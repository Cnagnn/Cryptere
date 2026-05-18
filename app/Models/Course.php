<?php

namespace App\Models;

use App\Traits\Versionable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

#[Fillable([
    'slug',
    'title',
    'summary',
    'cover_path',
    'estimated_minutes',
    'sort_order',
    'prerequisite_course_id',
    'category',
    'difficulty',
    'path_position',
    'is_published',
    'status',
    'version',
    'published_by',
])]
class Course extends Model
{
    use HasFactory, Versionable;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_ARCHIVED = 'archived';

    protected $appends = ['cover'];

    protected function casts(): array
    {
        return [
            'estimated_minutes' => 'integer',
            'status' => 'string',
            'version' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    public function setIsPublishedAttribute(bool $value): void
    {
        $this->attributes['is_published'] = $value;
        $this->attributes['status'] = $value ? self::STATUS_PUBLISHED : self::STATUS_DRAFT;
    }

    /**
     * Scope to published courses (using status field).
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    /**
     * Scope to draft courses.
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    /**
     * Scope to archived courses.
     */
    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ARCHIVED);
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
                ->orWhere('summary', 'like', "%{$keyword}%");
        });
    }

    /**
     * Return the cover image as a URL string.
     * Uses file-system path via cover_path column.
     */
    public function getCoverAttribute(): ?string
    {
        if (is_string($this->cover_path) && $this->cover_path !== '') {
            return Storage::disk('public')->url($this->cover_path);
        }

        return $this->buildDefaultCoverDataUri();
    }

    private function buildDefaultCoverDataUri(): string
    {
        $initial = Str::upper(Str::substr(trim((string) $this->title), 0, 1));

        if ($initial === '') {
            $initial = 'C';
        }

        $safeInitial = htmlspecialchars($initial, ENT_QUOTES | ENT_XML1);
        $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="360" viewBox="0 0 720 360" fill="none" role="img" aria-label="Course cover placeholder">
    <defs>
        <linearGradient id="course-cover-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1f2937"/>
            <stop offset="100%" stop-color="#111827"/>
        </linearGradient>
    </defs>
    <rect width="720" height="360" fill="url(#course-cover-gradient)"/>
    <circle cx="580" cy="80" r="120" fill="rgba(255,255,255,0.08)"/>
    <circle cx="120" cy="300" r="150" fill="rgba(255,255,255,0.05)"/>
    <rect x="36" y="36" width="96" height="96" rx="20" fill="rgba(255,255,255,0.15)"/>
    <text x="84" y="101" text-anchor="middle" font-size="54" font-weight="700" fill="#f9fafb" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif">{$safeInitial}</text>
</svg>
SVG;

        return 'data:image/svg+xml;utf8,'.rawurlencode($svg);
    }

    public function prerequisite(): BelongsTo
    {
        return $this->belongsTo(self::class, 'prerequisite_course_id');
    }

    /**
     * Get the user who published this course.
     */
    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function dependents(): HasMany
    {
        return $this->hasMany(self::class, 'prerequisite_course_id');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('position');
    }

    public function tasks(): HasManyThrough
    {
        return $this->hasManyThrough(LessonTask::class, Lesson::class);
    }

    /**
     * Get the final assessment for this course (one-to-one).
     * Each course may have at most one published assessment as its final evaluation.
     */
    public function assessment(): HasOne
    {
        return $this->hasOne(Assessment::class);
    }

    /**
     * Get all assessments for this course (one-to-many).
     * Supports multiple assessments per course (e.g., C1-C6 Bloom levels).
     */
    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'enrollments')
            ->withPivot(['progress_percentage', 'enrolled_at', 'completed_at'])
            ->withTimestamps();
    }

    /**
     * Determine if the course is unlocked for a given user.
     * A course is unlocked when it has no prerequisite, or the prerequisite is completed.
     */
    public function isUnlockedFor(User $user): bool
    {
        if ($this->prerequisite_course_id === null) {
            return true;
        }

        return Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $this->prerequisite_course_id)
            ->whereNotNull('completed_at')
            ->exists();
    }

    /**
     * Check if course is published.
     */
    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED;
    }

    /**
     * Check if course is draft.
     */
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * Check if course is archived.
     */
    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }
}
