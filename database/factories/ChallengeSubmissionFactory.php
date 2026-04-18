<?php

namespace Database\Factories;

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChallengeSubmission>
 */
class ChallengeSubmissionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $isCorrect = fake()->boolean(50);

        return [
            'user_id' => User::factory(),
            'challenge_id' => Challenge::factory(),
            'answer' => fake()->word(),
            'is_correct' => $isCorrect,
            'score' => $isCorrect ? fake()->numberBetween(50, 120) : 0,
            'submitted_at' => now()->subHours(fake()->numberBetween(1, 72)),
        ];
    }
}
