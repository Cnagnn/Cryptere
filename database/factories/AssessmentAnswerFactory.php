<?php

namespace Database\Factories;

use App\Models\AssessmentAnswer;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentSubmission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssessmentAnswer>
 */
class AssessmentAnswerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'submission_id' => AssessmentSubmission::factory(),
            'question_id' => AssessmentQuestion::factory(),
            'max_points' => 10,
        ];
    }

    public function correct(): static
    {
        return $this->state(fn () => [
            'is_correct' => true,
            'points_awarded' => 10,
            'graded_at' => now(),
        ]);
    }

    public function incorrect(): static
    {
        return $this->state(fn () => [
            'is_correct' => false,
            'points_awarded' => 0,
            'graded_at' => now(),
        ]);
    }

    public function withMcqAnswer(string $option = 'Option A'): static
    {
        return $this->state(fn () => [
            'selected_option' => $option,
        ]);
    }

    public function withEssayAnswer(): static
    {
        return $this->state(fn () => [
            'answer_text' => fake()->paragraphs(2, true),
        ]);
    }

    public function ungraded(): static
    {
        return $this->state(fn () => [
            'is_correct' => null,
            'points_awarded' => null,
            'graded_at' => null,
        ]);
    }
}
