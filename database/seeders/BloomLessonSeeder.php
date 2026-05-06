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

class BloomLessonSeeder extends Seeder
{
    /**
     * Seed one lesson/topic, three tasks, and six assessments covering C1-C6.
     */
    public function run(): void
    {
        $course = Course::query()->firstOrCreate(
            ['slug' => 'dasar-kriptografi-bloom'],
            [
                'title' => 'Dasar Kriptografi Bloom',
                'description' => 'Kursus pengantar kriptografi dengan latihan kognitif C1 sampai C6.',
                'summary' => 'Pelajari konsep dasar kriptografi, enkripsi, dekripsi, dan analisis cipher sederhana.',
                'estimated_minutes' => 60,
                'sort_order' => 1,
                'is_published' => true,
                'category' => 'Kriptografi',
                'difficulty' => 'beginner',
                'path_position' => 1,
            ],
        );

        $topic = Topic::query()->updateOrCreate(
            ['slug' => 'dasar-caesar-cipher-bloom'],
            [
                'name' => 'Dasar Caesar Cipher',
                'category' => 'Kriptografi',
            ],
        );

        $lesson = Lesson::query()->updateOrCreate(
            ['slug' => 'dasar-caesar-cipher-bloom'],
            [
                'course_id' => $course->id,
                'title' => 'Dasar Caesar Cipher',
                'description' => 'Lesson ini mengenalkan Caesar Cipher sebagai contoh substitusi monoalfabetik.',
                'content' => 'Caesar Cipher mengenkripsi teks dengan menggeser setiap huruf sejumlah nilai tetap. Teknik ini mudah dipahami, namun lemah terhadap analisis frekuensi dan brute force.',
                'position' => 1,
                'learning_objectives' => [
                    'Menjelaskan fungsi enkripsi dan dekripsi.',
                    'Menerapkan pergeseran Caesar Cipher pada pesan sederhana.',
                    'Menganalisis kelemahan Caesar Cipher.',
                ],
                'prerequisites_text' => 'Memahami alfabet dan operasi pergeseran sederhana.',
                'key_concepts' => [
                    'plaintext',
                    'ciphertext',
                    'key',
                    'shift',
                    'substitution cipher',
                ],
            ],
        );

        $videoTask = LessonTask::query()->updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'sort_order' => 1,
            ],
            [
                'title' => 'Tonton pengantar Caesar Cipher',
                'description' => 'Video singkat tentang plaintext, ciphertext, dan kunci pergeseran.',
                'type' => 'video',
                'video_url' => 'https://www.youtube.com/watch?v=sMOZf4GN3oc',
                'video_processing_status' => 'ready',
                'video_mp4_url' => null,
                'document_name' => null,
                'conversion_status' => null,
                'pdf_url' => null,
                'published_at' => now(),
                'published_by' => null,
            ],
        );

        LessonTask::query()->updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'sort_order' => 2,
            ],
            [
                'title' => 'Baca ringkasan Caesar Cipher',
                'description' => 'Materi bacaan tentang proses enkripsi, dekripsi, dan kelemahan cipher substitusi.',
                'type' => 'read',
                'video_url' => null,
                'video_processing_status' => null,
                'video_mp4_url' => null,
                'document_name' => 'Ringkasan Caesar Cipher',
                'conversion_status' => 'ready',
                'pdf_url' => null,
                'published_at' => now(),
                'published_by' => null,
            ],
        );

        $quizTask = LessonTask::query()->updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'sort_order' => 3,
            ],
            [
                'title' => 'Kuis cepat Caesar Cipher',
                'description' => 'Kuis untuk memastikan pemahaman dasar sebelum assessment.',
                'type' => 'quiz',
                'video_url' => null,
                'video_processing_status' => null,
                'video_mp4_url' => null,
                'document_name' => null,
                'conversion_status' => null,
                'pdf_url' => null,
                'published_at' => now(),
                'published_by' => null,
            ],
        );

        $this->seedQuizQuestions($quizTask, $topic);
        $this->seedAssessment($course, $topic);
    }

    private function seedQuizQuestions(LessonTask $quizTask, Topic $topic): void
    {
        $questions = [
            [
                'question' => 'Apa tujuan utama enkripsi?',
                'options' => [
                    'Mengubah plaintext menjadi ciphertext',
                    'Menghapus semua data',
                    'Mempercepat koneksi internet',
                    'Mengganti format gambar',
                ],
                'correct_option' => 0,
                'explanation' => 'Enkripsi mengubah plaintext menjadi ciphertext agar isi pesan tidak mudah dibaca.',
            ],
            [
                'question' => 'Jika huruf A digeser 3 posisi pada Caesar Cipher, hasilnya menjadi apa?',
                'options' => [
                    'B',
                    'C',
                    'D',
                    'E',
                ],
                'correct_option' => 2,
                'explanation' => 'A digeser tiga posisi menjadi D.',
            ],
            [
                'question' => 'Mengapa Caesar Cipher mudah diserang?',
                'options' => [
                    'Jumlah kemungkinan kunci sangat sedikit',
                    'Tidak memakai alfabet',
                    'Tidak menghasilkan ciphertext',
                    'Selalu membutuhkan internet',
                ],
                'correct_option' => 0,
                'explanation' => 'Caesar Cipher hanya memiliki sedikit kemungkinan pergeseran sehingga mudah dicoba satu per satu.',
            ],
        ];

        foreach ($questions as $index => $question) {
            QuizQuestion::query()->updateOrCreate(
                [
                    'lesson_task_id' => $quizTask->id,
                    'sort_order' => $index + 1,
                ],
                [
                    'topic_id' => $topic->id,
                    'question' => $question['question'],
                    'options' => $question['options'],
                    'correct_option' => $question['correct_option'],
                    'explanation' => $question['explanation'],
                    'difficulty_level' => ['easy', 'medium', 'hard'][$index],
                    'difficulty_score' => 0.2 + ($index * 0.2),
                    'discrimination' => 0.0,
                    'times_shown' => 0,
                    'times_correct' => 0,
                ],
            );
        }
    }

    private function seedAssessment(Course $course, Topic $topic): void
    {
        Assessment::query()
            ->where('slug', 'assessment-caesar-cipher-c1-c6')
            ->delete();

        foreach ($this->assessmentQuestions() as $index => $question) {
            $bloomLevel = $question['bloom_level'];
            $bloomLabel = Assessment::BLOOM_LABELS[$bloomLevel] ?? $bloomLevel;
            $sortOrder = $index + 1;

            $assessment = Assessment::query()->updateOrCreate(
                ['slug' => sprintf('assessment-caesar-cipher-%s', strtolower($bloomLevel))],
                [
                    'title' => sprintf('Assessment Caesar Cipher %s - %s', $bloomLevel, $bloomLabel),
                    'description' => sprintf('Assessment level %s untuk mengukur kemampuan %s pada materi Caesar Cipher.', $bloomLevel, $bloomLabel),
                    'course_id' => $course->id,
                    'topic_id' => $topic->id,
                    'bloom_level' => $bloomLevel,
                    'grading_type' => $question['grading_type'] === 'auto'
                        ? Assessment::GRADING_AUTO
                        : Assessment::GRADING_MANUAL,
                    'passing_score' => 70,
                    'max_attempts' => 3,
                    'time_limit_minutes' => 20,
                    'is_published' => true,
                    'available_from' => now(),
                    'available_until' => null,
                    'sort_order' => $sortOrder,
                ],
            );

            AssessmentQuestion::query()->updateOrCreate(
                [
                    'assessment_id' => $assessment->id,
                    'bloom_level' => $bloomLevel,
                    'sort_order' => 1,
                ],
                [
                    'question_type' => $question['question_type'],
                    'question_text' => $question['question_text'],
                    'options' => $question['options'] ?? null,
                    'correct_answer' => $question['correct_answer'] ?? null,
                    'explanation' => $question['explanation'],
                    'rubric' => $question['rubric'] ?? null,
                    'points' => $question['points'],
                    'grading_type' => $question['grading_type'],
                    'min_words' => $question['min_words'] ?? null,
                    'max_words' => $question['max_words'] ?? null,
                ],
            );
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function assessmentQuestions(): array
    {
        return [
            [
                'bloom_level' => Assessment::BLOOM_C1,
                'question_type' => AssessmentQuestion::TYPE_MCQ,
                'question_text' => 'C1 - Mengingat: Apa nama teks asli sebelum dienkripsi?',
                'options' => [
                    ['label' => 'Plaintext', 'value' => 'plaintext'],
                    ['label' => 'Ciphertext', 'value' => 'ciphertext'],
                    ['label' => 'Key', 'value' => 'key'],
                    ['label' => 'Hash', 'value' => 'hash'],
                ],
                'correct_answer' => 'plaintext',
                'explanation' => 'Plaintext adalah pesan asli sebelum proses enkripsi.',
                'points' => 10,
                'grading_type' => 'auto',
            ],
            [
                'bloom_level' => Assessment::BLOOM_C2,
                'question_type' => AssessmentQuestion::TYPE_ESSAY,
                'question_text' => 'C2 - Memahami: Jelaskan dengan bahasa sendiri perbedaan plaintext, ciphertext, dan key pada Caesar Cipher.',
                'explanation' => 'Jawaban baik menjelaskan plaintext sebagai pesan asli, ciphertext sebagai pesan tersandi, dan key sebagai nilai pergeseran.',
                'points' => 15,
                'grading_type' => 'manual',
                'min_words' => 40,
                'max_words' => 180,
                'rubric' => $this->rubric('Kejelasan konsep', 'Menjelaskan tiga istilah utama dengan tepat.', 15),
            ],
            [
                'bloom_level' => Assessment::BLOOM_C3,
                'question_type' => AssessmentQuestion::TYPE_COMPUTATION,
                'question_text' => 'C3 - Menerapkan: Enkripsi kata KODE dengan Caesar Cipher shift 3.',
                'correct_answer' => 'NRGH',
                'explanation' => 'K→N, O→R, D→G, E→H sehingga KODE menjadi NRGH.',
                'points' => 15,
                'grading_type' => 'auto',
            ],
            [
                'bloom_level' => Assessment::BLOOM_C4,
                'question_type' => AssessmentQuestion::TYPE_CASE_STUDY,
                'question_text' => 'C4 - Menganalisis: Seorang penyerang mengetahui pesan dienkripsi dengan Caesar Cipher. Analisis dua alasan mengapa pesan itu tetap mudah dibongkar.',
                'explanation' => 'Jawaban baik membahas ruang kunci kecil dan pola frekuensi huruf yang masih terlihat.',
                'points' => 20,
                'grading_type' => 'manual',
                'min_words' => 60,
                'max_words' => 220,
                'rubric' => $this->rubric('Analisis kelemahan', 'Menguraikan minimal dua kelemahan Caesar Cipher dengan alasan logis.', 20),
            ],
            [
                'bloom_level' => Assessment::BLOOM_C5,
                'question_type' => AssessmentQuestion::TYPE_ESSAY,
                'question_text' => 'C5 - Mengevaluasi: Nilai apakah Caesar Cipher layak dipakai untuk melindungi password modern. Sertakan alasan teknis.',
                'explanation' => 'Caesar Cipher tidak layak untuk password modern karena mudah dibongkar, tidak memakai salt, dan ruang kunci terlalu kecil.',
                'points' => 20,
                'grading_type' => 'manual',
                'min_words' => 70,
                'max_words' => 240,
                'rubric' => $this->rubric('Kualitas evaluasi', 'Memberikan keputusan jelas dan alasan teknis yang relevan.', 20),
            ],
            [
                'bloom_level' => Assessment::BLOOM_C6,
                'question_type' => AssessmentQuestion::TYPE_DESIGN,
                'question_text' => 'C6 - Mencipta: Rancang aturan mini cipher yang lebih kuat dari Caesar Cipher. Jelaskan cara enkripsi, dekripsi, dan alasan desainnya.',
                'explanation' => 'Jawaban baik menjelaskan rancangan, langkah enkripsi/dekripsi, serta alasan peningkatan keamanan.',
                'points' => 20,
                'grading_type' => 'manual',
                'min_words' => 90,
                'max_words' => 300,
                'rubric' => $this->rubric('Rancangan cipher', 'Membuat desain koheren yang dapat dienkripsi dan didekripsi.', 20),
            ],
        ];
    }

    /**
     * @return array{criteria: array<int, array{name: string, description: string, max_points: int, levels: array<int, array{score: int, description: string}>}>}
     */
    private function rubric(string $name, string $description, int $maxPoints): array
    {
        return [
            'criteria' => [
                [
                    'name' => $name,
                    'description' => $description,
                    'max_points' => $maxPoints,
                    'levels' => [
                        ['score' => $maxPoints, 'description' => 'Lengkap, tepat, dan terstruktur.'],
                        ['score' => (int) floor($maxPoints * 0.7), 'description' => 'Cukup tepat, tetapi masih kurang detail.'],
                        ['score' => (int) floor($maxPoints * 0.4), 'description' => 'Sebagian konsep benar, tetapi alasan lemah.'],
                        ['score' => 0, 'description' => 'Tidak menjawab atau jawaban tidak relevan.'],
                    ],
                ],
            ],
        ];
    }
}
