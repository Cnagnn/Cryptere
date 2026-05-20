<?php

namespace Database\Factories;

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssessmentQuestion>
 */
class AssessmentQuestionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'assessment_id' => Assessment::factory(),
            'bloom_level' => 'C1',
            'question_type' => 'mcq',
            'question_text' => fake()->sentence().'?',
            'options' => ['Option A', 'Option B', 'Option C', 'Option D'],
            'correct_answer' => 'Option A',
            'explanation' => fake()->sentence(),
            'points' => 10,
            'grading_type' => 'auto',
            'sort_order' => fake()->numberBetween(1, 20),
        ];
    }

    public function mcq(): static
    {
        return $this->state(fn () => [
            'bloom_level' => 'C1',
            'question_type' => 'mcq',
            'grading_type' => 'auto',
            'options' => ['Option A', 'Option B', 'Option C', 'Option D'],
            'correct_answer' => fake()->randomElement(['Option A', 'Option B', 'Option C', 'Option D']),
        ]);
    }

    public function multipleSelect(): static
    {
        return $this->state(fn () => [
            'bloom_level' => 'C2',
            'question_type' => 'multiple_select',
            'grading_type' => 'auto',
            'options' => ['Option A', 'Option B', 'Option C', 'Option D'],
            'correct_answer' => json_encode(['Option A', 'Option C']),
        ]);
    }

    public function trueFalse(): static
    {
        return $this->state(fn () => [
            'bloom_level' => 'C1',
            'question_type' => 'true_false',
            'grading_type' => 'auto',
            'options' => ['True', 'False'],
            'correct_answer' => fake()->randomElement(['True', 'False']),
        ]);
    }

    public function matching(): static
    {
        return $this->state(fn () => [
            'bloom_level' => 'C2',
            'question_type' => 'matching',
            'grading_type' => 'auto',
            'options' => ['A:1', 'B:2', 'C:3', 'D:4'],
            'correct_answer' => json_encode([
                'A' => '1',
                'B' => '2',
                'C' => '3',
                'D' => '4',
            ]),
        ]);
    }

    public function shortAnswer(): static
    {
        return $this->state(fn () => [
            'bloom_level' => 'C1',
            'question_type' => 'short_answer',
            'grading_type' => 'auto',
            'options' => null,
            'correct_answer' => fake()->word(),
        ]);
    }

    public function essay(): static
    {
        return $this->state(fn () => [
            'bloom_level' => 'C2',
            'question_type' => 'essay',
            'grading_type' => 'auto',
            'options' => null,
            'correct_answer' => json_encode([
                'keywords' => ['kunci', 'modulo'],
                'min_matches' => 1,
                'min_words' => 30,
            ]),
            'min_words' => 50,
            'max_words' => 200,
            'rubric' => [
                'criteria' => [
                    ['name' => 'Accuracy', 'description' => 'Correctness of explanation.', 'max_points' => 5, 'levels' => []],
                    ['name' => 'Clarity', 'description' => 'Clear communication.', 'max_points' => 5, 'levels' => []],
                ],
            ],
        ]);
    }
}
