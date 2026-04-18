<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LeaderboardUserSeeder extends Seeder
{
    private const LEADERBOARD_USER_TOTAL = 1000;

    /**
     * Seed leaderboard users.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'username' => 'testuser',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'points' => 240,
                'is_admin' => false,
                'role' => 'member',
                'status' => 'active',
            ]
        );

        $usersToCreate = max(self::LEADERBOARD_USER_TOTAL - User::query()->count(), 0);

        if ($usersToCreate > 0) {
            User::factory()
                ->count($usersToCreate)
                ->sequence(fn (): array => ['points' => fake()->numberBetween(75, 640)])
                ->create();
        }
    }
}
