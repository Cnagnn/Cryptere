<?php

namespace Database\Factories;

use App\Models\Bookmark;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Bookmark>
 */
class BookmarkFactory extends Factory
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
            'bookmarkable_type' => Course::class,
            'bookmarkable_id' => Course::factory(),
        ];
    }

    /**
     * Configure the bookmark for a course.
     */
    public function forCourse(?Course $course = null): static
    {
        return $this->state(fn (): array => [
            'bookmarkable_type' => Course::class,
            'bookmarkable_id' => $course?->id ?? Course::factory(),
        ]);
    }
}
