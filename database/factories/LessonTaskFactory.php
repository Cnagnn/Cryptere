<?php

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\LessonTask;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LessonTask>
 */
class LessonTaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'lesson_id' => Lesson::factory(),
            'title' => fake()->sentence(3),
            'type' => fake()->randomElement(['video', 'read', 'quiz']),
            'video_url' => fake()->optional()->url(),
            'document_name' => null,
            'conversion_status' => null,
            'pdf_url' => null,
            'sort_order' => fake()->numberBetween(1, 20),
            'status' => 'published',
        ];
    }
}
