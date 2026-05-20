<?php

namespace Database\Seeders;

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\Topic;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ManagementDemoSeeder extends Seeder
{
    /**
     * Seed demo data: 12 courses, each with 7 topics, 3 tasks per topic,
     * 6 assessments (C1-C6) per course, 6 questions per quiz/assessment.
     */
    public function run(): void
    {
        $courseDefinitions = [
            [
                'title' => 'Kriptografi Klasik',
                'topics' => ['Caesar Cipher', 'Vigenere Cipher', 'Substitusi Monoalfabetik', 'Transposisi', 'Hill Cipher', 'Playfair Cipher', 'One-Time Pad'],
            ],
            [
                'title' => 'Kriptografi Modern',
                'topics' => ['AES', 'DES', 'Blowfish', 'ChaCha20', 'Twofish', 'Serpent', 'RC4'],
            ],
            [
                'title' => 'Kriptografi Asimetris',
                'topics' => ['RSA', 'ECC', 'Diffie-Hellman', 'ElGamal', 'DSA', 'ECDSA', 'Lattice-Based'],
            ],
            [
                'title' => 'Hash & Integritas',
                'topics' => ['SHA-256', 'MD5', 'HMAC', 'SHA-3', 'BLAKE2', 'Whirlpool', 'RIPEMD-160'],
            ],
            [
                'title' => 'Tanda Tangan Digital',
                'topics' => ['DSA Signature', 'RSA Signature', 'ECDSA', 'EdDSA', 'Schnorr Signature', 'BLS Signature', 'Ring Signature'],
            ],
            [
                'title' => 'Keamanan Jaringan',
                'topics' => ['TLS/SSL', 'VPN', 'Firewall', 'IDS/IPS', 'IPsec', 'WireGuard', 'SSH Protocol'],
            ],
            [
                'title' => 'Steganografi',
                'topics' => ['LSB Embedding', 'Audio Steganography', 'Video Steganography', 'Network Steganography', 'Image Steganography', 'Text Steganography', 'DNA Steganography'],
            ],
            [
                'title' => 'Analisis Kriptografi',
                'topics' => ['Brute Force', 'Frequency Analysis', 'Known Plaintext Attack', 'Chosen Plaintext', 'Differential Cryptanalysis', 'Linear Cryptanalysis', 'Side-Channel Attack'],
            ],
            [
                'title' => 'Protokol Keamanan',
                'topics' => ['OAuth 2.0', 'SAML', 'Kerberos', 'OpenID Connect', 'FIDO2/WebAuthn', 'TOTP/HOTP', 'Zero Knowledge Proof'],
            ],
            [
                'title' => 'Blockchain & Crypto',
                'topics' => ['Bitcoin', 'Ethereum', 'Smart Contracts', 'Consensus Mechanisms', 'Merkle Tree', 'Zero Knowledge Rollup', 'DeFi Protocol'],
            ],
            [
                'title' => 'Keamanan Aplikasi Web',
                'topics' => ['XSS', 'SQL Injection', 'CSRF', 'SSRF', 'JWT Security', 'CORS Policy', 'Content Security Policy'],
            ],
            [
                'title' => 'Manajemen Kunci',
                'topics' => ['PKI', 'Key Exchange', 'HSM', 'Key Derivation', 'Key Rotation', 'Secret Sharing', 'Threshold Cryptography'],
            ],
        ];

        $bloomLevels = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

        foreach ($courseDefinitions as $sortOrder => $def) {
            $course = Course::query()->create([
                'slug' => Str::slug($def['title']).'-'.fake()->unique()->numberBetween(100, 999),
                'title' => $def['title'],
                'summary' => "Mata kuliah {$def['title']} membahas konsep fundamental dan penerapan praktis dalam kriptografi.",
                'sort_order' => $sortOrder + 1,
                'status' => 'published',
            ]);

            // Create 7 topics with 3 tasks each (video, dokumen, quiz)
            foreach ($def['topics'] as $lessonPosition => $topicName) {
                $topic = Topic::query()->firstOrCreate(
                    ['slug' => Str::slug($topicName)],
                    ['name' => $topicName, 'category' => 'cryptography'],
                );

                $lesson = Lesson::query()->create([
                    'course_id' => $course->id,
                    'topic_id' => $topic->id,
                    'slug' => Str::slug($topicName).'-'.fake()->unique()->numberBetween(100, 999),
                    'title' => $topicName,
                    'description' => "Pembahasan materi {$topicName} secara komprehensif.",
                    'content' => "# {$topicName}\n\nMateri lengkap tentang {$topicName} dalam konteks {$def['title']}.",
                    'position' => $lessonPosition + 1,
                    'status' => 'published',
                ]);

                // Task 1: Video
                LessonTask::query()->create([
                    'lesson_id' => $lesson->id,
                    'title' => "Video: Pengenalan {$topicName}",
                    'type' => 'video',
                    'description' => "Video penjelasan konsep dasar {$topicName}.",
                    'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    'video_processing_status' => 'ready',
                    'sort_order' => 1,
                    'status' => 'published',
                ]);

                // Task 2: Dokumen
                LessonTask::query()->create([
                    'lesson_id' => $lesson->id,
                    'title' => "Dokumen: Materi {$topicName}",
                    'type' => 'read',
                    'description' => "Materi bacaan lengkap tentang {$topicName}.",
                    'sort_order' => 2,
                    'status' => 'published',
                ]);

                // Task 3: Quiz with 6 questions
                $quizTask = LessonTask::query()->create([
                    'lesson_id' => $lesson->id,
                    'title' => "Quiz: {$topicName}",
                    'type' => 'quiz',
                    'description' => "Quiz untuk mengukur pemahaman {$topicName}.",
                    'sort_order' => 3,
                    'status' => 'published',
                ]);

                // 6 quiz questions
                for ($q = 1; $q <= 6; $q++) {
                    QuizQuestion::query()->create([
                        'lesson_task_id' => $quizTask->id,
                        'question' => "Pertanyaan {$q} tentang {$topicName}: ".fake()->sentence().'?',
                        'options' => [
                            fake()->sentence(3),
                            fake()->sentence(3),
                            fake()->sentence(3),
                            fake()->sentence(3),
                        ],
                        'correct_option' => fake()->numberBetween(0, 3),
                        'explanation' => "Penjelasan jawaban pertanyaan {$q} tentang {$topicName}.",
                        'sort_order' => $q,
                    ]);
                }
            }

            // Create 6 assessments (C1-C6), each with 6 questions
            foreach ($bloomLevels as $assessmentOrder => $bloom) {
                $assessment = Assessment::query()->create([
                    'course_id' => $course->id,
                    'slug' => Str::slug("{$def['title']}-{$bloom}").'-'.fake()->unique()->numberBetween(100, 999),
                    'title' => "{$def['title']} — {$bloom}",
                    'description' => "Assessment level {$bloom} untuk mata kuliah {$def['title']}.",
                    'bloom_level' => $bloom,
                    'grading_type' => 'auto',
                    'passing_score' => 70,
                    'max_attempts' => 3,
                    'time_limit_minutes' => fake()->randomElement([30, 45, 60]),
                    'status' => 'published',
                    'sort_order' => $assessmentOrder + 1,
                ]);

                // 6 assessment questions per assessment
                for ($q = 1; $q <= 6; $q++) {
                    $questionType = fake()->randomElement(['mcq', 'multiple_select', 'true_false', 'short_answer', 'essay']);

                    $questionData = [
                        'assessment_id' => $assessment->id,
                        'bloom_level' => $bloom,
                        'question_type' => $questionType,
                        'question_text' => "Soal {$q} ({$bloom}): ".fake()->sentence(8).'?',
                        'explanation' => fake()->sentence(),
                        'points' => 10,
                        'grading_type' => 'auto',
                        'sort_order' => $q,
                    ];

                    $questionData = match ($questionType) {
                        'mcq' => [...$questionData, 'options' => ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'], 'correct_answer' => fake()->randomElement(['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'])],
                        'multiple_select' => [...$questionData, 'options' => ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'], 'correct_answer' => json_encode(['Opsi A', 'Opsi C'])],
                        'true_false' => [...$questionData, 'options' => ['Benar', 'Salah'], 'correct_answer' => fake()->randomElement(['Benar', 'Salah'])],
                        'short_answer' => [...$questionData, 'options' => null, 'correct_answer' => fake()->word()],
                        'essay' => [...$questionData, 'options' => null, 'correct_answer' => null, 'min_words' => 50, 'max_words' => 200],
                        default => $questionData,
                    };

                    AssessmentQuestion::query()->create($questionData);
                }
            }
        }

        $this->command->info('Seeded 12 courses × 7 topics × 3 tasks + 6 assessments × 6 questions each.');
    }
}
