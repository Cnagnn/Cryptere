<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuizSubmission extends Model
{
    /** @var list<string> */
    protected $fillable = [
        'user_id',
        'lesson_task_id',
        'answers',
        'score',
        'total',
        'results',
        'xp_earned',
        'points_earned',
        'submitted_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'results' => 'array',
            'score' => 'integer',
            'total' => 'integer',
            'xp_earned' => 'integer',
            'points_earned' => 'integer',
            'submitted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<LessonTask, $this> */
    public function task(): BelongsTo
    {
        return $this->belongsTo(LessonTask::class, 'lesson_task_id');
    }
}
