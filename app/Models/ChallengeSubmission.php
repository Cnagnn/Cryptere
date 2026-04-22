<?php

namespace App\Models;

use Database\Factories\ChallengeSubmissionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'challenge_id', 'session_id', 'challenge_question_id', 'answer', 'is_correct', 'score', 'elapsed_ms', 'streak_bonus', 'question_index', 'submitted_at'])]
class ChallengeSubmission extends Model
{
    /** @use HasFactory<ChallengeSubmissionFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
            'submitted_at' => 'datetime',
            'elapsed_ms' => 'integer',
            'streak_bonus' => 'integer',
            'question_index' => 'integer',
        ];
    }

    /**
     * Get the user that owns the submission.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the challenge that owns the submission.
     */
    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    /**
     * Get the challenge question for this submission.
     */
    public function challengeQuestion(): BelongsTo
    {
        return $this->belongsTo(ChallengeQuestion::class);
    }
}
