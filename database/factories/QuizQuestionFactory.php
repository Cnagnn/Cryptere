<?php

namespace Database\Factories;

use App\Models\LessonTask;
use App\Models\QuizQuestion;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizQuestion>
 */
class QuizQuestionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $options = ['AES', 'RSA', 'SHA-256', 'DES'];

        return [
            'lesson_task_id' => LessonTask::factory(),
            'question' => fake()->sentence().'?',
            'options' => $options,
            'correct_option' => fake()->numberBetween(0, count($options) - 1),
            'explanation' => fake()->sentence(),
            'sort_order' => fake()->numberBetween(0, 10),
        ];
    }
}
