<?php

namespace Database\Factories;

use App\Models\Discussion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Discussion>
 */
class DiscussionFactory extends Factory
{
    protected $model = Discussion::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'discussable_type' => 'lesson',
            'discussable_id' => 1,
            'title' => fake()->sentence(4),
            'body' => fake()->paragraphs(2, true),
            'is_pinned' => false,
            'upvote_count' => 0,
            'reply_count' => 0,
        ];
    }

    /**
     * Mark the discussion as pinned.
     */
    public function pinned(): static
    {
        return $this->state(fn () => ['is_pinned' => true]);
    }
}
