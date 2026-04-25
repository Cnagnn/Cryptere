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
use Illuminate\Support\Facades\Hash;

class ManagementSeeder extends Seeder
{
    private const ADMIN_EMAIL = 'admin@example.com';

    private const LEARNER_EMAIL = 'test@example.com';

    public function run(): void
    {
        $admin = $this->seedAdmin();
        $learner = $this->seedLearner();
        $members = $this->seedMembers();

        $courses = $this->seedCourses();
        $challenges = $this->seedChallenges();

        $this->seedEnrollmentData($learner, $members, $courses);
        $this->seedChallengeSubmissions($learner, $challenges);

        // Keep admin points meaningful for management previews.
        $admin->forceFill(['points' => 500, 'xp' => 50])->save();
    }

    private function seedAdmin(): User
    {
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
            ],
        );
    }

    private function seedLearner(): User
    {
        return User::query()->updateOrCreate(
            ['email' => self::LEARNER_EMAIL],
            [
                'name' => 'Test User',
                'username' => 'testuser',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'points' => 240,
                'xp' => 24,
                'is_admin' => false,
                'role' => 'member',
                'status' => 'active',
            ],
        );
    }

    /**
     * @return Collection<int, User>
     */
    private function seedMembers()
    {
        $existingMembers = User::query()
            ->where('role', 'member')
            ->whereNot('email', self::LEARNER_EMAIL)
            ->limit(24)
            ->get();

        $remaining = max(24 - $existingMembers->count(), 0);

        if ($remaining > 0) {
            $createdMembers = User::factory()
                ->count($remaining)
                ->sequence(fn (): array => ['points' => fake()->numberBetween(40, 800), 'xp' => fake()->numberBetween(4, 80)])
                ->create([
                    'role' => 'member',
                    'is_admin' => false,
                    'status' => 'active',
                ]);

            return $existingMembers->concat($createdMembers);
        }

        return $existingMembers;
    }

    /**
     * @return Collection<int, Course>
     */
    private function seedCourses()
    {
        $blueprints = [
            [
                'slug' => 'crypto-foundations',
                'title' => 'Crypto Foundations',
                'summary' => 'Build intuition for confidentiality, integrity, and practical threat modeling.',
                'estimated_minutes' => 110,
                'sort_order' => 1,
                'lessons' => [
                    [
                        'slug' => 'why-cryptography-matters',
                        'title' => 'Why Cryptography Matters',
                        'tasks' => [
                            ['type' => 'video', 'title' => 'Video: Why Data Needs Protection', 'minutes' => 12, 'video_url' => 'https://youtu.be/GSIDS_lvRv4'],
                            ['type' => 'quiz', 'title' => 'Quiz: Security Goals', 'minutes' => 8],
                        ],
                    ],
                    [
                        'slug' => 'confidentiality-vs-integrity',
                        'title' => 'Confidentiality vs Integrity',
                        'tasks' => [
                            ['type' => 'read', 'title' => 'Reading: CIA Triad Notes', 'minutes' => 7, 'document_name' => 'cia-triad-notes.pdf', 'conversion_status' => 'done'],
                        ],
                    ],
                    [
                        'slug' => 'threat-modeling-basics',
                        'title' => 'Threat Modeling Basics',
                        'tasks' => [
                            ['type' => 'video', 'title' => 'Video: Basic Threat Model', 'minutes' => 10, 'video_url' => 'https://youtu.be/2g2fV5G9R4w'],
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'applied-classical-ciphers',
                'title' => 'Applied Classical Ciphers',
                'summary' => 'Practice Caesar and Vigenere ciphers through decoding drills and key discovery.',
                'estimated_minutes' => 95,
                'sort_order' => 2,
                'lessons' => [
                    [
                        'slug' => 'caesar-cipher-warmup',
                        'title' => 'Caesar Cipher Warmup',
                        'tasks' => [
                            ['type' => 'video', 'title' => 'Video: Caesar Cipher in Practice', 'minutes' => 10, 'video_url' => 'https://youtu.be/sMOZf4GN3oc'],
                            ['type' => 'quiz', 'title' => 'Quiz: Caesar Basics', 'minutes' => 6],
                        ],
                    ],
                    [
                        'slug' => 'vigenere-with-repeating-keys',
                        'title' => 'Vigenere with Repeating Keys',
                        'tasks' => [
                            ['type' => 'video', 'title' => 'Video: Key Length Estimation', 'minutes' => 12, 'video_url' => 'https://youtu.be/LaWp_Kq0cKs'],
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'modern-crypto-principles',
                'title' => 'Modern Crypto Principles',
                'summary' => 'Explore hashing, signatures, and key exchange in modern application security.',
                'estimated_minutes' => 140,
                'sort_order' => 3,
                'lessons' => [
                    [
                        'slug' => 'hash-functions-and-digest-properties',
                        'title' => 'Hash Functions and Digest Properties',
                        'tasks' => [
                            ['type' => 'video', 'title' => 'Video: Hash Properties Explained', 'minutes' => 12, 'video_url' => 'https://youtu.be/b4b8ktEV4Bg'],
                        ],
                    ],
                    [
                        'slug' => 'symmetric-vs-asymmetric-encryption',
                        'title' => 'Symmetric vs Asymmetric Encryption',
                        'tasks' => [
                            ['type' => 'quiz', 'title' => 'Quiz: Encryption Strategy', 'minutes' => 9],
                        ],
                    ],
                ],
            ],
        ];

        return collect($blueprints)
            ->map(function (array $courseBlueprint): Course {
                $course = Course::query()->updateOrCreate(
                    ['slug' => $courseBlueprint['slug']],
                    [
                        'title' => $courseBlueprint['title'],
                        'summary' => $courseBlueprint['summary'],
                        'estimated_minutes' => $courseBlueprint['estimated_minutes'],
                        'sort_order' => $courseBlueprint['sort_order'],
                        'is_published' => true,
                    ],
                );

                foreach ($courseBlueprint['lessons'] as $lessonIndex => $lessonBlueprint) {
                    $lesson = Lesson::query()->updateOrCreate(
                        [
                            'course_id' => $course->id,
                            'slug' => $lessonBlueprint['slug'],
                        ],
                        [
                            'title' => $lessonBlueprint['title'],
                            'content' => $lessonBlueprint['title'].' content summary.',
                            'position' => $lessonIndex + 1,
                        ],
                    );

                    foreach ($lessonBlueprint['tasks'] as $taskIndex => $taskBlueprint) {
                        $task = LessonTask::query()->updateOrCreate(
                            [
                                'lesson_id' => $lesson->id,
                                'sort_order' => $taskIndex + 1,
                            ],
                            [
                                'title' => $taskBlueprint['title'],
                                'type' => $taskBlueprint['type'],
                                'minutes' => $taskBlueprint['minutes'],
                                'video_url' => $taskBlueprint['video_url'] ?? null,
                                'document_name' => $taskBlueprint['document_name'] ?? null,
                                'conversion_status' => $taskBlueprint['conversion_status'] ?? null,
                                'pdf_url' => null,

                            ],
                        );

                        if ($task->type !== 'quiz') {
                            continue;
                        }

                        QuizQuestion::query()->where('lesson_task_id', $task->id)->delete();

                        QuizQuestion::query()->create([
                            'lesson_task_id' => $task->id,
                            'question' => 'Which concept best describes this quiz?',
                            'options' => ['Confidentiality', 'Compression', 'Caching', 'Rendering'],
                            'correct_option' => 0,
                            'explanation' => 'Most seeded quizzes focus on core cryptography concepts.',
                            'sort_order' => 1,
                        ]);
                    }
                }

                return $course;
            })
            ->values();
    }

    /**
     * @return Collection<int, Challenge>
     */
    private function seedChallenges()
    {
        $blueprints = [
            [
                'slug' => 'caesar-warmup',
                'title' => 'Caesar Warmup',
                'prompt' => 'Test your knowledge of the Caesar cipher — shifts, decryption, and history.',
                'hint' => 'Shift each letter three steps backward.',
                'expected_answer' => 'crypter',
                'is_published' => true,
                'time_start' => now()->subDays(5),
                'time_end' => now()->addDays(20),
                'time_limit_seconds' => 15,
                'questions_per_session' => 5,
                'max_points_per_question' => 10,
                'questions' => [
                    ['type' => 'mcq', 'question' => 'What is the Caesar cipher shift for FUBSWHU → CRYPTER?', 'options' => ['1', '2', '3', '4'], 'correct_answer' => '3', 'explanation' => 'Each letter is shifted 3 positions backward.'],
                    ['type' => 'true_false', 'question' => 'The Caesar cipher is a substitution cipher.', 'correct_answer' => 'True', 'explanation' => 'It substitutes each letter with another letter a fixed number of positions away.'],
                    ['type' => 'mcq', 'question' => 'How many possible shifts does a Caesar cipher have (English)?', 'options' => ['24', '25', '26', '52'], 'correct_answer' => '25', 'explanation' => 'There are 25 non-trivial shifts (shift 0 is identity).'],
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
                'is_published' => true,
                'time_start' => now()->subDays(4),
                'time_end' => now()->addDays(15),
                'time_limit_seconds' => 20,
                'questions_per_session' => 5,
                'max_points_per_question' => 10,
                'questions' => [
                    ['type' => 'mcq', 'question' => 'The Vigenere cipher is classified as which type?', 'options' => ['Monoalphabetic', 'Polyalphabetic', 'Transposition', 'Stream'], 'correct_answer' => 'Polyalphabetic', 'explanation' => 'It uses multiple substitution alphabets.'],
                    ['type' => 'true_false', 'question' => 'The Vigenere cipher uses a keyword to determine shifts.', 'correct_answer' => 'True', 'explanation' => 'Each letter of the keyword determines the shift for the corresponding plaintext letter.'],
                    ['type' => 'mcq', 'question' => 'Which method can break the Vigenere cipher?', 'options' => ['Kasiski examination', 'Rainbow tables', 'Padding oracle', 'Side-channel'], 'correct_answer' => 'Kasiski examination', 'explanation' => 'Kasiski examination finds repeated sequences to determine key length.'],
                    ['type' => 'fill_blank', 'question' => 'The Vigenere cipher was considered "le chiffre _____" (the indecipherable cipher).', 'correct_answer' => 'indéchiffrable', 'explanation' => 'It was called "le chiffre indéchiffrable" for centuries.'],
                    ['type' => 'mcq', 'question' => 'If the key is "KEY" and plaintext is "HELLO", what is the first encrypted letter?', 'options' => ['R', 'S', 'T', 'U'], 'correct_answer' => 'R', 'explanation' => 'H(7) + K(10) = R(17).'],
                    ['type' => 'true_false', 'question' => 'A Vigenere cipher with a key as long as the message is a one-time pad.', 'correct_answer' => 'True', 'explanation' => 'When the key is truly random and as long as the message, it becomes a one-time pad.'],
                    ['type' => 'text', 'question' => 'What technique analyzes letter frequency to break Vigenere?', 'correct_answer' => 'frequency analysis', 'explanation' => 'After determining key length, frequency analysis breaks each Caesar cipher independently.'],
                    ['type' => 'mcq', 'question' => 'Who is credited with inventing the Vigenere cipher?', 'options' => ['Blaise de Vigenere', 'Giovan Battista Bellaso', 'Leon Battista Alberti', 'Charles Babbage'], 'correct_answer' => 'Giovan Battista Bellaso', 'explanation' => 'Bellaso originally described it; Vigenere got the credit later.'],
                    ['type' => 'mcq', 'question' => 'What is the key space of a Vigenere cipher with a 5-letter key (English)?', 'options' => ['26^5', '5^26', '26!', '5!'], 'correct_answer' => '26^5', 'explanation' => 'Each position has 26 choices, so 26^5 total keys.'],
                    ['type' => 'true_false', 'question' => 'Index of coincidence can help determine the key length.', 'correct_answer' => 'True', 'explanation' => 'IC measures how likely two random letters match, revealing key length.'],
                ],
            ],
            [
                'slug' => 'sha256-quick-check',
                'title' => 'SHA-256 Quick Check',
                'prompt' => 'Test your understanding of SHA-256 and cryptographic hash functions.',
                'hint' => 'Focus on hash properties: collision resistance, preimage resistance.',
                'expected_answer' => 'collision resistance',
                'is_published' => true,
                'time_start' => now()->subDays(3),
                'time_end' => now()->addDays(30),
                'time_limit_seconds' => 20,
                'questions_per_session' => 5,
                'max_points_per_question' => 10,
                'questions' => [
                    ['type' => 'mcq', 'question' => 'What is the output size of SHA-256?', 'options' => ['128 bits', '160 bits', '256 bits', '512 bits'], 'correct_answer' => '256 bits', 'explanation' => 'SHA-256 produces a 256-bit (32-byte) digest.'],
                    ['type' => 'true_false', 'question' => 'SHA-256 is a member of the SHA-2 family.', 'correct_answer' => 'True', 'explanation' => 'SHA-2 includes SHA-224, SHA-256, SHA-384, and SHA-512.'],
                    ['type' => 'mcq', 'question' => 'Which property means it is hard to find two inputs with the same hash?', 'options' => ['Preimage resistance', 'Collision resistance', 'Avalanche effect', 'Key derivation'], 'correct_answer' => 'Collision resistance', 'explanation' => 'Collision resistance means finding any two inputs with the same hash is computationally infeasible.'],
                    ['type' => 'fill_blank', 'question' => 'A small change in input causes a large change in hash output, known as the _____ effect.', 'correct_answer' => 'avalanche', 'explanation' => 'The avalanche effect ensures even a 1-bit change flips ~50% of output bits.'],
                    ['type' => 'true_false', 'question' => 'SHA-256 can be reversed to recover the original input.', 'correct_answer' => 'False', 'explanation' => 'Hash functions are one-way; you cannot reverse them.'],
                    ['type' => 'mcq', 'question' => 'SHA-256 is commonly used in which cryptocurrency?', 'options' => ['Ethereum', 'Bitcoin', 'Monero', 'Cardano'], 'correct_answer' => 'Bitcoin', 'explanation' => 'Bitcoin uses SHA-256 for its proof-of-work mining algorithm.'],
                    ['type' => 'text', 'question' => 'What does SHA stand for?', 'correct_answer' => 'Secure Hash Algorithm', 'explanation' => 'SHA = Secure Hash Algorithm, designed by NSA.'],
                    ['type' => 'mcq', 'question' => 'How many rounds does SHA-256 use internally?', 'options' => ['32', '48', '64', '80'], 'correct_answer' => '64', 'explanation' => 'SHA-256 uses 64 rounds of compression.'],
                    ['type' => 'true_false', 'question' => 'MD5 is considered as secure as SHA-256.', 'correct_answer' => 'False', 'explanation' => 'MD5 has known collision vulnerabilities and is not recommended for security.'],
                    ['type' => 'mcq', 'question' => 'Which property means given a hash, it is hard to find the original input?', 'options' => ['Collision resistance', 'Preimage resistance', 'Second preimage resistance', 'Diffusion'], 'correct_answer' => 'Preimage resistance', 'explanation' => 'Preimage resistance means you cannot find an input that produces a given hash.'],
                ],
            ],
            [
                'slug' => 'rsa-padding-alert',
                'title' => 'RSA Padding Alert',
                'prompt' => 'Test your knowledge of RSA encryption, padding schemes, and key management.',
                'hint' => 'Modern apps avoid PKCS#1 v1.5 for new design.',
                'expected_answer' => 'oaep',
                'is_published' => false,
                'time_start' => now()->addDays(2),
                'time_end' => now()->addDays(40),
                'time_limit_seconds' => 25,
                'questions_per_session' => 5,
                'max_points_per_question' => 10,
                'questions' => [
                    ['type' => 'mcq', 'question' => 'What is the recommended RSA padding scheme for encryption?', 'options' => ['PKCS#1 v1.5', 'OAEP', 'PSS', 'No padding'], 'correct_answer' => 'OAEP', 'explanation' => 'OAEP (Optimal Asymmetric Encryption Padding) is recommended for RSA encryption.'],
                    ['type' => 'true_false', 'question' => 'RSA is an asymmetric encryption algorithm.', 'correct_answer' => 'True', 'explanation' => 'RSA uses a public/private key pair.'],
                    ['type' => 'mcq', 'question' => 'What mathematical problem does RSA security rely on?', 'options' => ['Discrete logarithm', 'Integer factorization', 'Elliptic curve', 'Knapsack'], 'correct_answer' => 'Integer factorization', 'explanation' => 'RSA relies on the difficulty of factoring large semiprime numbers.'],
                    ['type' => 'fill_blank', 'question' => 'RSA stands for Rivest, Shamir, and _____.', 'correct_answer' => 'Adleman', 'explanation' => 'RSA was invented by Ron Rivest, Adi Shamir, and Leonard Adleman.'],
                    ['type' => 'true_false', 'question' => 'A 1024-bit RSA key is considered secure for long-term use.', 'correct_answer' => 'False', 'explanation' => 'NIST recommends at least 2048-bit RSA keys.'],
                    ['type' => 'mcq', 'question' => 'Which padding scheme is recommended for RSA signatures?', 'options' => ['OAEP', 'PSS', 'PKCS#1 v1.5', 'ISO 9796'], 'correct_answer' => 'PSS', 'explanation' => 'PSS (Probabilistic Signature Scheme) is the modern standard for RSA signatures.'],
                    ['type' => 'text', 'question' => 'What is the minimum recommended RSA key size in bits?', 'correct_answer' => '2048', 'explanation' => 'NIST recommends 2048-bit RSA keys as the minimum.'],
                    ['type' => 'mcq', 'question' => 'In RSA, which key is used for encryption?', 'options' => ['Private key', 'Public key', 'Session key', 'Master key'], 'correct_answer' => 'Public key', 'explanation' => 'The public key encrypts; the private key decrypts.'],
                ],
            ],
        ];

        return collect($blueprints)
            ->map(function (array $blueprint): Challenge {
                $questions = $blueprint['questions'] ?? [];
                unset($blueprint['questions']);

                $challenge = Challenge::query()->updateOrCreate(
                    ['slug' => $blueprint['slug']],
                    [
                        'title' => $blueprint['title'],
                        'prompt' => $blueprint['prompt'],
                        'hint' => $blueprint['hint'],
                        'expected_answer' => $blueprint['expected_answer'],
                        'is_published' => $blueprint['is_published'],
                        'time_start' => $blueprint['time_start'],
                        'time_end' => $blueprint['time_end'],
                        'time_limit_seconds' => $blueprint['time_limit_seconds'] ?? 20,
                        'questions_per_session' => $blueprint['questions_per_session'] ?? 5,
                        'max_points_per_question' => $blueprint['max_points_per_question'] ?? 10,
                    ],
                );

                // Seed question bank
                if (count($questions) > 0) {
                    ChallengeQuestion::query()->where('challenge_id', $challenge->id)->delete();

                    foreach ($questions as $index => $q) {
                        ChallengeQuestion::query()->create([
                            'challenge_id' => $challenge->id,
                            'type' => $q['type'],
                            'question' => $q['question'],
                            'options' => $q['options'] ?? null,
                            'correct_answer' => $q['correct_answer'],
                            'explanation' => $q['explanation'] ?? null,
                            'sort_order' => $index + 1,
                        ]);
                    }
                }

                return $challenge;
            })
            ->values();
    }

    /**
     * @param  Collection<int, User>  $members
     * @param  Collection<int, Course>  $courses
     */
    private function seedEnrollmentData(User $learner, $members, $courses): void
    {
        foreach ($courses as $course) {
            Enrollment::query()->updateOrCreate(
                [
                    'user_id' => $learner->id,
                    'course_id' => $course->id,
                ],
                [
                    'progress_percentage' => fake()->numberBetween(20, 80),
                    'enrolled_at' => now()->subDays(fake()->numberBetween(2, 12)),
                    'completed_at' => null,
                ],
            );
        }

        $members->take(12)->each(function (User $member) use ($courses): void {
            $courses->shuffle()->take(fake()->numberBetween(1, 2))->each(function (Course $course) use ($member): void {
                Enrollment::query()->updateOrCreate(
                    [
                        'user_id' => $member->id,
                        'course_id' => $course->id,
                    ],
                    [
                        'progress_percentage' => fake()->numberBetween(5, 100),
                        'enrolled_at' => now()->subDays(fake()->numberBetween(1, 30)),
                        'completed_at' => fake()->boolean(30) ? now()->subDays(fake()->numberBetween(0, 5)) : null,
                    ],
                );
            });
        });

        $firstCourse = $courses->first();

        if (! $firstCourse instanceof Course) {
            return;
        }

        $firstTwoLessons = Lesson::query()
            ->where('course_id', $firstCourse->id)
            ->orderBy('position')
            ->limit(2)
            ->get();

        foreach ($firstTwoLessons as $lesson) {
            LessonProgress::query()->updateOrCreate(
                [
                    'user_id' => $learner->id,
                    'lesson_id' => $lesson->id,
                ],
                [
                    'attempts' => fake()->numberBetween(1, 2),
                    'completed_at' => now()->subDays(fake()->numberBetween(1, 3)),
                ],
            );
        }
    }

    /**
     * @param  Collection<int, Challenge>  $challenges
     */
    private function seedChallengeSubmissions(User $learner, $challenges): void
    {
        foreach ($challenges->take(3) as $challenge) {
            ChallengeSubmission::query()->updateOrCreate(
                [
                    'user_id' => $learner->id,
                    'challenge_id' => $challenge->id,
                ],
                [
                    'answer' => $challenge->expected_answer,
                    'is_correct' => true,
                    'score' => 100,
                    'submitted_at' => now()->subHours(fake()->numberBetween(2, 48)),
                ],
            );
        }
    }
}
