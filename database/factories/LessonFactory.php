<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Lesson>
 */
class LessonFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'slug' => fake()->slug(),
            'title' => fake()->sentence(4),
            'content' => fake()->paragraphs(4, true),
            'position' => fake()->numberBetween(1, 12),
            'xp_reward' => fake()->numberBetween(20, 70),
        ];
    }
}
