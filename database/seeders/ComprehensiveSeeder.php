<?php

namespace Database\Seeders;

use App\Models\Badge;
use App\Models\Bookmark;
use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LabVisit;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LessonTask;
use App\Models\Note;
use App\Models\QuizQuestion;
use App\Models\User;
use App\Services\BadgeService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ComprehensiveSeeder extends Seeder
{
    private const ADMIN_EMAIL = 'admin@example.com';

    private const LEARNER_EMAIL = 'test@example.com';

    private const MEMBER_COUNT = 30;

    /**
     * Seed a complete, realistic dataset covering every table.
     *
     * Tables seeded:
     *  - users (admin + learner + members with streaks)
     *  - courses (learning path with prerequisites, categories, difficulties)
     *  - lessons (with descriptions, varied XP)
     *  - lesson_tasks (video/read/quiz with published_at)
     *  - quiz_questions (per quiz task)
     *  - challenges (published + unpublished + daily, with time windows)
     *  - challenge_questions (mcq/true_false/text/fill_blank)
     *  - enrollments (varied progress, some completed)
     *  - lesson_progress (12-month distribution for chart data)
     *  - challenge_submissions (12-month distribution, session-based)
     *  - badges (via BadgeSeeder)
     *  - user_badges (earned badges based on real progress)
     *  - lab_visits (interactive lab tracking)
     *  - bookmarks (polymorphic on courses + lessons)
     *  - notes (user notes on lessons)
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting comprehensive seed...');

        // ── 1. Badges (delegate to existing seeder) ──
        $this->call(BadgeSeeder::class);

        // ── 2. Users ──
        $admin = $this->seedAdmin();
        $learner = $this->seedLearner();
        $members = $this->seedMembers();
        $allUsers = $members->prepend($learner);

        // ── 3. Courses with learning path ──
        $courses = $this->seedCourses();

        // ── 4. Challenges ──
        $challenges = $this->seedChallenges();

        // ── 5. Enrollments ──
        $this->seedEnrollments($learner, $members, $courses);

        // ── 6. Lesson progress (12-month spread for learner) ──
        $this->seedLessonProgress($learner, $courses);
        $this->seedMemberLessonProgress($members, $courses);

        // ── 7. Challenge submissions (12-month spread for learner) ──
        $this->seedChallengeSubmissions($learner, $challenges);
        $this->seedMemberChallengeSubmissions($members, $challenges);

        // ── 8. Lab visits ──
        $this->seedLabVisits($learner, $members);

        // ── 9. Bookmarks ──
        $this->seedBookmarks($learner, $members, $courses);

        // ── 10. Notes ──
        $this->seedNotes($learner, $members, $courses);

        // ── 11. Recalculate points ──
        $this->recalculatePoints($allUsers);
        $admin->forceFill(['points' => 500, 'xp' => 50])->save();

        // ── 12. Award badges based on real progress ──
        $this->awardBadges($allUsers);

        $this->command->info('🎉 Comprehensive seed complete!');
    }

    // ─────────────────────────────────────────────────────────
    //  Users
    // ─────────────────────────────────────────────────────────

    private function seedAdmin(): User
    {
        $this->command->info('Seeding admin...');

        return User::query()->updateOrCreate(
            ['email' => self::ADMIN_EMAIL],
            [
                'name' => 'Admin User',
                'username' => 'admin',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'points' => 350,
                'xp' => 35,
                'is_admin' => true,
                'role' => 'admin',
                'status' => 'active',
                'current_streak' => 12,
                'longest_streak' => 45,
                'last_active_date' => now()->toDateString(),
            ],
        );
    }

    private function seedLearner(): User
    {
        $this->command->info('Seeding learner...');

        return User::query()->updateOrCreate(
            ['email' => self::LEARNER_EMAIL],
            [
                'name' => 'Test User',
                'username' => 'testuser',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'points' => 0,
                'xp' => 0,
                'is_admin' => false,
                'role' => 'member',
                'status' => 'active',
                'current_streak' => 7,
                'longest_streak' => 21,
                'last_active_date' => now()->toDateString(),
            ],
        );
    }

    /**
     * @return Collection<int, User>
     */
    private function seedMembers(): Collection
    {
        $existing = User::query()
            ->where('role', 'member')
            ->whereNot('email', self::LEARNER_EMAIL)
            ->limit(self::MEMBER_COUNT)
            ->get();

        $remaining = max(self::MEMBER_COUNT - $existing->count(), 0);

        if ($remaining <= 0) {
            $this->command->info("⏭ Members already exist ({$existing->count()}).");

            return $existing;
        }

        $this->command->info("Creating {$remaining} members...");

        $created = User::factory()
            ->count($remaining)
            ->sequence(fn (): array => [
                'points' => fake()->numberBetween(40, 2000),
                'xp' => fake()->numberBetween(4, 200),
                'current_streak' => fake()->numberBetween(0, 14),
                'longest_streak' => fake()->numberBetween(0, 30),
                'last_active_date' => fake()->dateTimeBetween('-7 days', 'now'),
            ])
            ->create(['role' => 'member', 'is_admin' => false, 'status' => 'active']);

        return $existing->concat($created);
    }

    // ─────────────────────────────────────────────────────────
    //  Courses (learning path with prerequisites)
    // ─────────────────────────────────────────────────────────

    /**
     * @return Collection<int, Course>
     */
    private function seedCourses(): Collection
    {
        $this->command->info('Seeding courses with learning path...');

        $blueprints = [
            // ── Path 1: Classical Cryptography (beginner → intermediate) ──
            [
                'slug' => 'crypto-foundations',
                'title' => 'Crypto Foundations',
                'summary' => 'Build intuition for confidentiality, integrity, and practical threat modeling.',
                'estimated_minutes' => 110,
                'sort_order' => 1,
                'category' => 'Classical Cryptography',
                'difficulty' => 'beginner',
                'path_position' => 1,
                'prerequisite_slug' => null,
                'lessons' => [
                    ['slug' => 'why-cryptography-matters', 'title' => 'Why Cryptography Matters', 'description' => 'Understand why data protection is essential in the digital age.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: Why Data Needs Protection', 'minutes' => 12, 'video_url' => 'https://youtu.be/GSIDS_lvRv4'],
                        ['type' => 'quiz', 'title' => 'Quiz: Security Goals', 'minutes' => 8, 'questions' => [
                            ['question' => 'Which of the following is NOT part of the CIA triad?', 'options' => ['Confidentiality', 'Integrity', 'Authentication', 'Availability'], 'correct_option' => 2, 'explanation' => 'The CIA triad consists of Confidentiality, Integrity, and Availability.'],
                            ['question' => 'What does encryption primarily protect?', 'options' => ['Availability', 'Confidentiality', 'Integrity', 'Non-repudiation'], 'correct_option' => 1, 'explanation' => 'Encryption ensures data confidentiality by making it unreadable without the key.'],
                        ]],
                    ]],
                    ['slug' => 'confidentiality-vs-integrity', 'title' => 'Confidentiality vs Integrity', 'description' => 'Learn the difference between keeping data secret and keeping it accurate.', 'tasks' => [
                        ['type' => 'read', 'title' => 'Reading: CIA Triad Notes', 'minutes' => 7, 'document_name' => 'cia-triad-notes.pdf', 'conversion_status' => 'done'],
                        ['type' => 'quiz', 'title' => 'Quiz: CIA Triad', 'minutes' => 5, 'questions' => [
                            ['question' => 'Integrity ensures data has not been...', 'options' => ['Encrypted', 'Tampered with', 'Compressed', 'Backed up'], 'correct_option' => 1, 'explanation' => 'Integrity means data has not been altered or tampered with.'],
                        ]],
                    ]],
                    ['slug' => 'threat-modeling-basics', 'title' => 'Threat Modeling Basics', 'description' => 'Identify and categorize potential security threats.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: Basic Threat Model', 'minutes' => 10, 'video_url' => 'https://youtu.be/2g2fV5G9R4w'],
                        ['type' => 'read', 'title' => 'Reading: STRIDE Framework', 'minutes' => 8],
                    ]],
                ],
            ],
            [
                'slug' => 'applied-classical-ciphers',
                'title' => 'Applied Classical Ciphers',
                'summary' => 'Practice Caesar and Vigenere ciphers through decoding drills and key discovery.',
                'estimated_minutes' => 95,
                'sort_order' => 2,
                'category' => 'Classical Cryptography',
                'difficulty' => 'beginner',
                'path_position' => 2,
                'prerequisite_slug' => 'crypto-foundations',
                'lessons' => [
                    ['slug' => 'caesar-cipher-warmup', 'title' => 'Caesar Cipher Warmup', 'description' => 'Learn the simplest substitution cipher and its weaknesses.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: Caesar Cipher in Practice', 'minutes' => 10, 'video_url' => 'https://youtu.be/sMOZf4GN3oc'],
                        ['type' => 'quiz', 'title' => 'Quiz: Caesar Basics', 'minutes' => 6, 'questions' => [
                            ['question' => 'How many possible shifts does a Caesar cipher have?', 'options' => ['24', '25', '26', '52'], 'correct_option' => 1, 'explanation' => 'There are 25 non-trivial shifts (shift 0 is identity).'],
                            ['question' => 'What attack easily breaks a Caesar cipher?', 'options' => ['Brute force', 'Man-in-the-middle', 'SQL injection', 'Buffer overflow'], 'correct_option' => 0, 'explanation' => 'With only 25 possible keys, brute force is trivial.'],
                        ]],
                    ]],
                    ['slug' => 'vigenere-with-repeating-keys', 'title' => 'Vigenere with Repeating Keys', 'description' => 'Explore polyalphabetic substitution and key length estimation.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: Key Length Estimation', 'minutes' => 12, 'video_url' => 'https://youtu.be/LaWp_Kq0cKs'],
                        ['type' => 'read', 'title' => 'Reading: Kasiski Examination', 'minutes' => 10],
                    ]],
                    ['slug' => 'frequency-analysis', 'title' => 'Frequency Analysis', 'description' => 'Use letter frequency to crack monoalphabetic ciphers.', 'tasks' => [
                        ['type' => 'read', 'title' => 'Reading: English Letter Frequencies', 'minutes' => 8],
                        ['type' => 'quiz', 'title' => 'Quiz: Frequency Analysis', 'minutes' => 7, 'questions' => [
                            ['question' => 'What is the most common letter in English?', 'options' => ['T', 'A', 'E', 'S'], 'correct_option' => 2, 'explanation' => 'E is the most frequently used letter in English.'],
                        ]],
                    ]],
                ],
            ],

            // ── Path 2: Modern Cryptography (intermediate → advanced) ──
            [
                'slug' => 'modern-crypto-principles',
                'title' => 'Modern Crypto Principles',
                'summary' => 'Explore hashing, signatures, and key exchange in modern application security.',
                'estimated_minutes' => 140,
                'sort_order' => 3,
                'category' => 'Modern Cryptography',
                'difficulty' => 'intermediate',
                'path_position' => 3,
                'prerequisite_slug' => 'applied-classical-ciphers',
                'lessons' => [
                    ['slug' => 'hash-functions-and-digest-properties', 'title' => 'Hash Functions and Digest Properties', 'description' => 'Understand one-way functions, collision resistance, and the avalanche effect.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: Hash Properties Explained', 'minutes' => 12, 'video_url' => 'https://youtu.be/b4b8ktEV4Bg'],
                        ['type' => 'quiz', 'title' => 'Quiz: Hash Properties', 'minutes' => 8, 'questions' => [
                            ['question' => 'What is the output size of SHA-256?', 'options' => ['128 bits', '160 bits', '256 bits', '512 bits'], 'correct_option' => 2, 'explanation' => 'SHA-256 produces a 256-bit digest.'],
                            ['question' => 'Which property means finding two inputs with the same hash is hard?', 'options' => ['Preimage resistance', 'Collision resistance', 'Avalanche effect', 'Key derivation'], 'correct_option' => 1, 'explanation' => 'Collision resistance prevents finding two inputs with the same hash.'],
                        ]],
                    ]],
                    ['slug' => 'symmetric-vs-asymmetric-encryption', 'title' => 'Symmetric vs Asymmetric Encryption', 'description' => 'Compare AES and RSA, and learn when to use each.', 'tasks' => [
                        ['type' => 'quiz', 'title' => 'Quiz: Encryption Strategy', 'minutes' => 9, 'questions' => [
                            ['question' => 'Which algorithm is symmetric?', 'options' => ['RSA', 'AES', 'ECC', 'DSA'], 'correct_option' => 1, 'explanation' => 'AES is a symmetric encryption algorithm.'],
                            ['question' => 'Asymmetric encryption uses how many keys?', 'options' => ['1', '2', '3', '4'], 'correct_option' => 1, 'explanation' => 'Asymmetric encryption uses a public and private key pair.'],
                        ]],
                    ]],
                    ['slug' => 'digital-signatures-intro', 'title' => 'Digital Signatures Introduction', 'description' => 'Learn how digital signatures provide authentication and non-repudiation.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: How Digital Signatures Work', 'minutes' => 14],
                        ['type' => 'read', 'title' => 'Reading: RSA vs ECDSA Signatures', 'minutes' => 10],
                    ]],
                ],
            ],
            [
                'slug' => 'blockchain-cryptography',
                'title' => 'Blockchain Cryptography',
                'summary' => 'Understand the cryptographic building blocks behind blockchain technology.',
                'estimated_minutes' => 160,
                'sort_order' => 4,
                'category' => 'Modern Cryptography',
                'difficulty' => 'intermediate',
                'path_position' => 4,
                'prerequisite_slug' => 'modern-crypto-principles',
                'lessons' => [
                    ['slug' => 'merkle-trees', 'title' => 'Merkle Trees', 'description' => 'Learn how hash trees verify data integrity in distributed systems.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: Merkle Trees Explained', 'minutes' => 11],
                        ['type' => 'quiz', 'title' => 'Quiz: Merkle Trees', 'minutes' => 7, 'questions' => [
                            ['question' => 'What is the root of a Merkle tree?', 'options' => ['A leaf hash', 'The combined hash of all data', 'A random nonce', 'The block header'], 'correct_option' => 1, 'explanation' => 'The Merkle root is the hash that summarizes all transactions.'],
                        ]],
                    ]],
                    ['slug' => 'proof-of-work', 'title' => 'Proof of Work', 'description' => 'Understand the mining puzzle and its role in consensus.', 'tasks' => [
                        ['type' => 'read', 'title' => 'Reading: PoW vs PoS', 'minutes' => 12],
                        ['type' => 'video', 'title' => 'Video: Mining a Block', 'minutes' => 15],
                    ]],
                    ['slug' => 'elliptic-curve-basics', 'title' => 'Elliptic Curve Basics', 'description' => 'Introduction to ECC and its use in Bitcoin and Ethereum.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: ECC for Beginners', 'minutes' => 16],
                        ['type' => 'quiz', 'title' => 'Quiz: ECC Fundamentals', 'minutes' => 8, 'questions' => [
                            ['question' => 'Which curve does Bitcoin use?', 'options' => ['secp256k1', 'Curve25519', 'P-256', 'Ed25519'], 'correct_option' => 0, 'explanation' => 'Bitcoin uses the secp256k1 elliptic curve.'],
                            ['question' => 'ECC provides equivalent security to RSA with...', 'options' => ['Larger keys', 'Smaller keys', 'Same size keys', 'No keys'], 'correct_option' => 1, 'explanation' => 'ECC achieves equivalent security with much smaller key sizes.'],
                        ]],
                    ]],
                ],
            ],

            // ── Path 3: Applied Security (advanced) ──
            [
                'slug' => 'network-security-essentials',
                'title' => 'Network Security Essentials',
                'summary' => 'Master TLS, certificate chains, and secure communication protocols.',
                'estimated_minutes' => 180,
                'sort_order' => 5,
                'category' => 'Applied Security',
                'difficulty' => 'advanced',
                'path_position' => 5,
                'prerequisite_slug' => 'blockchain-cryptography',
                'lessons' => [
                    ['slug' => 'tls-handshake', 'title' => 'TLS Handshake Deep Dive', 'description' => 'Step through the TLS 1.3 handshake process.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: TLS 1.3 Handshake', 'minutes' => 18],
                        ['type' => 'read', 'title' => 'Reading: Certificate Chains', 'minutes' => 12],
                    ]],
                    ['slug' => 'certificate-authorities', 'title' => 'Certificate Authorities', 'description' => 'How CAs issue, revoke, and manage digital certificates.', 'tasks' => [
                        ['type' => 'read', 'title' => 'Reading: X.509 Certificates', 'minutes' => 10],
                        ['type' => 'quiz', 'title' => 'Quiz: PKI & CAs', 'minutes' => 8, 'questions' => [
                            ['question' => 'What does a CA sign?', 'options' => ['Private keys', 'Certificates', 'Passwords', 'Tokens'], 'correct_option' => 1, 'explanation' => 'A Certificate Authority signs digital certificates.'],
                            ['question' => 'What is a CRL?', 'options' => ['Certificate Revocation List', 'Crypto Resource Library', 'Central Root Ledger', 'Cipher Rotation Log'], 'correct_option' => 0, 'explanation' => 'CRL is a list of revoked certificates published by the CA.'],
                        ]],
                    ]],
                    ['slug' => 'zero-knowledge-proofs', 'title' => 'Zero Knowledge Proofs', 'description' => 'Prove knowledge without revealing the secret itself.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: ZKP Explained Simply', 'minutes' => 20],
                        ['type' => 'quiz', 'title' => 'Quiz: ZKP Concepts', 'minutes' => 10, 'questions' => [
                            ['question' => 'In a ZKP, the prover reveals...', 'options' => ['The secret', 'Nothing about the secret', 'Half the secret', 'An encrypted secret'], 'correct_option' => 1, 'explanation' => 'Zero knowledge means the verifier learns nothing beyond the validity of the statement.'],
                        ]],
                    ]],
                ],
            ],
        ];

        $courseMap = [];

        $courses = collect($blueprints)->map(function (array $bp) use (&$courseMap): Course {
            $prerequisiteId = null;
            if ($bp['prerequisite_slug'] && isset($courseMap[$bp['prerequisite_slug']])) {
                $prerequisiteId = $courseMap[$bp['prerequisite_slug']];
            }

            $course = Course::query()->updateOrCreate(
                ['slug' => $bp['slug']],
                [
                    'title' => $bp['title'],
                    'summary' => $bp['summary'],
                    'estimated_minutes' => $bp['estimated_minutes'],
                    'sort_order' => $bp['sort_order'],
                    'is_published' => true,
                    'category' => $bp['category'],
                    'difficulty' => $bp['difficulty'],
                    'path_position' => $bp['path_position'],
                    'prerequisite_course_id' => $prerequisiteId,
                ],
            );

            $courseMap[$bp['slug']] = $course->id;

            foreach ($bp['lessons'] as $li => $lessonBp) {
                $lesson = Lesson::query()->updateOrCreate(
                    ['course_id' => $course->id, 'slug' => $lessonBp['slug']],
                    [
                        'title' => $lessonBp['title'],
                        'description' => $lessonBp['description'] ?? null,
                        'content' => ($lessonBp['description'] ?? $lessonBp['title']).' — detailed lesson content.',
                        'position' => $li + 1,
                    ],
                );

                foreach ($lessonBp['tasks'] as $ti => $taskBp) {
                    $task = LessonTask::query()->updateOrCreate(
                        ['lesson_id' => $lesson->id, 'sort_order' => $ti + 1],
                        [
                            'title' => $taskBp['title'],
                            'type' => $taskBp['type'],
                            'minutes' => $taskBp['minutes'],
                            'video_url' => $taskBp['video_url'] ?? null,
                            'document_name' => $taskBp['document_name'] ?? null,
                            'conversion_status' => $taskBp['conversion_status'] ?? null,
                            'published_at' => now()->subDays(fake()->numberBetween(1, 30)),
                        ],
                    );

                    if ($taskBp['type'] === 'quiz' && ! empty($taskBp['questions'])) {
                        QuizQuestion::query()->where('lesson_task_id', $task->id)->delete();

                        foreach ($taskBp['questions'] as $qi => $q) {
                            QuizQuestion::query()->create([
                                'lesson_task_id' => $task->id,
                                'question' => $q['question'],
                                'options' => $q['options'],
                                'correct_option' => $q['correct_option'],
                                'explanation' => $q['explanation'],
                                'sort_order' => $qi + 1,
                            ]);
                        }
                    }
                }
            }

            return $course;
        })->values();

        $this->command->info('✓ '.count($blueprints).' courses with learning path created.');

        return $courses;
    }

    // ─────────────────────────────────────────────────────────
    //  Challenges
    // ─────────────────────────────────────────────────────────

    /**
     * @return Collection<int, Challenge>
     */
    private function seedChallenges(): Collection
    {
        $this->command->info('Seeding challenges...');

        $blueprints = [
            [
                'slug' => 'caesar-warmup',
                'title' => 'Caesar Warmup',
                'prompt' => 'Test your knowledge of the Caesar cipher — shifts, decryption, and history.',
                'hint' => 'Shift each letter three steps backward.',
                'expected_answer' => 'crypter',
                'difficulty' => 'beginner',
                'is_published' => true,
                'is_daily' => false,
                'time_start' => now()->subDays(5),
                'time_end' => now()->addDays(20),
                'time_limit_seconds' => 15,
                'questions_per_session' => 5,
                'max_points_per_question' => 10,
                'questions' => [
                    ['type' => 'mcq', 'question' => 'What is the Caesar cipher shift for FUBSWHU → CRYPTER?', 'options' => ['1', '2', '3', '4'], 'correct_answer' => '3', 'explanation' => 'Each letter is shifted 3 positions backward.'],
                    ['type' => 'true_false', 'question' => 'The Caesar cipher is a substitution cipher.', 'correct_answer' => 'True', 'explanation' => 'It substitutes each letter with another letter a fixed number of positions away.'],
                    ['type' => 'mcq', 'question' => 'How many possible shifts does a Caesar cipher have (English)?', 'options' => ['24', '25', '26', '52'], 'correct_answer' => '25', 'explanation' => 'There are 25 non-trivial shifts.'],
                    ['type' => 'fill_blank', 'question' => 'Caesar cipher is also known as a _____ cipher.', 'correct_answer' => 'shift', 'explanation' => 'It shifts each letter by a fixed amount.'],
                    ['type' => 'mcq', 'question' => 'Which Roman leader famously used the Caesar cipher?', 'options' => ['Augustus', 'Julius Caesar', 'Nero', 'Marcus Aurelius'], 'correct_answer' => 'Julius Caesar', 'explanation' => 'Julius Caesar used it to communicate with his generals.'],
                    ['type' => 'true_false', 'question' => 'A Caesar cipher with shift 13 is called ROT13.', 'correct_answer' => 'True', 'explanation' => 'ROT13 is a special case of Caesar cipher with shift 13.'],
                    ['type' => 'text', 'question' => 'Decrypt "KHOOR" with shift 3.', 'correct_answer' => 'HELLO', 'explanation' => 'K→H, H→E, O→L, O→L, R→O = HELLO.'],
                    ['type' => 'mcq', 'question' => 'What attack easily breaks a Caesar cipher?', 'options' => ['Brute force', 'Man-in-the-middle', 'SQL injection', 'Buffer overflow'], 'correct_answer' => 'Brute force', 'explanation' => 'With only 25 possible keys, brute force is trivial.'],
                ],
            ],
            [
                'slug' => 'vigenere-key-detective',
                'title' => 'Vigenere Key Detective',
                'prompt' => 'How well do you know the Vigenere cipher and polyalphabetic encryption?',
                'hint' => 'Vigenere belongs to the polyalphabetic cipher family.',
                'expected_answer' => 'polyalphabetic',
                'difficulty' => 'intermediate',
                'is_published' => true,
                'is_daily' => false,
                'time_start' => now()->subDays(4),
                'time_end' => now()->addDays(15),
                'time_limit_seconds' => 20,
                'questions_per_session' => 5,
                'max_points_per_question' => 10,
                'questions' => [
                    ['type' => 'mcq', 'question' => 'The Vigenere cipher is classified as which type?', 'options' => ['Monoalphabetic', 'Polyalphabetic', 'Transposition', 'Stream'], 'correct_answer' => 'Polyalphabetic', 'explanation' => 'It uses multiple substitution alphabets.'],
                    ['type' => 'true_false', 'question' => 'The Vigenere cipher uses a keyword to determine shifts.', 'correct_answer' => 'True', 'explanation' => 'Each letter of the keyword determines the shift.'],
                    ['type' => 'mcq', 'question' => 'Which method can break the Vigenere cipher?', 'options' => ['Kasiski examination', 'Rainbow tables', 'Padding oracle', 'Side-channel'], 'correct_answer' => 'Kasiski examination', 'explanation' => 'Kasiski examination finds repeated sequences to determine key length.'],
                    ['type' => 'fill_blank', 'question' => 'The Vigenere cipher was considered "le chiffre _____".', 'correct_answer' => 'indéchiffrable', 'explanation' => 'It was called "le chiffre indéchiffrable" for centuries.'],
                    ['type' => 'mcq', 'question' => 'If the key is "KEY" and plaintext is "HELLO", what is the first encrypted letter?', 'options' => ['R', 'S', 'T', 'U'], 'correct_answer' => 'R', 'explanation' => 'H(7) + K(10) = R(17).'],
                    ['type' => 'text', 'question' => 'What technique analyzes letter frequency to break Vigenere?', 'correct_answer' => 'frequency analysis', 'explanation' => 'After determining key length, frequency analysis breaks each Caesar cipher independently.'],
                ],
            ],
            [
                'slug' => 'sha256-quick-check',
                'title' => 'SHA-256 Quick Check',
                'prompt' => 'Test your understanding of SHA-256 and cryptographic hash functions.',
                'hint' => 'Focus on hash properties: collision resistance, preimage resistance.',
                'expected_answer' => 'collision resistance',
                'difficulty' => 'intermediate',
                'is_published' => true,
                'is_daily' => false,
                'time_start' => now()->subDays(3),
                'time_end' => now()->addDays(30),
                'time_limit_seconds' => 20,
                'questions_per_session' => 5,
                'max_points_per_question' => 10,
                'questions' => [
                    ['type' => 'mcq', 'question' => 'What is the output size of SHA-256?', 'options' => ['128 bits', '160 bits', '256 bits', '512 bits'], 'correct_answer' => '256 bits', 'explanation' => 'SHA-256 produces a 256-bit digest.'],
                    ['type' => 'true_false', 'question' => 'SHA-256 is a member of the SHA-2 family.', 'correct_answer' => 'True', 'explanation' => 'SHA-2 includes SHA-224, SHA-256, SHA-384, and SHA-512.'],
                    ['type' => 'fill_blank', 'question' => 'A small change in input causes a large change in hash output, known as the _____ effect.', 'correct_answer' => 'avalanche', 'explanation' => 'The avalanche effect ensures even a 1-bit change flips ~50% of output bits.'],
                    ['type' => 'true_false', 'question' => 'SHA-256 can be reversed to recover the original input.', 'correct_answer' => 'False', 'explanation' => 'Hash functions are one-way; you cannot reverse them.'],
                    ['type' => 'mcq', 'question' => 'SHA-256 is commonly used in which cryptocurrency?', 'options' => ['Ethereum', 'Bitcoin', 'Monero', 'Cardano'], 'correct_answer' => 'Bitcoin', 'explanation' => 'Bitcoin uses SHA-256 for its proof-of-work mining algorithm.'],
                    ['type' => 'text', 'question' => 'What does SHA stand for?', 'correct_answer' => 'Secure Hash Algorithm', 'explanation' => 'SHA = Secure Hash Algorithm, designed by NSA.'],
                ],
            ],
            [
                'slug' => 'rsa-padding-alert',
                'title' => 'RSA Padding Alert',
                'prompt' => 'Test your knowledge of RSA encryption, padding schemes, and key management.',
                'hint' => 'Modern apps avoid PKCS#1 v1.5 for new design.',
                'expected_answer' => 'oaep',
                'difficulty' => 'advanced',
                'is_published' => false,
                'is_daily' => false,
                'time_start' => now()->addDays(2),
                'time_end' => now()->addDays(40),
                'time_limit_seconds' => 25,
                'questions_per_session' => 5,
                'max_points_per_question' => 10,
                'questions' => [
                    ['type' => 'mcq', 'question' => 'What is the recommended RSA padding scheme for encryption?', 'options' => ['PKCS#1 v1.5', 'OAEP', 'PSS', 'No padding'], 'correct_answer' => 'OAEP', 'explanation' => 'OAEP is recommended for RSA encryption.'],
                    ['type' => 'true_false', 'question' => 'RSA is an asymmetric encryption algorithm.', 'correct_answer' => 'True', 'explanation' => 'RSA uses a public/private key pair.'],
                    ['type' => 'mcq', 'question' => 'What mathematical problem does RSA security rely on?', 'options' => ['Discrete logarithm', 'Integer factorization', 'Elliptic curve', 'Knapsack'], 'correct_answer' => 'Integer factorization', 'explanation' => 'RSA relies on the difficulty of factoring large semiprime numbers.'],
                    ['type' => 'fill_blank', 'question' => 'RSA stands for Rivest, Shamir, and _____.', 'correct_answer' => 'Adleman', 'explanation' => 'RSA was invented by Ron Rivest, Adi Shamir, and Leonard Adleman.'],
                    ['type' => 'text', 'question' => 'What is the minimum recommended RSA key size in bits?', 'correct_answer' => '2048', 'explanation' => 'NIST recommends 2048-bit RSA keys as the minimum.'],
                ],
            ],
            // ── Daily challenge ──
            [
                'slug' => 'daily-crypto-trivia',
                'title' => 'Daily Crypto Trivia',
                'prompt' => 'A quick daily challenge to test your cryptography knowledge.',
                'hint' => 'Think about fundamental crypto concepts.',
                'expected_answer' => 'encryption',
                'difficulty' => 'beginner',
                'is_published' => true,
                'is_daily' => true,
                'daily_date' => now()->toDateString(),
                'time_start' => now()->startOfDay(),
                'time_end' => now()->endOfDay(),
                'time_limit_seconds' => 30,
                'questions_per_session' => 3,
                'max_points_per_question' => 5,
                'questions' => [
                    ['type' => 'mcq', 'question' => 'What is the process of converting plaintext to ciphertext?', 'options' => ['Decryption', 'Encryption', 'Hashing', 'Encoding'], 'correct_answer' => 'Encryption', 'explanation' => 'Encryption converts plaintext to ciphertext using a key.'],
                    ['type' => 'true_false', 'question' => 'AES is a symmetric encryption algorithm.', 'correct_answer' => 'True', 'explanation' => 'AES uses the same key for encryption and decryption.'],
                    ['type' => 'mcq', 'question' => 'Which key size is NOT valid for AES?', 'options' => ['128', '192', '256', '512'], 'correct_answer' => '512', 'explanation' => 'AES supports 128, 192, and 256-bit keys only.'],
                ],
            ],
        ];

        $challenges = collect($blueprints)->map(function (array $bp): Challenge {
            $questions = $bp['questions'] ?? [];
            unset($bp['questions']);

            $challenge = Challenge::query()->updateOrCreate(
                ['slug' => $bp['slug']],
                collect($bp)->except('slug')->toArray(),
            );

            if (count($questions) > 0) {
                ChallengeQuestion::query()->where('challenge_id', $challenge->id)->delete();

                foreach ($questions as $i => $q) {
                    ChallengeQuestion::query()->create([
                        'challenge_id' => $challenge->id,
                        'type' => $q['type'],
                        'question' => $q['question'],
                        'options' => $q['options'] ?? null,
                        'correct_answer' => $q['correct_answer'],
                        'explanation' => $q['explanation'] ?? null,
                        'sort_order' => $i + 1,
                    ]);
                }
            }

            return $challenge;
        })->values();

        $this->command->info('✓ '.count($blueprints).' challenges created.');

        return $challenges;
    }

    // ─────────────────────────────────────────────────────────
    //  Enrollments
    // ─────────────────────────────────────────────────────────

    /**
     * @param  Collection<int, User>  $members
     * @param  Collection<int, Course>  $courses
     */
    private function seedEnrollments(User $learner, Collection $members, Collection $courses): void
    {
        $this->command->info('Seeding enrollments...');

        // Learner enrolled in all courses, first 2 completed
        foreach ($courses as $i => $course) {
            $isCompleted = $i < 2;
            Enrollment::query()->updateOrCreate(
                ['user_id' => $learner->id, 'course_id' => $course->id],
                [
                    'progress_percentage' => $isCompleted ? 100 : fake()->numberBetween(20, 80),
                    'enrolled_at' => now()->subDays(fake()->numberBetween(10, 60)),
                    'completed_at' => $isCompleted ? now()->subDays(fake()->numberBetween(1, 10)) : null,
                ],
            );
        }

        // Members enrolled in 1-3 random courses
        $members->each(function (User $member) use ($courses): void {
            $courses->shuffle()->take(fake()->numberBetween(1, 3))->each(function (Course $course) use ($member): void {
                $isCompleted = fake()->boolean(25);
                Enrollment::query()->updateOrCreate(
                    ['user_id' => $member->id, 'course_id' => $course->id],
                    [
                        'progress_percentage' => $isCompleted ? 100 : fake()->numberBetween(5, 95),
                        'enrolled_at' => now()->subDays(fake()->numberBetween(1, 60)),
                        'completed_at' => $isCompleted ? now()->subDays(fake()->numberBetween(0, 10)) : null,
                    ],
                );
            });
        });

        $this->command->info('✓ Enrollments created.');
    }

    // ─────────────────────────────────────────────────────────
    //  Lesson Progress (12-month spread for learner)
    // ─────────────────────────────────────────────────────────

    /**
     * @param  Collection<int, Course>  $courses
     */
    private function seedLessonProgress(User $learner, Collection $courses): void
    {
        $this->command->info('Seeding learner lesson progress (12-month spread)...');

        LessonProgress::query()->where('user_id', $learner->id)->delete();

        $allLessons = Lesson::query()
            ->whereIn('course_id', $courses->pluck('id'))
            ->get();
        $lessonIds = $allLessons->pluck('id')->shuffle()->values();

        // Organic growth curve across 12 months
        $distribution = [2, 3, 2, 3, 4, 3, 4, 5, 3, 4, 3, 2];
        $rows = [];
        $idx = 0;

        foreach ($distribution as $monthOffset => $count) {
            $monthStart = now()->subMonths(11 - $monthOffset)->startOfMonth();
            $monthEnd = now()->subMonths(11 - $monthOffset)->endOfMonth();

            for ($i = 0; $i < $count && $idx < $lessonIds->count(); $i++) {
                $rows[] = [
                    'user_id' => $learner->id,
                    'lesson_id' => $lessonIds[$idx],
                    'attempts' => fake()->numberBetween(1, 3),
                    'completed_at' => fake()->dateTimeBetween($monthStart, $monthEnd),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $idx++;
            }
        }

        LessonProgress::insert($rows);
        $this->command->info("✓ {$idx} lesson completions spread across 12 months.");
    }

    /**
     * @param  Collection<int, User>  $members
     * @param  Collection<int, Course>  $courses
     */
    private function seedMemberLessonProgress(Collection $members, Collection $courses): void
    {
        $this->command->info('Seeding member lesson progress...');

        $courseLessons = Lesson::query()
            ->whereIn('course_id', $courses->pluck('id'))
            ->get()
            ->groupBy('course_id');

        // Track existing progress to avoid unique constraint violations
        $existingKeys = LessonProgress::query()
            ->select('user_id', 'lesson_id')
            ->get()
            ->map(fn ($row) => $row->user_id.'-'.$row->lesson_id)
            ->flip()
            ->all();

        $rows = [];
        $seen = $existingKeys;

        $members->each(function (User $member) use ($courseLessons, &$rows, &$seen): void {
            $enrolledCourseIds = Enrollment::query()
                ->where('user_id', $member->id)
                ->pluck('course_id');

            foreach ($enrolledCourseIds as $courseId) {
                $lessons = $courseLessons->get($courseId);
                if (! $lessons || $lessons->isEmpty()) {
                    continue;
                }

                $pickCount = min(fake()->numberBetween(1, 3), $lessons->count());
                $lessons->shuffle()->take($pickCount)->each(function (Lesson $lesson) use ($member, &$rows, &$seen): void {
                    $key = $member->id.'-'.$lesson->id;

                    if (isset($seen[$key])) {
                        return;
                    }

                    $seen[$key] = true;
                    $rows[] = [
                        'user_id' => $member->id,
                        'lesson_id' => $lesson->id,
                        'attempts' => fake()->numberBetween(1, 4),
                        'completed_at' => fake()->boolean(70) ? fake()->dateTimeBetween('-3 months', 'now') : null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                });
            }
        });

        foreach (array_chunk($rows, 500) as $chunk) {
            LessonProgress::insert($chunk);
        }

        $this->command->info('✓ '.count($rows).' member lesson progress records created.');
    }

    // ─────────────────────────────────────────────────────────
    //  Challenge Submissions (12-month spread for learner)
    // ─────────────────────────────────────────────────────────

    /**
     * @param  Collection<int, Challenge>  $challenges
     */
    private function seedChallengeSubmissions(User $learner, Collection $challenges): void
    {
        $this->command->info('Seeding learner challenge submissions (12-month spread)...');

        ChallengeSubmission::query()->where('user_id', $learner->id)->delete();

        $publishedChallenges = $challenges->where('is_published', true);
        $challengeIds = $publishedChallenges->pluck('id')->all();

        if (empty($challengeIds)) {
            return;
        }

        // Submissions per month: organic growth
        $distribution = [3, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 5];
        $rows = [];

        foreach ($distribution as $monthOffset => $count) {
            $monthStart = now()->subMonths(11 - $monthOffset)->startOfMonth();
            $monthEnd = now()->subMonths(11 - $monthOffset)->endOfMonth();

            for ($i = 0; $i < $count; $i++) {
                $isCorrect = fake()->boolean(75);
                $rows[] = [
                    'user_id' => $learner->id,
                    'challenge_id' => fake()->randomElement($challengeIds),
                    'session_id' => Str::uuid()->toString(),
                    'answer' => fake()->word(),
                    'is_correct' => $isCorrect,
                    'score' => $isCorrect ? fake()->numberBetween(80, 200) : 0,
                    'submitted_at' => fake()->dateTimeBetween($monthStart, $monthEnd),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        ChallengeSubmission::insert($rows);
        $this->command->info('✓ '.count($rows).' learner challenge submissions spread across 12 months.');
    }

    /**
     * @param  Collection<int, User>  $members
     * @param  Collection<int, Challenge>  $challenges
     */
    private function seedMemberChallengeSubmissions(Collection $members, Collection $challenges): void
    {
        $this->command->info('Seeding member challenge submissions...');

        $publishedIds = $challenges->where('is_published', true)->pluck('id')->all();

        if (empty($publishedIds)) {
            return;
        }

        $rows = [];

        $members->each(function (User $member) use ($publishedIds, &$rows): void {
            $attemptCount = fake()->numberBetween(1, 5);
            $attemptIds = fake()->randomElements($publishedIds, min($attemptCount, count($publishedIds)));

            foreach ($attemptIds as $challengeId) {
                $isCorrect = fake()->boolean(50);
                $rows[] = [
                    'user_id' => $member->id,
                    'challenge_id' => $challengeId,
                    'session_id' => Str::uuid()->toString(),
                    'answer' => fake()->word(),
                    'is_correct' => $isCorrect,
                    'score' => $isCorrect ? fake()->numberBetween(50, 150) : 0,
                    'submitted_at' => fake()->dateTimeBetween('-3 months', 'now'),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        });

        foreach (array_chunk($rows, 500) as $chunk) {
            ChallengeSubmission::insert($chunk);
        }

        $this->command->info('✓ '.count($rows).' member challenge submissions created.');
    }

    // ─────────────────────────────────────────────────────────
    //  Lab Visits
    // ─────────────────────────────────────────────────────────

    /**
     * @param  Collection<int, User>  $members
     */
    private function seedLabVisits(User $learner, Collection $members): void
    {
        $this->command->info('Seeding lab visits...');

        $labs = ['caesar-cipher', 'vigenere-cipher', 'sha256-hasher', 'rsa-keygen', 'aes-encryptor', 'diffie-hellman'];

        // Learner visited all 6 labs
        foreach ($labs as $lab) {
            LabVisit::query()->updateOrCreate(
                ['user_id' => $learner->id, 'lab_slug' => $lab],
                [
                    'visit_count' => fake()->numberBetween(1, 10),
                    'first_visited_at' => fake()->dateTimeBetween('-3 months', '-1 month'),
                    'last_visited_at' => fake()->dateTimeBetween('-1 month', 'now'),
                ],
            );
        }

        // Members visit 0-4 random labs
        $members->each(function (User $member) use ($labs): void {
            $visitCount = fake()->numberBetween(0, 4);
            if ($visitCount === 0) {
                return;
            }

            $pickedLabs = fake()->randomElements($labs, $visitCount);
            foreach ($pickedLabs as $lab) {
                LabVisit::query()->updateOrCreate(
                    ['user_id' => $member->id, 'lab_slug' => $lab],
                    [
                        'visit_count' => fake()->numberBetween(1, 5),
                        'first_visited_at' => fake()->dateTimeBetween('-2 months', '-1 week'),
                        'last_visited_at' => fake()->dateTimeBetween('-1 week', 'now'),
                    ],
                );
            }
        });

        $this->command->info('✓ Lab visits created.');
    }

    // ─────────────────────────────────────────────────────────
    //  Bookmarks (polymorphic)
    // ─────────────────────────────────────────────────────────

    /**
     * @param  Collection<int, User>  $members
     * @param  Collection<int, Course>  $courses
     */
    private function seedBookmarks(User $learner, Collection $members, Collection $courses): void
    {
        $this->command->info('Seeding bookmarks...');

        $lessons = Lesson::query()
            ->whereIn('course_id', $courses->pluck('id'))
            ->inRandomOrder()
            ->limit(20)
            ->get();

        // Learner bookmarks 3 courses and 5 lessons
        $courses->take(3)->each(function (Course $course) use ($learner): void {
            Bookmark::query()->updateOrCreate([
                'user_id' => $learner->id,
                'bookmarkable_type' => Course::class,
                'bookmarkable_id' => $course->id,
            ]);
        });

        $lessons->take(5)->each(function (Lesson $lesson) use ($learner): void {
            Bookmark::query()->updateOrCreate([
                'user_id' => $learner->id,
                'bookmarkable_type' => Lesson::class,
                'bookmarkable_id' => $lesson->id,
            ]);
        });

        // Some members bookmark courses/lessons
        $members->take(10)->each(function (User $member) use ($courses, $lessons): void {
            $courses->shuffle()->take(fake()->numberBetween(0, 2))->each(function (Course $course) use ($member): void {
                Bookmark::query()->updateOrCreate([
                    'user_id' => $member->id,
                    'bookmarkable_type' => Course::class,
                    'bookmarkable_id' => $course->id,
                ]);
            });

            $lessons->shuffle()->take(fake()->numberBetween(0, 3))->each(function (Lesson $lesson) use ($member): void {
                Bookmark::query()->updateOrCreate([
                    'user_id' => $member->id,
                    'bookmarkable_type' => Lesson::class,
                    'bookmarkable_id' => $lesson->id,
                ]);
            });
        });

        $this->command->info('✓ Bookmarks created.');
    }

    // ─────────────────────────────────────────────────────────
    //  Notes
    // ─────────────────────────────────────────────────────────

    /**
     * @param  Collection<int, User>  $members
     * @param  Collection<int, Course>  $courses
     */
    private function seedNotes(User $learner, Collection $members, Collection $courses): void
    {
        $this->command->info('Seeding notes...');

        $lessons = Lesson::query()
            ->whereIn('course_id', $courses->pluck('id'))
            ->get();

        $noteContents = [
            'Remember: CIA triad = Confidentiality, Integrity, Availability.',
            'Caesar cipher shift of 3 is the classic example. ROT13 is shift 13.',
            'Kasiski examination helps find the key length of a Vigenere cipher.',
            'SHA-256 output is always 256 bits (32 bytes) regardless of input size.',
            'RSA key size minimum: 2048 bits. OAEP padding for encryption, PSS for signatures.',
            'Merkle trees allow efficient verification of data integrity in blockchains.',
            'TLS 1.3 reduced the handshake to 1-RTT (or 0-RTT for resumption).',
            'ECC provides equivalent security to RSA with much smaller key sizes.',
            'The avalanche effect: changing 1 bit of input changes ~50% of hash output.',
            'Zero knowledge proofs: prove you know something without revealing it.',
        ];

        // Learner writes notes on several lessons
        $lessons->shuffle()->take(8)->each(function (Lesson $lesson, int $i) use ($learner, $noteContents): void {
            Note::query()->updateOrCreate(
                ['user_id' => $learner->id, 'lesson_id' => $lesson->id],
                ['content' => $noteContents[$i % count($noteContents)]],
            );
        });

        // Some members write notes
        $members->take(8)->each(function (User $member) use ($lessons): void {
            $lessons->shuffle()->take(fake()->numberBetween(1, 3))->each(function (Lesson $lesson) use ($member): void {
                Note::query()->updateOrCreate(
                    ['user_id' => $member->id, 'lesson_id' => $lesson->id],
                    ['content' => fake()->paragraph()],
                );
            });
        });

        $this->command->info('✓ Notes created.');
    }

    // ─────────────────────────────────────────────────────────
    //  Points Recalculation
    // ─────────────────────────────────────────────────────────

    /**
     * @param  Collection<int, User>  $users
     */
    private function recalculatePoints(Collection $users): void
    {
        $this->command->info('Recalculating user points...');

        foreach ($users as $user) {
            $completedCount = (int) $user->lessonProgress()
                ->whereNotNull('completed_at')
                ->count();

            $lessonXp = $completedCount * (int) config('rewards.lesson_completion_xp', 30);

            $challengeScore = (int) $user->challengeSubmissions()
                ->where('is_correct', true)
                ->sum('score');

            $user->forceFill(['points' => $lessonXp + $challengeScore, 'xp' => $lessonXp])->save();
        }

        $this->command->info('✓ Points recalculated for '.count($users).' users.');
    }

    // ─────────────────────────────────────────────────────────
    //  Badge Awarding
    // ─────────────────────────────────────────────────────────

    /**
     * @param  Collection<int, User>  $users
     */
    private function awardBadges(Collection $users): void
    {
        $this->command->info('Awarding badges based on progress...');

        $badgeService = app(BadgeService::class);
        $allCriteria = [
            'first_enrollment', 'courses_completed', 'lessons_completed',
            'challenges_solved', 'streak_days', 'labs_visited', 'points_earned',
        ];

        $totalAwarded = 0;

        foreach ($users as $user) {
            $awarded = $badgeService->checkAndAward($user, $allCriteria);
            $totalAwarded += $awarded->count();
        }

        $this->command->info("✓ {$totalAwarded} badges awarded across ".count($users).' users.');
    }
}
