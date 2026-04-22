<?php

namespace Database\Factories;

use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChallengeQuestion>
 */
class ChallengeQuestionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'challenge_id' => Challenge::factory(),
            'type' => ChallengeQuestion::TYPE_MCQ,
            'question' => fake()->sentence().'?',
            'options' => ['AES', 'RSA', 'SHA-256', 'DES'],
            'correct_answer' => 'AES',
            'explanation' => fake()->sentence(),
            'sort_order' => 0,
        ];
    }

    /**
     * Configure the question as true/false type.
     */
    public function trueFalse(): static
    {
        return $this->state(fn (): array => [
            'type' => ChallengeQuestion::TYPE_TRUE_FALSE,
            'options' => ['True', 'False'],
            'correct_answer' => fake()->randomElement(['True', 'False']),
        ]);
    }

    /**
     * Configure the question as text input type.
     */
    public function text(): static
    {
        return $this->state(fn (): array => [
            'type' => ChallengeQuestion::TYPE_TEXT,
            'options' => null,
            'correct_answer' => fake()->word(),
        ]);
    }

    /**
     * Configure the question as fill-in-the-blank type.
     */
    public function fillBlank(): static
    {
        return $this->state(fn (): array => [
            'type' => ChallengeQuestion::TYPE_FILL_BLANK,
            'options' => null,
            'correct_answer' => fake()->word(),
        ]);
    }
}
