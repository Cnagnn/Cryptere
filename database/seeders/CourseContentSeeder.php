<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CourseContentSeeder extends Seeder
{
    /**
     * Seed courses, topics (lessons), tasks, and quiz questions.
     */
    public function run(): void
    {
        $courses = $this->getCourseData();

        foreach ($courses as $sortOrder => $courseData) {
            $course = Course::create([
                'slug' => Str::slug($courseData['title']),
                'title' => $courseData['title'],
                'summary' => $courseData['summary'],
                'estimated_minutes' => $courseData['estimated_minutes'],
                'sort_order' => $sortOrder + 1,
                'is_published' => $courseData['is_published'],
                'category' => $courseData['category'] ?? null,
                'difficulty' => $courseData['difficulty'] ?? null,
            ]);

            foreach ($courseData['topics'] as $topicPosition => $topicData) {
                $lesson = Lesson::create([
                    'course_id' => $course->id,
                    'slug' => Str::slug($topicData['title']),
                    'title' => $topicData['title'],
                    'description' => $topicData['description'],
                    'content' => $topicData['content'] ?? $topicData['description'],
                    'position' => $topicPosition + 1,
                    'learning_objectives' => $topicData['learning_objectives'] ?? null,
                    'key_concepts' => $topicData['key_concepts'] ?? null,
                ]);

                foreach ($topicData['tasks'] as $taskOrder => $taskData) {
                    $task = LessonTask::create([
                        'lesson_id' => $lesson->id,
                        'title' => $taskData['title'],
                        'description' => $taskData['description'] ?? '',
                        'type' => $taskData['type'],
                        'minutes' => $taskData['minutes'],
                        'video_url' => $taskData['video_url'] ?? null,
                        'sort_order' => $taskOrder + 1,
                        'published_at' => ($courseData['is_published']) ? now() : null,
                    ]);

                    if (isset($taskData['quiz_questions'])) {
                        foreach ($taskData['quiz_questions'] as $qOrder => $questionData) {
                            QuizQuestion::create([
                                'lesson_task_id' => $task->id,
                                'question' => $questionData['question'],
                                'options' => $questionData['options'],
                                'correct_option' => $questionData['correct_option'],
                                'explanation' => $questionData['explanation'],
                                'sort_order' => $qOrder + 1,
                            ]);
                        }
                    }
                }
            }
        }
    }

    private function getCourseData(): array
    {
        return [
            // ─── Course 1: Foundations of Cryptography ────────────────────────
            [
                'title' => 'Foundations of Cryptography',
                'summary' => 'Master the fundamental concepts of cryptography including information theory, mathematical foundations, and the principles that underpin all modern encryption systems.',
                'estimated_minutes' => 180,
                'is_published' => true,
                'category' => 'fundamentals',
                'difficulty' => 'beginner',
                'topics' => [
                    [
                        'title' => 'Introduction to Information Security',
                        'description' => 'Understanding the CIA triad, threat models, and why cryptography matters in the digital age.',
                        'learning_objectives' => ['Define confidentiality, integrity, and availability', 'Identify common threat models', 'Explain the role of cryptography in security'],
                        'key_concepts' => ['CIA Triad', 'Threat Modeling', 'Defense in Depth'],
                        'tasks' => [
                            ['title' => 'What is Cryptography?', 'type' => 'video', 'minutes' => 12, 'description' => 'An overview of cryptography and its importance in modern computing.', 'video_url' => 'https://www.youtube.com/watch?v=example1'],
                            ['title' => 'The CIA Triad Explained', 'type' => 'video', 'minutes' => 8, 'description' => 'Deep dive into Confidentiality, Integrity, and Availability.'],
                            ['title' => 'Threat Models & Attack Surfaces', 'type' => 'reading', 'minutes' => 15, 'description' => 'Learn how to identify and categorize potential threats to a system.'],
                            ['title' => 'Information Security Quiz', 'type' => 'quiz', 'minutes' => 10, 'description' => 'Test your understanding of information security fundamentals.', 'quiz_questions' => [
                                ['question' => 'What does the "C" in CIA triad stand for?', 'options' => ['Cryptography', 'Confidentiality', 'Compliance', 'Certification'], 'correct_option' => 1, 'explanation' => 'The CIA triad consists of Confidentiality, Integrity, and Availability.'],
                                ['question' => 'Which principle ensures data has not been tampered with?', 'options' => ['Confidentiality', 'Availability', 'Integrity', 'Authentication'], 'correct_option' => 2, 'explanation' => 'Integrity ensures that data remains unaltered and trustworthy.'],
                                ['question' => 'What is a threat model?', 'options' => ['A type of encryption', 'A framework for identifying potential threats', 'A network protocol', 'A firewall configuration'], 'correct_option' => 1, 'explanation' => 'A threat model is a structured approach to identifying and prioritizing potential threats.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Mathematical Foundations',
                        'description' => 'Essential mathematics for cryptography: modular arithmetic, prime numbers, and number theory.',
                        'learning_objectives' => ['Perform modular arithmetic operations', 'Understand prime factorization', 'Apply Euler\'s theorem'],
                        'key_concepts' => ['Modular Arithmetic', 'Prime Numbers', 'GCD', 'Euler\'s Totient'],
                        'tasks' => [
                            ['title' => 'Modular Arithmetic Basics', 'type' => 'video', 'minutes' => 15, 'description' => 'Learn the fundamentals of modular arithmetic used in cryptographic algorithms.'],
                            ['title' => 'Prime Numbers & Factorization', 'type' => 'video', 'minutes' => 12, 'description' => 'Understanding why prime numbers are crucial for encryption.'],
                            ['title' => 'GCD and Extended Euclidean Algorithm', 'type' => 'reading', 'minutes' => 20, 'description' => 'Master the algorithms that form the backbone of RSA.'],
                            ['title' => 'Euler\'s Theorem & Fermat\'s Little Theorem', 'type' => 'video', 'minutes' => 10, 'description' => 'Key theorems used in public-key cryptography.'],
                            ['title' => 'Math Foundations Quiz', 'type' => 'quiz', 'minutes' => 12, 'description' => 'Test your mathematical knowledge.', 'quiz_questions' => [
                                ['question' => 'What is 17 mod 5?', 'options' => ['2', '3', '4', '1'], 'correct_option' => 0, 'explanation' => '17 divided by 5 gives remainder 2.'],
                                ['question' => 'Which number is NOT prime?', 'options' => ['7', '11', '15', '13'], 'correct_option' => 2, 'explanation' => '15 = 3 × 5, so it is not prime.'],
                                ['question' => 'What is the GCD of 12 and 18?', 'options' => ['2', '3', '6', '9'], 'correct_option' => 2, 'explanation' => 'The greatest common divisor of 12 and 18 is 6.'],
                                ['question' => 'Euler\'s totient φ(10) equals?', 'options' => ['2', '4', '5', '8'], 'correct_option' => 1, 'explanation' => 'φ(10) = 10 × (1-1/2) × (1-1/5) = 4. Numbers coprime to 10: 1, 3, 7, 9.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'History of Cryptography',
                        'description' => 'From ancient ciphers to modern encryption: a journey through the evolution of secret communication.',
                        'learning_objectives' => ['Trace the evolution of cryptographic methods', 'Understand historical cipher techniques', 'Appreciate the arms race between codemakers and codebreakers'],
                        'key_concepts' => ['Caesar Cipher', 'Enigma Machine', 'One-Time Pad', 'Kerckhoffs Principle'],
                        'tasks' => [
                            ['title' => 'Ancient Ciphers: Scytale & Caesar', 'type' => 'video', 'minutes' => 10, 'description' => 'Explore the earliest known encryption methods.'],
                            ['title' => 'The Enigma Machine & WWII', 'type' => 'video', 'minutes' => 18, 'description' => 'How breaking Enigma changed the course of history.'],
                            ['title' => 'Kerckhoffs\' Principle', 'type' => 'reading', 'minutes' => 8, 'description' => 'Why security should not depend on secrecy of the algorithm.'],
                            ['title' => 'The Birth of Modern Cryptography', 'type' => 'video', 'minutes' => 14, 'description' => 'Shannon, Diffie-Hellman, and the public-key revolution.'],
                            ['title' => 'History Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your knowledge of cryptographic history.', 'quiz_questions' => [
                                ['question' => 'Who is credited with breaking the Enigma code?', 'options' => ['Claude Shannon', 'Alan Turing', 'Whitfield Diffie', 'Bruce Schneier'], 'correct_option' => 1, 'explanation' => 'Alan Turing led the team at Bletchley Park that broke the Enigma code.'],
                                ['question' => 'What does Kerckhoffs\' principle state?', 'options' => ['All algorithms must be secret', 'Security should rely only on the key', 'Encryption must use prime numbers', 'Ciphers must be symmetric'], 'correct_option' => 1, 'explanation' => 'Kerckhoffs\' principle states that a cryptosystem should be secure even if everything about the system is public knowledge, except the key.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Randomness & Entropy',
                        'description' => 'Understanding the role of randomness in cryptography and how to generate secure random numbers.',
                        'learning_objectives' => ['Define entropy in information theory', 'Distinguish between PRNG and CSPRNG', 'Identify sources of randomness'],
                        'key_concepts' => ['Entropy', 'PRNG', 'CSPRNG', 'Seed', 'Random Oracle'],
                        'tasks' => [
                            ['title' => 'What is Entropy?', 'type' => 'video', 'minutes' => 10, 'description' => 'Shannon entropy and its role in measuring randomness.'],
                            ['title' => 'Pseudo-Random vs True Random', 'type' => 'video', 'minutes' => 12, 'description' => 'Understanding the difference and when each is appropriate.'],
                            ['title' => 'Cryptographically Secure PRNGs', 'type' => 'reading', 'minutes' => 15, 'description' => 'How CSPRNGs work and why they matter for key generation.'],
                            ['title' => 'Randomness Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your understanding of randomness in cryptography.', 'quiz_questions' => [
                                ['question' => 'What does CSPRNG stand for?', 'options' => ['Cryptographic Standard Protocol for Random Number Generation', 'Cryptographically Secure Pseudo-Random Number Generator', 'Central System for Producing Random Numbers Generally', 'Cipher-based Secure Protocol for Random Nonce Generation'], 'correct_option' => 1, 'explanation' => 'CSPRNG stands for Cryptographically Secure Pseudo-Random Number Generator.'],
                                ['question' => 'Which is NOT a good source of entropy?', 'options' => ['Mouse movements', 'System clock alone', 'Keyboard timing', 'Hardware noise'], 'correct_option' => 1, 'explanation' => 'System clock alone is predictable and not a good entropy source.'],
                            ]],
                        ],
                    ],
                ],
            ],

            // ─── Course 2: Classical Ciphers ─────────────────────────────────
            [
                'title' => 'Classical Ciphers & Cryptanalysis',
                'summary' => 'Study historical encryption methods from substitution ciphers to polyalphabetic systems, and learn the techniques used to break them.',
                'estimated_minutes' => 150,
                'is_published' => true,
                'category' => 'classical',
                'difficulty' => 'beginner',
                'topics' => [
                    [
                        'title' => 'Substitution Ciphers',
                        'description' => 'Learn about monoalphabetic and polyalphabetic substitution ciphers.',
                        'learning_objectives' => ['Implement Caesar cipher', 'Understand frequency analysis', 'Break simple substitution ciphers'],
                        'key_concepts' => ['Caesar Cipher', 'ROT13', 'Frequency Analysis', 'Monoalphabetic'],
                        'tasks' => [
                            ['title' => 'Caesar Cipher Implementation', 'type' => 'video', 'minutes' => 10, 'description' => 'Build a Caesar cipher from scratch.'],
                            ['title' => 'ROT13 and Variants', 'type' => 'reading', 'minutes' => 8, 'description' => 'Understanding rotation ciphers and their properties.'],
                            ['title' => 'Frequency Analysis Attack', 'type' => 'video', 'minutes' => 15, 'description' => 'How to break substitution ciphers using letter frequency.'],
                            ['title' => 'Atbash & Affine Ciphers', 'type' => 'video', 'minutes' => 12, 'description' => 'More substitution cipher variants and their mathematics.'],
                            ['title' => 'Substitution Cipher Quiz', 'type' => 'quiz', 'minutes' => 10, 'description' => 'Test your substitution cipher knowledge.', 'quiz_questions' => [
                                ['question' => 'In a Caesar cipher with shift 3, what does "D" encrypt to?', 'options' => ['F', 'G', 'E', 'H'], 'correct_option' => 1, 'explanation' => 'D + 3 = G in the alphabet.'],
                                ['question' => 'What technique is used to break monoalphabetic ciphers?', 'options' => ['Brute force only', 'Frequency analysis', 'Quantum computing', 'Social engineering'], 'correct_option' => 1, 'explanation' => 'Frequency analysis exploits the fact that certain letters appear more often in natural language.'],
                                ['question' => 'How many possible keys does a simple Caesar cipher have?', 'options' => ['26', '25', '52', '256'], 'correct_option' => 1, 'explanation' => 'There are 25 meaningful shifts (shift of 0 is identity).'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Polyalphabetic Ciphers',
                        'description' => 'Advanced classical ciphers that use multiple alphabets to resist frequency analysis.',
                        'learning_objectives' => ['Implement Vigenère cipher', 'Understand the Kasiski examination', 'Apply the Index of Coincidence'],
                        'key_concepts' => ['Vigenère Cipher', 'Kasiski Examination', 'Index of Coincidence', 'Autokey'],
                        'tasks' => [
                            ['title' => 'The Vigenère Cipher', 'type' => 'video', 'minutes' => 14, 'description' => 'Understanding the "unbreakable" cipher and how it works.'],
                            ['title' => 'Kasiski Examination', 'type' => 'video', 'minutes' => 12, 'description' => 'Finding the key length of a Vigenère cipher.'],
                            ['title' => 'Index of Coincidence', 'type' => 'reading', 'minutes' => 18, 'description' => 'A statistical method for determining key length.'],
                            ['title' => 'Breaking Vigenère: Complete Attack', 'type' => 'video', 'minutes' => 20, 'description' => 'Step-by-step walkthrough of breaking a Vigenère cipher.'],
                            ['title' => 'Polyalphabetic Quiz', 'type' => 'quiz', 'minutes' => 10, 'description' => 'Test your polyalphabetic cipher skills.', 'quiz_questions' => [
                                ['question' => 'Why is Vigenère harder to break than Caesar?', 'options' => ['It uses longer keys', 'It uses multiple alphabets', 'It is computerized', 'It uses prime numbers'], 'correct_option' => 1, 'explanation' => 'Vigenère uses multiple cipher alphabets, making frequency analysis much harder.'],
                                ['question' => 'What does the Kasiski examination determine?', 'options' => ['The plaintext', 'The key length', 'The cipher type', 'The author'], 'correct_option' => 1, 'explanation' => 'Kasiski examination finds repeated sequences to determine the key length.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Transposition Ciphers',
                        'description' => 'Ciphers that rearrange the positions of characters rather than substituting them.',
                        'learning_objectives' => ['Implement rail fence cipher', 'Understand columnar transposition', 'Combine transposition with substitution'],
                        'key_concepts' => ['Rail Fence', 'Columnar Transposition', 'Route Cipher', 'Product Cipher'],
                        'tasks' => [
                            ['title' => 'Rail Fence Cipher', 'type' => 'video', 'minutes' => 10, 'description' => 'A simple transposition cipher using zigzag patterns.'],
                            ['title' => 'Columnar Transposition', 'type' => 'video', 'minutes' => 12, 'description' => 'Rearranging text using column-based keys.'],
                            ['title' => 'Double Transposition', 'type' => 'reading', 'minutes' => 15, 'description' => 'Applying transposition twice for stronger encryption.'],
                            ['title' => 'Transposition Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your transposition cipher knowledge.', 'quiz_questions' => [
                                ['question' => 'What does a transposition cipher change?', 'options' => ['The letters themselves', 'The position of letters', 'The alphabet used', 'The key size'], 'correct_option' => 1, 'explanation' => 'Transposition ciphers rearrange the positions of characters without changing them.'],
                                ['question' => 'What is a product cipher?', 'options' => ['A cipher that multiplies numbers', 'A combination of substitution and transposition', 'A cipher used in commerce', 'A one-time pad variant'], 'correct_option' => 1, 'explanation' => 'A product cipher combines substitution and transposition for stronger encryption.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'One-Time Pad & Perfect Secrecy',
                        'description' => 'The only theoretically unbreakable cipher and Shannon\'s proof of perfect secrecy.',
                        'learning_objectives' => ['Understand perfect secrecy', 'Implement one-time pad', 'Recognize practical limitations'],
                        'key_concepts' => ['One-Time Pad', 'Perfect Secrecy', 'Shannon\'s Theorem', 'Key Distribution Problem'],
                        'tasks' => [
                            ['title' => 'Shannon\'s Perfect Secrecy', 'type' => 'video', 'minutes' => 12, 'description' => 'The mathematical proof that OTP is unbreakable.'],
                            ['title' => 'Implementing One-Time Pad', 'type' => 'video', 'minutes' => 10, 'description' => 'How to correctly implement and use a one-time pad.'],
                            ['title' => 'Why OTP is Impractical', 'type' => 'reading', 'minutes' => 10, 'description' => 'The key distribution problem and why we need other ciphers.'],
                            ['title' => 'Perfect Secrecy Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your understanding of perfect secrecy.', 'quiz_questions' => [
                                ['question' => 'What makes the one-time pad perfectly secure?', 'options' => ['Complex algorithm', 'Key is as long as the message and truly random', 'It uses AES internally', 'It requires quantum computers'], 'correct_option' => 1, 'explanation' => 'OTP achieves perfect secrecy because the key is at least as long as the message, truly random, and never reused.'],
                                ['question' => 'What happens if you reuse a one-time pad key?', 'options' => ['Nothing changes', 'Security is completely broken', 'It becomes AES', 'Speed increases'], 'correct_option' => 1, 'explanation' => 'Reusing a OTP key allows an attacker to XOR two ciphertexts and recover information about the plaintexts.'],
                            ]],
                        ],
                    ],
                ],
            ],

            // ─── Course 3: Symmetric Encryption ──────────────────────────────
            [
                'title' => 'Symmetric Encryption',
                'summary' => 'Deep dive into symmetric-key algorithms including block ciphers, stream ciphers, and modes of operation used in modern systems.',
                'estimated_minutes' => 240,
                'is_published' => true,
                'category' => 'symmetric',
                'difficulty' => 'intermediate',
                'topics' => [
                    [
                        'title' => 'Block Cipher Fundamentals',
                        'description' => 'Understanding how block ciphers work, including Feistel networks and substitution-permutation networks.',
                        'learning_objectives' => ['Explain Feistel network structure', 'Understand S-boxes and P-boxes', 'Describe confusion and diffusion'],
                        'key_concepts' => ['Feistel Network', 'S-box', 'P-box', 'Confusion', 'Diffusion'],
                        'tasks' => [
                            ['title' => 'Block Cipher Architecture', 'type' => 'video', 'minutes' => 15, 'description' => 'How block ciphers process fixed-size blocks of data.'],
                            ['title' => 'Feistel Networks Explained', 'type' => 'video', 'minutes' => 18, 'description' => 'The elegant structure behind DES and many other ciphers.'],
                            ['title' => 'Substitution-Permutation Networks', 'type' => 'video', 'minutes' => 14, 'description' => 'The alternative to Feistel used in AES.'],
                            ['title' => 'Confusion & Diffusion', 'type' => 'reading', 'minutes' => 12, 'description' => 'Shannon\'s principles for secure cipher design.'],
                            ['title' => 'Block Cipher Quiz', 'type' => 'quiz', 'minutes' => 10, 'description' => 'Test your block cipher knowledge.', 'quiz_questions' => [
                                ['question' => 'What is the block size of AES?', 'options' => ['64 bits', '128 bits', '256 bits', '512 bits'], 'correct_option' => 1, 'explanation' => 'AES always uses a 128-bit block size, regardless of key size.'],
                                ['question' => 'Which property ensures small input changes cause large output changes?', 'options' => ['Confusion', 'Diffusion', 'Compression', 'Expansion'], 'correct_option' => 1, 'explanation' => 'Diffusion spreads the influence of each plaintext bit across many ciphertext bits.'],
                                ['question' => 'What structure does DES use?', 'options' => ['SPN', 'Feistel Network', 'Stream cipher', 'Hash function'], 'correct_option' => 1, 'explanation' => 'DES uses a 16-round Feistel network structure.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'DES & Triple DES',
                        'description' => 'The Data Encryption Standard: its design, weaknesses, and the Triple DES extension.',
                        'learning_objectives' => ['Describe DES algorithm structure', 'Explain why DES is insecure today', 'Understand 3DES and its key options'],
                        'key_concepts' => ['DES', '56-bit key', 'Triple DES', 'Meet-in-the-Middle Attack'],
                        'tasks' => [
                            ['title' => 'DES Algorithm Walkthrough', 'type' => 'video', 'minutes' => 20, 'description' => 'Step-by-step explanation of the DES algorithm.'],
                            ['title' => 'Why DES Failed: Key Size Attacks', 'type' => 'video', 'minutes' => 12, 'description' => 'How brute force made 56-bit keys obsolete.'],
                            ['title' => 'Triple DES (3DES)', 'type' => 'reading', 'minutes' => 15, 'description' => 'Extending DES with multiple encryptions.'],
                            ['title' => 'Meet-in-the-Middle Attack', 'type' => 'video', 'minutes' => 10, 'description' => 'Why double DES doesn\'t double the security.'],
                            ['title' => 'DES Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your DES knowledge.', 'quiz_questions' => [
                                ['question' => 'What is the effective key length of DES?', 'options' => ['64 bits', '56 bits', '128 bits', '48 bits'], 'correct_option' => 1, 'explanation' => 'DES uses a 64-bit key but 8 bits are parity, leaving 56 effective bits.'],
                                ['question' => 'How many rounds does DES have?', 'options' => ['8', '12', '16', '20'], 'correct_option' => 2, 'explanation' => 'DES performs 16 rounds of the Feistel function.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'AES (Advanced Encryption Standard)',
                        'description' => 'The current gold standard in symmetric encryption: Rijndael algorithm internals and implementation.',
                        'learning_objectives' => ['Describe AES round operations', 'Understand key expansion', 'Compare AES-128, AES-192, AES-256'],
                        'key_concepts' => ['Rijndael', 'SubBytes', 'ShiftRows', 'MixColumns', 'AddRoundKey'],
                        'tasks' => [
                            ['title' => 'AES Overview & History', 'type' => 'video', 'minutes' => 12, 'description' => 'How AES was selected and why it replaced DES.'],
                            ['title' => 'AES Round Operations', 'type' => 'video', 'minutes' => 20, 'description' => 'SubBytes, ShiftRows, MixColumns, and AddRoundKey explained.'],
                            ['title' => 'AES Key Expansion', 'type' => 'video', 'minutes' => 15, 'description' => 'How the cipher key is expanded into round keys.'],
                            ['title' => 'AES Security Analysis', 'type' => 'reading', 'minutes' => 18, 'description' => 'Known attacks and why AES remains secure.'],
                            ['title' => 'Implementing AES in Practice', 'type' => 'reading', 'minutes' => 15, 'description' => 'Best practices for using AES in real applications.'],
                            ['title' => 'AES Quiz', 'type' => 'quiz', 'minutes' => 12, 'description' => 'Test your AES knowledge.', 'quiz_questions' => [
                                ['question' => 'How many rounds does AES-256 use?', 'options' => ['10', '12', '14', '16'], 'correct_option' => 2, 'explanation' => 'AES-128 uses 10 rounds, AES-192 uses 12, and AES-256 uses 14 rounds.'],
                                ['question' => 'Which AES operation provides non-linearity?', 'options' => ['ShiftRows', 'SubBytes', 'MixColumns', 'AddRoundKey'], 'correct_option' => 1, 'explanation' => 'SubBytes uses an S-box to provide non-linear substitution.'],
                                ['question' => 'What type of network does AES use?', 'options' => ['Feistel', 'Substitution-Permutation Network', 'Stream cipher', 'Hash-based'], 'correct_option' => 1, 'explanation' => 'AES (Rijndael) uses a Substitution-Permutation Network (SPN).'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Modes of Operation',
                        'description' => 'How to securely encrypt data larger than one block using various modes of operation.',
                        'learning_objectives' => ['Compare ECB, CBC, CTR, GCM modes', 'Identify vulnerabilities in ECB mode', 'Implement authenticated encryption'],
                        'key_concepts' => ['ECB', 'CBC', 'CTR', 'GCM', 'IV', 'Nonce', 'AEAD'],
                        'tasks' => [
                            ['title' => 'ECB Mode & Its Weakness', 'type' => 'video', 'minutes' => 10, 'description' => 'Why ECB mode leaks information (the penguin problem).'],
                            ['title' => 'CBC Mode', 'type' => 'video', 'minutes' => 12, 'description' => 'Cipher Block Chaining and initialization vectors.'],
                            ['title' => 'CTR Mode', 'type' => 'video', 'minutes' => 10, 'description' => 'Turning a block cipher into a stream cipher.'],
                            ['title' => 'GCM: Authenticated Encryption', 'type' => 'video', 'minutes' => 15, 'description' => 'Galois/Counter Mode for encryption with authentication.'],
                            ['title' => 'Choosing the Right Mode', 'type' => 'reading', 'minutes' => 12, 'description' => 'Guidelines for selecting appropriate modes of operation.'],
                            ['title' => 'Modes of Operation Quiz', 'type' => 'quiz', 'minutes' => 10, 'description' => 'Test your modes of operation knowledge.', 'quiz_questions' => [
                                ['question' => 'Which mode should NEVER be used for encrypting images?', 'options' => ['CBC', 'ECB', 'CTR', 'GCM'], 'correct_option' => 1, 'explanation' => 'ECB encrypts identical blocks to identical ciphertext, revealing patterns in images.'],
                                ['question' => 'What does GCM provide that CBC does not?', 'options' => ['Encryption', 'Decryption', 'Authentication', 'Compression'], 'correct_option' => 2, 'explanation' => 'GCM provides both encryption and authentication (AEAD), while CBC only provides encryption.'],
                                ['question' => 'What must never be reused with the same key in CTR mode?', 'options' => ['The plaintext', 'The nonce/IV', 'The block size', 'The padding'], 'correct_option' => 1, 'explanation' => 'Reusing a nonce with the same key in CTR mode completely breaks security.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Stream Ciphers',
                        'description' => 'Encryption algorithms that process data one bit or byte at a time.',
                        'learning_objectives' => ['Understand LFSR-based stream ciphers', 'Learn about RC4 and its weaknesses', 'Study ChaCha20 design'],
                        'key_concepts' => ['LFSR', 'RC4', 'ChaCha20', 'Salsa20', 'Keystream'],
                        'tasks' => [
                            ['title' => 'Stream Cipher Principles', 'type' => 'video', 'minutes' => 12, 'description' => 'How stream ciphers generate keystreams.'],
                            ['title' => 'RC4: Rise and Fall', 'type' => 'video', 'minutes' => 14, 'description' => 'Once popular, now broken — lessons from RC4.'],
                            ['title' => 'ChaCha20 & Poly1305', 'type' => 'video', 'minutes' => 16, 'description' => 'The modern stream cipher used in TLS and WireGuard.'],
                            ['title' => 'Stream Cipher Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your stream cipher knowledge.', 'quiz_questions' => [
                                ['question' => 'What is the main advantage of stream ciphers over block ciphers?', 'options' => ['Stronger security', 'Speed and low latency', 'Larger key sizes', 'Better authentication'], 'correct_option' => 1, 'explanation' => 'Stream ciphers can encrypt data byte-by-byte with low latency, ideal for real-time communication.'],
                                ['question' => 'Which protocol uses ChaCha20-Poly1305?', 'options' => ['SSL 2.0', 'WireGuard VPN', 'FTP', 'Telnet'], 'correct_option' => 1, 'explanation' => 'WireGuard uses ChaCha20-Poly1305 as its primary AEAD cipher.'],
                            ]],
                        ],
                    ],
                ],
            ],

            // ─── Course 4: Asymmetric Cryptography ───────────────────────────
            [
                'title' => 'Asymmetric Cryptography',
                'summary' => 'Public-key cryptography fundamentals including RSA, Diffie-Hellman key exchange, and elliptic curve cryptography.',
                'estimated_minutes' => 210,
                'is_published' => true,
                'category' => 'asymmetric',
                'difficulty' => 'intermediate',
                'topics' => [
                    [
                        'title' => 'Public-Key Cryptography Concepts',
                        'description' => 'The revolutionary idea of asymmetric encryption and its applications.',
                        'learning_objectives' => ['Understand public/private key pairs', 'Differentiate encryption vs signing', 'Explain the key distribution problem solution'],
                        'key_concepts' => ['Public Key', 'Private Key', 'Key Pair', 'Digital Envelope', 'Hybrid Encryption'],
                        'tasks' => [
                            ['title' => 'The Key Distribution Problem', 'type' => 'video', 'minutes' => 10, 'description' => 'Why symmetric keys alone aren\'t enough.'],
                            ['title' => 'Public-Key Revolution', 'type' => 'video', 'minutes' => 14, 'description' => 'How Diffie and Hellman changed everything.'],
                            ['title' => 'Encryption vs Digital Signatures', 'type' => 'reading', 'minutes' => 12, 'description' => 'Two uses of asymmetric cryptography.'],
                            ['title' => 'Hybrid Encryption', 'type' => 'video', 'minutes' => 10, 'description' => 'Combining symmetric and asymmetric for the best of both.'],
                            ['title' => 'Public-Key Concepts Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your understanding.', 'quiz_questions' => [
                                ['question' => 'In public-key encryption, which key encrypts?', 'options' => ['Private key', 'Public key', 'Session key', 'Master key'], 'correct_option' => 1, 'explanation' => 'The recipient\'s public key is used to encrypt; only their private key can decrypt.'],
                                ['question' => 'What is hybrid encryption?', 'options' => ['Using two public keys', 'Combining symmetric and asymmetric encryption', 'Encrypting twice', 'Using quantum and classical together'], 'correct_option' => 1, 'explanation' => 'Hybrid encryption uses asymmetric crypto to exchange a symmetric key, then uses the symmetric key for bulk data.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'RSA Algorithm',
                        'description' => 'The most widely deployed public-key algorithm: key generation, encryption, and signing.',
                        'learning_objectives' => ['Generate RSA key pairs', 'Perform RSA encryption/decryption', 'Understand RSA security assumptions'],
                        'key_concepts' => ['RSA', 'Key Generation', 'Padding (OAEP)', 'Integer Factorization Problem'],
                        'tasks' => [
                            ['title' => 'RSA Key Generation', 'type' => 'video', 'minutes' => 18, 'description' => 'Step-by-step RSA key pair generation.'],
                            ['title' => 'RSA Encryption & Decryption', 'type' => 'video', 'minutes' => 15, 'description' => 'The mathematics of RSA encryption.'],
                            ['title' => 'RSA Padding: PKCS#1 & OAEP', 'type' => 'reading', 'minutes' => 15, 'description' => 'Why raw RSA is insecure and how padding fixes it.'],
                            ['title' => 'RSA Key Sizes & Performance', 'type' => 'reading', 'minutes' => 10, 'description' => 'Choosing appropriate key sizes for security.'],
                            ['title' => 'Attacks on RSA', 'type' => 'video', 'minutes' => 16, 'description' => 'Common mistakes and attacks against RSA implementations.'],
                            ['title' => 'RSA Quiz', 'type' => 'quiz', 'minutes' => 12, 'description' => 'Test your RSA knowledge.', 'quiz_questions' => [
                                ['question' => 'RSA security relies on the difficulty of?', 'options' => ['Discrete logarithm', 'Integer factorization', 'Hash collision', 'Elliptic curve'], 'correct_option' => 1, 'explanation' => 'RSA\'s security is based on the computational difficulty of factoring large integers.'],
                                ['question' => 'What is the minimum recommended RSA key size today?', 'options' => ['512 bits', '1024 bits', '2048 bits', '4096 bits'], 'correct_option' => 2, 'explanation' => '2048 bits is the current minimum recommendation; 3072+ is preferred for long-term security.'],
                                ['question' => 'Why is textbook RSA insecure?', 'options' => ['Key is too short', 'It is deterministic without padding', 'It uses DES internally', 'It requires quantum computers'], 'correct_option' => 1, 'explanation' => 'Without padding, RSA is deterministic — the same plaintext always produces the same ciphertext.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Diffie-Hellman Key Exchange',
                        'description' => 'The protocol that enables two parties to establish a shared secret over an insecure channel.',
                        'learning_objectives' => ['Implement DH key exchange', 'Understand the discrete logarithm problem', 'Recognize man-in-the-middle vulnerabilities'],
                        'key_concepts' => ['Diffie-Hellman', 'Discrete Logarithm', 'Generator', 'MITM Attack', 'Ephemeral DH'],
                        'tasks' => [
                            ['title' => 'DH Protocol Walkthrough', 'type' => 'video', 'minutes' => 15, 'description' => 'How two parties agree on a secret without sharing it.'],
                            ['title' => 'The Discrete Logarithm Problem', 'type' => 'reading', 'minutes' => 12, 'description' => 'The mathematical hardness assumption behind DH.'],
                            ['title' => 'Man-in-the-Middle Attack on DH', 'type' => 'video', 'minutes' => 10, 'description' => 'Why unauthenticated DH is vulnerable.'],
                            ['title' => 'Ephemeral Diffie-Hellman (DHE)', 'type' => 'reading', 'minutes' => 10, 'description' => 'Forward secrecy through ephemeral keys.'],
                            ['title' => 'DH Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your DH knowledge.', 'quiz_questions' => [
                                ['question' => 'What problem does Diffie-Hellman solve?', 'options' => ['Data encryption', 'Key exchange over insecure channel', 'Digital signatures', 'Password storage'], 'correct_option' => 1, 'explanation' => 'DH allows two parties to establish a shared secret key over an insecure communication channel.'],
                                ['question' => 'What provides forward secrecy?', 'options' => ['Static DH', 'Ephemeral DH (DHE)', 'RSA key exchange', 'Pre-shared keys'], 'correct_option' => 1, 'explanation' => 'Ephemeral DH generates new key pairs for each session, so compromising long-term keys doesn\'t reveal past sessions.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Elliptic Curve Cryptography (ECC)',
                        'description' => 'Modern public-key cryptography using elliptic curves for smaller keys and faster operations.',
                        'learning_objectives' => ['Understand elliptic curve mathematics', 'Compare ECC vs RSA key sizes', 'Learn about ECDH and ECDSA'],
                        'key_concepts' => ['Elliptic Curve', 'ECDH', 'ECDSA', 'Curve25519', 'secp256k1'],
                        'tasks' => [
                            ['title' => 'Elliptic Curves Introduction', 'type' => 'video', 'minutes' => 16, 'description' => 'The geometry and algebra of elliptic curves.'],
                            ['title' => 'Point Addition & Scalar Multiplication', 'type' => 'video', 'minutes' => 14, 'description' => 'The operations that make ECC work.'],
                            ['title' => 'ECDH Key Exchange', 'type' => 'video', 'minutes' => 12, 'description' => 'Diffie-Hellman using elliptic curves.'],
                            ['title' => 'ECDSA Digital Signatures', 'type' => 'reading', 'minutes' => 15, 'description' => 'How Bitcoin and TLS use elliptic curve signatures.'],
                            ['title' => 'Curve Selection: P-256 vs Curve25519', 'type' => 'reading', 'minutes' => 10, 'description' => 'Choosing the right curve for your application.'],
                            ['title' => 'ECC Quiz', 'type' => 'quiz', 'minutes' => 10, 'description' => 'Test your ECC knowledge.', 'quiz_questions' => [
                                ['question' => 'What advantage does ECC have over RSA?', 'options' => ['Simpler math', 'Smaller key sizes for equivalent security', 'Older and more tested', 'No patents'], 'correct_option' => 1, 'explanation' => 'A 256-bit ECC key provides similar security to a 3072-bit RSA key.'],
                                ['question' => 'Which curve is used in Bitcoin?', 'options' => ['P-256', 'Curve25519', 'secp256k1', 'P-384'], 'correct_option' => 2, 'explanation' => 'Bitcoin uses the secp256k1 elliptic curve for its digital signatures.'],
                            ]],
                        ],
                    ],
                ],
            ],

            // ─── Course 5: Hash Functions & MACs ─────────────────────────────
            [
                'title' => 'Hash Functions & Message Authentication',
                'summary' => 'Cryptographic hash functions, their properties, and how they enable message authentication codes and digital integrity.',
                'estimated_minutes' => 160,
                'is_published' => true,
                'category' => 'hashing',
                'difficulty' => 'intermediate',
                'topics' => [
                    [
                        'title' => 'Cryptographic Hash Functions',
                        'description' => 'Properties, constructions, and applications of hash functions.',
                        'learning_objectives' => ['Define preimage resistance', 'Understand collision resistance', 'Compare MD5, SHA-1, SHA-256, SHA-3'],
                        'key_concepts' => ['Preimage Resistance', 'Collision Resistance', 'Avalanche Effect', 'Merkle-Damgård'],
                        'tasks' => [
                            ['title' => 'Hash Function Properties', 'type' => 'video', 'minutes' => 12, 'description' => 'The three security properties every hash function needs.'],
                            ['title' => 'MD5 & SHA-1: Broken Hashes', 'type' => 'video', 'minutes' => 10, 'description' => 'Why these once-popular hashes are no longer secure.'],
                            ['title' => 'SHA-256 & SHA-3', 'type' => 'video', 'minutes' => 14, 'description' => 'Current standard hash functions and their designs.'],
                            ['title' => 'Birthday Attack', 'type' => 'reading', 'minutes' => 12, 'description' => 'The probability theory behind collision attacks.'],
                            ['title' => 'Hash Functions Quiz', 'type' => 'quiz', 'minutes' => 10, 'description' => 'Test your hash function knowledge.', 'quiz_questions' => [
                                ['question' => 'What is the output size of SHA-256?', 'options' => ['128 bits', '256 bits', '512 bits', '1024 bits'], 'correct_option' => 1, 'explanation' => 'SHA-256 always produces a 256-bit (32-byte) hash output.'],
                                ['question' => 'Which property means you can\'t find two inputs with the same hash?', 'options' => ['Preimage resistance', 'Second preimage resistance', 'Collision resistance', 'Avalanche effect'], 'correct_option' => 2, 'explanation' => 'Collision resistance means it\'s computationally infeasible to find any two distinct inputs that hash to the same output.'],
                                ['question' => 'Why is MD5 considered broken?', 'options' => ['Output is too short', 'Practical collision attacks exist', 'It\'s too slow', 'Key size is small'], 'correct_option' => 1, 'explanation' => 'Researchers demonstrated practical collision attacks against MD5 in 2004.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'HMAC & Message Authentication Codes',
                        'description' => 'Using hash functions to verify message integrity and authenticity.',
                        'learning_objectives' => ['Construct HMAC from hash functions', 'Understand MAC security properties', 'Implement HMAC in practice'],
                        'key_concepts' => ['HMAC', 'MAC', 'Authenticate-then-Encrypt', 'Encrypt-then-MAC'],
                        'tasks' => [
                            ['title' => 'What is a MAC?', 'type' => 'video', 'minutes' => 10, 'description' => 'Message Authentication Codes and why we need them.'],
                            ['title' => 'HMAC Construction', 'type' => 'video', 'minutes' => 12, 'description' => 'How HMAC uses a hash function with a secret key.'],
                            ['title' => 'MAC Composition: EtM, MtE, E&M', 'type' => 'reading', 'minutes' => 15, 'description' => 'The right way to combine encryption and authentication.'],
                            ['title' => 'HMAC Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your MAC knowledge.', 'quiz_questions' => [
                                ['question' => 'What does HMAC stand for?', 'options' => ['Hash-based Message Authentication Code', 'Hybrid MAC Algorithm Cipher', 'High-security MAC', 'Hash MAC Authenticated Cipher'], 'correct_option' => 0, 'explanation' => 'HMAC stands for Hash-based Message Authentication Code.'],
                                ['question' => 'Which composition is considered most secure?', 'options' => ['MAC-then-Encrypt', 'Encrypt-then-MAC', 'Encrypt-and-MAC', 'MAC-only'], 'correct_option' => 1, 'explanation' => 'Encrypt-then-MAC is the recommended approach as it provides the strongest security guarantees.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Password Hashing',
                        'description' => 'Specialized hash functions designed for securely storing passwords.',
                        'learning_objectives' => ['Explain why SHA-256 is bad for passwords', 'Compare bcrypt, scrypt, Argon2', 'Implement secure password storage'],
                        'key_concepts' => ['bcrypt', 'scrypt', 'Argon2', 'Salt', 'Work Factor', 'Memory-Hard'],
                        'tasks' => [
                            ['title' => 'Why Regular Hashes Fail for Passwords', 'type' => 'video', 'minutes' => 10, 'description' => 'Speed is the enemy when hashing passwords.'],
                            ['title' => 'bcrypt Deep Dive', 'type' => 'video', 'minutes' => 12, 'description' => 'The time-tested password hashing function.'],
                            ['title' => 'Argon2: The Modern Choice', 'type' => 'video', 'minutes' => 14, 'description' => 'Winner of the Password Hashing Competition.'],
                            ['title' => 'Salting & Peppering', 'type' => 'reading', 'minutes' => 10, 'description' => 'Adding randomness to defeat rainbow tables.'],
                            ['title' => 'Password Hashing Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your password hashing knowledge.', 'quiz_questions' => [
                                ['question' => 'Why is SHA-256 bad for password hashing?', 'options' => ['It\'s broken', 'It\'s too fast', 'Output is too long', 'It needs a key'], 'correct_option' => 1, 'explanation' => 'SHA-256 is designed to be fast, which allows attackers to try billions of passwords per second.'],
                                ['question' => 'What does a salt prevent?', 'options' => ['Brute force attacks', 'Rainbow table attacks', 'Timing attacks', 'Buffer overflows'], 'correct_option' => 1, 'explanation' => 'A unique salt per password prevents precomputed rainbow table attacks.'],
                            ]],
                        ],
                    ],
                ],
            ],

            // ─── Course 6: Digital Signatures & PKI ──────────────────────────
            [
                'title' => 'Digital Signatures & PKI',
                'summary' => 'Learn how digital signatures provide authentication and non-repudiation, and how Public Key Infrastructure enables trust on the internet.',
                'estimated_minutes' => 180,
                'is_published' => true,
                'category' => 'signatures',
                'difficulty' => 'advanced',
                'topics' => [
                    [
                        'title' => 'Digital Signature Schemes',
                        'description' => 'RSA signatures, DSA, and EdDSA — how they work and when to use each.',
                        'learning_objectives' => ['Implement RSA signatures', 'Understand DSA algorithm', 'Compare EdDSA advantages'],
                        'key_concepts' => ['RSA-PSS', 'DSA', 'EdDSA', 'Ed25519', 'Non-repudiation'],
                        'tasks' => [
                            ['title' => 'Digital Signatures Overview', 'type' => 'video', 'minutes' => 12, 'description' => 'What digital signatures provide and how they differ from MACs.'],
                            ['title' => 'RSA Signatures (PKCS#1 v1.5 & PSS)', 'type' => 'video', 'minutes' => 15, 'description' => 'Signing with RSA and the importance of proper padding.'],
                            ['title' => 'DSA & ECDSA', 'type' => 'video', 'minutes' => 14, 'description' => 'The Digital Signature Algorithm and its elliptic curve variant.'],
                            ['title' => 'EdDSA & Ed25519', 'type' => 'reading', 'minutes' => 12, 'description' => 'The modern, fast, and secure signature scheme.'],
                            ['title' => 'Signature Schemes Quiz', 'type' => 'quiz', 'minutes' => 10, 'description' => 'Test your digital signature knowledge.', 'quiz_questions' => [
                                ['question' => 'What property do digital signatures provide that MACs don\'t?', 'options' => ['Integrity', 'Authentication', 'Non-repudiation', 'Confidentiality'], 'correct_option' => 2, 'explanation' => 'Digital signatures provide non-repudiation — the signer cannot deny having signed the message.'],
                                ['question' => 'Which key is used to create a digital signature?', 'options' => ['Public key', 'Private key', 'Session key', 'Shared key'], 'correct_option' => 1, 'explanation' => 'The signer uses their private key to create the signature; anyone can verify with the public key.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'X.509 Certificates',
                        'description' => 'The standard format for public key certificates used in TLS/SSL.',
                        'learning_objectives' => ['Read X.509 certificate fields', 'Understand certificate chains', 'Validate certificate authenticity'],
                        'key_concepts' => ['X.509', 'Certificate Chain', 'Root CA', 'Intermediate CA', 'Subject Alternative Name'],
                        'tasks' => [
                            ['title' => 'X.509 Certificate Structure', 'type' => 'video', 'minutes' => 14, 'description' => 'Anatomy of a digital certificate.'],
                            ['title' => 'Certificate Chains & Trust', 'type' => 'video', 'minutes' => 12, 'description' => 'How browsers verify website certificates.'],
                            ['title' => 'Reading Certificates with OpenSSL', 'type' => 'reading', 'minutes' => 15, 'description' => 'Practical certificate inspection commands.'],
                            ['title' => 'Certificate Revocation (CRL & OCSP)', 'type' => 'video', 'minutes' => 10, 'description' => 'What happens when certificates need to be invalidated.'],
                            ['title' => 'X.509 Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your certificate knowledge.', 'quiz_questions' => [
                                ['question' => 'Who signs a root CA certificate?', 'options' => ['The intermediate CA', 'The end entity', 'Itself (self-signed)', 'The browser vendor'], 'correct_option' => 2, 'explanation' => 'Root CA certificates are self-signed — they sign their own certificate.'],
                                ['question' => 'What does OCSP check?', 'options' => ['Certificate encryption strength', 'Certificate revocation status', 'Certificate expiry date', 'Certificate key size'], 'correct_option' => 1, 'explanation' => 'OCSP (Online Certificate Status Protocol) checks whether a certificate has been revoked.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Public Key Infrastructure (PKI)',
                        'description' => 'The ecosystem of policies, procedures, and technology for managing digital certificates.',
                        'learning_objectives' => ['Design a PKI hierarchy', 'Understand CA operations', 'Implement certificate pinning'],
                        'key_concepts' => ['PKI', 'Certificate Authority', 'Registration Authority', 'Certificate Pinning', 'Let\'s Encrypt'],
                        'tasks' => [
                            ['title' => 'PKI Architecture', 'type' => 'video', 'minutes' => 15, 'description' => 'Components and roles in a PKI system.'],
                            ['title' => 'Certificate Authority Operations', 'type' => 'reading', 'minutes' => 12, 'description' => 'How CAs issue, manage, and revoke certificates.'],
                            ['title' => 'Let\'s Encrypt & ACME Protocol', 'type' => 'video', 'minutes' => 10, 'description' => 'Automated certificate issuance for the web.'],
                            ['title' => 'Certificate Pinning', 'type' => 'reading', 'minutes' => 10, 'description' => 'Extra protection against rogue certificates.'],
                            ['title' => 'PKI Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your PKI knowledge.', 'quiz_questions' => [
                                ['question' => 'What is the role of a Certificate Authority?', 'options' => ['Encrypt data', 'Issue and manage digital certificates', 'Store private keys', 'Route network traffic'], 'correct_option' => 1, 'explanation' => 'A CA is a trusted entity that issues, manages, and revokes digital certificates.'],
                                ['question' => 'What protocol does Let\'s Encrypt use?', 'options' => ['OCSP', 'ACME', 'LDAP', 'SCEP'], 'correct_option' => 1, 'explanation' => 'Let\'s Encrypt uses the ACME (Automatic Certificate Management Environment) protocol.'],
                            ]],
                        ],
                    ],
                ],
            ],

            // ─── Course 7: Network Security Protocols ─────────────────────────
            [
                'title' => 'Network Security Protocols',
                'summary' => 'Study the cryptographic protocols that secure internet communications: TLS, SSH, IPsec, and modern VPN technologies.',
                'estimated_minutes' => 200,
                'is_published' => true,
                'category' => 'protocols',
                'difficulty' => 'advanced',
                'topics' => [
                    [
                        'title' => 'TLS/SSL Protocol',
                        'description' => 'The protocol that secures HTTPS and most internet communications.',
                        'learning_objectives' => ['Understand TLS handshake', 'Compare TLS 1.2 vs 1.3', 'Configure TLS securely'],
                        'key_concepts' => ['TLS Handshake', 'Cipher Suite', 'Forward Secrecy', 'TLS 1.3', '0-RTT'],
                        'tasks' => [
                            ['title' => 'TLS Handshake Explained', 'type' => 'video', 'minutes' => 18, 'description' => 'Step-by-step walkthrough of the TLS handshake.'],
                            ['title' => 'Cipher Suites & Negotiation', 'type' => 'video', 'minutes' => 12, 'description' => 'How client and server agree on cryptographic algorithms.'],
                            ['title' => 'TLS 1.3 Improvements', 'type' => 'video', 'minutes' => 14, 'description' => 'What changed in TLS 1.3 and why it matters.'],
                            ['title' => 'TLS Configuration Best Practices', 'type' => 'reading', 'minutes' => 15, 'description' => 'Secure server configuration guidelines.'],
                            ['title' => 'TLS Quiz', 'type' => 'quiz', 'minutes' => 10, 'description' => 'Test your TLS knowledge.', 'quiz_questions' => [
                                ['question' => 'How many round trips does TLS 1.3 handshake require?', 'options' => ['0', '1', '2', '3'], 'correct_option' => 1, 'explanation' => 'TLS 1.3 completes the handshake in just 1 round trip (1-RTT), compared to 2 in TLS 1.2.'],
                                ['question' => 'What was removed in TLS 1.3?', 'options' => ['AES', 'RSA key exchange', 'ECDHE', 'Certificates'], 'correct_option' => 1, 'explanation' => 'TLS 1.3 removed static RSA key exchange to enforce forward secrecy.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'SSH Protocol',
                        'description' => 'Secure Shell protocol for encrypted remote access and file transfer.',
                        'learning_objectives' => ['Understand SSH architecture', 'Configure key-based authentication', 'Use SSH tunneling'],
                        'key_concepts' => ['SSH-2', 'Key Authentication', 'SSH Tunneling', 'Port Forwarding', 'SSH Agent'],
                        'tasks' => [
                            ['title' => 'SSH Protocol Architecture', 'type' => 'video', 'minutes' => 12, 'description' => 'Transport, authentication, and connection layers.'],
                            ['title' => 'SSH Key Management', 'type' => 'video', 'minutes' => 14, 'description' => 'Generating, distributing, and rotating SSH keys.'],
                            ['title' => 'SSH Tunneling & Port Forwarding', 'type' => 'reading', 'minutes' => 12, 'description' => 'Using SSH as a secure tunnel for other protocols.'],
                            ['title' => 'SSH Hardening', 'type' => 'reading', 'minutes' => 10, 'description' => 'Best practices for securing SSH servers.'],
                            ['title' => 'SSH Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your SSH knowledge.', 'quiz_questions' => [
                                ['question' => 'Which authentication method is most secure for SSH?', 'options' => ['Password', 'Public key', 'Keyboard-interactive', 'Host-based'], 'correct_option' => 1, 'explanation' => 'Public key authentication is more secure than passwords as it\'s not vulnerable to brute force.'],
                                ['question' => 'What is SSH agent forwarding used for?', 'options' => ['Encrypting files', 'Using local keys on remote servers', 'Compressing data', 'Load balancing'], 'correct_option' => 1, 'explanation' => 'SSH agent forwarding allows you to use your local SSH keys when connecting from one remote server to another.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'VPN Technologies',
                        'description' => 'IPsec, OpenVPN, and WireGuard — modern VPN protocols compared.',
                        'learning_objectives' => ['Compare IPsec modes', 'Understand WireGuard design', 'Choose appropriate VPN technology'],
                        'key_concepts' => ['IPsec', 'IKE', 'OpenVPN', 'WireGuard', 'Tunnel Mode', 'Transport Mode'],
                        'tasks' => [
                            ['title' => 'IPsec: AH & ESP', 'type' => 'video', 'minutes' => 15, 'description' => 'Authentication Header and Encapsulating Security Payload.'],
                            ['title' => 'IKE Key Exchange', 'type' => 'video', 'minutes' => 12, 'description' => 'Internet Key Exchange protocol for IPsec.'],
                            ['title' => 'WireGuard: Modern VPN', 'type' => 'video', 'minutes' => 14, 'description' => 'The simple, fast, and secure VPN protocol.'],
                            ['title' => 'VPN Comparison Guide', 'type' => 'reading', 'minutes' => 12, 'description' => 'When to use IPsec, OpenVPN, or WireGuard.'],
                            ['title' => 'VPN Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your VPN knowledge.', 'quiz_questions' => [
                                ['question' => 'Which VPN protocol has the smallest codebase?', 'options' => ['IPsec', 'OpenVPN', 'WireGuard', 'PPTP'], 'correct_option' => 2, 'explanation' => 'WireGuard has approximately 4,000 lines of code, compared to hundreds of thousands for IPsec/OpenVPN.'],
                                ['question' => 'What cipher does WireGuard use?', 'options' => ['AES-256-GCM', 'ChaCha20-Poly1305', 'Blowfish', '3DES'], 'correct_option' => 1, 'explanation' => 'WireGuard uses ChaCha20-Poly1305 for symmetric encryption and authentication.'],
                            ]],
                        ],
                    ],
                ],
            ],

            // ─── Course 8: Blockchain & Cryptocurrency ────────────────────────
            [
                'title' => 'Blockchain Cryptography',
                'summary' => 'Explore the cryptographic foundations of blockchain technology, from hash chains to zero-knowledge proofs.',
                'estimated_minutes' => 190,
                'is_published' => true,
                'category' => 'blockchain',
                'difficulty' => 'advanced',
                'topics' => [
                    [
                        'title' => 'Hash Chains & Merkle Trees',
                        'description' => 'Data structures that enable efficient verification in blockchain systems.',
                        'learning_objectives' => ['Build a hash chain', 'Construct Merkle trees', 'Verify Merkle proofs'],
                        'key_concepts' => ['Hash Chain', 'Merkle Tree', 'Merkle Root', 'Merkle Proof', 'Tamper Evidence'],
                        'tasks' => [
                            ['title' => 'Hash Chains Explained', 'type' => 'video', 'minutes' => 10, 'description' => 'Linking blocks together with cryptographic hashes.'],
                            ['title' => 'Merkle Trees', 'type' => 'video', 'minutes' => 14, 'description' => 'Efficient data verification with tree structures.'],
                            ['title' => 'Merkle Proofs in Practice', 'type' => 'reading', 'minutes' => 12, 'description' => 'How light clients verify transactions without downloading the full blockchain.'],
                            ['title' => 'Merkle Trees Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your Merkle tree knowledge.', 'quiz_questions' => [
                                ['question' => 'What is the time complexity of verifying a Merkle proof?', 'options' => ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], 'correct_option' => 1, 'explanation' => 'Merkle proofs require O(log n) hashes to verify, where n is the number of leaves.'],
                                ['question' => 'What does the Merkle root represent?', 'options' => ['The first transaction', 'A summary hash of all data in the tree', 'The block number', 'The miner\'s address'], 'correct_option' => 1, 'explanation' => 'The Merkle root is a single hash that summarizes all the data in the tree.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Consensus Mechanisms',
                        'description' => 'How distributed systems agree on the state of the blockchain.',
                        'learning_objectives' => ['Compare PoW and PoS', 'Understand Byzantine fault tolerance', 'Analyze 51% attacks'],
                        'key_concepts' => ['Proof of Work', 'Proof of Stake', 'Byzantine Fault Tolerance', 'Nakamoto Consensus'],
                        'tasks' => [
                            ['title' => 'Proof of Work Mining', 'type' => 'video', 'minutes' => 15, 'description' => 'How miners compete to add blocks using computational puzzles.'],
                            ['title' => 'Proof of Stake', 'type' => 'video', 'minutes' => 12, 'description' => 'Validating blocks based on stake rather than computation.'],
                            ['title' => 'Byzantine Generals Problem', 'type' => 'reading', 'minutes' => 14, 'description' => 'The fundamental problem of distributed consensus.'],
                            ['title' => '51% Attacks & Security', 'type' => 'video', 'minutes' => 10, 'description' => 'What happens when one entity controls majority hash power.'],
                            ['title' => 'Consensus Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your consensus knowledge.', 'quiz_questions' => [
                                ['question' => 'What does Proof of Work require miners to find?', 'options' => ['A private key', 'A nonce that produces a hash below target', 'A valid signature', 'A Merkle proof'], 'correct_option' => 1, 'explanation' => 'Miners must find a nonce that, when hashed with the block data, produces a hash below the difficulty target.'],
                                ['question' => 'What advantage does Proof of Stake have over Proof of Work?', 'options' => ['More decentralized', 'Energy efficient', 'Faster blocks', 'Simpler code'], 'correct_option' => 1, 'explanation' => 'PoS doesn\'t require massive computational resources, making it far more energy efficient.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Zero-Knowledge Proofs',
                        'description' => 'Proving knowledge of information without revealing the information itself.',
                        'learning_objectives' => ['Understand ZKP properties', 'Learn about zk-SNARKs', 'Explore privacy applications'],
                        'key_concepts' => ['Zero-Knowledge', 'zk-SNARK', 'zk-STARK', 'Completeness', 'Soundness'],
                        'tasks' => [
                            ['title' => 'Zero-Knowledge Proofs Intuition', 'type' => 'video', 'minutes' => 14, 'description' => 'The cave analogy and what ZKPs really mean.'],
                            ['title' => 'zk-SNARKs Explained', 'type' => 'video', 'minutes' => 18, 'description' => 'Succinct non-interactive arguments of knowledge.'],
                            ['title' => 'zk-STARKs vs zk-SNARKs', 'type' => 'reading', 'minutes' => 12, 'description' => 'Comparing the two main ZKP systems.'],
                            ['title' => 'ZKP Applications: Zcash & zkRollups', 'type' => 'reading', 'minutes' => 15, 'description' => 'Real-world uses of zero-knowledge proofs.'],
                            ['title' => 'ZKP Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your ZKP knowledge.', 'quiz_questions' => [
                                ['question' => 'What are the three properties of a zero-knowledge proof?', 'options' => ['Fast, secure, simple', 'Completeness, soundness, zero-knowledge', 'Encryption, signing, hashing', 'Public, private, shared'], 'correct_option' => 1, 'explanation' => 'A ZKP must be complete (honest prover convinces), sound (cheater can\'t convince), and zero-knowledge (reveals nothing extra).'],
                                ['question' => 'What does the "S" in SNARK stand for?', 'options' => ['Secure', 'Succinct', 'Symmetric', 'Standard'], 'correct_option' => 1, 'explanation' => 'SNARK = Succinct Non-interactive ARgument of Knowledge.'],
                            ]],
                        ],
                    ],
                ],
            ],

            // ─── Course 9: Post-Quantum Cryptography ──────────────────────────
            [
                'title' => 'Post-Quantum Cryptography',
                'summary' => 'Prepare for the quantum computing era: lattice-based, code-based, and hash-based cryptographic algorithms resistant to quantum attacks.',
                'estimated_minutes' => 170,
                'is_published' => false,
                'category' => 'post-quantum',
                'difficulty' => 'advanced',
                'topics' => [
                    [
                        'title' => 'Quantum Computing Threat',
                        'description' => 'How quantum computers threaten current cryptographic systems.',
                        'learning_objectives' => ['Understand Shor\'s algorithm impact', 'Identify vulnerable algorithms', 'Plan for crypto agility'],
                        'key_concepts' => ['Shor\'s Algorithm', 'Grover\'s Algorithm', 'Quantum Supremacy', 'Crypto Agility', 'Harvest Now Decrypt Later'],
                        'tasks' => [
                            ['title' => 'Quantum Computing Basics for Cryptographers', 'type' => 'video', 'minutes' => 15, 'description' => 'What quantum computers can and cannot do.'],
                            ['title' => 'Shor\'s Algorithm: Breaking RSA & ECC', 'type' => 'video', 'minutes' => 18, 'description' => 'How quantum computers factor large numbers efficiently.'],
                            ['title' => 'Grover\'s Algorithm: Halving Symmetric Security', 'type' => 'reading', 'minutes' => 12, 'description' => 'Why we need to double symmetric key sizes.'],
                            ['title' => 'Harvest Now, Decrypt Later', 'type' => 'reading', 'minutes' => 10, 'description' => 'Why we need to act now even before quantum computers arrive.'],
                            ['title' => 'Quantum Threat Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your quantum threat knowledge.', 'quiz_questions' => [
                                ['question' => 'Which algorithm does Shor\'s algorithm break?', 'options' => ['AES-256', 'RSA', 'SHA-256', 'ChaCha20'], 'correct_option' => 1, 'explanation' => 'Shor\'s algorithm efficiently solves integer factorization and discrete logarithm, breaking RSA and ECC.'],
                                ['question' => 'What is the impact of Grover\'s algorithm on AES-128?', 'options' => ['Completely breaks it', 'Reduces security to 64-bit equivalent', 'No impact', 'Makes it stronger'], 'correct_option' => 1, 'explanation' => 'Grover\'s algorithm provides a quadratic speedup for search, effectively halving the security bits.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Lattice-Based Cryptography',
                        'description' => 'The leading candidate for post-quantum public-key encryption and signatures.',
                        'learning_objectives' => ['Understand lattice problems (LWE, RLWE)', 'Learn about CRYSTALS-Kyber', 'Study CRYSTALS-Dilithium signatures'],
                        'key_concepts' => ['Lattice', 'LWE', 'RLWE', 'CRYSTALS-Kyber', 'CRYSTALS-Dilithium', 'ML-KEM'],
                        'tasks' => [
                            ['title' => 'Introduction to Lattices', 'type' => 'video', 'minutes' => 16, 'description' => 'Mathematical lattices and hard problems.'],
                            ['title' => 'Learning With Errors (LWE)', 'type' => 'video', 'minutes' => 14, 'description' => 'The problem that makes lattice crypto secure.'],
                            ['title' => 'CRYSTALS-Kyber (ML-KEM)', 'type' => 'video', 'minutes' => 18, 'description' => 'NIST\'s chosen post-quantum key encapsulation mechanism.'],
                            ['title' => 'CRYSTALS-Dilithium (ML-DSA)', 'type' => 'reading', 'minutes' => 15, 'description' => 'Post-quantum digital signatures from lattices.'],
                            ['title' => 'Lattice Crypto Quiz', 'type' => 'quiz', 'minutes' => 10, 'description' => 'Test your lattice cryptography knowledge.', 'quiz_questions' => [
                                ['question' => 'Which NIST PQC standard is for key encapsulation?', 'options' => ['Dilithium', 'Kyber (ML-KEM)', 'SPHINCS+', 'BIKE'], 'correct_option' => 1, 'explanation' => 'CRYSTALS-Kyber (now ML-KEM) was selected by NIST as the standard for post-quantum key encapsulation.'],
                                ['question' => 'What mathematical problem does Kyber rely on?', 'options' => ['Integer factorization', 'Discrete logarithm', 'Module Learning With Errors', 'Hash collision'], 'correct_option' => 2, 'explanation' => 'Kyber\'s security is based on the Module Learning With Errors (MLWE) problem.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Hash-Based Signatures',
                        'description' => 'Signature schemes whose security relies only on hash function properties.',
                        'learning_objectives' => ['Understand Lamport signatures', 'Learn XMSS and SPHINCS+', 'Compare stateful vs stateless schemes'],
                        'key_concepts' => ['Lamport Signature', 'XMSS', 'SPHINCS+', 'Stateful', 'Stateless', 'SLH-DSA'],
                        'tasks' => [
                            ['title' => 'Lamport One-Time Signatures', 'type' => 'video', 'minutes' => 12, 'description' => 'The simplest quantum-resistant signature scheme.'],
                            ['title' => 'Merkle Signature Scheme (XMSS)', 'type' => 'video', 'minutes' => 14, 'description' => 'Extending one-time signatures with Merkle trees.'],
                            ['title' => 'SPHINCS+ (SLH-DSA)', 'type' => 'reading', 'minutes' => 16, 'description' => 'NIST\'s stateless hash-based signature standard.'],
                            ['title' => 'Hash-Based Signatures Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your hash-based signature knowledge.', 'quiz_questions' => [
                                ['question' => 'Why are hash-based signatures considered quantum-safe?', 'options' => ['They use large keys', 'Their security relies only on hash function properties', 'They are very slow', 'They use lattices internally'], 'correct_option' => 1, 'explanation' => 'Hash-based signatures only require the security of the underlying hash function, which quantum computers don\'t efficiently break.'],
                                ['question' => 'What is the main disadvantage of SPHINCS+?', 'options' => ['Not quantum-safe', 'Large signature sizes', 'Requires trusted setup', 'Patent restrictions'], 'correct_option' => 1, 'explanation' => 'SPHINCS+ signatures are relatively large (tens of kilobytes) compared to lattice-based alternatives.'],
                            ]],
                        ],
                    ],
                ],
            ],

            // ─── Course 10: Applied Cryptography ──────────────────────────────
            [
                'title' => 'Applied Cryptography in Practice',
                'summary' => 'Real-world cryptographic implementations: secure coding practices, common pitfalls, and hands-on projects using modern libraries.',
                'estimated_minutes' => 220,
                'is_published' => false,
                'category' => 'applied',
                'difficulty' => 'advanced',
                'topics' => [
                    [
                        'title' => 'Secure Random Number Generation',
                        'description' => 'Implementing cryptographically secure randomness in real applications.',
                        'learning_objectives' => ['Use OS-provided entropy sources', 'Implement secure key generation', 'Avoid common PRNG mistakes'],
                        'key_concepts' => ['/dev/urandom', 'CryptGenRandom', 'SecureRandom', 'Entropy Pool', 'Seed Management'],
                        'tasks' => [
                            ['title' => 'OS Entropy Sources', 'type' => 'video', 'minutes' => 12, 'description' => 'How operating systems collect and provide randomness.'],
                            ['title' => 'Secure Key Generation Patterns', 'type' => 'reading', 'minutes' => 15, 'description' => 'Best practices for generating cryptographic keys.'],
                            ['title' => 'Common PRNG Vulnerabilities', 'type' => 'video', 'minutes' => 14, 'description' => 'Real-world bugs from bad randomness.'],
                            ['title' => 'RNG Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your secure RNG knowledge.', 'quiz_questions' => [
                                ['question' => 'Which is the correct way to generate a random key in Python?', 'options' => ['random.randint()', 'os.urandom()', 'time.time()', 'hash(input())'], 'correct_option' => 1, 'explanation' => 'os.urandom() provides cryptographically secure random bytes from the OS entropy source.'],
                                ['question' => 'What happens if you seed a PRNG with a predictable value?', 'options' => ['Nothing', 'Output becomes predictable', 'It runs faster', 'It uses more memory'], 'correct_option' => 1, 'explanation' => 'A predictable seed means an attacker can reproduce the entire output sequence.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Implementing AES Correctly',
                        'description' => 'Practical AES implementation with proper mode selection, IV handling, and key management.',
                        'learning_objectives' => ['Choose correct AES mode for use case', 'Handle IVs and nonces properly', 'Implement key derivation'],
                        'key_concepts' => ['AES-GCM', 'Key Derivation (HKDF)', 'Nonce Management', 'Authenticated Encryption'],
                        'tasks' => [
                            ['title' => 'AES-GCM Implementation', 'type' => 'video', 'minutes' => 18, 'description' => 'Step-by-step AES-GCM encryption in multiple languages.'],
                            ['title' => 'Key Derivation with HKDF', 'type' => 'video', 'minutes' => 12, 'description' => 'Deriving multiple keys from a master secret.'],
                            ['title' => 'Nonce Misuse Resistance', 'type' => 'reading', 'minutes' => 14, 'description' => 'What happens when nonces are reused and how to prevent it.'],
                            ['title' => 'AES Implementation Quiz', 'type' => 'quiz', 'minutes' => 10, 'description' => 'Test your practical AES knowledge.', 'quiz_questions' => [
                                ['question' => 'What size should a GCM nonce be?', 'options' => ['64 bits', '96 bits', '128 bits', '256 bits'], 'correct_option' => 1, 'explanation' => 'The recommended nonce size for AES-GCM is 96 bits (12 bytes).'],
                                ['question' => 'What does HKDF stand for?', 'options' => ['Hash Key Derivation Function', 'HMAC-based Key Derivation Function', 'High-security Key Distribution Framework', 'Hybrid Key Derivation Format'], 'correct_option' => 1, 'explanation' => 'HKDF is the HMAC-based Extract-and-Expand Key Derivation Function (RFC 5869).'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Cryptographic API Security',
                        'description' => 'Common mistakes when using cryptographic libraries and how to avoid them.',
                        'learning_objectives' => ['Identify insecure defaults', 'Implement constant-time comparison', 'Handle errors securely'],
                        'key_concepts' => ['Timing Attacks', 'Padding Oracle', 'Constant-Time', 'Side Channels', 'Secure Defaults'],
                        'tasks' => [
                            ['title' => 'Timing Attacks & Constant-Time Code', 'type' => 'video', 'minutes' => 14, 'description' => 'Why string comparison can leak secrets.'],
                            ['title' => 'Padding Oracle Attacks', 'type' => 'video', 'minutes' => 16, 'description' => 'How error messages can break encryption.'],
                            ['title' => 'Secure API Design Patterns', 'type' => 'reading', 'minutes' => 15, 'description' => 'Designing APIs that are hard to misuse.'],
                            ['title' => 'Side-Channel Mitigations', 'type' => 'reading', 'minutes' => 12, 'description' => 'Protecting against power analysis and cache timing.'],
                            ['title' => 'Crypto API Security Quiz', 'type' => 'quiz', 'minutes' => 10, 'description' => 'Test your secure implementation knowledge.', 'quiz_questions' => [
                                ['question' => 'Why should you use constant-time comparison for MACs?', 'options' => ['It\'s faster', 'Prevents timing attacks that leak byte-by-byte information', 'It uses less memory', 'It\'s required by the standard'], 'correct_option' => 1, 'explanation' => 'Regular string comparison returns early on mismatch, leaking information about how many bytes matched.'],
                                ['question' => 'What is a padding oracle attack?', 'options' => ['Attacking the key', 'Using error messages to decrypt ciphertext', 'Brute forcing the padding', 'A type of SQL injection'], 'correct_option' => 1, 'explanation' => 'Padding oracle attacks exploit different error responses for valid vs invalid padding to decrypt ciphertext byte by byte.'],
                            ]],
                        ],
                    ],
                    [
                        'title' => 'Secure Key Management',
                        'description' => 'Storing, rotating, and distributing cryptographic keys in production systems.',
                        'learning_objectives' => ['Design key hierarchies', 'Implement key rotation', 'Use HSMs and key vaults'],
                        'key_concepts' => ['Key Hierarchy', 'Key Rotation', 'HSM', 'Key Vault', 'Key Wrapping', 'Envelope Encryption'],
                        'tasks' => [
                            ['title' => 'Key Hierarchy Design', 'type' => 'video', 'minutes' => 14, 'description' => 'Master keys, data encryption keys, and key encryption keys.'],
                            ['title' => 'Key Rotation Strategies', 'type' => 'video', 'minutes' => 12, 'description' => 'How to rotate keys without downtime.'],
                            ['title' => 'Hardware Security Modules (HSMs)', 'type' => 'reading', 'minutes' => 15, 'description' => 'Dedicated hardware for key protection.'],
                            ['title' => 'Cloud Key Management (AWS KMS, Azure Key Vault)', 'type' => 'reading', 'minutes' => 12, 'description' => 'Using cloud services for key management.'],
                            ['title' => 'Key Management Quiz', 'type' => 'quiz', 'minutes' => 8, 'description' => 'Test your key management knowledge.', 'quiz_questions' => [
                                ['question' => 'What is envelope encryption?', 'options' => ['Encrypting emails', 'Encrypting data keys with a master key', 'Using two algorithms', 'Physical key storage'], 'correct_option' => 1, 'explanation' => 'Envelope encryption encrypts data with a DEK, then encrypts the DEK with a master key (KEK).'],
                                ['question' => 'What does an HSM provide?', 'options' => ['Faster encryption', 'Tamper-resistant key storage and operations', 'Network security', 'Antivirus protection'], 'correct_option' => 1, 'explanation' => 'HSMs provide tamper-resistant hardware that stores keys and performs crypto operations without exposing the keys.'],
                            ]],
                        ],
                    ],
                ],
            ],
        ];
    }
}
