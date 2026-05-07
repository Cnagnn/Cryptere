<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'title',
    'category',
    'bloom_level',
    'question_type',
    'question_text',
    'options',
    'correct_answer',
    'explanation',
    'rubric',
    'points',
    'difficulty_score',
    'discrimination',
    'times_used',
    'created_by',
    'is_active',
])]
#[Hidden(['correct_answer'])]
class QuestionBank extends Model
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
            'options' => 'array',
            'rubric' => 'array',
            'points' => 'integer',
            'difficulty_score' => 'decimal:2',
            'discrimination' => 'decimal:2',
            'times_used' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // ── Relationships ──

    /**
     * Get the user who created this question.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all assessment questions created from this bank entry.
     */
    public function assessmentQuestions(): HasMany
    {
        return $this->hasMany(AssessmentQuestion::class);
    }

    // ── Scopes ──

    /**
     * Scope to active questions only.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope by Bloom's taxonomy level.
     */
    public function scopeByBloomLevel(Builder $query, string $level): Builder
    {
        return $query->where('bloom_level', $level);
    }

    /**
     * Scope by question type.
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('question_type', $type);
    }

    /**
     * Scope by category.
     */
    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    // ── Helpers ──

    /**
     * Increment usage counter when question is used in an assessment.
     */
    public function incrementUsage(): void
    {
        $this->increment('times_used');
    }

    /**
     * Check if this question can be deleted (not used in any assessments).
     */
    public function canDelete(): bool
    {
        return $this->assessmentQuestions()->count() === 0;
    }
}
