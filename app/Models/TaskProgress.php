<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'lesson_task_id', 'completed_at', 'watch_seconds', 'reading_seconds', 'started_at'])]
class TaskProgress extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'task_progress';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
            'started_at' => 'datetime',
            'watch_seconds' => 'integer',
            'reading_seconds' => 'integer',
        ];
    }

    /**
     * Get the user that owns the progress row.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the task that owns the progress row.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(LessonTask::class, 'lesson_task_id');
    }
}
