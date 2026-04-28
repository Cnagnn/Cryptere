<?php

namespace Database\Factories;

use App\Models\Discussion;
use App\Models\DiscussionReply;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiscussionReply>
 */
class DiscussionReplyFactory extends Factory
{
    protected $model = DiscussionReply::class;

    public function definition(): array
    {
        return [
            'discussion_id' => Discussion::factory(),
            'user_id' => User::factory(),
            'body' => fake()->paragraph(),
            'upvote_count' => 0,
        ];
    }
}
