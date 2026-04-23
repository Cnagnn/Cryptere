<?php

namespace Database\Seeders;

use App\Models\Badge;
use App\Services\BadgeService;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    /**
     * Seed the badge definitions.
     */
    public function run(): void
    {
        $badges = [
            // Milestone badges
            [
                'slug' => 'first-enrollment',
                'name' => 'First Step',
                'description' => 'Enroll in your first course.',
                'icon' => 'rocket',
                'category' => Badge::CATEGORY_MILESTONE,
                'tier' => Badge::TIER_BRONZE,
                'criteria_type' => 'first_enrollment',
                'criteria_value' => 1,
                'sort_order' => 1,
            ],

            // Course completion badges
            [
                'slug' => 'course-complete-1',
                'name' => 'Course Graduate',
                'description' => 'Complete your first course.',
                'icon' => 'graduation-cap',
                'category' => Badge::CATEGORY_COURSE,
                'tier' => Badge::TIER_BRONZE,
                'criteria_type' => 'courses_completed',
                'criteria_value' => 1,
                'sort_order' => 10,
            ],
            [
                'slug' => 'course-complete-3',
                'name' => 'Knowledge Seeker',
                'description' => 'Complete 3 courses.',
                'icon' => 'graduation-cap',
                'category' => Badge::CATEGORY_COURSE,
                'tier' => Badge::TIER_SILVER,
                'criteria_type' => 'courses_completed',
                'criteria_value' => 3,
                'sort_order' => 11,
            ],
            [
                'slug' => 'course-complete-5',
                'name' => 'Crypto Scholar',
                'description' => 'Complete 5 courses.',
                'icon' => 'graduation-cap',
                'category' => Badge::CATEGORY_COURSE,
                'tier' => Badge::TIER_GOLD,
                'criteria_type' => 'courses_completed',
                'criteria_value' => 5,
                'sort_order' => 12,
            ],

            // Lesson completion badges
            [
                'slug' => 'lessons-5',
                'name' => 'Quick Learner',
                'description' => 'Complete 5 lessons.',
                'icon' => 'book-open',
                'category' => Badge::CATEGORY_COURSE,
                'tier' => Badge::TIER_BRONZE,
                'criteria_type' => 'lessons_completed',
                'criteria_value' => 5,
                'sort_order' => 20,
            ],
            [
                'slug' => 'lessons-15',
                'name' => 'Dedicated Student',
                'description' => 'Complete 15 lessons.',
                'icon' => 'book-open',
                'category' => Badge::CATEGORY_COURSE,
                'tier' => Badge::TIER_SILVER,
                'criteria_type' => 'lessons_completed',
                'criteria_value' => 15,
                'sort_order' => 21,
            ],
            [
                'slug' => 'lessons-30',
                'name' => 'Lesson Master',
                'description' => 'Complete 30 lessons.',
                'icon' => 'book-open',
                'category' => Badge::CATEGORY_COURSE,
                'tier' => Badge::TIER_GOLD,
                'criteria_type' => 'lessons_completed',
                'criteria_value' => 30,
                'sort_order' => 22,
            ],

            // Challenge badges
            [
                'slug' => 'challenge-1',
                'name' => 'Challenger',
                'description' => 'Solve your first challenge.',
                'icon' => 'swords',
                'category' => Badge::CATEGORY_CHALLENGE,
                'tier' => Badge::TIER_BRONZE,
                'criteria_type' => 'challenges_solved',
                'criteria_value' => 1,
                'sort_order' => 30,
            ],
            [
                'slug' => 'challenge-5',
                'name' => 'Problem Solver',
                'description' => 'Solve 5 challenges.',
                'icon' => 'swords',
                'category' => Badge::CATEGORY_CHALLENGE,
                'tier' => Badge::TIER_SILVER,
                'criteria_type' => 'challenges_solved',
                'criteria_value' => 5,
                'sort_order' => 31,
            ],
            [
                'slug' => 'challenge-10',
                'name' => 'Challenge Champion',
                'description' => 'Solve 10 challenges.',
                'icon' => 'swords',
                'category' => Badge::CATEGORY_CHALLENGE,
                'tier' => Badge::TIER_GOLD,
                'criteria_type' => 'challenges_solved',
                'criteria_value' => 10,
                'sort_order' => 32,
            ],
            [
                'slug' => 'challenge-20',
                'name' => 'Cryptanalyst',
                'description' => 'Solve 20 challenges.',
                'icon' => 'swords',
                'category' => Badge::CATEGORY_CHALLENGE,
                'tier' => Badge::TIER_PLATINUM,
                'criteria_type' => 'challenges_solved',
                'criteria_value' => 20,
                'sort_order' => 33,
            ],

            // Special challenge badges
            [
                'slug' => 'perfect-quiz',
                'name' => 'Perfect Score',
                'description' => 'Get 100% on a quiz session with 3+ questions.',
                'icon' => 'check-circle',
                'category' => Badge::CATEGORY_SPECIAL,
                'tier' => Badge::TIER_GOLD,
                'criteria_type' => 'perfect_quiz',
                'criteria_value' => 1,
                'sort_order' => 40,
            ],
            [
                'slug' => 'speed-demon',
                'name' => 'Speed Demon',
                'description' => 'Answer a challenge correctly in under 5 seconds.',
                'icon' => 'zap',
                'category' => Badge::CATEGORY_SPECIAL,
                'tier' => Badge::TIER_GOLD,
                'criteria_type' => 'speed_demon',
                'criteria_value' => 1,
                'sort_order' => 41,
            ],

            // Streak badges
            [
                'slug' => 'streak-3',
                'name' => 'Getting Started',
                'description' => 'Maintain a 3-day learning streak.',
                'icon' => 'flame',
                'category' => Badge::CATEGORY_STREAK,
                'tier' => Badge::TIER_BRONZE,
                'criteria_type' => 'streak_days',
                'criteria_value' => 3,
                'sort_order' => 50,
            ],
            [
                'slug' => 'streak-7',
                'name' => 'Week Warrior',
                'description' => 'Maintain a 7-day learning streak.',
                'icon' => 'flame',
                'category' => Badge::CATEGORY_STREAK,
                'tier' => Badge::TIER_SILVER,
                'criteria_type' => 'streak_days',
                'criteria_value' => 7,
                'sort_order' => 51,
            ],
            [
                'slug' => 'streak-14',
                'name' => 'Fortnight Focus',
                'description' => 'Maintain a 14-day learning streak.',
                'icon' => 'flame',
                'category' => Badge::CATEGORY_STREAK,
                'tier' => Badge::TIER_GOLD,
                'criteria_type' => 'streak_days',
                'criteria_value' => 14,
                'sort_order' => 52,
            ],
            [
                'slug' => 'streak-30',
                'name' => 'Unstoppable',
                'description' => 'Maintain a 30-day learning streak.',
                'icon' => 'flame',
                'category' => Badge::CATEGORY_STREAK,
                'tier' => Badge::TIER_PLATINUM,
                'criteria_type' => 'streak_days',
                'criteria_value' => 30,
                'sort_order' => 53,
            ],

            // Lab badges
            [
                'slug' => 'lab-explorer-1',
                'name' => 'Lab Explorer',
                'description' => 'Visit your first interactive lab.',
                'icon' => 'flask-conical',
                'category' => Badge::CATEGORY_LAB,
                'tier' => Badge::TIER_BRONZE,
                'criteria_type' => 'labs_visited',
                'criteria_value' => 1,
                'sort_order' => 60,
            ],
            [
                'slug' => 'lab-explorer-3',
                'name' => 'Lab Enthusiast',
                'description' => 'Visit 3 different interactive labs.',
                'icon' => 'flask-conical',
                'category' => Badge::CATEGORY_LAB,
                'tier' => Badge::TIER_SILVER,
                'criteria_type' => 'labs_visited',
                'criteria_value' => 3,
                'sort_order' => 61,
            ],
            [
                'slug' => 'lab-explorer-6',
                'name' => 'Lab Master',
                'description' => 'Visit all 6 interactive labs.',
                'icon' => 'flask-conical',
                'category' => Badge::CATEGORY_LAB,
                'tier' => Badge::TIER_GOLD,
                'criteria_type' => 'labs_visited',
                'criteria_value' => 6,
                'sort_order' => 62,
            ],

            // Points badges
            [
                'slug' => 'points-500',
                'name' => 'Point Collector',
                'description' => 'Earn 500 XP points.',
                'icon' => 'star',
                'category' => Badge::CATEGORY_MILESTONE,
                'tier' => Badge::TIER_BRONZE,
                'criteria_type' => 'points_earned',
                'criteria_value' => 500,
                'sort_order' => 70,
            ],
            [
                'slug' => 'points-2000',
                'name' => 'XP Hunter',
                'description' => 'Earn 2,000 XP points.',
                'icon' => 'star',
                'category' => Badge::CATEGORY_MILESTONE,
                'tier' => Badge::TIER_SILVER,
                'criteria_type' => 'points_earned',
                'criteria_value' => 2000,
                'sort_order' => 71,
            ],
            [
                'slug' => 'points-5000',
                'name' => 'XP Legend',
                'description' => 'Earn 5,000 XP points.',
                'icon' => 'star',
                'category' => Badge::CATEGORY_MILESTONE,
                'tier' => Badge::TIER_GOLD,
                'criteria_type' => 'points_earned',
                'criteria_value' => 5000,
                'sort_order' => 72,
            ],
            [
                'slug' => 'points-10000',
                'name' => 'XP Grandmaster',
                'description' => 'Earn 10,000 XP points.',
                'icon' => 'star',
                'category' => Badge::CATEGORY_MILESTONE,
                'tier' => Badge::TIER_PLATINUM,
                'criteria_type' => 'points_earned',
                'criteria_value' => 10000,
                'sort_order' => 73,
            ],
        ];

        foreach ($badges as $badge) {
            Badge::query()->updateOrCreate(
                ['slug' => $badge['slug']],
                $badge,
            );
        }

        BadgeService::clearCache();
    }
}
