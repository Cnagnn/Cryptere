<?php

namespace Database\Seeders;

use App\Models\Badge;
use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LabVisit;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LessonTask;
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
     */
    public function run(): void
    {
        $this->command->info('ðŸš€ Starting comprehensive seed...');

        // â”€â”€ 1. Badges (delegate to existing seeder) â”€â”€
        $this->call(BadgeSeeder::class);

        // â”€â”€ 2. Users â”€â”€
        $admin = $this->seedAdmin();
        $learner = $this->seedLearner();
        $members = $this->seedMembers();
        $allUsers = $members->prepend($learner);

        // â”€â”€ 3. Courses with learning path â”€â”€
        $courses = $this->seedCourses();

        // â”€â”€ 4. Challenges â”€â”€
        $challenges = $this->seedChallenges();

        // â”€â”€ 5. Enrollments â”€â”€
        $this->seedEnrollments($learner, $members, $courses);

        // â”€â”€ 6. Lesson progress (12-month spread for learner) â”€â”€
        $this->seedLessonProgress($learner, $courses);
        $this->seedMemberLessonProgress($members, $courses);

        // â”€â”€ 7. Challenge submissions (12-month spread for learner) â”€â”€
        $this->seedChallengeSubmissions($learner, $challenges);
        $this->seedMemberChallengeSubmissions($members, $challenges);

        // â”€â”€ 8. Lab visits â”€â”€
        $this->seedLabVisits($learner, $members);

        // â”€â”€ 9. Recent daily activity (last 7 days for weekly chart) â”€â”€
        $this->seedRecentDailyActivity($learner, $courses, $challenges);

        // â”€â”€ 10. Recalculate points â”€â”€
        $this->recalculatePoints($allUsers);
        $admin->forceFill(['points' => 500, 'xp' => 50])->save();

        // â”€â”€ 11. Award badges based on real progress â”€â”€
        $this->awardBadges($allUsers);

        $this->command->info('ðŸŽ‰ Comprehensive seed complete!');
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  Users
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
                'current_streak' => 14,
                'longest_streak' => 42,
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
            $this->command->info("â­ Members already exist ({$existing->count()}).");

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

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  Courses (learning path with prerequisites)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * @return Collection<int, Course>
     */
    private function seedCourses(): Collection
    {
        $this->command->info('Seeding courses with learning path...');

        $blueprints = [
            // â”€â”€ Path 1: Classical Cryptography (beginner â†’ intermediate) â”€â”€
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
                            ['question' => 'Which of the following is NOT part of the CIA triad?', 'options' => ['Confidentiality', 'Integrity', 'Authentication', 'Availability'], 'correct_option' => 2, 'explanation' => 'The CIA triad consists of Confidentiality, Integrity, and Availability.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                            ['question' => 'What does encryption primarily protect?', 'options' => ['Availability', 'Confidentiality', 'Integrity', 'Non-repudiation'], 'correct_option' => 1, 'explanation' => 'Encryption ensures data confidentiality by making it unreadable without the key.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                            ['question' => 'Which security goal ensures that data is accessible when needed?', 'options' => ['Confidentiality', 'Integrity', 'Availability', 'Authentication'], 'correct_option' => 2, 'explanation' => 'Availability ensures that information and resources are accessible to authorized users when needed.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                            ['question' => 'What is the primary purpose of a digital signature?', 'options' => ['Encrypt data', 'Compress files', 'Verify authenticity and integrity', 'Speed up transmission'], 'correct_option' => 2, 'explanation' => 'Digital signatures verify that a message was sent by the claimed sender and has not been altered.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'Non-repudiation prevents a sender from...', 'options' => ['Reading the message', 'Denying they sent the message', 'Encrypting the message', 'Forwarding the message'], 'correct_option' => 1, 'explanation' => 'Non-repudiation ensures the sender cannot deny having sent a message.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                            ['question' => 'Which attack targets the availability of a system?', 'options' => ['Eavesdropping', 'Man-in-the-middle', 'Denial of Service (DoS)', 'Phishing'], 'correct_option' => 2, 'explanation' => 'DoS attacks aim to make a system unavailable to its intended users.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.4],
                            ['question' => 'What is the difference between authentication and authorization?', 'options' => ['They are the same thing', 'Authentication verifies identity; authorization grants permissions', 'Authorization verifies identity; authentication grants permissions', 'Neither relates to security'], 'correct_option' => 1, 'explanation' => 'Authentication confirms who you are; authorization determines what you can do.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.65],
                            ['question' => 'Which of the following best describes defense in depth?', 'options' => ['Using one very strong security measure', 'Layering multiple security controls', 'Encrypting everything twice', 'Hiring more security staff'], 'correct_option' => 1, 'explanation' => 'Defense in depth uses multiple layers of security controls to protect assets.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.7],
                        ]],
                    ]],
                    ['slug' => 'confidentiality-vs-integrity', 'title' => 'Confidentiality vs Integrity', 'description' => 'Learn the difference between keeping data secret and keeping it accurate.', 'tasks' => [
                        ['type' => 'read', 'title' => 'Reading: CIA Triad Notes', 'minutes' => 7, 'document_name' => 'cia-triad-notes.pdf', 'conversion_status' => 'done'],
                        ['type' => 'quiz', 'title' => 'Quiz: CIA Triad', 'minutes' => 5, 'questions' => [
                            ['question' => 'Integrity ensures data has not been...', 'options' => ['Encrypted', 'Tampered with', 'Compressed', 'Backed up'], 'correct_option' => 1, 'explanation' => 'Integrity means data has not been altered or tampered with.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                            ['question' => 'Which mechanism is commonly used to verify data integrity?', 'options' => ['Encryption', 'Hashing', 'Compression', 'Tokenization'], 'correct_option' => 1, 'explanation' => 'Hash functions produce a fixed-size digest that changes if the data is modified.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.4],
                            ['question' => 'Confidentiality is best achieved through...', 'options' => ['Access control lists', 'Encryption', 'Backups', 'Logging'], 'correct_option' => 1, 'explanation' => 'Encryption transforms data so only authorized parties with the key can read it.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                            ['question' => 'Which scenario is a confidentiality breach?', 'options' => ['Server goes offline', 'Database records are modified', 'Sensitive emails are leaked', 'Backup fails'], 'correct_option' => 2, 'explanation' => 'Leaked sensitive data is a confidentiality breach â€” unauthorized access to private information.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                            ['question' => 'A RAID system primarily supports which security goal?', 'options' => ['Confidentiality', 'Integrity', 'Availability', 'Non-repudiation'], 'correct_option' => 2, 'explanation' => 'RAID provides redundancy to ensure data remains available even if a disk fails.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.65],
                            ['question' => 'Which of the following is an integrity attack?', 'options' => ['Eavesdropping on network traffic', 'Modifying a financial transaction in transit', 'Flooding a server with requests', 'Guessing a password'], 'correct_option' => 1, 'explanation' => 'Modifying data in transit is an integrity attack â€” the data is tampered with.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
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
                            ['question' => 'How many possible shifts does a Caesar cipher have?', 'options' => ['24', '25', '26', '52'], 'correct_option' => 1, 'explanation' => 'There are 25 non-trivial shifts (shift 0 is identity).', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                            ['question' => 'What attack easily breaks a Caesar cipher?', 'options' => ['Brute force', 'Man-in-the-middle', 'SQL injection', 'Buffer overflow'], 'correct_option' => 0, 'explanation' => 'With only 25 possible keys, brute force is trivial.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                            ['question' => 'The Caesar cipher is an example of which cipher type?', 'options' => ['Transposition', 'Substitution', 'Stream', 'Block'], 'correct_option' => 1, 'explanation' => 'The Caesar cipher substitutes each letter with another letter a fixed number of positions away.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                            ['question' => 'If you encrypt "HELLO" with a Caesar shift of 3, what is the result?', 'options' => ['KHOOR', 'JGNNQ', 'IFMMP', 'LIPPS'], 'correct_option' => 0, 'explanation' => 'Hâ†’K, Eâ†’H, Lâ†’O, Lâ†’O, Oâ†’R gives KHOOR.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                            ['question' => 'ROT13 is a special case of Caesar cipher with shift...', 'options' => ['7', '10', '13', '26'], 'correct_option' => 2, 'explanation' => 'ROT13 uses a shift of 13, which is its own inverse since 13+13=26.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.4],
                            ['question' => 'Which Roman leader is the Caesar cipher named after?', 'options' => ['Augustus', 'Julius Caesar', 'Nero', 'Marcus Aurelius'], 'correct_option' => 1, 'explanation' => 'Julius Caesar used this cipher to communicate with his generals.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.15],
                            ['question' => 'Why is the Caesar cipher considered insecure by modern standards?', 'options' => ['It uses too many keys', 'The key space is too small (only 25 keys)', 'It requires a computer to break', 'It only works with English'], 'correct_option' => 1, 'explanation' => 'With only 25 possible keys, any attacker can try all of them in seconds.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.35],
                            ['question' => 'What is the Caesar cipher shift value if A maps to D?', 'options' => ['1', '2', '3', '4'], 'correct_option' => 2, 'explanation' => 'A(0) â†’ D(3) means a shift of 3.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.3],
                        ]],
                    ]],
                    ['slug' => 'vigenere-with-repeating-keys', 'title' => 'Vigenere with Repeating Keys', 'description' => 'Explore polyalphabetic substitution and key length estimation.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: Key Length Estimation', 'minutes' => 12, 'video_url' => 'https://youtu.be/LaWp_Kq0cKs'],
                        ['type' => 'read', 'title' => 'Reading: Kasiski Examination', 'minutes' => 10],
                    ]],
                    ['slug' => 'frequency-analysis', 'title' => 'Frequency Analysis', 'description' => 'Use letter frequency to crack monoalphabetic ciphers.', 'tasks' => [
                        ['type' => 'read', 'title' => 'Reading: English Letter Frequencies', 'minutes' => 8],
                        ['type' => 'quiz', 'title' => 'Quiz: Frequency Analysis', 'minutes' => 7, 'questions' => [
                            ['question' => 'What is the most common letter in English?', 'options' => ['T', 'A', 'E', 'S'], 'correct_option' => 2, 'explanation' => 'E is the most frequently used letter in English.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                            ['question' => 'Frequency analysis is most effective against which type of cipher?', 'options' => ['Polyalphabetic', 'Monoalphabetic', 'One-time pad', 'AES'], 'correct_option' => 1, 'explanation' => 'Monoalphabetic ciphers preserve letter frequency patterns, making them vulnerable.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                            ['question' => 'Which letter pair (digraph) is most common in English?', 'options' => ['ST', 'TH', 'ER', 'AN'], 'correct_option' => 1, 'explanation' => 'TH is the most common digraph in English text.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'Why does frequency analysis fail against the one-time pad?', 'options' => ['The key is too short', 'Each character uses a different random key', 'It uses transposition', 'The plaintext is compressed first'], 'correct_option' => 1, 'explanation' => 'A one-time pad uses a truly random key as long as the message, destroying frequency patterns.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.7],
                            ['question' => 'In a substitution cipher, if "X" appears most often, it likely represents...', 'options' => ['X', 'E', 'Z', 'A'], 'correct_option' => 1, 'explanation' => 'The most frequent ciphertext letter likely maps to E, the most common English letter.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.3],
                            ['question' => 'What additional technique helps when single-letter frequency is ambiguous?', 'options' => ['Brute force', 'Bigram and trigram analysis', 'Key exchange', 'Hashing'], 'correct_option' => 1, 'explanation' => 'Analyzing pairs (bigrams) and triples (trigrams) of letters provides more context for breaking ciphers.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.65],
                        ]],
                    ]],
                ],
            ],

            // â”€â”€ Path 2: Modern Cryptography (intermediate â†’ advanced) â”€â”€
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
                            ['question' => 'What is the output size of SHA-256?', 'options' => ['128 bits', '160 bits', '256 bits', '512 bits'], 'correct_option' => 2, 'explanation' => 'SHA-256 produces a 256-bit digest.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                            ['question' => 'Which property means finding two inputs with the same hash is hard?', 'options' => ['Preimage resistance', 'Collision resistance', 'Avalanche effect', 'Key derivation'], 'correct_option' => 1, 'explanation' => 'Collision resistance prevents finding two inputs with the same hash.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                            ['question' => 'What does the avalanche effect mean in hashing?', 'options' => ['Output is always the same', 'A small input change causes a large output change', 'The hash gets longer with more input', 'Multiple inputs produce the same hash'], 'correct_option' => 1, 'explanation' => 'The avalanche effect means even a 1-bit change in input produces a drastically different hash.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.4],
                            ['question' => 'Preimage resistance means it is hard to...', 'options' => ['Find two inputs with the same hash', 'Find the input given only the hash output', 'Generate a hash quickly', 'Store the hash securely'], 'correct_option' => 1, 'explanation' => 'Preimage resistance means given a hash value, it is computationally infeasible to find the original input.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'Which hash algorithm is considered broken and should not be used for security?', 'options' => ['SHA-256', 'SHA-3', 'MD5', 'BLAKE2'], 'correct_option' => 2, 'explanation' => 'MD5 has known collision vulnerabilities and is considered cryptographically broken.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.3],
                            ['question' => 'Hash functions are deterministic, meaning...', 'options' => ['They produce random output', 'The same input always produces the same output', 'They require a key', 'Output length varies'], 'correct_option' => 1, 'explanation' => 'A deterministic function always produces the same output for the same input.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                            ['question' => 'What is a common use of hash functions in password storage?', 'options' => ['Encrypting passwords reversibly', 'Storing password hashes with salt', 'Compressing passwords', 'Converting passwords to binary'], 'correct_option' => 1, 'explanation' => 'Passwords are hashed with a salt so the original password cannot be recovered from the stored value.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.6],
                            ['question' => 'SHA-3 is based on which construction?', 'options' => ['Merkle-DamgÃ¥rd', 'Sponge construction', 'Feistel network', 'Substitution-permutation'], 'correct_option' => 1, 'explanation' => 'SHA-3 uses the Keccak sponge construction, unlike SHA-2 which uses Merkle-DamgÃ¥rd.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.75],
                        ]],
                    ]],
                    ['slug' => 'symmetric-vs-asymmetric-encryption', 'title' => 'Symmetric vs Asymmetric Encryption', 'description' => 'Compare AES and RSA, and learn when to use each.', 'tasks' => [
                        ['type' => 'quiz', 'title' => 'Quiz: Encryption Strategy', 'minutes' => 9, 'questions' => [
                            ['question' => 'Which algorithm is symmetric?', 'options' => ['RSA', 'AES', 'ECC', 'DSA'], 'correct_option' => 1, 'explanation' => 'AES is a symmetric encryption algorithm.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                            ['question' => 'Asymmetric encryption uses how many keys?', 'options' => ['1', '2', '3', '4'], 'correct_option' => 1, 'explanation' => 'Asymmetric encryption uses a public and private key pair.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                            ['question' => 'Which is faster for bulk data encryption?', 'options' => ['RSA', 'Symmetric encryption (e.g., AES)', 'Diffie-Hellman', 'Digital signatures'], 'correct_option' => 1, 'explanation' => 'Symmetric encryption is much faster than asymmetric and is used for bulk data.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.4],
                            ['question' => 'In hybrid encryption, asymmetric crypto is used to...', 'options' => ['Encrypt all the data', 'Exchange the symmetric key', 'Hash the message', 'Compress the plaintext'], 'correct_option' => 1, 'explanation' => 'Hybrid encryption uses asymmetric crypto to securely exchange a symmetric key, then encrypts data with the symmetric key.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.65],
                            ['question' => 'What key size does AES-256 use?', 'options' => ['128 bits', '192 bits', '256 bits', '512 bits'], 'correct_option' => 2, 'explanation' => 'AES-256 uses a 256-bit key for encryption.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                            ['question' => 'Which problem makes RSA secure?', 'options' => ['Discrete logarithm', 'Integer factorization', 'Hash collision', 'Knapsack problem'], 'correct_option' => 1, 'explanation' => 'RSA security relies on the difficulty of factoring large composite numbers.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.7],
                            ['question' => 'Diffie-Hellman is used for...', 'options' => ['Encrypting data', 'Key exchange', 'Digital signatures', 'Hashing'], 'correct_option' => 1, 'explanation' => 'Diffie-Hellman allows two parties to establish a shared secret over an insecure channel.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'Which mode of AES should NOT be used for encrypting multiple blocks?', 'options' => ['CBC', 'CTR', 'ECB', 'GCM'], 'correct_option' => 2, 'explanation' => 'ECB mode encrypts each block independently, revealing patterns in the plaintext.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.75],
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
                            ['question' => 'What is the root of a Merkle tree?', 'options' => ['A leaf hash', 'The combined hash of all data', 'A random nonce', 'The block header'], 'correct_option' => 1, 'explanation' => 'The Merkle root is the hash that summarizes all transactions.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                            ['question' => 'What is the main advantage of a Merkle tree for data verification?', 'options' => ['It encrypts data', 'It allows efficient proof of inclusion', 'It compresses data', 'It speeds up mining'], 'correct_option' => 1, 'explanation' => 'Merkle trees allow verifying that a specific piece of data is included without downloading the entire dataset.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                            ['question' => 'In a Merkle tree with 8 leaves, how many levels does the tree have?', 'options' => ['2', '3', '4', '8'], 'correct_option' => 2, 'explanation' => 'A binary Merkle tree with 8 leaves has log2(8)+1 = 4 levels (including root and leaves).', 'difficulty_level' => 'hard', 'difficulty_score' => 0.7],
                            ['question' => 'A Merkle proof for one transaction requires how many hashes?', 'options' => ['All hashes in the tree', 'Only the sibling hashes along the path to root', 'Just the root hash', 'Half of all hashes'], 'correct_option' => 1, 'explanation' => 'A Merkle proof only needs the sibling hashes along the path from the leaf to the root â€” O(log n) hashes.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.65],
                            ['question' => 'If one leaf in a Merkle tree changes, which hashes are affected?', 'options' => ['Only the leaf hash', 'All hashes in the tree', 'The leaf hash and all ancestors up to the root', 'No hashes change'], 'correct_option' => 2, 'explanation' => 'Changing a leaf affects its hash and all parent hashes up to the root.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'Merkle trees are used in Bitcoin to...', 'options' => ['Mine new coins', 'Verify transactions efficiently', 'Generate private keys', 'Encrypt wallet data'], 'correct_option' => 1, 'explanation' => 'Bitcoin uses Merkle trees in block headers to efficiently verify transaction inclusion.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.3],
                        ]],
                    ]],
                    ['slug' => 'proof-of-work', 'title' => 'Proof of Work', 'description' => 'Understand the mining puzzle and its role in consensus.', 'tasks' => [
                        ['type' => 'read', 'title' => 'Reading: PoW vs PoS', 'minutes' => 12],
                        ['type' => 'video', 'title' => 'Video: Mining a Block', 'minutes' => 15],
                    ]],
                    ['slug' => 'elliptic-curve-basics', 'title' => 'Elliptic Curve Basics', 'description' => 'Introduction to ECC and its use in Bitcoin and Ethereum.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: ECC for Beginners', 'minutes' => 16],
                        ['type' => 'quiz', 'title' => 'Quiz: ECC Fundamentals', 'minutes' => 8, 'questions' => [
                            ['question' => 'Which curve does Bitcoin use?', 'options' => ['secp256k1', 'Curve25519', 'P-256', 'Ed25519'], 'correct_option' => 0, 'explanation' => 'Bitcoin uses the secp256k1 elliptic curve.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.4],
                            ['question' => 'ECC provides equivalent security to RSA with...', 'options' => ['Larger keys', 'Smaller keys', 'Same size keys', 'No keys'], 'correct_option' => 1, 'explanation' => 'ECC achieves equivalent security with much smaller key sizes.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                            ['question' => 'What mathematical problem makes ECC secure?', 'options' => ['Integer factorization', 'Elliptic curve discrete logarithm problem', 'Knapsack problem', 'Traveling salesman problem'], 'correct_option' => 1, 'explanation' => 'ECC security is based on the difficulty of the elliptic curve discrete logarithm problem (ECDLP).', 'difficulty_level' => 'hard', 'difficulty_score' => 0.7],
                            ['question' => 'A 256-bit ECC key provides security comparable to which RSA key size?', 'options' => ['512 bits', '1024 bits', '2048 bits', '3072 bits'], 'correct_option' => 3, 'explanation' => 'A 256-bit ECC key provides security roughly equivalent to a 3072-bit RSA key.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.75],
                            ['question' => 'In ECC, a public key is derived from...', 'options' => ['A random hash', 'Multiplying the private key by the generator point', 'The block hash', 'A certificate authority'], 'correct_option' => 1, 'explanation' => 'The public key is the result of scalar multiplication of the private key with the curve generator point.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.8],
                            ['question' => 'Which signature scheme uses elliptic curves?', 'options' => ['RSA', 'DSA', 'ECDSA', 'HMAC'], 'correct_option' => 2, 'explanation' => 'ECDSA (Elliptic Curve Digital Signature Algorithm) is the EC-based signature scheme.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                            ['question' => 'Curve25519 is commonly used for...', 'options' => ['Mining', 'Key exchange (X25519)', 'Password hashing', 'Data compression'], 'correct_option' => 1, 'explanation' => 'Curve25519 is widely used for Diffie-Hellman key exchange (X25519) in protocols like TLS 1.3.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.55],
                            ['question' => 'What is the "point at infinity" in ECC?', 'options' => ['The largest point on the curve', 'The identity element for point addition', 'A security vulnerability', 'The private key'], 'correct_option' => 1, 'explanation' => 'The point at infinity serves as the identity element in elliptic curve group operations.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.85],
                        ]],
                    ]],
                ],
            ],

            // â”€â”€ Path 3: Applied Security (advanced) â”€â”€
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
                            ['question' => 'What does a CA sign?', 'options' => ['Private keys', 'Certificates', 'Passwords', 'Tokens'], 'correct_option' => 1, 'explanation' => 'A Certificate Authority signs digital certificates.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                            ['question' => 'What is a CRL?', 'options' => ['Certificate Revocation List', 'Crypto Resource Library', 'Central Root Ledger', 'Cipher Rotation Log'], 'correct_option' => 0, 'explanation' => 'CRL is a list of revoked certificates published by the CA.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.4],
                            ['question' => 'What is the purpose of a root CA?', 'options' => ['Encrypt all web traffic', 'Serve as the trust anchor in a certificate chain', 'Generate private keys for users', 'Monitor network traffic'], 'correct_option' => 1, 'explanation' => 'The root CA is the ultimate trust anchor â€” all certificates in the chain trace back to it.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                            ['question' => 'What format are most web certificates in?', 'options' => ['PGP', 'X.509', 'JSON Web Token', 'PKCS#7'], 'correct_option' => 1, 'explanation' => 'X.509 is the standard format for public key certificates used in TLS/SSL.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'OCSP is an alternative to CRL for...', 'options' => ['Encrypting certificates', 'Checking certificate revocation status in real-time', 'Generating new certificates', 'Compressing certificate chains'], 'correct_option' => 1, 'explanation' => 'OCSP (Online Certificate Status Protocol) provides real-time certificate revocation checking.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.65],
                            ['question' => 'What happens when a CA is compromised?', 'options' => ['Nothing changes', 'All certificates it issued become untrusted', 'Only expired certificates are affected', 'The private keys are automatically rotated'], 'correct_option' => 1, 'explanation' => 'A compromised CA means all certificates it issued can no longer be trusted.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'Certificate pinning helps prevent...', 'options' => ['DDoS attacks', 'Man-in-the-middle attacks using rogue certificates', 'SQL injection', 'Brute force attacks'], 'correct_option' => 1, 'explanation' => 'Certificate pinning ensures the client only accepts specific certificates, preventing MITM with rogue certs.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.7],
                            ['question' => 'A self-signed certificate is signed by...', 'options' => ['A trusted CA', 'The entity itself', 'The browser vendor', 'The DNS provider'], 'correct_option' => 1, 'explanation' => 'A self-signed certificate is signed by the same entity it identifies, not by a trusted CA.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.3],
                        ]],
                    ]],
                    ['slug' => 'zero-knowledge-proofs', 'title' => 'Zero Knowledge Proofs', 'description' => 'Prove knowledge without revealing the secret itself.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: ZKP Explained Simply', 'minutes' => 20],
                        ['type' => 'quiz', 'title' => 'Quiz: ZKP Concepts', 'minutes' => 10, 'questions' => [
                            ['question' => 'In a ZKP, the prover reveals...', 'options' => ['The secret', 'Nothing about the secret', 'Half the secret', 'An encrypted secret'], 'correct_option' => 1, 'explanation' => 'Zero knowledge means the verifier learns nothing beyond the validity of the statement.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                            ['question' => 'Which property ensures the prover cannot cheat in a ZKP?', 'options' => ['Completeness', 'Soundness', 'Zero knowledge', 'Efficiency'], 'correct_option' => 1, 'explanation' => 'Soundness ensures that a dishonest prover cannot convince the verifier of a false statement.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'The classic "Ali Baba cave" example demonstrates...', 'options' => ['Encryption', 'A zero-knowledge proof concept', 'Key exchange', 'Digital signatures'], 'correct_option' => 1, 'explanation' => 'The Ali Baba cave is a famous analogy for explaining how ZKPs work.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.3],
                            ['question' => 'zk-SNARKs stands for...', 'options' => ['Zero-Knowledge Secure Network Authentication', 'Zero-Knowledge Succinct Non-interactive Arguments of Knowledge', 'Zero-Key Symmetric Notation and Routing', 'Zero-Knowledge Standard Network Access Rules'], 'correct_option' => 1, 'explanation' => 'zk-SNARKs are Zero-Knowledge Succinct Non-interactive Arguments of Knowledge.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.75],
                            ['question' => 'Which blockchain uses ZKPs for privacy?', 'options' => ['Bitcoin', 'Ethereum (only)', 'Zcash', 'Dogecoin'], 'correct_option' => 2, 'explanation' => 'Zcash uses zk-SNARKs to enable private transactions on its blockchain.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                            ['question' => 'Completeness in ZKP means...', 'options' => ['The proof is always short', 'An honest prover can always convince an honest verifier', 'The verifier learns the secret', 'The proof can be reused'], 'correct_option' => 1, 'explanation' => 'Completeness guarantees that if the statement is true, an honest prover can convince the verifier.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.65],
                        ]],
                    ]],
                ],
            ],

            // â”€â”€ Path 4: Post-Quantum Cryptography (advanced) â”€â”€
            [
                'slug' => 'post-quantum-cryptography',
                'title' => 'Post-Quantum Cryptography',
                'summary' => 'Prepare for the quantum computing era by understanding lattice-based, hash-based, and code-based cryptographic algorithms that resist quantum attacks.',
                'estimated_minutes' => 200,
                'sort_order' => 6,
                'category' => 'Post-Quantum',
                'difficulty' => 'advanced',
                'path_position' => 6,
                'prerequisite_slug' => 'network-security-essentials',
                'lessons' => [
                    ['slug' => 'the-quantum-threat', 'title' => 'The Quantum Threat', 'description' => 'Understand why quantum computers threaten RSA, ECC, and current public-key cryptography.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: The Quantum Computing Threat to Cryptography', 'minutes' => 18, 'video_url' => 'https://youtu.be/6H_9l9N3IXU'],
                        ['type' => 'quiz', 'title' => 'Quiz: Quantum Threat Landscape', 'minutes' => 10, 'questions' => [
                            ['question' => 'Which algorithm allows quantum computers to efficiently factor large integers?', 'options' => ['Grover\'s algorithm', 'Shor\'s algorithm', 'Dijkstra\'s algorithm', 'Euclid\'s algorithm'], 'correct_option' => 1, 'explanation' => 'Shor\'s algorithm (1994) can factor large integers in polynomial time on a quantum computer, breaking RSA.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                            ['question' => 'What speedup does Grover\'s algorithm provide for brute-force search?', 'options' => ['Exponential', 'Quadratic', 'Cubic', 'Logarithmic'], 'correct_option' => 1, 'explanation' => 'Grover\'s algorithm provides a quadratic speedup, reducing AES-128 effective security from 128 bits to 64 bits.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                            ['question' => 'Which of the following algorithms is NOT broken by Shor\'s algorithm?', 'options' => ['RSA-2048', 'ECDSA', 'AES-256', 'Diffie-Hellman'], 'correct_option' => 2, 'explanation' => 'AES-256 is a symmetric algorithm. Shor\'s algorithm targets asymmetric algorithms based on factoring and discrete logarithms.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'What does "Harvest Now, Decrypt Later" (HNDL) mean?', 'options' => ['Encrypting data for future use', 'Intercepting encrypted data today to decrypt with future quantum computers', 'A quantum key distribution protocol', 'A type of side-channel attack'], 'correct_option' => 1, 'explanation' => 'HNDL attacks involve storing encrypted communications now and decrypting them once quantum computers become available.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.4],
                            ['question' => 'When did NIST publish the first PQC standards (FIPS 203/204/205)?', 'options' => ['2020', '2022', 'August 2024', '2026'], 'correct_option' => 2, 'explanation' => 'NIST published FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA) in August 2024.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.65],
                            ['question' => 'What is a Cryptographically Relevant Quantum Computer (CRQC)?', 'options' => ['Any quantum computer', 'A quantum computer capable of breaking RSA-2048', 'A quantum computer used for key distribution', 'A classical computer simulating quantum algorithms'], 'correct_option' => 1, 'explanation' => 'A CRQC is a quantum computer powerful enough to run Shor\'s algorithm against real-world cryptographic parameters like RSA-2048.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.7],
                            ['question' => 'To maintain 128-bit security against Grover\'s algorithm, what AES key size is needed?', 'options' => ['AES-128', 'AES-192', 'AES-256', 'AES-512'], 'correct_option' => 2, 'explanation' => 'Grover\'s algorithm halves the effective security, so AES-256 provides 128-bit security against quantum attacks.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'How many initial submissions did NIST receive for the PQC standardization process?', 'options' => ['26', '52', '69', '82'], 'correct_option' => 3, 'explanation' => 'NIST received 82 initial submissions in 2016, which were narrowed down through multiple evaluation rounds.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.8],
                        ]],
                    ]],
                    ['slug' => 'lattice-based-cryptography', 'title' => 'Lattice-Based Cryptography', 'description' => 'Learn about LWE, CRYSTALS-Kyber, and CRYSTALS-Dilithium â€” the core NIST PQC standards.', 'tasks' => [
                        ['type' => 'read', 'title' => 'Reading: Lattice Problems and NIST Standards', 'minutes' => 20],
                        ['type' => 'quiz', 'title' => 'Quiz: Lattice-Based Cryptography', 'minutes' => 10, 'questions' => [
                            ['question' => 'What does LWE stand for?', 'options' => ['Linear Weight Encryption', 'Learning With Errors', 'Lattice Width Estimation', 'Logarithmic Witness Extraction'], 'correct_option' => 1, 'explanation' => 'Learning With Errors (LWE) is the foundational hard problem for lattice-based cryptography, introduced by Oded Regev in 2005.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                            ['question' => 'CRYSTALS-Kyber (FIPS 203) is used for which purpose?', 'options' => ['Digital signatures', 'Key Encapsulation Mechanism (KEM)', 'Hash-based signatures', 'Password hashing'], 'correct_option' => 1, 'explanation' => 'Kyber is a KEM â€” it securely establishes a shared secret between two parties, replacing RSA/ECDH key exchange.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                            ['question' => 'CRYSTALS-Dilithium (FIPS 204) is used for which purpose?', 'options' => ['Key encapsulation', 'Symmetric encryption', 'Digital signatures', 'Hash computation'], 'correct_option' => 2, 'explanation' => 'Dilithium is a digital signature scheme that replaces RSA signatures and ECDSA with quantum-resistant alternatives.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                            ['question' => 'What makes the LWE problem hard to solve?', 'options' => ['Large prime numbers', 'The addition of small random errors to linear equations', 'Elliptic curve operations', 'Hash function collisions'], 'correct_option' => 1, 'explanation' => 'Without errors, LWE would be simple linear algebra. The small error terms make it computationally hard, believed equivalent to worst-case lattice problems.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'What is the approximate public key size of Kyber-768 (NIST Level 3)?', 'options' => ['64 bytes', '256 bytes', '1,184 bytes', '261,120 bytes'], 'correct_option' => 2, 'explanation' => 'Kyber-768 has a public key of 1,184 bytes â€” larger than RSA-2048 (256 bytes) but still practical for most applications.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.7],
                            ['question' => 'Module-LWE (used by Kyber and Dilithium) is a variant that...', 'options' => ['Uses random matrices only', 'Uses small matrices of polynomial ring elements', 'Eliminates the error term', 'Requires quantum computers to compute'], 'correct_option' => 1, 'explanation' => 'Module-LWE uses small matrices of ring elements, providing a balance between the efficiency of Ring-LWE and the security of standard LWE.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.75],
                            ['question' => 'Compared to RSA key exchange, Kyber is...', 'options' => ['Slower but has smaller keys', 'Faster with larger keys', 'Slower with larger keys', 'Faster with smaller keys'], 'correct_option' => 1, 'explanation' => 'Kyber is orders of magnitude faster than RSA for key exchange, though its public keys are larger (1,184 bytes vs 256 bytes for RSA-2048).', 'difficulty_level' => 'medium', 'difficulty_score' => 0.55],
                            ['question' => 'Which NIST security level does Kyber-768 target?', 'options' => ['Level 1 (AES-128 equivalent)', 'Level 3 (AES-192 equivalent)', 'Level 5 (AES-256 equivalent)', 'Level 2 (SHA-256 equivalent)'], 'correct_option' => 1, 'explanation' => 'Kyber-768 targets NIST Security Level 3, providing security equivalent to AES-192.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.65],
                        ]],
                    ]],
                    ['slug' => 'hash-and-code-based-schemes', 'title' => 'Hash-Based and Code-Based Schemes', 'description' => 'Explore SPHINCS+, Merkle signatures, and the McEliece cryptosystem.', 'tasks' => [
                        ['type' => 'read', 'title' => 'Reading: Alternative PQC Families', 'minutes' => 18],
                        ['type' => 'quiz', 'title' => 'Quiz: Hash-Based and Code-Based Crypto', 'minutes' => 8, 'questions' => [
                            ['question' => 'SPHINCS+ (FIPS 205) is what type of signature scheme?', 'options' => ['Lattice-based', 'Code-based', 'Hash-based stateless', 'Multivariate'], 'correct_option' => 2, 'explanation' => 'SPHINCS+ is a stateless hash-based digital signature scheme, relying only on the security of hash functions.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                            ['question' => 'What is the key advantage of stateless over stateful signature schemes?', 'options' => ['Smaller signatures', 'No risk of catastrophic key reuse', 'Faster signing', 'Smaller public keys'], 'correct_option' => 1, 'explanation' => 'Stateful schemes like XMSS require tracking used keys â€” reusing a one-time key completely breaks security. Stateless SPHINCS+ eliminates this risk.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'What is the primary drawback of the McEliece cryptosystem?', 'options' => ['Slow encryption', 'Small key sizes', 'Enormous public keys (~261 KB)', 'Vulnerability to quantum attacks'], 'correct_option' => 2, 'explanation' => 'McEliece public keys are approximately 261 KB â€” impractically large for many protocols like TLS.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                            ['question' => 'SPHINCS+ public keys are approximately...', 'options' => ['32-64 bytes', '1,184 bytes', '261,120 bytes', '4,096 bytes'], 'correct_option' => 0, 'explanation' => 'SPHINCS+ has remarkably small public keys (32-64 bytes) â€” the smallest of any PQC signature scheme. The trade-off is large signatures (7-30 KB).', 'difficulty_level' => 'hard', 'difficulty_score' => 0.65],
                            ['question' => 'The McEliece cryptosystem has resisted attacks for how many years?', 'options' => ['10 years', '25 years', '35 years', 'Over 45 years (since 1978)'], 'correct_option' => 3, 'explanation' => 'McEliece was proposed in 1978 and has withstood over 45 years of classical and quantum cryptanalysis.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'Why is SPHINCS+ considered a critical backup to lattice-based schemes?', 'options' => ['It is faster than Dilithium', 'It has smaller signatures', 'Its security relies on different assumptions (hash functions only)', 'It was standardized first'], 'correct_option' => 2, 'explanation' => 'SPHINCS+ relies only on hash function security â€” if lattice assumptions are ever broken, SPHINCS+ provides an independent fallback.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.7],
                        ]],
                    ]],
                    ['slug' => 'migrating-to-post-quantum', 'title' => 'Migrating to Post-Quantum Security', 'description' => 'Learn practical strategies for transitioning to quantum-resistant cryptography.', 'tasks' => [
                        ['type' => 'video', 'title' => 'Video: PQC Migration in Practice', 'minutes' => 16],
                        ['type' => 'quiz', 'title' => 'Quiz: PQC Migration Strategies', 'minutes' => 8, 'questions' => [
                            ['question' => 'What is the primary benefit of hybrid encryption (classical + PQC)?', 'options' => ['Faster performance', 'Security holds if either algorithm is secure', 'Smaller key sizes', 'Simpler implementation'], 'correct_option' => 1, 'explanation' => 'Hybrid encryption combines classical and PQC algorithms so the system remains secure even if one is broken â€” defense in depth.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.3],
                            ['question' => 'What is "crypto agility"?', 'options' => ['Using the fastest available algorithm', 'The ability to switch cryptographic algorithms without architectural changes', 'A quantum computing technique', 'Encrypting data multiple times'], 'correct_option' => 1, 'explanation' => 'Crypto agility means designing systems that can swap algorithms via configuration, essential for adapting to evolving PQC standards.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                            ['question' => 'Which company deployed hybrid PQC key exchange (X25519+Kyber) in its messaging app in 2023?', 'options' => ['WhatsApp', 'Signal', 'Telegram', 'Discord'], 'correct_option' => 1, 'explanation' => 'Signal integrated PQXDH (Post-Quantum Extended Diffie-Hellman) combining X25519 with CRYSTALS-Kyber in September 2023.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                            ['question' => 'In a hybrid TLS 1.3 key exchange, the shared secret is derived from...', 'options' => ['Only the PQC algorithm', 'Only the classical algorithm', 'Both classical and PQC shared secrets combined', 'A pre-shared key'], 'correct_option' => 2, 'explanation' => 'Hybrid key exchange combines both shared secrets (e.g., X25519 + Kyber) through a KDF, ensuring security if either algorithm holds.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.65],
                            ['question' => 'Which organization should be the primary reference for PQC migration guidance?', 'options' => ['IEEE', 'NIST', 'W3C', 'IETF'], 'correct_option' => 1, 'explanation' => 'NIST leads the PQC standardization effort and provides migration guidelines through FIPS 203/204/205 and supporting publications.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.3],
                            ['question' => 'What is the recommended first step in a PQC migration?', 'options' => ['Replace all RSA keys immediately', 'Conduct a cryptographic inventory of all systems', 'Wait for quantum computers to arrive', 'Switch to symmetric-only encryption'], 'correct_option' => 1, 'explanation' => 'The first step is inventorying all cryptographic assets to understand what algorithms are in use and prioritize migration by risk.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.4],
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
                $lessonContent = LessonContentProvider::get($lessonBp['slug']);

                $lesson = Lesson::query()->updateOrCreate(
                    ['course_id' => $course->id, 'slug' => $lessonBp['slug']],
                    [
                        'title' => $lessonBp['title'],
                        'description' => $lessonBp['description'] ?? null,
                        'content' => $lessonContent['content'] ?? (($lessonBp['description'] ?? $lessonBp['title']).' â€” detailed lesson content.'),
                        'learning_objectives' => $lessonContent['learning_objectives'] ?? null,
                        'key_concepts' => $lessonContent['key_concepts'] ?? null,
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
                                'difficulty_level' => $q['difficulty_level'] ?? null,
                                'difficulty_score' => $q['difficulty_score'] ?? null,
                            ]);
                        }
                    }
                }
            }

            return $course;
        })->values();

        $this->command->info('âœ“ '.count($blueprints).' courses with learning path created.');

        return $courses;
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  Challenges
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
                'prompt' => 'Test your knowledge of the Caesar cipher â€” shifts, decryption, and history.',
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
                    ['type' => 'mcq', 'question' => 'What is the Caesar cipher shift for FUBSWHU â†’ CRYPTER?', 'options' => ['1', '2', '3', '4'], 'correct_answer' => '3', 'explanation' => 'Each letter is shifted 3 positions backward.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                    ['type' => 'true_false', 'question' => 'The Caesar cipher is a substitution cipher.', 'correct_answer' => 'True', 'explanation' => 'It substitutes each letter with another letter a fixed number of positions away.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                    ['type' => 'mcq', 'question' => 'How many possible shifts does a Caesar cipher have (English)?', 'options' => ['24', '25', '26', '52'], 'correct_answer' => '25', 'explanation' => 'There are 25 non-trivial shifts.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                    ['type' => 'fill_blank', 'question' => 'Caesar cipher is also known as a _____ cipher.', 'correct_answer' => 'shift', 'explanation' => 'It shifts each letter by a fixed amount.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.3],
                    ['type' => 'mcq', 'question' => 'Which Roman leader famously used the Caesar cipher?', 'options' => ['Augustus', 'Julius Caesar', 'Nero', 'Marcus Aurelius'], 'correct_answer' => 'Julius Caesar', 'explanation' => 'Julius Caesar used it to communicate with his generals.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                    ['type' => 'true_false', 'question' => 'A Caesar cipher with shift 13 is called ROT13.', 'correct_answer' => 'True', 'explanation' => 'ROT13 is a special case of Caesar cipher with shift 13.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.4],
                    ['type' => 'text', 'question' => 'Decrypt "KHOOR" with shift 3.', 'correct_answer' => 'HELLO', 'explanation' => 'Kâ†’H, Hâ†’E, Oâ†’L, Oâ†’L, Râ†’O = HELLO.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.55],
                    ['type' => 'mcq', 'question' => 'What attack easily breaks a Caesar cipher?', 'options' => ['Brute force', 'Man-in-the-middle', 'SQL injection', 'Buffer overflow'], 'correct_answer' => 'Brute force', 'explanation' => 'With only 25 possible keys, brute force is trivial.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
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
                    ['type' => 'mcq', 'question' => 'The Vigenere cipher is classified as which type?', 'options' => ['Monoalphabetic', 'Polyalphabetic', 'Transposition', 'Stream'], 'correct_answer' => 'Polyalphabetic', 'explanation' => 'It uses multiple substitution alphabets.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.4],
                    ['type' => 'true_false', 'question' => 'The Vigenere cipher uses a keyword to determine shifts.', 'correct_answer' => 'True', 'explanation' => 'Each letter of the keyword determines the shift.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                    ['type' => 'mcq', 'question' => 'Which method can break the Vigenere cipher?', 'options' => ['Kasiski examination', 'Rainbow tables', 'Padding oracle', 'Side-channel'], 'correct_answer' => 'Kasiski examination', 'explanation' => 'Kasiski examination finds repeated sequences to determine key length.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.75],
                    ['type' => 'fill_blank', 'question' => 'The Vigenere cipher was considered "le chiffre _____".', 'correct_answer' => 'indÃ©chiffrable', 'explanation' => 'It was called "le chiffre indÃ©chiffrable" for centuries.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.85],
                    ['type' => 'mcq', 'question' => 'If the key is "KEY" and plaintext is "HELLO", what is the first encrypted letter?', 'options' => ['R', 'S', 'T', 'U'], 'correct_answer' => 'R', 'explanation' => 'H(7) + K(10) = R(17).', 'difficulty_level' => 'hard', 'difficulty_score' => 0.7],
                    ['type' => 'text', 'question' => 'What technique analyzes letter frequency to break Vigenere?', 'correct_answer' => 'frequency analysis', 'explanation' => 'After determining key length, frequency analysis breaks each Caesar cipher independently.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.55],
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
                    ['type' => 'mcq', 'question' => 'What is the output size of SHA-256?', 'options' => ['128 bits', '160 bits', '256 bits', '512 bits'], 'correct_answer' => '256 bits', 'explanation' => 'SHA-256 produces a 256-bit digest.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.3],
                    ['type' => 'true_false', 'question' => 'SHA-256 is a member of the SHA-2 family.', 'correct_answer' => 'True', 'explanation' => 'SHA-2 includes SHA-224, SHA-256, SHA-384, and SHA-512.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                    ['type' => 'fill_blank', 'question' => 'A small change in input causes a large change in hash output, known as the _____ effect.', 'correct_answer' => 'avalanche', 'explanation' => 'The avalanche effect ensures even a 1-bit change flips ~50% of output bits.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.55],
                    ['type' => 'true_false', 'question' => 'SHA-256 can be reversed to recover the original input.', 'correct_answer' => 'False', 'explanation' => 'Hash functions are one-way; you cannot reverse them.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                    ['type' => 'mcq', 'question' => 'SHA-256 is commonly used in which cryptocurrency?', 'options' => ['Ethereum', 'Bitcoin', 'Monero', 'Cardano'], 'correct_answer' => 'Bitcoin', 'explanation' => 'Bitcoin uses SHA-256 for its proof-of-work mining algorithm.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                    ['type' => 'text', 'question' => 'What does SHA stand for?', 'correct_answer' => 'Secure Hash Algorithm', 'explanation' => 'SHA = Secure Hash Algorithm, designed by NSA.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
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
                    ['type' => 'mcq', 'question' => 'What is the recommended RSA padding scheme for encryption?', 'options' => ['PKCS#1 v1.5', 'OAEP', 'PSS', 'No padding'], 'correct_answer' => 'OAEP', 'explanation' => 'OAEP is recommended for RSA encryption.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.7],
                    ['type' => 'true_false', 'question' => 'RSA is an asymmetric encryption algorithm.', 'correct_answer' => 'True', 'explanation' => 'RSA uses a public/private key pair.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                    ['type' => 'mcq', 'question' => 'What mathematical problem does RSA security rely on?', 'options' => ['Discrete logarithm', 'Integer factorization', 'Elliptic curve', 'Knapsack'], 'correct_answer' => 'Integer factorization', 'explanation' => 'RSA relies on the difficulty of factoring large semiprime numbers.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.75],
                    ['type' => 'fill_blank', 'question' => 'RSA stands for Rivest, Shamir, and _____.', 'correct_answer' => 'Adleman', 'explanation' => 'RSA was invented by Ron Rivest, Adi Shamir, and Leonard Adleman.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                    ['type' => 'text', 'question' => 'What is the minimum recommended RSA key size in bits?', 'correct_answer' => '2048', 'explanation' => 'NIST recommends 2048-bit RSA keys as the minimum.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.8],
                ],
            ],
            // â”€â”€ Daily challenge â”€â”€
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
                    ['type' => 'mcq', 'question' => 'What is the process of converting plaintext to ciphertext?', 'options' => ['Decryption', 'Encryption', 'Hashing', 'Encoding'], 'correct_answer' => 'Encryption', 'explanation' => 'Encryption converts plaintext to ciphertext using a key.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.2],
                    ['type' => 'true_false', 'question' => 'AES is a symmetric encryption algorithm.', 'correct_answer' => 'True', 'explanation' => 'AES uses the same key for encryption and decryption.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                    ['type' => 'mcq', 'question' => 'Which key size is NOT valid for AES?', 'options' => ['128', '192', '256', '512'], 'correct_answer' => '512', 'explanation' => 'AES supports 128, 192, and 256-bit keys only.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                ],
            ],
            // â”€â”€ PQC Challenge â”€â”€
            [
                'slug' => 'pqc-readiness-check',
                'title' => 'PQC Readiness Check',
                'prompt' => 'Test your knowledge of post-quantum cryptography and the quantum threat landscape.',
                'hint' => 'Think about which algorithms are quantum-resistant and why.',
                'expected_answer' => 'lattice',
                'difficulty' => 'advanced',
                'is_published' => true,
                'is_daily' => false,
                'time_start' => now()->subDays(1),
                'time_end' => now()->addDays(60),
                'time_limit_seconds' => 25,
                'questions_per_session' => 5,
                'max_points_per_question' => 10,
                'questions' => [
                    ['type' => 'mcq', 'question' => 'Shor\'s algorithm primarily breaks which type of cryptography?', 'options' => ['Symmetric encryption (AES)', 'Hash functions (SHA-256)', 'Public-key cryptography (RSA, ECC)', 'Message authentication codes (HMAC)'], 'correct_answer' => 'Public-key cryptography (RSA, ECC)', 'explanation' => 'Shor\'s algorithm efficiently solves integer factorization and discrete logarithm problems, breaking RSA, ECC, and Diffie-Hellman.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.3],
                    ['type' => 'true_false', 'question' => 'Grover\'s algorithm provides an exponential speedup for brute-force search.', 'correct_answer' => 'False', 'explanation' => 'Grover\'s algorithm provides a quadratic (not exponential) speedup, reducing n-bit security to n/2 bits.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                    ['type' => 'mcq', 'question' => 'CRYSTALS-Kyber (FIPS 203) is designed for which cryptographic function?', 'options' => ['Digital signatures', 'Key Encapsulation Mechanism (KEM)', 'Hash-based signatures', 'Symmetric encryption'], 'correct_answer' => 'Key Encapsulation Mechanism (KEM)', 'explanation' => 'Kyber is a KEM that securely establishes shared secrets between parties, replacing RSA and ECDH key exchange.', 'difficulty_level' => 'medium', 'difficulty_score' => 0.45],
                    ['type' => 'fill_blank', 'question' => 'CRYSTALS-Dilithium (FIPS 204) is a post-quantum _____ scheme.', 'correct_answer' => 'digital signature', 'explanation' => 'Dilithium is a lattice-based digital signature algorithm standardized as FIPS 204 (ML-DSA).', 'difficulty_level' => 'medium', 'difficulty_score' => 0.5],
                    ['type' => 'mcq', 'question' => 'What is the primary advantage of SPHINCS+ over lattice-based signatures?', 'options' => ['Smaller signatures', 'Faster signing speed', 'Security relies only on hash function properties', 'Smaller public keys'], 'correct_answer' => 'Security relies only on hash function properties', 'explanation' => 'SPHINCS+ derives security entirely from hash functions â€” the most conservative and well-understood assumption in post-quantum cryptography.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.7],
                    ['type' => 'true_false', 'question' => 'Hybrid encryption combines classical and post-quantum algorithms for defense in depth.', 'correct_answer' => 'True', 'explanation' => 'Hybrid encryption ensures security holds if either the classical or PQC algorithm remains secure, providing a safe migration path.', 'difficulty_level' => 'easy', 'difficulty_score' => 0.25],
                    ['type' => 'mcq', 'question' => 'Compared to RSA-2048, Kyber-768 public keys are approximately...', 'options' => ['Half the size', 'The same size', '4-5 times larger', '1000 times larger'], 'correct_answer' => '4-5 times larger', 'explanation' => 'Kyber-768 public keys are ~1,184 bytes vs RSA-2048 at ~256 bytes â€” about 4.6Ã— larger, but still practical.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.75],
                    ['type' => 'text', 'question' => 'In what year did NIST publish the final PQC standards FIPS 203, 204, and 205?', 'correct_answer' => '2024', 'explanation' => 'NIST published FIPS 203 (ML-KEM/Kyber), FIPS 204 (ML-DSA/Dilithium), and FIPS 205 (SLH-DSA/SPHINCS+) in August 2024.', 'difficulty_level' => 'hard', 'difficulty_score' => 0.65],
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
                        'difficulty_level' => $q['difficulty_level'] ?? 'medium',
                        'difficulty_score' => $q['difficulty_score'] ?? 0.5,
                    ]);
                }
            }

            return $challenge;
        })->values();

        $this->command->info('âœ“ '.count($blueprints).' challenges created.');

        return $challenges;
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  Enrollments
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

        $this->command->info('âœ“ Enrollments created.');
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  Lesson Progress (12-month spread for learner)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        $this->command->info("âœ“ {$idx} lesson completions spread across 12 months.");
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

        $this->command->info('âœ“ '.count($rows).' member lesson progress records created.');
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  Challenge Submissions (12-month spread for learner)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        $this->command->info('âœ“ '.count($rows).' learner challenge submissions spread across 12 months.');
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

        $this->command->info('âœ“ '.count($rows).' member challenge submissions created.');
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  Lab Visits
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * @param  Collection<int, User>  $members
     */
    private function seedLabVisits(User $learner, Collection $members): void
    {
        $this->command->info('Seeding lab visits...');

        $labs = ['caesar-cipher', 'vigenere-cipher', 'sha256-hasher', 'rsa-keygen', 'aes-encryptor', 'diffie-hellman', 'lattice-cipher'];

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

        $this->command->info('âœ“ Lab visits created.');
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  Recent Daily Activity (last 7 days for weekly chart)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * Seed additional lesson completions and challenge submissions
     * in the last 7 days so the weekly earnings chart has data.
     *
     * @param  Collection<int, Course>  $courses
     * @param  Collection<int, Challenge>  $challenges
     */
    private function seedRecentDailyActivity(User $learner, Collection $courses, Collection $challenges): void
    {
        $this->command->info('Seeding recent daily activity (last 7 days)...');

        // â”€â”€ Lesson completions â”€â”€
        // The lesson_progress table has a unique (user_id, lesson_id) constraint,
        // so we can't insert duplicates. Instead, we UPDATE existing completions
        // to move some of them into the last 7 days so the weekly chart has data.
        $existingProgress = LessonProgress::query()
            ->where('user_id', $learner->id)
            ->inRandomOrder()
            ->limit(10)
            ->get();

        $lessonUpdated = 0;

        foreach ($existingProgress as $idx => $progress) {
            $dayOffset = 6 - ($idx % 7); // spread across 7 days
            $day = now()->subDays($dayOffset);
            $endTime = $dayOffset === 0 ? now()->subMinutes(5) : $day->copy()->endOfDay();

            $progress->update([
                'completed_at' => fake()->dateTimeBetween(
                    $day->copy()->startOfDay(),
                    $endTime,
                ),
            ]);
            $lessonUpdated++;
        }

        // â”€â”€ Challenge submissions â”€â”€
        // No unique constraint on (user_id, challenge_id), so we can insert freely.
        $publishedIds = $challenges->where('is_published', true)->pluck('id')->all();
        $challengeRows = [];

        if (count($publishedIds) > 0) {
            for ($dayOffset = 6; $dayOffset >= 0; $dayOffset--) {
                $day = now()->subDays($dayOffset);
                $endTime = $dayOffset === 0 ? now()->subMinutes(5) : $day->copy()->endOfDay();
                $count = fake()->numberBetween(1, 3);

                for ($i = 0; $i < $count; $i++) {
                    $isCorrect = fake()->boolean(80);
                    $challengeRows[] = [
                        'user_id' => $learner->id,
                        'challenge_id' => fake()->randomElement($publishedIds),
                        'session_id' => Str::uuid()->toString(),
                        'answer' => fake()->word(),
                        'is_correct' => $isCorrect,
                        'score' => $isCorrect ? fake()->numberBetween(30, 50) : 0,
                        'submitted_at' => fake()->dateTimeBetween(
                            $day->copy()->startOfDay(),
                            $endTime,
                        ),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }

            ChallengeSubmission::insert($challengeRows);
        }

        $this->command->info('âœ“ '.$lessonUpdated.' lesson completions moved to last 7 days + '.count($challengeRows).' challenge submissions added.');
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  Points Recalculation
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

        $this->command->info('âœ“ Points recalculated for '.count($users).' users.');
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  Badge Awarding
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

        $this->command->info("âœ“ {$totalAwarded} badges awarded across ".count($users).' users.');
    }
}

