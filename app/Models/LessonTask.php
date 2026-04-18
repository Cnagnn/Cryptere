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
    'type',
    'minutes',
    'video_url',
    'document_name',
    'conversion_status',
    'pdf_url',
    'sort_order',
    'published_at',
    'published_by',
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
            'minutes' => 'integer',
            'sort_order' => 'integer',
            'published_at' => 'datetime',
            'published_by' => 'integer',
        ];
    }

    /**
     * Scope published tasks only.
     */
    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at');
    }

    /**
     * Get the lesson that owns the task.
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * Get quiz questions for this task.
     */
    public function quizQuestions(): HasMany
    {
        return $this->hasMany(QuizQuestion::class, 'lesson_task_id')->orderBy('sort_order')->orderBy('id');
    }
}
