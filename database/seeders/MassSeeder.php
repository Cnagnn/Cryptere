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
use App\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class MassSeeder extends Seeder
{
    private const TARGET_USERS = 1000;

    private const TARGET_COURSES = 200;

    private const TARGET_CHALLENGES = 300;

    /**
     * Seed thousands of users, hundreds of courses & challenges
     * WITHOUT deleting existing data. Resumable — skips phases
     * that already have enough records.
     */
    public function run(): void
    {
        $users = $this->seedUsers();
        $courses = $this->seedCourses();
        $challenges = $this->seedChallenges();
        $this->seedEnrollmentsAndProgress($users, $courses, $challenges);

        $this->command->info('🎉 Mass seeding complete!');
    }

    private function seedUsers(): Collection
    {
        $existing = User::where('role', 'member')->where('is_admin', false)->count();

        if ($existing >= self::TARGET_USERS) {
            $this->command->info("⏭ Skipping users ({$existing} already exist).");

            return User::where('role', 'member')->where('is_admin', false)
                ->inRandomOrder()->limit(self::TARGET_USERS)->get();
        }

        $needed = self::TARGET_USERS - $existing;
        $this->command->info("Creating {$needed} users...");
        $newUsers = User::factory()
            ->count($needed)
            ->create([
                'points' => fn () => fake()->numberBetween(0, 5000),
                'xp' => fn () => fake()->numberBetween(0, 500),
                'current_streak' => fn () => fake()->numberBetween(0, 30),
                'longest_streak' => fn () => fake()->numberBetween(0, 60),
                'last_active_date' => fn () => fake()->dateTimeBetween('-30 days', 'now'),
            ]);
        $this->command->info("✓ {$needed} users created.");

        return User::where('role', 'member')->where('is_admin', false)
            ->inRandomOrder()->limit(self::TARGET_USERS)->get();
    }

    private function seedCourses(): Collection
    {
        $existing = Course::count();

        if ($existing >= self::TARGET_COURSES) {
            $this->command->info("⏭ Skipping courses ({$existing} already exist).");

            return Course::inRandomOrder()->limit(self::TARGET_COURSES)->get();
        }

        $needed = self::TARGET_COURSES - $existing;
        $this->command->info("Creating {$needed} courses with lessons & tasks...");
        $difficulties = ['beginner', 'intermediate', 'advanced'];
        $categories = ['Cryptography', 'Network Security', 'Web Security', 'Blockchain', 'Forensics', 'Malware Analysis', 'Reverse Engineering', 'OSINT'];

        $newCourses = collect();
        for ($i = 0; $i < $needed; $i++) {
            $title = fake()->unique()->catchPhrase().' '.fake()->randomElement(['Fundamentals', 'Masterclass', 'Deep Dive', 'Workshop', 'Bootcamp']);
            $course = Course::create([
                'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1000, 9999),
                'title' => $title,
                'summary' => fake()->paragraph(3),
                'estimated_minutes' => fake()->numberBetween(30, 240),
                'sort_order' => $existing + $i + 100,
                'is_published' => fake()->boolean(90),
                'category' => fake()->randomElement($categories),
                'difficulty' => fake()->randomElement($difficulties),
                'path_position' => $existing + $i + 1,
            ]);

            // 3-8 lessons per course
            $lessonCount = fake()->numberBetween(3, 8);
            for ($l = 0; $l < $lessonCount; $l++) {
                $lesson = Lesson::create([
                    'course_id' => $course->id,
                    'slug' => Str::slug(fake()->sentence(3)).'-'.fake()->unique()->numberBetween(10000, 99999),
                    'title' => fake()->sentence(3),
                    'description' => fake()->paragraph(),
                    'content' => fake()->paragraphs(5, true),
                    'position' => $l + 1,
                ]);

                // 1-3 tasks per lesson
                $taskCount = fake()->numberBetween(1, 3);
                for ($t = 0; $t < $taskCount; $t++) {
                    $taskType = fake()->randomElement(['video', 'read', 'quiz']);
                    $task = LessonTask::create([
                        'lesson_id' => $lesson->id,
                        'title' => fake()->sentence(2),
                        'description' => fake()->paragraph(),
                        'type' => $taskType,
                        'minutes' => fake()->numberBetween(5, 30),
                        'sort_order' => $t + 1,
                    ]);

                    // Quiz tasks get 3-5 questions
                    if ($taskType === 'quiz') {
                        $qCount = fake()->numberBetween(3, 5);
                        for ($q = 0; $q < $qCount; $q++) {
                            QuizQuestion::create([
                                'lesson_task_id' => $task->id,
                                'question' => fake()->sentence().'?',
                                'options' => fake()->shuffleArray(['AES', 'RSA', 'SHA-256', 'DES']),
                                'correct_option' => fake()->numberBetween(0, 3),
                                'explanation' => fake()->sentence(),
                                'sort_order' => $q + 1,
                            ]);
                        }
                    }
                }
            }

            $newCourses->push($course);

            if (($i + 1) % 50 === 0) {
                $this->command->info('  → '.($i + 1).' courses created...');
            }
        }
        $this->command->info("✓ {$needed} courses created.");

        return Course::inRandomOrder()->limit(self::TARGET_COURSES)->get();
    }

    private function seedChallenges(): Collection
    {
        $existing = Challenge::count();

        if ($existing >= self::TARGET_CHALLENGES) {
            $this->command->info("⏭ Skipping challenges ({$existing} already exist).");

            return Challenge::inRandomOrder()->limit(self::TARGET_CHALLENGES)->get();
        }

        $needed = self::TARGET_CHALLENGES - $existing;
        $this->command->info("Creating {$needed} challenges with questions...");
        $challengeTopics = [
            'Caesar Cipher', 'Vigenere Cipher', 'RSA Encryption', 'AES Encryption',
            'SHA Hashing', 'Digital Signatures', 'Public Key Infrastructure', 'Diffie-Hellman',
            'Elliptic Curve', 'Block Cipher Modes', 'Stream Ciphers', 'Hash Functions',
            'Key Exchange', 'Zero Knowledge Proofs', 'Homomorphic Encryption',
            'Quantum Cryptography', 'Steganography', 'SSL/TLS', 'X.509 Certificates',
            'HMAC', 'PBKDF2', 'Bcrypt', 'Argon2', 'ChaCha20', 'Poly1305',
        ];

        $newChallenges = collect();
        for ($i = 0; $i < $needed; $i++) {
            $topic = fake()->randomElement($challengeTopics);
            $suffix = fake()->randomElement(['Basics', 'Advanced', 'Challenge', 'Quiz', 'Practice', 'Lab']);
            $title = "{$topic} {$suffix}";

            $challenge = Challenge::create([
                'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1000, 9999),
                'title' => $title,
                'prompt' => "Test your knowledge of {$topic}.",
                'hint' => "Review the {$topic} lesson materials.",
                'expected_answer' => strtolower(explode(' ', $topic)[0]),
                'difficulty' => fake()->randomElement(['beginner', 'intermediate', 'advanced']),
                'is_published' => fake()->boolean(90),
                'time_limit_seconds' => fake()->randomElement([20, 30, 60, 120, 300, 600]),
                'questions_per_session' => fake()->randomElement([5, 10, 15]),
                'max_points_per_question' => fake()->randomElement([5, 10, 20]),
            ]);

            // 5-10 questions per challenge
            $qCount = fake()->numberBetween(5, 10);
            $types = [ChallengeQuestion::TYPE_MCQ, ChallengeQuestion::TYPE_TRUE_FALSE, ChallengeQuestion::TYPE_TEXT];
            for ($q = 0; $q < $qCount; $q++) {
                $type = fake()->randomElement($types);
                ChallengeQuestion::create([
                    'challenge_id' => $challenge->id,
                    'type' => $type,
                    'question' => fake()->sentence().'?',
                    'options' => $type === ChallengeQuestion::TYPE_MCQ
                        ? fake()->shuffleArray(['AES', 'RSA', 'SHA-256', 'DES'])
                        : ($type === ChallengeQuestion::TYPE_TRUE_FALSE ? ['True', 'False'] : null),
                    'correct_answer' => $type === ChallengeQuestion::TYPE_TRUE_FALSE
                        ? fake()->randomElement(['True', 'False'])
                        : fake()->word(),
                    'explanation' => fake()->sentence(),
                    'sort_order' => $q + 1,
                ]);
            }

            $newChallenges->push($challenge);

            if (($i + 1) % 100 === 0) {
                $this->command->info('  → '.($i + 1).' challenges created...');
            }
        }
        $this->command->info("✓ {$needed} challenges created.");

        return Challenge::inRandomOrder()->limit(self::TARGET_CHALLENGES)->get();
    }

    private function seedEnrollmentsAndProgress(
        Collection $users,
        Collection $courses,
        Collection $challenges,
    ): void {
        $existingEnrollments = Enrollment::count();

        if ($existingEnrollments >= self::TARGET_USERS * 2) {
            $this->command->info("⏭ Skipping enrollments ({$existingEnrollments} already exist).");

            return;
        }

        $this->command->info('Creating enrollments & progress...');
        $courseIds = $courses->pluck('id')->all();
        $challengeIds = $challenges->pluck('id')->all();

        // Pre-load course → lesson IDs mapping to avoid N+1
        $courseLessons = [];
        $allLessons = Lesson::whereIn('course_id', $courseIds)->get(['id', 'course_id']);
        foreach ($allLessons as $lesson) {
            $courseLessons[$lesson->course_id][] = $lesson->id;
        }

        $enrollmentRows = [];
        $lessonProgressRows = [];
        $submissionRows = [];

        // Only process users that don't have enrollments yet
        $usersWithEnrollments = Enrollment::distinct()->pluck('user_id')->toArray();
        $usersToProcess = $users->reject(fn ($u) => in_array($u->id, $usersWithEnrollments));
        $this->command->info('  Processing '.$usersToProcess->count().' users without enrollments...');

        foreach ($usersToProcess->values() as $index => $user) {
            // Each user enrolls in 2-8 random courses
            $enrollCount = fake()->numberBetween(2, min(8, count($courseIds)));
            $enrollCourseIds = fake()->randomElements($courseIds, $enrollCount);

            foreach ($enrollCourseIds as $courseId) {
                $isCompleted = fake()->boolean(20);
                $enrollmentRows[] = [
                    'user_id' => $user->id,
                    'course_id' => $courseId,
                    'progress_percentage' => $isCompleted ? 100 : fake()->numberBetween(5, 95),
                    'enrolled_at' => fake()->dateTimeBetween('-6 months', '-1 day'),
                    'completed_at' => $isCompleted ? fake()->dateTimeBetween('-3 months', 'now') : null,
                ];

                // Lesson progress from pre-loaded map
                $lessonIds = $courseLessons[$courseId] ?? [];
                if (count($lessonIds) > 0) {
                    $pickCount = min(fake()->numberBetween(1, 3), count($lessonIds));
                    $pickedLessons = fake()->randomElements($lessonIds, $pickCount);
                    foreach ($pickedLessons as $lessonId) {
                        $lessonProgressRows[] = [
                            'user_id' => $user->id,
                            'lesson_id' => $lessonId,
                            'attempts' => fake()->numberBetween(1, 4),
                            'completed_at' => fake()->boolean(70) ? fake()->dateTimeBetween('-3 months', 'now') : null,
                        ];
                    }
                }
            }

            // Challenge submissions (1-5 random challenges)
            $attemptCount = fake()->numberBetween(1, min(5, count($challengeIds)));
            $attemptChallengeIds = fake()->randomElements($challengeIds, $attemptCount);
            foreach ($attemptChallengeIds as $challengeId) {
                $isCorrect = fake()->boolean(50);
                $submissionRows[] = [
                    'user_id' => $user->id,
                    'challenge_id' => $challengeId,
                    'answer' => fake()->word(),
                    'is_correct' => $isCorrect,
                    'score' => $isCorrect ? fake()->numberBetween(50, 120) : 0,
                    'submitted_at' => fake()->dateTimeBetween('-3 months', 'now'),
                ];
            }

            if (($index + 1) % 200 === 0) {
                $this->command->info('  → '.($index + 1).' users processed...');
            }
        }

        // Bulk insert in chunks
        $this->command->info('  Inserting '.count($enrollmentRows).' enrollments...');
        foreach (array_chunk($enrollmentRows, 500) as $chunk) {
            Enrollment::insert($chunk);
        }

        $this->command->info('  Inserting '.count($lessonProgressRows).' lesson progress records...');
        foreach (array_chunk($lessonProgressRows, 500) as $chunk) {
            LessonProgress::insert($chunk);
        }

        $this->command->info('  Inserting '.count($submissionRows).' challenge submissions...');
        foreach (array_chunk($submissionRows, 500) as $chunk) {
            ChallengeSubmission::insert($chunk);
        }

        $this->command->info('✓ Enrollments & progress created.');
    }
}
