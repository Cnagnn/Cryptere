<?php

namespace Database\Factories;

use App\Models\LessonTask;
use App\Models\QuizSubmission;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<QuizSubmission>
 */
class QuizSubmissionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $total = fake()->numberBetween(3, 10);
        $score = fake()->numberBetween(0, $total);

        return [
            'user_id' => User::factory(),
            'lesson_task_id' => LessonTask::factory(),
            'answers' => array_fill(0, $total, fake()->word()),
            'score' => $score,
            'total' => $total,
            'results' => array_map(fn () => fake()->boolean(70), range(1, $total)),
            'xp_earned' => $score * 10,
            'points_earned' => $score * 15,
            'submitted_at' => now()->subHours(fake()->numberBetween(1, 72)),
        ];
    }

    /**
     * Indicate a perfect score submission.
     */
    public function perfect(): static
    {
        return $this->state(fn (array $attributes): array => [
            'score' => $attributes['total'],
            'results' => array_fill(0, $attributes['total'], true),
            'xp_earned' => $attributes['total'] * 10,
            'points_earned' => $attributes['total'] * 15,
        ]);
    }
}
