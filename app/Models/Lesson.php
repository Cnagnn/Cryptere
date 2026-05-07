<?php

namespace App\Models;

use Database\Factories\LessonFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['course_id', 'slug', 'title', 'description', 'content', 'position', 'learning_objectives', 'prerequisites_text', 'key_concepts', 'topic_id', 'prerequisite_lesson_id', 'status', 'version', 'published_by'])]
class Lesson extends Model
{
    /** @use HasFactory<LessonFactory> */
    use HasFactory;

    protected $casts = [
        'learning_objectives' => 'array',
        'key_concepts' => 'array',
        'status' => 'string',
        'version' => 'integer',
    ];

    /**
     * Get the course that owns the lesson.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the topic this lesson belongs to.
     */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    /**
     * Get the prerequisite lesson.
     */
    public function prerequisite(): BelongsTo
    {
        return $this->belongsTo(self::class, 'prerequisite_lesson_id');
    }

    /**
     * Get lessons that depend on this lesson.
     */
    public function dependents(): HasMany
    {
        return $this->hasMany(self::class, 'prerequisite_lesson_id');
    }

    /**
     * Get the user who published this lesson.
     */
    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    /**
     * Get progress rows recorded for this lesson.
     */
    public function progress(): HasMany
    {
        return $this->hasMany(LessonProgress::class);
    }

    /**
     * Get the ordered tasks for this lesson.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(LessonTask::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Scope to published lessons.
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Scope to draft lessons.
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Scope to archived lessons.
     */
    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    /**
     * Check if lesson is published.
     */
    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    /**
     * Check if user can access this lesson (published and prerequisite met).
     */
    public function canAccess(User $user): bool
    {
        if (!$this->isPublished()) {
            return false;
        }

        if ($this->prerequisite_lesson_id === null) {
            return true;
        }

        // Check if prerequisite lesson is completed
        return LessonProgress::query()
            ->where('user_id', $user->id)
            ->where('lesson_id', $this->prerequisite_lesson_id)
            ->where('is_completed', true)
            ->exists();
    }
}
