<?php

namespace Database\Factories;

use App\Models\Badge;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Badge>
 */
class BadgeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'slug' => fake()->unique()->slug(3),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'icon' => 'award',
            'category' => Badge::CATEGORY_MILESTONE,
            'tier' => Badge::TIER_BRONZE,
            'criteria_type' => 'points_earned',
            'criteria_value' => 100,
            'sort_order' => 0,
        ];
    }

    /**
     * Badge for course completion.
     */
    public function course(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => Badge::CATEGORY_COURSE,
            'criteria_type' => 'courses_completed',
        ]);
    }

    /**
     * Badge for streak milestones.
     */
    public function streak(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => Badge::CATEGORY_STREAK,
            'criteria_type' => 'streak_days',
        ]);
    }

    /**
     * Badge for lab visits.
     */
    public function lab(): static
    {
        return $this->state(fn (array $attributes) => [
            'category' => Badge::CATEGORY_LAB,
            'criteria_type' => 'labs_visited',
        ]);
    }

    /**
     * Set the tier to silver.
     */
    public function silver(): static
    {
        return $this->state(fn (array $attributes) => [
            'tier' => Badge::TIER_SILVER,
        ]);
    }

    /**
     * Set the tier to gold.
     */
    public function gold(): static
    {
        return $this->state(fn (array $attributes) => [
            'tier' => Badge::TIER_GOLD,
        ]);
    }

    /**
     * Set the tier to platinum.
     */
    public function platinum(): static
    {
        return $this->state(fn (array $attributes) => [
            'tier' => Badge::TIER_PLATINUM,
        ]);
    }
}
