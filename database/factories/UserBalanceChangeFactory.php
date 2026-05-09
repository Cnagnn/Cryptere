<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserBalanceChange;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserBalanceChange>
 */
class UserBalanceChangeFactory extends Factory
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
            'xp_delta' => fake()->numberBetween(-50, 150),
            'points_delta' => fake()->numberBetween(-50, 150),
            'source' => fake()->randomElement([
                'opening_balance',
                'model_update',
                'course_completion',
                'challenge_session',
                'level_up',
            ]),
        ];
    }
}
