<?php

namespace App\Models;

use Database\Factories\AssessmentAnswerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'submission_id',
    'question_id',
    'answer_text',
    'selected_option',
    'is_correct',
    'points_awarded',
    'max_points',
    'rubric_scores',
    'feedback',
    'graded_at',
])]
class AssessmentAnswer extends Model
{
    /** @use HasFactory<AssessmentAnswerFactory> */
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
            'points_awarded' => 'integer',
            'max_points' => 'integer',
            'rubric_scores' => 'array',
            'graded_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function submission(): BelongsTo
    {
        return $this->belongsTo(AssessmentSubmission::class, 'submission_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(AssessmentQuestion::class, 'question_id');
    }

    // ── Helpers ──

    /**
     * Check if this answer has been graded.
     */
    public function isGraded(): bool
    {
        return $this->points_awarded !== null;
    }

    /**
     * Get the score as a percentage.
     */
    public function getScorePercentageAttribute(): ?float
    {
        if ($this->points_awarded === null || $this->max_points === 0) {
            return null;
        }

        return round(($this->points_awarded / $this->max_points) * 100, 1);
    }

    /**
     * Apply auto-grading for objective questions.
     */
    public function autoGrade(): void
    {
        $question = $this->question;

        if (! $question->isAutoGradable()) {
            return;
        }

        $answer = $this->answer_text ?? $this->selected_option ?? '';
        $fraction = $question->gradeAnswer($answer);
        $maxPoints = (int) $question->points;
        $awarded = (int) round($fraction * $maxPoints);

        $this->update([
            'is_correct' => $fraction >= 1.0,
            'points_awarded' => $awarded,
            'max_points' => $maxPoints,
            'graded_at' => now(),
        ]);
    }

    /**
     * Apply manual grading with rubric scores.
     *
     * @param  array<string, array{score: int, feedback?: string}>  $rubricScores
     */
    public function manualGrade(array $rubricScores, ?string $feedback = null): void
    {
        $totalPoints = collect($rubricScores)->sum('score');
        $maxPoints = $this->question->points;

        // Ensure points don't exceed maximum
        $pointsAwarded = min($totalPoints, $maxPoints);

        $this->update([
            'rubric_scores' => $rubricScores,
            'points_awarded' => $pointsAwarded,
            'max_points' => $maxPoints,
            'is_correct' => $pointsAwarded >= ($maxPoints * 0.7), // 70% threshold
            'feedback' => $feedback,
            'graded_at' => now(),
        ]);
    }
}
