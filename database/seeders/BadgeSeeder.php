<?php

namespace Database\Seeders;

use App\Models\Badge;
use App\Services\BadgeService;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $badges = [
            [
                'slug' => 'first-enrollment',
                'name' => 'Langkah Pertama',
                'description' => 'Mendaftar kursus pertama Anda',
                'icon' => 'zap',
                'category' => 'course',
                'tier' => 'bronze',
                'criteria_type' => 'first_enrollment',
                'criteria_value' => 1,
                'sort_order' => 1,
            ],
            [
                'slug' => 'first-course-completed',
                'name' => 'Lulusan Kursus',
                'description' => 'Menyelesaikan kursus pertama',
                'icon' => 'star',
                'category' => 'course',
                'tier' => 'bronze',
                'criteria_type' => 'courses_completed',
                'criteria_value' => 1,
                'sort_order' => 2,
            ],
            [
                'slug' => 'crypto-scholar',
                'name' => 'Sarjana Kriptografi',
                'description' => 'Menyelesaikan 3 kursus',
                'icon' => 'award',
                'category' => 'course',
                'tier' => 'silver',
                'criteria_type' => 'courses_completed',
                'criteria_value' => 3,
                'sort_order' => 3,
            ],
            [
                'slug' => 'active-learner',
                'name' => 'Pembelajar Aktif',
                'description' => 'Menyelesaikan 10 pelajaran',
                'icon' => 'book',
                'category' => 'milestone',
                'tier' => 'bronze',
                'criteria_type' => 'lessons_completed',
                'criteria_value' => 10,
                'sort_order' => 4,
            ],
            [
                'slug' => 'diligent-learner',
                'name' => 'Pembelajar Tekun',
                'description' => 'Menyelesaikan 25 pelajaran',
                'icon' => 'book',
                'category' => 'milestone',
                'tier' => 'silver',
                'criteria_type' => 'lessons_completed',
                'criteria_value' => 25,
                'sort_order' => 5,
            ],
            [
                'slug' => 'perfect-quiz',
                'name' => 'Sempurna',
                'description' => 'Mendapat skor 100% pada quiz pertama',
                'icon' => 'target',
                'category' => 'milestone',
                'tier' => 'silver',
                'criteria_type' => 'perfect_quiz',
                'criteria_value' => 1,
                'sort_order' => 6,
            ],
            [
                'slug' => 'consistent-7-days',
                'name' => 'Konsisten',
                'description' => 'Belajar 7 hari berturut-turut',
                'icon' => 'flame',
                'category' => 'streak',
                'tier' => 'bronze',
                'criteria_type' => 'streak_days',
                'criteria_value' => 7,
                'sort_order' => 7,
            ],
            [
                'slug' => 'consistent-30-days',
                'name' => 'Konsisten Tingkat Lanjut',
                'description' => 'Belajar 30 hari berturut-turut',
                'icon' => 'flame',
                'category' => 'streak',
                'tier' => 'gold',
                'criteria_type' => 'streak_days',
                'criteria_value' => 30,
                'sort_order' => 8,
            ],
            [
                'slug' => 'lab-explorer',
                'name' => 'Eksplorator Lab',
                'description' => 'Mengunjungi 3 lab',
                'icon' => 'award',
                'category' => 'lab',
                'tier' => 'bronze',
                'criteria_type' => 'labs_visited',
                'criteria_value' => 3,
                'sort_order' => 9,
            ],
            [
                'slug' => 'lab-master',
                'name' => 'Master Lab',
                'description' => 'Mengunjungi semua 6 lab',
                'icon' => 'trophy',
                'category' => 'lab',
                'tier' => 'gold',
                'criteria_type' => 'labs_visited',
                'criteria_value' => 6,
                'sort_order' => 10,
            ],
            [
                'slug' => 'point-hunter',
                'name' => 'Pemburu Poin',
                'description' => 'Mencapai 1000 poin',
                'icon' => 'trophy',
                'category' => 'milestone',
                'tier' => 'gold',
                'criteria_type' => 'points_earned',
                'criteria_value' => 1000,
                'sort_order' => 11,
            ],
        ];

        foreach ($badges as $badge) {
            Badge::firstOrCreate(
                ['slug' => $badge['slug']],
                $badge,
            );
        }

        BadgeService::clearCache();
    }
}
