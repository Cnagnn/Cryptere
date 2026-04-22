<?php

namespace Database\Factories;

use App\Models\Challenge;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Challenge>
 */
class ChallengeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $topics = [
            ['algorithm' => 'Caesar cipher', 'answer' => 'crypter'],
            ['algorithm' => 'Vigenere cipher', 'answer' => 'cipher'],
            ['algorithm' => 'SHA-256', 'answer' => 'hash'],
            ['algorithm' => 'digital signature', 'answer' => 'signature'],
            ['algorithm' => 'RSA key exchange', 'answer' => 'public key'],
        ];

        $topic = fake()->randomElement($topics);
        $title = ucfirst($topic['algorithm']).' Challenge';

        return [
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(10, 999),
            'title' => $title,
            'prompt' => sprintf('Submit the core keyword that best describes the security goal of %s.', $topic['algorithm']),
            'hint' => 'Think about the one-word cryptography concept introduced in the lesson.',
            'expected_answer' => $topic['answer'],
            'is_published' => true,
        ];
    }
}
