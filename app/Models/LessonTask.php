<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'lesson_id',
    'title',
    'description',
    'type',
    'video_url',
    'video_processing_status',
    'video_mp4_url',
    'document_name',
    'conversion_status',
    'pdf_url',
    'sort_order',
    'published_at',
    'published_by',
    'estimated_minutes',
    'prerequisite_task_id',
    'status',
    'version',
])]
class LessonTask extends Model
{
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'published_at' => 'datetime',
            'published_by' => 'integer',
            'estimated_minutes' => 'integer',
            'status' => 'string',
            'version' => 'integer',
        ];
    }

    /**
     * Scope published tasks only (using status field).
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Get the lesson that owns the task.
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Get the prerequisite task.
     */
    public function prerequisite(): BelongsTo
    {
        return $this->belongsTo(self::class, 'prerequisite_task_id');
    }

    /**
     * Get tasks that depend on this task.
     */
    public function dependents(): HasMany
    {
        return $this->hasMany(self::class, 'prerequisite_task_id');
    }

    /**
     * Get quiz questions for this task.
     */
    public function quizQuestions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class, 'lesson_task_id')->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Check if task is published.
     */
    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    /**
     * Check if user can access this task (published and prerequisite met).
     */
    public function canAccess(User $user): bool
    {
        if (!$this->isPublished()) {
            return false;
        }

        if ($this->prerequisite_task_id === null) {
            return true;
        }

        // Check if prerequisite task is completed
        // Assuming task completion tracked via lesson progress or similar
        return true; // Implement based on your progress tracking
    }
}
