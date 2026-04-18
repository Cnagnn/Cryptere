<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Enrollment>
 */
class EnrollmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $isCompleted = fake()->boolean(20);

        return [
            'user_id' => User::factory(),
            'course_id' => Course::factory(),
            'progress_percentage' => $isCompleted
                ? 100
                : fake()->numberBetween(5, 95),
            'enrolled_at' => now()->subDays(fake()->numberBetween(1, 30)),
            'completed_at' => $isCompleted
                ? now()->subDays(fake()->numberBetween(0, 5))
                : null,
        ];
    }
}
