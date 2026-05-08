<?php

namespace Database\Factories;

use App\Models\LabVisit;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LabVisit>
 */
class LabVisitFactory extends Factory
{
    private const LAB_SLUGS = [
        'caesar-cipher-lab',
        'vigenere-cipher-lab',
        'aes-lab',
        'rsa-lab',
        'digital-signature-lab',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $firstVisited = fake()->dateTimeBetween('-30 days', 'now');

        return [
            'user_id' => User::factory(),
            'lab_slug' => fake()->randomElement(self::LAB_SLUGS),
            'visit_count' => fake()->numberBetween(1, 20),
            'first_visited_at' => $firstVisited,
            'last_visited_at' => fake()->dateTimeBetween($firstVisited, 'now'),
        ];
    }
}
