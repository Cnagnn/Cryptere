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

    public function essay(): static
    {
        return $this->state(fn () => [
            'bloom_level' => 'C2',
            'question_type' => 'essay',
            'grading_type' => 'manual',
            'options' => null,
            'correct_answer' => null,
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

    public function computation(): static
    {
        return $this->state(fn () => [
            'bloom_level' => 'C3',
            'question_type' => 'computation',
            'grading_type' => 'auto',
            'options' => null,
            'correct_answer' => (string) fake()->numberBetween(1, 1000),
        ]);
    }

    public function caseStudy(): static
    {
        return $this->state(fn () => [
            'bloom_level' => 'C4',
            'question_type' => 'case_study',
            'grading_type' => 'manual',
            'options' => null,
            'correct_answer' => null,
            'min_words' => 200,
            'max_words' => 500,
            'points' => 20,
            'rubric' => [
                'criteria' => [
                    ['name' => 'Identification', 'description' => 'Identifies key elements.', 'max_points' => 7, 'levels' => []],
                    ['name' => 'Analysis Depth', 'description' => 'Depth of analysis.', 'max_points' => 7, 'levels' => []],
                    ['name' => 'Evidence', 'description' => 'Use of evidence.', 'max_points' => 6, 'levels' => []],
                ],
            ],
        ]);
    }

    public function design(): static
    {
        return $this->state(fn () => [
            'bloom_level' => 'C6',
            'question_type' => 'design',
            'grading_type' => 'manual',
            'options' => null,
            'correct_answer' => null,
            'min_words' => 500,
            'max_words' => 1000,
            'points' => 30,
            'rubric' => [
                'criteria' => [
                    ['name' => 'Completeness', 'description' => 'All components present.', 'max_points' => 6, 'levels' => []],
                    ['name' => 'Technical Soundness', 'description' => 'Feasible and secure.', 'max_points' => 6, 'levels' => []],
                    ['name' => 'Originality', 'description' => 'Creative approach.', 'max_points' => 6, 'levels' => []],
                    ['name' => 'Documentation', 'description' => 'Quality of docs.', 'max_points' => 6, 'levels' => []],
                    ['name' => 'Integration', 'description' => 'Components work together.', 'max_points' => 6, 'levels' => []],
                ],
            ],
        ]);
    }
}
