<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'lesson_task_id',
    'topic_id',
    'question',
    'options',
    'correct_option',
    'explanation',
    'sort_order',
])]
class QuizQuestion extends Model
{
    use HasFactory;

    public function topic()
    {
        return $this->belongsTo(Topic::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => 'array',
            'correct_option' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the task that owns this quiz question.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(LessonTask::class, 'lesson_task_id');
    }
}
