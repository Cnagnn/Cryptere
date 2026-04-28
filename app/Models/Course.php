<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

#[Fillable([
    'slug',
    'title',
    'summary',
    'cover_path',
    'estimated_minutes',
    'sort_order',
    'is_published',
    'prerequisite_course_id',
    'category',
    'difficulty',
    'path_position',
])]
class Course extends Model
{
    use HasFactory;

    protected $appends = ['cover'];

    protected function casts(): array
    {
        return [
            'estimated_minutes' => 'integer',
            'is_published' => 'boolean',
        ];
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
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

    public function dependents(): HasMany
    {
        return $this->hasMany(self::class, 'prerequisite_course_id');
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('position');
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
}
