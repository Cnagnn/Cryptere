<?php

namespace App\Models;

use Database\Factories\ChallengeQuestionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable(['challenge_id', 'type', 'question', 'options', 'correct_answer', 'explanation', 'sort_order', 'difficulty_level', 'difficulty_score', 'discrimination', 'times_shown', 'times_correct'])]
#[Hidden(['correct_answer'])]
class ChallengeQuestion extends Model
{
    /** @use HasFactory<ChallengeQuestionFactory> */
    use HasFactory;

    public const TYPE_MCQ = 'mcq';

    public const TYPE_TRUE_FALSE = 'true_false';

    public const TYPE_TEXT = 'text';

    public const TYPE_FILL_BLANK = 'fill_blank';

    public const TYPES = [
        self::TYPE_MCQ,
        self::TYPE_TRUE_FALSE,
        self::TYPE_TEXT,
        self::TYPE_FILL_BLANK,
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
            'sort_order' => 'integer',
            'difficulty_score' => 'float',
            'discrimination' => 'float',
            'times_shown' => 'integer',
            'times_correct' => 'integer',
        ];
    }

    /**
     * Get the challenge that owns the question.
     */
    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }

    /**
     * Check whether the given answer is correct (type-aware normalized comparison).
     */
    public function isCorrect(string $answer): bool
    {
        $normalized = Str::squish(Str::lower($answer));
        $expected = Str::squish(Str::lower($this->correct_answer));

        return $normalized === $expected;
    }
}
