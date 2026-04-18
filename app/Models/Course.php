<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

#[Fillable([
    'slug',
    'title',
    'summary',
    'cover_image',
    'cover_mime_type',
    'cover_path',
    'difficulty',
    'estimated_minutes',
    'sort_order',
    'is_published',
])]
#[Hidden(['cover_image', 'cover_mime_type'])]
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
     * Prefers file-system path (faster, CDN-friendly), falls back to binary blob (legacy).
     */
    public function getCoverAttribute(): ?string
    {
        // Prefer file-system storage (new uploads)
        if (is_string($this->cover_path) && $this->cover_path !== '') {
            return Storage::disk('public')->url($this->cover_path);
        }

        // Fall back to legacy binary blob
        $coverBinary = $this->resolveCoverBinary();
        if (! is_string($coverBinary) || $coverBinary === '') {
            return $this->buildDefaultCoverDataUri();
        }
        $mimeType = is_string($this->cover_mime_type) && $this->cover_mime_type !== ''
            ? $this->cover_mime_type
            : 'image/jpeg';

        return sprintf('data:%s;base64,%s', $mimeType, base64_encode($coverBinary));
    }

    private function resolveCoverBinary(): ?string
    {
        $coverImage = $this->cover_image;
        if (is_string($coverImage)) {
            return $coverImage;
        }
        if (is_resource($coverImage)) {
            rewind($coverImage);
            $contents = stream_get_contents($coverImage);

            return is_string($contents) ? $contents : null;
        }

        return null;
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
}
