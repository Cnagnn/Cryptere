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
    'question_bank_id',
    'difficulty_score',
    'discrimination',
    'times_shown',
    'times_correct',
])]
#[Hidden(['correct_answer'])]
class AssessmentQuestion extends Model
{
    /** @use HasFactory<AssessmentQuestionFactory> */
    use HasFactory;

    // Question types
    public const TYPE_MCQ = 'mcq';

    public const TYPE_MULTIPLE_SELECT = 'multiple_select';

    public const TYPE_TRUE_FALSE = 'true_false';

    public const TYPE_MATCHING = 'matching';

    public const TYPE_SHORT_ANSWER = 'short_answer';

    public const TYPE_ESSAY = 'essay';

    public const TYPES = [
        self::TYPE_MCQ,
        self::TYPE_MULTIPLE_SELECT,
        self::TYPE_TRUE_FALSE,
        self::TYPE_MATCHING,
        self::TYPE_SHORT_ANSWER,
        self::TYPE_ESSAY,
    ];

    /**
     * All question types are auto-gradable. Essays are auto-graded using a
     * keyword-detection scheme stored in correct_answer; other types use
     * deterministic comparison.
     */
    public const AUTO_GRADABLE_TYPES = self::TYPES;

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
            'difficulty_score' => 'decimal:2',
            'discrimination' => 'decimal:2',
            'times_shown' => 'integer',
            'times_correct' => 'integer',
        ];
    }

    // ── Relationships ──

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class);
    }

    /**
     * Get the question bank entry this question was created from.
     */
    public function questionBank(): BelongsTo
    {
        return $this->belongsTo(QuestionBank::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(AssessmentAnswer::class, 'question_id');
    }

    // ── Helpers ──

    /**
     * Grade a learner answer for this question and return a 0..1 score fraction.
     *
     * 1.0 = full credit, 0.0 = no credit. Intermediate values are reserved for
     * essay questions which support partial credit based on keyword coverage.
     */
    public function gradeAnswer(?string $answer): float
    {
        $answer = (string) ($answer ?? '');

        return match ($this->question_type) {
            self::TYPE_MCQ, self::TYPE_TRUE_FALSE => $this->gradeSingleChoice($answer),
            self::TYPE_MULTIPLE_SELECT => $this->gradeMultipleSelect($answer),
            self::TYPE_MATCHING => $this->gradeMatching($answer),
            self::TYPE_SHORT_ANSWER => $this->gradeShortAnswer($answer),
            self::TYPE_ESSAY => $this->gradeEssay($answer),
            default => 0.0,
        };
    }

    /**
     * Backwards-compatible boolean check used by legacy callers.
     */
    public function isCorrect(string $answer): bool
    {
        return $this->gradeAnswer($answer) >= 1.0;
    }

    /**
     * Determine if this question can be auto-graded. With the auto-only
     * grading model this is true for every supported question type.
     */
    public function isAutoGradable(): bool
    {
        return in_array($this->question_type, self::AUTO_GRADABLE_TYPES, true);
    }

    /**
     * Manual grading is no longer supported.
     */
    public function requiresManualGrading(): bool
    {
        return false;
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

    /**
     * Record an attempt for this question.
     */
    public function recordAttempt(bool $correct): void
    {
        $this->increment('times_shown');
        if ($correct) {
            $this->increment('times_correct');
        }
        $this->updateAnalytics();
    }

    /**
     * Update difficulty and discrimination analytics.
     */
    public function updateAnalytics(): void
    {
        if ($this->times_shown === 0) {
            return;
        }

        // Calculate difficulty (p-value: proportion correct)
        $this->difficulty_score = round($this->times_correct / $this->times_shown, 2);

        // Discrimination calculation requires more context (high vs low performers)
        // Placeholder: implement based on your analytics requirements
        // For now, just save difficulty
        $this->saveQuietly();
    }

    // ── Per-type grading helpers ──

    private function gradeSingleChoice(string $answer): float
    {
        return $this->normalize($answer) === $this->normalize((string) $this->correct_answer)
            ? 1.0
            : 0.0;
    }

    private function gradeMultipleSelect(string $answer): float
    {
        $given = $this->normalizeSet($this->decodeArray($answer));
        $expected = $this->normalizeSet($this->decodeArray((string) $this->correct_answer));

        if (count($expected) === 0) {
            return 0.0;
        }

        return $given === $expected ? 1.0 : 0.0;
    }

    private function gradeMatching(string $answer): float
    {
        $given = $this->normalizeAssoc($this->decodeAssoc($answer));
        $expected = $this->normalizeAssoc($this->decodeAssoc((string) $this->correct_answer));

        if (count($expected) === 0) {
            return 0.0;
        }

        return $given === $expected ? 1.0 : 0.0;
    }

    private function gradeShortAnswer(string $answer): float
    {
        $normalized = $this->normalize($answer);

        if ($normalized === '') {
            return 0.0;
        }

        foreach ($this->acceptedShortAnswers() as $accepted) {
            if ($this->normalize($accepted) === $normalized) {
                return 1.0;
            }
        }

        return 0.0;
    }

    /**
     * Auto-grade an essay answer using keyword-coverage and word-count rules
     * stored in the correct_answer JSON payload, e.g.
     *
     *   {"keywords":["kunci","modulo"],"min_matches":2,"min_words":30}
     *
     * If correct_answer is not a JSON spec, falls back to a word-count rule
     * driven by min_words/max_words on the question.
     */
    private function gradeEssay(string $answer): float
    {
        $trimmed = trim($answer);

        if ($trimmed === '') {
            return 0.0;
        }

        $wordCount = preg_match_all('/\\S+/u', $trimmed) ?: 0;
        $spec = $this->decodeEssaySpec((string) $this->correct_answer);

        $minWords = (int) ($spec['min_words'] ?? $this->min_words ?? 0);
        $maxWords = (int) ($spec['max_words'] ?? $this->max_words ?? 0);

        if ($maxWords > 0 && $wordCount > $maxWords) {
            // Hard cap: exceeding max_words drops to half credit.
            $wordCountPenalty = 0.5;
        } else {
            $wordCountPenalty = 1.0;
        }

        $keywords = array_values(array_filter(array_map(
            fn ($keyword): string => $this->normalize((string) $keyword),
            $spec['keywords'] ?? [],
        ), fn (string $keyword): bool => $keyword !== ''));

        if ($keywords === []) {
            // No keyword spec: grade purely on word-count threshold.
            if ($minWords <= 0) {
                return 1.0 * $wordCountPenalty;
            }

            return $wordCount >= $minWords ? 1.0 * $wordCountPenalty : 0.0;
        }

        $haystack = $this->normalize($trimmed);
        $matches = 0;

        foreach ($keywords as $keyword) {
            if ($keyword !== '' && str_contains($haystack, $keyword)) {
                $matches++;
            }
        }

        $required = (int) ($spec['min_matches'] ?? count($keywords));
        $required = max(1, min($required, count($keywords)));

        $coverage = $matches / count($keywords);

        if ($matches >= $required && ($minWords <= 0 || $wordCount >= $minWords)) {
            return 1.0 * $wordCountPenalty;
        }

        // Partial credit proportional to coverage, capped at 0.9 of word penalty.
        return min(0.9, $coverage) * $wordCountPenalty;
    }

    /**
     * @return list<string>
     */
    private function acceptedShortAnswers(): array
    {
        $raw = (string) $this->correct_answer;

        if ($raw === '') {
            return [];
        }

        $decoded = $this->decodeArray($raw);

        if ($decoded !== null && $decoded !== []) {
            return array_values(array_map('strval', $decoded));
        }

        // Allow pipe- or newline-separated alternates as a simple authoring shorthand.
        $parts = preg_split('/\\s*(?:\\||\\n)\\s*/u', $raw) ?: [];

        return array_values(array_filter(array_map('trim', $parts), fn (string $p): bool => $p !== ''));
    }

    private function normalize(string $value): string
    {
        return Str::squish(Str::lower($value));
    }

    /**
     * @param  list<mixed>  $values
     * @return list<string>
     */
    private function normalizeSet(array $values): array
    {
        $normalized = array_values(array_unique(array_map(
            fn ($v): string => $this->normalize((string) $v),
            $values,
        )));
        sort($normalized);

        return $normalized;
    }

    /**
     * @param  array<int|string, mixed>  $assoc
     * @return array<string, string>
     */
    private function normalizeAssoc(array $assoc): array
    {
        $result = [];

        foreach ($assoc as $key => $value) {
            $normalizedKey = $this->normalize((string) $key);

            if ($normalizedKey === '') {
                continue;
            }

            $result[$normalizedKey] = $this->normalize((string) $value);
        }

        ksort($result);

        return $result;
    }

    /**
     * @return list<mixed>|null
     */
    private function decodeArray(string $raw): ?array
    {
        $raw = trim($raw);

        if ($raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (is_array($decoded) && array_is_list($decoded)) {
            return $decoded;
        }

        return null;
    }

    /**
     * @return array<int|string, mixed>
     */
    private function decodeAssoc(string $raw): array
    {
        $raw = trim($raw);

        if ($raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (is_array($decoded) && ! array_is_list($decoded)) {
            return $decoded;
        }

        return [];
    }

    /**
     * @return array{keywords?: list<string>, min_matches?: int, min_words?: int, max_words?: int}
     */
    private function decodeEssaySpec(string $raw): array
    {
        $raw = trim($raw);

        if ($raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (is_array($decoded) && ! array_is_list($decoded)) {
            return $decoded;
        }

        return [];
    }
}
