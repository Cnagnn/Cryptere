<?php

namespace Database\Seeders;

use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LessonTask;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class PointsHistorySeeder extends Seeder
{
    /**
     * Seed realistic 12-month points history for chart testing.
     *
     * Creates courses, lessons, challenges, then spreads
     * lesson_progress and challenge_submissions across the
     * last 12 months for the first non-admin user.
     */
    public function run(): void
    {
        $user = User::where('is_admin', false)->first() ?? User::first();

        if (! $user) {
            $this->command->error('No user found. Create a user first.');

            return;
        }

        $this->command->info("Seeding points history for: {$user->name} ({$user->email})");

        $courses = $this->ensureCourses();
        $challenges = $this->ensureChallenges();
        $this->seedEnrollments($user, $courses);
        $this->seedLessonProgress($user, $courses);
        $this->seedChallengeSubmissions($user, $challenges);
        $this->recalculateUserPoints($user);

        $this->command->info('🎉 Points history seeded across 12 months!');
    }

    /**
     * Ensure at least 15 courses with lessons exist.
     *
     * @return Collection<int, Course>
     */
    private function ensureCourses(): Collection
    {
        if (Course::count() >= 15) {
            $this->command->info('⏭ Courses already exist, reusing.');

            return Course::with('lessons')->limit(15)->get();
        }

        $this->command->info('Creating courses with lessons...');

        $topics = [
            'Symmetric Encryption Fundamentals',
            'Asymmetric Cryptography Deep Dive',
            'Hash Functions & Integrity',
            'Digital Signatures Workshop',
            'Network Security Essentials',
            'Blockchain Cryptography',
            'Zero Knowledge Proofs',
            'Elliptic Curve Cryptography',
            'Post-Quantum Cryptography',
            'Steganography Techniques',
            'SSL/TLS Protocol Analysis',
            'Key Management Systems',
            'Homomorphic Encryption',
            'Secure Multi-Party Computation',
            'Cryptographic Protocol Design',
        ];

        $courses = collect();
        foreach ($topics as $i => $title) {
            $course = Course::create([
                'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1000, 9999),
                'title' => $title,
                'summary' => fake()->paragraph(2),
                'estimated_minutes' => fake()->numberBetween(60, 180),
                'sort_order' => $i + 1,
                'is_published' => true,
                'category' => 'Cryptography',
                'difficulty' => fake()->randomElement(['beginner', 'intermediate', 'advanced']),
                'path_position' => $i + 1,
            ]);

            // 6-10 lessons per course with varying XP
            $lessonCount = fake()->numberBetween(6, 10);
            for ($l = 0; $l < $lessonCount; $l++) {
                $lesson = Lesson::create([
                    'course_id' => $course->id,
                    'slug' => Str::slug(fake()->sentence(3)).'-'.fake()->unique()->numberBetween(10000, 99999),
                    'title' => fake()->sentence(3),
                    'description' => fake()->paragraph(),
                    'content' => fake()->paragraphs(3, true),
                    'position' => $l + 1,
                ]);

                LessonTask::create([
                    'lesson_id' => $lesson->id,
                    'title' => fake()->sentence(2),
                    'description' => fake()->paragraph(),
                    'type' => 'read',
                    'minutes' => fake()->numberBetween(5, 20),
                    'sort_order' => 1,
                ]);
            }

            $courses->push($course);
        }

        $this->command->info('✓ '.count($topics).' courses created.');

        return Course::with('lessons')->whereIn('id', $courses->pluck('id'))->get();
    }

    /**
     * Ensure at least 5 challenges with questions exist.
     *
     * @return Collection<int, Challenge>
     */
    private function ensureChallenges(): Collection
    {
        if (Challenge::count() >= 5) {
            $this->command->info('⏭ Challenges already exist, reusing.');

            return Challenge::limit(5)->get();
        }

        $this->command->info('Creating 5 challenges...');

        $titles = [
            'Caesar Cipher Basics',
            'RSA Key Exchange',
            'AES Encryption Practice',
            'SHA-256 Hashing Quiz',
            'Diffie-Hellman Challenge',
        ];

        $challenges = collect();
        foreach ($titles as $title) {
            $challenge = Challenge::create([
                'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1000, 9999),
                'title' => $title,
                'prompt' => "Test your knowledge of {$title}.",
                'hint' => 'Review the related lesson materials.',
                'expected_answer' => strtolower(explode(' ', $title)[0]),
                'difficulty' => fake()->randomElement(['beginner', 'intermediate', 'advanced']),
                'is_published' => true,
                'time_limit_seconds' => fake()->randomElement([30, 60, 120]),
                'questions_per_session' => 5,
                'max_points_per_question' => 10,
            ]);

            // 5 questions per challenge
            for ($q = 0; $q < 5; $q++) {
                ChallengeQuestion::create([
                    'challenge_id' => $challenge->id,
                    'type' => ChallengeQuestion::TYPE_MCQ,
                    'question' => fake()->sentence().'?',
                    'options' => ['AES', 'RSA', 'SHA-256', 'DES'],
                    'correct_answer' => 'AES',
                    'explanation' => fake()->sentence(),
                    'sort_order' => $q + 1,
                ]);
            }

            $challenges->push($challenge);
        }

        $this->command->info('✓ 5 challenges created.');

        return $challenges;
    }

    /**
     * Enroll the user in all courses.
     */
    private function seedEnrollments(User $user, Collection $courses): void
    {
        Enrollment::where('user_id', $user->id)->delete();

        $rows = [];
        foreach ($courses as $course) {
            $rows[] = [
                'user_id' => $user->id,
                'course_id' => $course->id,
                'progress_percentage' => fake()->numberBetween(30, 100),
                'enrolled_at' => fake()->dateTimeBetween('-12 months', '-6 months'),
                'completed_at' => fake()->boolean(40) ? fake()->dateTimeBetween('-3 months', 'now') : null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        Enrollment::insert($rows);
        $this->command->info('✓ '.count($rows).' enrollments created.');
    }

    /**
     * Spread lesson completions across 12 months with a realistic curve.
     *
     * Creates an organic growth pattern: fewer completions in early months,
     * more in recent months, with some natural variation.
     */
    private function seedLessonProgress(User $user, Collection $courses): void
    {
        // Clean existing progress for this user to avoid duplicates
        LessonProgress::where('user_id', $user->id)->delete();

        $allLessons = $courses->flatMap->lessons;
        $lessonIds = $allLessons->pluck('id')->shuffle()->values();

        // Distribution: how many lessons completed per month (12 months ago → now)
        // Creates an organic growth curve with peaks and valleys for interesting XP chart data.
        // Total: ~120 lessons needed (we have 90-150 from 15 courses × 6-10 lessons)
        $monthlyDistribution = [4, 6, 8, 7, 10, 12, 9, 14, 11, 16, 13, 10];

        $this->command->info('Seeding lesson progress across 12 months...');

        $lessonIndex = 0;
        $rows = [];

        foreach ($monthlyDistribution as $monthOffset => $count) {
            $monthStart = now()->subMonths(11 - $monthOffset)->startOfMonth();
            $monthEnd = now()->subMonths(11 - $monthOffset)->endOfMonth();

            for ($i = 0; $i < $count && $lessonIndex < $lessonIds->count(); $i++) {
                $rows[] = [
                    'user_id' => $user->id,
                    'lesson_id' => $lessonIds[$lessonIndex],
                    'attempts' => fake()->numberBetween(1, 3),
                    'completed_at' => fake()->dateTimeBetween($monthStart, $monthEnd),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $lessonIndex++;
            }
        }

        LessonProgress::insert($rows);
        $this->command->info("✓ {$lessonIndex} lesson completions spread across 12 months.");
    }

    /**
     * Spread challenge submissions across 12 months.
     *
     * Creates 2-6 correct submissions per month with varying scores.
     */
    private function seedChallengeSubmissions(User $user, Collection $challenges): void
    {
        // Clean existing submissions for this user
        ChallengeSubmission::where('user_id', $user->id)->delete();

        $challengeIds = $challenges->pluck('id')->all();

        // Submissions per month: organic growth pattern — enough to guarantee points every month
        $monthlySubmissions = [5, 7, 6, 9, 8, 12, 10, 14, 12, 16, 14, 8];

        $this->command->info('Seeding challenge submissions across 12 months...');

        $rows = [];
        $totalSubmissions = 0;

        foreach ($monthlySubmissions as $monthOffset => $count) {
            $monthStart = now()->subMonths(11 - $monthOffset)->startOfMonth();
            $monthEnd = now()->subMonths(11 - $monthOffset)->endOfMonth();

            for ($i = 0; $i < $count; $i++) {
                $isCorrect = fake()->boolean(80); // 80% success rate
                $rows[] = [
                    'user_id' => $user->id,
                    'challenge_id' => fake()->randomElement($challengeIds),
                    'answer' => fake()->word(),
                    'is_correct' => $isCorrect,
                    'score' => $isCorrect ? fake()->numberBetween(80, 200) : 0,
                    'submitted_at' => fake()->dateTimeBetween($monthStart, $monthEnd),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $totalSubmissions++;
            }
        }

        ChallengeSubmission::insert($rows);
        $this->command->info("✓ {$totalSubmissions} challenge submissions spread across 12 months.");
    }

    /**
     * Recalculate user.points from actual lesson + challenge data.
     */
    private function recalculateUserPoints(User $user): void
    {
        $lessonXpPerLesson = (int) config('rewards.lesson_completion_xp', 30);
        $completedLessonCount = $user->lessonProgress()
            ->whereNotNull('completed_at')
            ->count();
        $lessonPoints = $completedLessonCount * $lessonXpPerLesson;

        $challengePoints = $user->challengeSubmissions()
            ->where('is_correct', true)
            ->sum('score');

        $total = (int) $lessonPoints + (int) $challengePoints;
        $xpTotal = (int) $lessonPoints; // XP comes from lessons only; challenge XP is flat per-challenge
        $user->forceFill(['points' => $total, 'xp' => $xpTotal])->save();

        $this->command->info("✓ User points recalculated: {$total} total ({$lessonPoints} lessons + {$challengePoints} challenges), XP: {$xpTotal}.");
    }
}
