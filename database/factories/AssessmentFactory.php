<?php

namespace Database\Factories;

use App\Models\Assessment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Assessment>
 */
class AssessmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $bloomLevel = fake()->randomElement(Assessment::BLOOM_LEVELS);
        $title = $this->titleForBloom($bloomLevel);

        return [
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(10, 999),
            'title' => $title,
            'description' => fake()->paragraph(),
            'bloom_level' => $bloomLevel,
            'grading_type' => $this->gradingTypeForBloom($bloomLevel),
            'passing_score' => 70,
            'max_attempts' => 3,
            'time_limit_minutes' => fake()->randomElement([null, 30, 60, 90]),
            'is_published' => true,
            'sort_order' => fake()->numberBetween(1, 100),
        ];
    }

    public function bloomLevel(string $level): static
    {
        return $this->state(fn () => [
            'bloom_level' => $level,
            'grading_type' => $this->gradingTypeForBloom($level),
        ]);
    }

    public function published(): static
    {
        return $this->state(fn () => ['is_published' => true]);
    }

    public function unpublished(): static
    {
        return $this->state(fn () => ['is_published' => false]);
    }

    private function titleForBloom(string $level): string
    {
        $topics = ['AES', 'RSA', 'Vigenere', 'SHA-256', 'DES', 'Digital Signatures'];
        $topic = fake()->randomElement($topics);

        return match ($level) {
            'C1' => "{$topic} — Recall & Recognition",
            'C2' => "{$topic} — Concept Explanation",
            'C3' => "{$topic} — Practical Application",
            'C4' => "{$topic} — Security Analysis",
            'C5' => "{$topic} — Critical Evaluation",
            'C6' => "{$topic} — Protocol Design",
            default => "{$topic} Assessment",
        };
    }

    private function gradingTypeForBloom(string $level): string
    {
        return match ($level) {
            'C1', 'C3' => 'auto',
            'C2' => 'mixed',
            default => 'manual',
        };
    }
}
