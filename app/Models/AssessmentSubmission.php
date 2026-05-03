<?php

namespace App\Models;

use Database\Factories\AssessmentSubmissionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'assessment_id',
    'attempt_number',
    'status',
    'started_at',
    'submitted_at',
    'graded_at',
    'total_score',
    'points_earned',
    'points_possible',
    'passed',
    'graded_by',
    'overall_feedback',
])]
class AssessmentSubmission extends Model
{
    /** @use HasFactory<AssessmentSubmissionFactory> */
    use HasFactory;

    // Status constants
    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_GRADING = 'grading';

    public const STATUS_GRADED = 'graded';

    public const STATUSES = [
        self::STATUS_IN_PROGRESS,
        self::STATUS_SUBMITTED,
        self::STATUS_GRADING,
        self::STATUS_GRADED,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'attempt_number' => 'integer',
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'graded_at' => 'datetime',
            'total_score' => 'integer',
            'points_earned' => 'integer',
            'points_possible' => 'integer',
            'passed' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function grader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'graded_by');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(AssessmentAnswer::class, 'submission_id');
    }

    // ── Scopes ──

    public function scopeStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function scopePendingGrading(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_SUBMITTED)
            ->orderBy('submitted_at');
    }

    public function scopeGraded(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_GRADED);
    }

    public function scopeForUser(Builder $query, User|int $user): Builder
    {
        $userId = $user instanceof User ? $user->id : $user;

        return $query->where('user_id', $userId);
    }

    // ── Helpers ──

    /**
     * Check if this submission is still in progress (editable).
     */
    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    /**
     * Check if this submission has been fully graded.
     */
    public function isGraded(): bool
    {
        return $this->status === self::STATUS_GRADED;
    }

    /**
     * Check if this submission is awaiting manual grading.
     */
    public function isPendingGrading(): bool
    {
        return in_array($this->status, [self::STATUS_SUBMITTED, self::STATUS_GRADING]);
    }

    /**
     * Calculate and update the total score from individual answers.
     */
    public function calculateScore(): void
    {
        $answers = $this->answers()->whereNotNull('points_awarded')->get();

        $pointsEarned = $answers->sum('points_awarded');
        $pointsPossible = $answers->sum('max_points');

        $totalScore = $pointsPossible > 0
            ? (int) round(($pointsEarned / $pointsPossible) * 100)
            : 0;

        $passingScore = $this->assessment->passing_score ?? 70;

        $this->update([
            'points_earned' => $pointsEarned,
            'points_possible' => $pointsPossible,
            'total_score' => $totalScore,
            'passed' => $totalScore >= $passingScore,
        ]);
    }

    /**
     * Check if all answers have been graded.
     */
    public function isFullyGraded(): bool
    {
        $totalQuestions = $this->answers()->count();
        $gradedAnswers = $this->answers()->whereNotNull('points_awarded')->count();

        return $totalQuestions > 0 && $totalQuestions === $gradedAnswers;
    }

    /**
     * Get the number of answers still pending grading.
     */
    public function getPendingAnswersCountAttribute(): int
    {
        return $this->answers()->whereNull('points_awarded')->count();
    }
}
