<?php

namespace Database\Seeders;

use App\Models\Challenge;
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
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    private const ADMIN_EMAIL = 'admin@example.com';

    private const LEARNER_EMAIL = 'test@example.com';

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->seedAdminAccount();
        $this->call(LeaderboardUserSeeder::class);

        /** @var User $learner */
        $learner = User::query()->where('email', self::LEARNER_EMAIL)->firstOrFail();

        $courses = $this->seedCoursesAndLessons();
        $challenges = $this->seedChallenges();

        $this->seedLearnerActivity($learner, $courses, $challenges);
    }

    private function seedAdminAccount(): void
    {
        User::query()->updateOrCreate(
            ['email' => self::ADMIN_EMAIL],
            [
                'name' => 'Admin User',
                'username' => 'admin',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'points' => 150,
                'is_admin' => true,
                'role' => 'admin',
                'status' => 'active',
            ],
        );
    }

    /**
     * @return Collection<int, Course>
     */
    private function seedCoursesAndLessons(): Collection
    {
        $courseBlueprints = [
            [
                'slug' => 'crypto-foundations',
                'title' => 'Crypto Foundations',
                'summary' => 'Build intuition for confidentiality, integrity, and practical threat modeling.',
                'difficulty' => 'beginner',
                'estimated_minutes' => 110,
                'sort_order' => 1,
                'lessons' => [
                    [
                        'slug' => 'why-cryptography-matters',
                        'title' => 'Why Cryptography Matters',
                        'content' => 'Understand why modern systems need cryptography to preserve trust and data safety.',
                        'xp_reward' => 25,
                        'tasks' => [
                            [
                                'title' => 'Video: Why Data Needs Protection',
                                'type' => 'video',
                                'minutes' => 12,
                                'video_url' => 'https://youtu.be/GSIDS_lvRv4',
                            ],
                            [
                                'title' => 'Quiz: Security Goals',
                                'type' => 'quiz',
                                'minutes' => 6,
                                'quiz_questions' => [
                                    [
                                        'question' => 'Which goal prevents unauthorized disclosure of information?',
                                        'options' => ['Availability', 'Confidentiality', 'Performance', 'Compression'],
                                        'correct_option' => 1,
                                        'explanation' => 'Confidentiality ensures information is only accessible to authorized parties.',
                                    ],
                                    [
                                        'question' => 'Which goal protects data from unauthorized modification?',
                                        'options' => ['Integrity', 'Obfuscation', 'Throughput', 'Redundancy'],
                                        'correct_option' => 0,
                                        'explanation' => 'Integrity protects the correctness and consistency of data.',
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'slug' => 'confidentiality-vs-integrity',
                        'title' => 'Confidentiality vs Integrity',
                        'content' => 'Compare confidentiality and integrity requirements across different product scenarios.',
                        'xp_reward' => 35,
                        'tasks' => [
                            [
                                'title' => 'Reading: CIA Triad Quick Notes',
                                'type' => 'read',
                                'minutes' => 8,
                                'document_name' => 'cia-triad-quick-notes.pdf',
                                'conversion_status' => 'done',
                                'pdf_url' => null,
                            ],
                            [
                                'title' => 'Quiz: Match the Right Goal',
                                'type' => 'quiz',
                                'minutes' => 7,
                                'quiz_questions' => [
                                    [
                                        'question' => 'Tamper detection on messages is primarily about which goal?',
                                        'options' => ['Integrity', 'Confidentiality', 'Availability', 'Latency'],
                                        'correct_option' => 0,
                                        'explanation' => 'Tamper detection verifies the message content was not altered.',
                                    ],
                                    [
                                        'question' => 'Encrypting database backups mainly protects which goal?',
                                        'options' => ['Throughput', 'Confidentiality', 'Usability', 'Observability'],
                                        'correct_option' => 1,
                                        'explanation' => 'Encryption protects backup contents from unauthorized access.',
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'slug' => 'threat-modeling-basics',
                        'title' => 'Threat Modeling Basics',
                        'content' => 'Identify assets, attackers, and boundaries before deciding defensive controls.',
                        'xp_reward' => 45,
                        'tasks' => [
                            [
                                'title' => 'Video: Build a Basic Threat Model',
                                'type' => 'video',
                                'minutes' => 11,
                                'video_url' => 'https://youtu.be/2g2fV5G9R4w',
                            ],
                            [
                                'title' => 'Quiz: Threat Model Essentials',
                                'type' => 'quiz',
                                'minutes' => 7,
                                'quiz_questions' => [
                                    [
                                        'question' => 'What should be identified first in a threat model?',
                                        'options' => ['Assets to protect', 'Framework choice', 'Dashboard metrics', 'Deployment region'],
                                        'correct_option' => 0,
                                        'explanation' => 'Threat models begin by identifying important assets and trust boundaries.',
                                    ],
                                    [
                                        'question' => 'Which item helps prioritize remediation?',
                                        'options' => ['Threat likelihood and impact', 'Code style', 'Number of commits', 'UI color scheme'],
                                        'correct_option' => 0,
                                        'explanation' => 'Likelihood and impact guide risk-based prioritization.',
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'applied-classical-ciphers',
                'title' => 'Applied Classical Ciphers',
                'summary' => 'Practice Caesar and Vigenere ciphers through decoding drills and key discovery.',
                'difficulty' => 'beginner',
                'estimated_minutes' => 95,
                'sort_order' => 2,
                'lessons' => [
                    [
                        'slug' => 'caesar-cipher-warmup',
                        'title' => 'Caesar Cipher Warmup',
                        'content' => 'Learn substitution mechanics and apply fixed shifts to decode simple strings.',
                        'xp_reward' => 25,
                        'tasks' => [
                            [
                                'title' => 'Video: Caesar Cipher in Practice',
                                'type' => 'video',
                                'minutes' => 10,
                                'video_url' => 'https://youtu.be/sMOZf4GN3oc',
                            ],
                            [
                                'title' => 'Quiz: Caesar Cipher Basics',
                                'type' => 'quiz',
                                'minutes' => 6,
                                'quiz_questions' => [
                                    [
                                        'question' => 'A Caesar cipher with shift 3 transforms A into what letter?',
                                        'options' => ['B', 'C', 'D', 'E'],
                                        'correct_option' => 2,
                                        'explanation' => 'Shift 3 moves A to D.',
                                    ],
                                    [
                                        'question' => 'Which attack often breaks monoalphabetic substitution quickly?',
                                        'options' => ['Frequency analysis', 'SQL injection', 'Replay attack', 'Race condition'],
                                        'correct_option' => 0,
                                        'explanation' => 'Frequency analysis exploits language distribution patterns.',
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'slug' => 'frequency-analysis-essentials',
                        'title' => 'Frequency Analysis Essentials',
                        'content' => 'Use letter and digram distributions to infer likely plaintext candidates.',
                        'xp_reward' => 35,
                        'tasks' => [
                            [
                                'title' => 'Reading: Frequency Analysis Worksheet',
                                'type' => 'read',
                                'minutes' => 9,
                                'document_name' => 'frequency-analysis-worksheet.pdf',
                                'conversion_status' => 'done',
                                'pdf_url' => null,
                            ],
                            [
                                'title' => 'Quiz: Spot the Pattern',
                                'type' => 'quiz',
                                'minutes' => 7,
                                'quiz_questions' => [
                                    [
                                        'question' => 'In English, which letter is usually most frequent?',
                                        'options' => ['E', 'Q', 'Z', 'J'],
                                        'correct_option' => 0,
                                        'explanation' => 'E is one of the most common letters in English corpora.',
                                    ],
                                    [
                                        'question' => 'Why are repeated trigrams useful during cracking?',
                                        'options' => ['They reveal language patterns', 'They reduce key length to one', 'They hide noise', 'They bypass encryption'],
                                        'correct_option' => 0,
                                        'explanation' => 'Repeated trigrams can expose likely plaintext and key alignment clues.',
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'slug' => 'vigenere-with-repeating-keys',
                        'title' => 'Vigenere with Repeating Keys',
                        'content' => 'Apply repeated-key substitution and estimate key length using practical heuristics.',
                        'xp_reward' => 45,
                        'tasks' => [
                            [
                                'title' => 'Video: Vigenere Key Length Estimation',
                                'type' => 'video',
                                'minutes' => 12,
                                'video_url' => 'https://youtu.be/LaWp_Kq0cKs',
                            ],
                            [
                                'title' => 'Quiz: Vigenere Concepts',
                                'type' => 'quiz',
                                'minutes' => 8,
                                'quiz_questions' => [
                                    [
                                        'question' => 'Vigenere belongs to which cipher family?',
                                        'options' => ['Polyalphabetic', 'Transposition', 'Stream hardware', 'One-time hash'],
                                        'correct_option' => 0,
                                        'explanation' => 'Vigenere applies multiple alphabets and is a polyalphabetic cipher.',
                                    ],
                                    [
                                        'question' => 'Which technique helps estimate Vigenere key length?',
                                        'options' => ['Kasiski examination', 'Binary search', 'Bloom filter', 'Round-robin'],
                                        'correct_option' => 0,
                                        'explanation' => 'Kasiski examination and index of coincidence are commonly used.',
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'modern-crypto-principles',
                'title' => 'Modern Crypto Principles',
                'summary' => 'Explore hashing, signatures, and key exchange in modern application security.',
                'difficulty' => 'intermediate',
                'estimated_minutes' => 140,
                'sort_order' => 3,
                'lessons' => [
                    [
                        'slug' => 'hash-functions-and-digest-properties',
                        'title' => 'Hash Functions and Digest Properties',
                        'content' => 'Understand one-way digests and why collision resistance matters in practice.',
                        'xp_reward' => 30,
                        'tasks' => [
                            [
                                'title' => 'Video: Hash Properties Explained',
                                'type' => 'video',
                                'minutes' => 12,
                                'video_url' => 'https://youtu.be/b4b8ktEV4Bg',
                            ],
                            [
                                'title' => 'Quiz: Hash Function Fundamentals',
                                'type' => 'quiz',
                                'minutes' => 7,
                                'quiz_questions' => [
                                    [
                                        'question' => 'Which property means it should be hard to find two inputs with same hash?',
                                        'options' => ['Collision resistance', 'Compression', 'Symmetry', 'Idempotency'],
                                        'correct_option' => 0,
                                        'explanation' => 'Collision resistance prevents practical duplicate digest discovery.',
                                    ],
                                    [
                                        'question' => 'Password storage should use what approach?',
                                        'options' => ['Salted password hashing', 'Plain text logs', 'Encrypted ZIP', 'Session cache'],
                                        'correct_option' => 0,
                                        'explanation' => 'Salted and slow hashing protects stored credentials.',
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'slug' => 'digital-signature-flow',
                        'title' => 'Digital Signature Flow',
                        'content' => 'Learn how signatures provide integrity and authenticity using public-key cryptography.',
                        'xp_reward' => 40,
                        'tasks' => [
                            [
                                'title' => 'Reading: Signature Verification Checklist',
                                'type' => 'read',
                                'minutes' => 9,
                                'document_name' => 'signature-verification-checklist.pdf',
                                'conversion_status' => 'done',
                                'pdf_url' => null,
                            ],
                            [
                                'title' => 'Quiz: Signature Workflow',
                                'type' => 'quiz',
                                'minutes' => 8,
                                'quiz_questions' => [
                                    [
                                        'question' => 'Which key is used to verify a digital signature?',
                                        'options' => ['Public key', 'Private key', 'Session key', 'Root password'],
                                        'correct_option' => 0,
                                        'explanation' => 'Signatures are verified using the signer\'s public key.',
                                    ],
                                    [
                                        'question' => 'Digital signatures primarily provide which guarantees?',
                                        'options' => ['Integrity and authenticity', 'Compression and caching', 'Availability and replication', 'Sharding and routing'],
                                        'correct_option' => 0,
                                        'explanation' => 'Signatures prove message origin and detect tampering.',
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'slug' => 'symmetric-vs-asymmetric-encryption',
                        'title' => 'Symmetric vs Asymmetric Encryption',
                        'content' => 'Compare performance, key exchange complexity, and common hybrid encryption patterns.',
                        'xp_reward' => 50,
                        'tasks' => [
                            [
                                'title' => 'Video: Hybrid Encryption in Real Systems',
                                'type' => 'video',
                                'minutes' => 13,
                                'video_url' => 'https://youtu.be/GSIDS_lvRv4',
                            ],
                            [
                                'title' => 'Quiz: Encryption Strategy',
                                'type' => 'quiz',
                                'minutes' => 8,
                                'quiz_questions' => [
                                    [
                                        'question' => 'Why is asymmetric crypto often paired with symmetric crypto?',
                                        'options' => ['To combine secure key exchange and speed', 'To avoid all key management', 'To remove certificate needs', 'To reduce entropy requirements'],
                                        'correct_option' => 0,
                                        'explanation' => 'Asymmetric key exchange plus symmetric data encryption is efficient and secure.',
                                    ],
                                    [
                                        'question' => 'Which encryption type is generally faster for bulk data?',
                                        'options' => ['Symmetric', 'Asymmetric', 'Hashing', 'Encoding'],
                                        'correct_option' => 0,
                                        'explanation' => 'Symmetric algorithms are optimized for high-throughput encryption.',
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        return collect($courseBlueprints)
            ->map(function (array $courseBlueprint): Course {
                $course = Course::query()->updateOrCreate(
                    ['slug' => $courseBlueprint['slug']],
                    [
                        'title' => $courseBlueprint['title'],
                        'summary' => $courseBlueprint['summary'],
                        'difficulty' => $courseBlueprint['difficulty'],
                        'estimated_minutes' => $courseBlueprint['estimated_minutes'],
                        'sort_order' => $courseBlueprint['sort_order'],
                        'is_published' => true,
                    ],
                );

                $expectedLessonSlugs = collect($courseBlueprint['lessons'])->pluck('slug')->all();

                Lesson::query()
                    ->where('course_id', $course->id)
                    ->whereNotIn('slug', $expectedLessonSlugs)
                    ->delete();

                collect($courseBlueprint['lessons'])
                    ->values()
                    ->each(function (array $lessonBlueprint, int $lessonIndex) use ($course): void {
                        $lesson = Lesson::query()->updateOrCreate(
                            [
                                'course_id' => $course->id,
                                'slug' => $lessonBlueprint['slug'],
                            ],
                            [
                                'title' => $lessonBlueprint['title'],
                                'content' => $lessonBlueprint['content'],
                                'position' => $lessonIndex + 1,
                                'xp_reward' => $lessonBlueprint['xp_reward'],
                            ],
                        );

                        $expectedTaskOrders = range(1, count($lessonBlueprint['tasks']));

                        LessonTask::query()
                            ->where('lesson_id', $lesson->id)
                            ->whereNotIn('sort_order', $expectedTaskOrders)
                            ->delete();

                        collect($lessonBlueprint['tasks'])
                            ->values()
                            ->each(function (array $taskBlueprint, int $taskIndex) use ($lesson): void {
                                $taskType = (string) $taskBlueprint['type'];

                                $task = LessonTask::query()->updateOrCreate(
                                    [
                                        'lesson_id' => $lesson->id,
                                        'sort_order' => $taskIndex + 1,
                                    ],
                                    [
                                        'title' => (string) $taskBlueprint['title'],
                                        'type' => $taskType,
                                        'minutes' => (int) $taskBlueprint['minutes'],
                                        'video_url' => $taskType === 'video' ? ($taskBlueprint['video_url'] ?? null) : null,
                                        'document_name' => $taskType === 'read' ? ($taskBlueprint['document_name'] ?? null) : null,
                                        'conversion_status' => $taskType === 'read' ? ($taskBlueprint['conversion_status'] ?? null) : null,
                                        'pdf_url' => $taskType === 'read' ? ($taskBlueprint['pdf_url'] ?? null) : null,
                                    ],
                                );

                                $task->quizQuestions()->delete();

                                if ($taskType !== 'quiz') {
                                    return;
                                }

                                collect($taskBlueprint['quiz_questions'] ?? [])
                                    ->values()
                                    ->each(function (array $questionBlueprint, int $questionIndex) use ($task): void {
                                        QuizQuestion::query()->create([
                                            'lesson_task_id' => $task->id,
                                            'question' => (string) $questionBlueprint['question'],
                                            'options' => $questionBlueprint['options'],
                                            'correct_option' => (int) $questionBlueprint['correct_option'],
                                            'explanation' => $questionBlueprint['explanation'] ?? null,
                                            'sort_order' => $questionIndex + 1,
                                        ]);
                                    });
                            });
                    });

                return $course;
            })
            ->values();
    }

    /**
     * @return Collection<int, Challenge>
     */
    private function seedChallenges(): Collection
    {
        $challengeBlueprints = [
            [
                'slug' => 'caesar-warmup',
                'title' => 'Caesar Warmup',
                'prompt' => 'Decrypt this Caesar cipher (shift 3): FUBSWHU',
                'hint' => 'Shift each letter three steps backward.',
                'difficulty' => 'beginner',
                'expected_answer' => 'crypter',
                'points_reward' => 60,
                'is_published' => true,
                'time_start' => now()->subDays(10),
                'time_end' => now()->addDays(20),
            ],
            [
                'slug' => 'vigenere-key-detective',
                'title' => 'Vigenere Key Detective',
                'prompt' => 'Submit the algorithm keyword: polyalphabetic',
                'hint' => 'Vigenere belongs to this cipher family.',
                'difficulty' => 'beginner',
                'expected_answer' => 'polyalphabetic',
                'points_reward' => 75,
                'is_published' => true,
                'time_start' => now()->subDays(7),
                'time_end' => now()->addDays(14),
            ],
            [
                'slug' => 'sha256-quick-check',
                'title' => 'SHA-256 Quick Check',
                'prompt' => 'Type the one-word property: collision resistance',
                'hint' => 'It should be hard to find two messages with the same hash.',
                'difficulty' => 'intermediate',
                'expected_answer' => 'collision resistance',
                'points_reward' => 90,
                'is_published' => true,
                'time_start' => now()->subDays(5),
                'time_end' => now()->addDays(30),
            ],
            [
                'slug' => 'rsa-padding-alert',
                'title' => 'RSA Padding Alert',
                'prompt' => 'Name the recommended RSA padding scheme for encryption.',
                'hint' => 'Modern applications avoid PKCS#1 v1.5 for new designs.',
                'difficulty' => 'advanced',
                'expected_answer' => 'oaep',
                'points_reward' => 110,
                'is_published' => false,
                'time_start' => now()->addDays(2),
                'time_end' => now()->addDays(45),
            ],
        ];

        return collect($challengeBlueprints)
            ->map(fn (array $challengeBlueprint): Challenge => Challenge::query()->updateOrCreate(
                ['slug' => $challengeBlueprint['slug']],
                [
                    'title' => $challengeBlueprint['title'],
                    'prompt' => $challengeBlueprint['prompt'],
                    'hint' => $challengeBlueprint['hint'],
                    'difficulty' => $challengeBlueprint['difficulty'],
                    'expected_answer' => $challengeBlueprint['expected_answer'],
                    'points_reward' => $challengeBlueprint['points_reward'],
                    'is_published' => $challengeBlueprint['is_published'],
                    'time_start' => $challengeBlueprint['time_start'],
                    'time_end' => $challengeBlueprint['time_end'],
                ],
            ))
            ->values();
    }

    /**
     * @param  Collection<int, Course>  $courses
     * @param  Collection<int, Challenge>  $challenges
     */
    private function seedLearnerActivity(User $learner, Collection $courses, Collection $challenges): void
    {
        $learner->forceFill([
            'name' => 'Test User',
            'username' => 'testuser',
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'points' => 240,
            'is_admin' => false,
            'role' => 'member',
            'status' => 'active',
        ])->save();

        $foundationCourse = $courses->firstWhere('slug', 'crypto-foundations');
        $classicalCourse = $courses->firstWhere('slug', 'applied-classical-ciphers');

        if ($foundationCourse instanceof Course) {
            Enrollment::query()->updateOrCreate(
                [
                    'user_id' => $learner->id,
                    'course_id' => $foundationCourse->id,
                ],
                [
                    'progress_percentage' => 67,
                    'enrolled_at' => now()->subDays(6),
                    'completed_at' => null,
                ],
            );

            $foundationLessons = $foundationCourse->lessons()->orderBy('position')->get();

            $foundationLessons->take(2)->each(function (Lesson $lesson) use ($learner): void {
                LessonProgress::query()->updateOrCreate(
                    [
                        'user_id' => $learner->id,
                        'lesson_id' => $lesson->id,
                    ],
                    [
                        'attempts' => 1,
                        'completed_at' => now()->subDays(4),
                    ],
                );
            });

            $ongoingLesson = $foundationLessons->slice(2, 1)->first();

            if ($ongoingLesson instanceof Lesson) {
                LessonProgress::query()->updateOrCreate(
                    [
                        'user_id' => $learner->id,
                        'lesson_id' => $ongoingLesson->id,
                    ],
                    [
                        'attempts' => 2,
                        'completed_at' => null,
                    ],
                );
            }
        }

        if ($classicalCourse instanceof Course) {
            Enrollment::query()->updateOrCreate(
                [
                    'user_id' => $learner->id,
                    'course_id' => $classicalCourse->id,
                ],
                [
                    'progress_percentage' => 34,
                    'enrolled_at' => now()->subDays(3),
                    'completed_at' => null,
                ],
            );
        }

        ChallengeSubmission::query()
            ->where('user_id', $learner->id)
            ->delete();

        $caesarChallenge = $challenges->firstWhere('slug', 'caesar-warmup');
        $vigenereChallenge = $challenges->firstWhere('slug', 'vigenere-key-detective');
        $hashChallenge = $challenges->firstWhere('slug', 'sha256-quick-check');

        if ($caesarChallenge instanceof Challenge) {
            ChallengeSubmission::query()->create([
                'user_id' => $learner->id,
                'challenge_id' => $caesarChallenge->id,
                'answer' => 'crypter',
                'is_correct' => true,
                'score' => $caesarChallenge->points_reward,
                'submitted_at' => now()->subDays(2),
            ]);
        }

        if ($vigenereChallenge instanceof Challenge) {
            ChallengeSubmission::query()->create([
                'user_id' => $learner->id,
                'challenge_id' => $vigenereChallenge->id,
                'answer' => 'monoalphabetic',
                'is_correct' => false,
                'score' => 0,
                'submitted_at' => now()->subDay(),
            ]);
        }

        if ($hashChallenge instanceof Challenge) {
            ChallengeSubmission::query()->create([
                'user_id' => $learner->id,
                'challenge_id' => $hashChallenge->id,
                'answer' => 'collision resistance',
                'is_correct' => true,
                'score' => $hashChallenge->points_reward,
                'submitted_at' => now()->subHours(6),
            ]);
        }
    }
}
