<?php

namespace App\Models;

use Database\Factories\AssessmentQuestionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'assessment_id',
    'bloom_level',
    'question_type',
    'question_text',
    'options',
    'correct_answer',
    'explanation',
    'rubric',
    'points',
    'grading_type',
    'min_words',
    'max_words',
    'sort_order',
])]
#[Hidden(['correct_answer'])]
class AssessmentQuestion extends Model
{
    /** @use HasFactory<AssessmentQuestionFactory> */
    use HasFactory;

    // Question types
    public const TYPE_MCQ = 'mcq';

    public const TYPE_TRUE_FALSE = 'true_false';

    public const TYPE_SHORT_ANSWER = 'short_answer';

    public const TYPE_ESSAY = 'essay';

    public const TYPE_COMPUTATION = 'computation';

    public const TYPE_CASE_STUDY = 'case_study';

    public const TYPE_DESIGN = 'design';

    public const TYPES = [
        self::TYPE_MCQ,
        self::TYPE_TRUE_FALSE,
        self::TYPE_SHORT_ANSWER,
        self::TYPE_ESSAY,
        self::TYPE_COMPUTATION,
        self::TYPE_CASE_STUDY,
        self::TYPE_DESIGN,
    ];

    // Types that can be auto-graded
    public const AUTO_GRADABLE_TYPES = [
        self::TYPE_MCQ,
        self::TYPE_TRUE_FALSE,
        self::TYPE_SHORT_ANSWER,
        self::TYPE_COMPUTATION,
    ];

    // Types that require manual grading
    public const MANUAL_GRADED_TYPES = [
        self::TYPE_ESSAY,
        self::TYPE_CASE_STUDY,
        self::TYPE_DESIGN,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'options' => 'array',
            'rubric' => 'array',
            'points' => 'integer',
            'min_words' => 'integer',
            'max_words' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    // ── Relationships ──

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(AssessmentAnswer::class, 'question_id');
    }

    // ── Helpers ──

    /**
     * Check whether the given answer is correct (for auto-gradable types).
     */
    public function isCorrect(string $answer): bool
    {
        if (! $this->isAutoGradable()) {
            return false;
        }

        if ($this->question_type === self::TYPE_MCQ || $this->question_type === self::TYPE_TRUE_FALSE) {
            return Str::lower(trim($answer)) === Str::lower(trim($this->correct_answer));
        }

        // For short_answer and computation: normalize whitespace and case
        $normalized = Str::squish(Str::lower($answer));
        $expected = Str::squish(Str::lower($this->correct_answer));

        return $normalized === $expected;
    }

    /**
     * Determine if this question can be auto-graded.
     */
    public function isAutoGradable(): bool
    {
        return $this->grading_type === 'auto'
            && in_array($this->question_type, self::AUTO_GRADABLE_TYPES);
    }

    /**
     * Determine if this question requires manual grading.
     */
    public function requiresManualGrading(): bool
    {
        return $this->grading_type === 'manual';
    }

    /**
     * Get the rubric criteria as a structured array.
     *
     * @return array<int, array{name: string, description: string, max_points: int, levels: array}>
     */
    public function getRubricCriteria(): array
    {
        return $this->rubric['criteria'] ?? [];
    }

    /**
     * Get the maximum possible rubric score (sum of all criteria max_points).
     */
    public function getMaxRubricScore(): int
    {
        return collect($this->getRubricCriteria())
            ->sum('max_points');
    }
}
