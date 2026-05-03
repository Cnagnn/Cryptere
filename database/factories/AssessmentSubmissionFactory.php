<?php

namespace Database\Factories;

use App\Models\Assessment;
use App\Models\AssessmentSubmission;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssessmentSubmission>
 */
class AssessmentSubmissionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'assessment_id' => Assessment::factory(),
            'attempt_number' => 1,
            'status' => AssessmentSubmission::STATUS_IN_PROGRESS,
            'started_at' => now(),
        ];
    }

    public function submitted(): static
    {
        return $this->state(fn () => [
            'status' => AssessmentSubmission::STATUS_SUBMITTED,
            'submitted_at' => now(),
        ]);
    }

    public function graded(int $score = 80): static
    {
        return $this->state(fn () => [
            'status' => AssessmentSubmission::STATUS_GRADED,
            'submitted_at' => now()->subHour(),
            'graded_at' => now(),
            'total_score' => $score,
            'points_earned' => (int) ($score * 0.1),
            'points_possible' => 10,
            'passed' => $score >= 70,
        ]);
    }

    public function passed(): static
    {
        return $this->graded(fake()->numberBetween(70, 100));
    }

    public function failed(): static
    {
        return $this->graded(fake()->numberBetween(10, 69));
    }
}
