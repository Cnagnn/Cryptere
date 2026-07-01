<?php

namespace Database\Seeders;

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Support\CourseAssetStorage;
use Illuminate\Database\Seeder;

class CryptographyCourseSeeder extends Seeder
{
    public function run(): void
    {
        $courseAssets = app(CourseAssetStorage::class);
        $retainedCourseIds = [];

        foreach ($this->courseBlueprints() as $courseIndex => $courseBlueprint) {
            $course = Course::query()->updateOrCreate(
                ['slug' => $courseBlueprint['slug']],
                [
                    'title' => $courseBlueprint['title'],
                    'summary' => $courseBlueprint['summary'],
                    'category' => 'cryptography',
                    'difficulty' => $courseBlueprint['difficulty'],
                    'sort_order' => $courseIndex + 1,
                    'status' => Course::STATUS_PUBLISHED,
                    'is_published' => true,
                ],
            );

            $retainedCourseIds[] = $course->id;
            $retainedLessonIds = [];
            $retainedAssessmentIds = [];

            foreach ($courseBlueprint['lessons'] as $lessonIndex => $lessonBlueprint) {
                $lesson = Lesson::query()->updateOrCreate(
                    [
                        'course_id' => $course->id,
                        'slug' => $lessonBlueprint['slug'],
                    ],
                    [
                        'title' => $lessonBlueprint['title'],
                        'description' => $lessonBlueprint['description'],
                        'content' => $lessonBlueprint['content'],
                        'position' => $lessonIndex + 1,
                        'learning_objectives' => $lessonBlueprint['learning_objectives'],
                        'key_concepts' => $lessonBlueprint['key_concepts'],
                        'status' => Lesson::STATUS_PUBLISHED,
                    ],
                );

                $retainedLessonIds[] = $lesson->id;
                $retainedTaskIds = [];

                foreach ($lessonBlueprint['tasks'] as $taskIndex => $taskBlueprint) {
                    $pdfUrl = null;

                    if (($taskBlueprint['type'] ?? null) === 'read') {
                        $documentPath = sprintf(
                            'lesson-documents/%s/%s.pdf',
                            $courseBlueprint['slug'],
                            $lessonBlueprint['slug'],
                        );

                        $courseAssets->putLocalFile(
                            $documentPath,
                            base_path('ta-elearning-kriptografi.pdf'),
                        );

                        $pdfUrl = $courseAssets->url($documentPath);
                    }

                    $task = LessonTask::query()->updateOrCreate(
                        [
                            'lesson_id' => $lesson->id,
                            'title' => $taskBlueprint['title'],
                        ],
                        [
                            'description' => $taskBlueprint['description'],
                            'type' => $taskBlueprint['type'],
                            'video_url' => $taskBlueprint['video_url'] ?? null,
                            'document_name' => $taskBlueprint['document_name'] ?? null,
                            'conversion_status' => $taskBlueprint['conversion_status'] ?? null,
                            'pdf_url' => $pdfUrl,
                            'sort_order' => $taskIndex + 1,
                            'status' => LessonTask::STATUS_PUBLISHED,
                        ],
                    );

                    $retainedTaskIds[] = $task->id;

                    QuizQuestion::query()
                        ->where('lesson_task_id', $task->id)
                        ->delete();

                    if (($taskBlueprint['type'] ?? null) === 'quiz') {
                        foreach ($taskBlueprint['questions'] as $questionIndex => $questionBlueprint) {
                            QuizQuestion::query()->create([
                                'lesson_task_id' => $task->id,
                                'question' => $questionBlueprint['question'],
                                'options' => $questionBlueprint['options'],
                                'correct_option' => $questionBlueprint['correct_option'],
                                'explanation' => $questionBlueprint['explanation'],
                                'sort_order' => $questionIndex + 1,
                            ]);
                        }
                    }
                }

                LessonTask::query()
                    ->where('lesson_id', $lesson->id)
                    ->whereNotIn('id', $retainedTaskIds)
                    ->delete();
            }

            foreach ($this->buildAssessmentQuestions($courseBlueprint['title']) as $assessmentIndex => $questionBlueprint) {
                $assessment = Assessment::query()->updateOrCreate(
                    [
                        'course_id' => $course->id,
                        'slug' => sprintf(
                            '%s-competency-%s',
                            $courseBlueprint['slug'],
                            strtolower($questionBlueprint['bloom_level']),
                        ),
                    ],
                    [
                        'title' => sprintf(
                            '%s Competency %s',
                            $courseBlueprint['title'],
                            $questionBlueprint['bloom_level'],
                        ),
                        'description' => 'Uji kompetensi berbasis Bloom taxonomy untuk level '.$questionBlueprint['bloom_level'].'.',
                        'bloom_level' => $questionBlueprint['bloom_level'],
                        'grading_type' => Assessment::GRADING_AUTO,
                        'passing_score' => 70,
                        'max_attempts' => 3,
                        'time_limit_minutes' => 30,
                        'sort_order' => $assessmentIndex + 1,
                        'status' => Assessment::STATUS_PUBLISHED,
                    ],
                );

                $retainedAssessmentIds[] = $assessment->id;

                AssessmentQuestion::query()
                    ->where('assessment_id', $assessment->id)
                    ->delete();

                AssessmentQuestion::query()->create([
                    'assessment_id' => $assessment->id,
                    'bloom_level' => $questionBlueprint['bloom_level'],
                    'question_type' => $questionBlueprint['question_type'],
                    'question_text' => $questionBlueprint['question_text'],
                    'options' => $questionBlueprint['options'],
                    'correct_answer' => $questionBlueprint['correct_answer'],
                    'explanation' => $questionBlueprint['explanation'],
                    'points' => 10,
                    'grading_type' => Assessment::GRADING_AUTO,
                    'sort_order' => 1,
                    'min_words' => $questionBlueprint['min_words'] ?? null,
                    'max_words' => $questionBlueprint['max_words'] ?? null,
                    'rubric' => $questionBlueprint['rubric'] ?? null,
                ]);
            }

            Assessment::query()
                ->where('course_id', $course->id)
                ->whereNotIn('id', $retainedAssessmentIds)
                ->delete();

            Lesson::query()
                ->where('course_id', $course->id)
                ->whereNotIn('id', $retainedLessonIds)
                ->delete();
        }

        Course::query()
            ->whereIn('slug', array_column($this->courseBlueprints(), 'slug'))
            ->whereNotIn('id', $retainedCourseIds)
            ->delete();
    }

    /**
     * @return array<int, array{
     *   slug: string,
     *   title: string,
     *   summary: string,
     *   difficulty: string,
     *   lessons: array<int, array<string, mixed>>
     * }>
     */
    private function courseBlueprints(): array
    {
        return [
            $this->buildCourseBlueprint(
                'caesar-cipher-lab',
                'beginner',
                ['shift', 'monoalphabetic substitution', 'key space', 'frequency analysis'],
                'Materi ini membahas bagaimana pergeseran alfabet bekerja, bagaimana kunci direpresentasikan, dan mengapa Caesar Cipher mudah dipecahkan.',
            ),
            $this->buildCourseBlueprint(
                'vigenere-cipher-lab',
                'beginner',
                ['keyword encryption', 'polyalphabetic substitution', 'repeating key', 'Kasiski examination'],
                'Materi ini membahas penggunaan kata kunci untuk menghasilkan pergeseran berbeda di setiap karakter dan dampaknya terhadap keamanan dibanding Caesar.',
            ),
            $this->buildCourseBlueprint(
                'aes-lab',
                'intermediate',
                ['block cipher', 'state matrix', 'SubBytes', 'ShiftRows', 'MixColumns', 'AddRoundKey'],
                'Materi ini fokus pada struktur internal AES-128, representasi state, dan alasan setiap transformasi diperlukan untuk confusi serta difusi.',
            ),
            $this->buildCourseBlueprint(
                'des-lab',
                'intermediate',
                ['Feistel network', 'initial permutation', 'round function', 'S-box', 'legacy cipher'],
                'Materi ini menjelaskan jaringan Feistel pada DES, peran permutasi dan S-box, serta alasan DES kini diposisikan sebagai algoritma legacy.',
            ),
            $this->buildCourseBlueprint(
                'rsa-lab',
                'intermediate',
                ['public key cryptography', 'prime numbers', 'modular arithmetic', 'key generation'],
                'Materi ini membahas pembangkitan kunci RSA, hubungan p, q, n, phi, e, dan d, serta bagaimana operasi modular menghasilkan enkripsi dan dekripsi.',
            ),
            $this->buildCourseBlueprint(
                'digital-signature-lab',
                'intermediate',
                ['message digest', 'integrity', 'authenticity', 'non-repudiation', 'verification flow'],
                'Materi ini memfokuskan pada tanda tangan digital berbasis RSA dan SHA-256 untuk menjamin integritas, autentikasi, dan non-repudiasi.',
            ),
        ];
    }

    /**
     * @param  array<int, string>  $concepts
     * @return array{slug: string, title: string, summary: string, difficulty: string, lessons: array<int, array<string, mixed>>}
     */
    private function buildCourseBlueprint(string $labSlug, string $difficulty, array $concepts, string $body): array
    {
        /** @var array{title: string, summary: string, group: string} $lab */
        $lab = config("labs.{$labSlug}");
        $courseSlug = str_replace('-lab', '-course', $labSlug);
        $courseTitle = $lab['title'].' Fundamentals';
        $videoUrl = $this->youtubeUrlsByLab()[$labSlug];

        return [
            'slug' => $courseSlug,
            'title' => $courseTitle,
            'summary' => 'Materi pembelajaran untuk '.$lab['title'].' tanpa membuka simulasi lab secara langsung.',
            'difficulty' => $difficulty,
            'lessons' => [
                $this->buildLessonBlueprint(
                    $courseSlug,
                    $lab['title'],
                    'foundations',
                    'Foundations',
                    'Pengenalan konsep inti, komponen algoritma, dan alasan algoritma ini penting dipelajari.',
                    $this->buildLongLessonContent($lab['title'], 'foundations', $body),
                    [
                        'Menjelaskan peran '.$lab['title'].' dalam peta kriptografi.',
                        'Mengidentifikasi konsep inti yang membangun algoritma.',
                        'Membedakan kapan algoritma ini relevan dan kapan tidak.',
                    ],
                    $concepts,
                    $videoUrl,
                ),
                $this->buildLessonBlueprint(
                    $courseSlug,
                    $lab['title'],
                    'mechanics',
                    'Mechanics',
                    'Membedah alur kerja algoritma, representasi data, dan langkah transformasi utama.',
                    $this->buildLongLessonContent($lab['title'], 'mechanics', 'Pelajaran ini mengurai aliran data dari input ke output, menunjukkan bagaimana representasi internal, kunci, dan transformasi berulang membentuk perilaku keamanan algoritma.'),
                    [
                        'Menelusuri urutan langkah algoritma dari input ke output.',
                        'Menjelaskan bagaimana kunci memengaruhi hasil transformasi.',
                        'Membedakan peran tiap komponen dalam menjaga kerahasiaan, integritas, atau autentikasi.',
                    ],
                    ['data flow', 'internal representation', 'key influence'],
                    $videoUrl,
                ),
                $this->buildLessonBlueprint(
                    $courseSlug,
                    $lab['title'],
                    'analysis',
                    'Analysis and Practice',
                    'Analisis kekuatan, keterbatasan, dan latihan pemahaman berbasis skenario.',
                    $this->buildLongLessonContent($lab['title'], 'analysis', 'Pelajaran ini membantu learner menilai keamanan, use case, trade-off, dan kesalahan umum saat memilih atau menjelaskan algoritma '.$lab['title'].' dalam konteks nyata.'),
                    [
                        'Mengevaluasi kekuatan dan keterbatasan algoritma.',
                        'Memilih konteks penggunaan yang tepat untuk '.$lab['title'].'.',
                        'Menjawab pertanyaan konseptual tanpa bergantung pada simulasi lab.',
                    ],
                    ['security trade-off', 'use case selection', 'threat model awareness'],
                    $videoUrl,
                ),
            ],
        ];
    }

    /**
     * @param  array<int, string>  $learningObjectives
     * @param  array<int, string>  $keyConcepts
     * @return array<string, mixed>
     */
    private function buildLessonBlueprint(
        string $courseSlug,
        string $labTitle,
        string $slugSuffix,
        string $label,
        string $description,
        string $content,
        array $learningObjectives,
        array $keyConcepts,
        string $videoUrl,
    ): array {
        return [
            'slug' => $courseSlug.'-'.$slugSuffix,
            'title' => $labTitle.' '.$label,
            'description' => $description,
            'content' => $content,
            'learning_objectives' => $learningObjectives,
            'key_concepts' => $keyConcepts,
            'tasks' => [
                [
                    'title' => 'Video: '.$labTitle.' '.$label,
                    'description' => 'Tonton penjelasan video YouTube untuk membangun pemahaman visual sebelum mengerjakan task lainnya.',
                    'type' => 'video',
                    'video_url' => $videoUrl,
                ],
                [
                    'title' => 'Baca + PDF: '.$labTitle.' '.$label,
                    'description' => 'Pelajari materi bacaan dan dokumen PDF asli untuk memperdalam konsep, istilah, dan konteks penggunaan algoritma.',
                    'type' => 'read',
                    'document_name' => 'ta-elearning-kriptografi.pdf',
                    'conversion_status' => 'converted',
                ],
                [
                    'title' => 'Quiz: '.$labTitle.' '.$label,
                    'description' => 'Evaluasi pemahaman learner terhadap video, materi baca, dan struktur konsep pada sesi ini.',
                    'type' => 'quiz',
                    'questions' => $this->buildQuizQuestions($labTitle, $label),
                ],
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function youtubeUrlsByLab(): array
    {
        return [
            'caesar-cipher-lab' => 'https://www.youtube.com/watch?v=sMOZf4GN3oc',
            'vigenere-cipher-lab' => 'https://www.youtube.com/watch?v=SkJcmCaHqS0',
            'aes-lab' => 'https://www.youtube.com/watch?v=O4xNJsjtN6E',
            'des-lab' => 'https://www.youtube.com/watch?v=YJYBlG5we38',
            'rsa-lab' => 'https://www.youtube.com/watch?v=4zahvcJ9glg',
            'digital-signature-lab' => 'https://www.youtube.com/watch?v=GSIDS_lvRv4',
        ];
    }

    /**
     * @return array<int, array{question: string, options: array<int, string>, correct_option: int, explanation: string}>
     */
    private function buildQuizQuestions(string $labTitle, string $lessonLabel): array
    {
        return [
            [
                'question' => 'Apa fokus utama yang dipelajari pada sesi '.$lessonLabel.' untuk '.$labTitle.'?',
                'options' => [
                    'Konsep, alur kerja, dan konteks penggunaan algoritma',
                    'Dekorasi antarmuka pengguna',
                    'Pengaturan server produksi',
                    'Migrasi database umum',
                ],
                'correct_option' => 0,
                'explanation' => 'Materi course ini berfokus pada pemahaman algoritma, bukan topik UI atau infrastruktur.',
            ],
            [
                'question' => 'Mengapa memahami komponen internal '.$labTitle.' itu penting?',
                'options' => [
                    'Agar learner tahu bagaimana keamanan dibentuk oleh setiap langkah',
                    'Agar learner tidak perlu memahami kunci sama sekali',
                    'Agar semua algoritma lain bisa diabaikan',
                    'Agar implementasi selalu bebas ancaman',
                ],
                'correct_option' => 0,
                'explanation' => 'Komponen internal menjelaskan bagaimana algoritma mencapai tujuan keamanannya dan di mana batasannya.',
            ],
            [
                'question' => 'Apa manfaat mempelajari konteks penggunaan '.$labTitle.'?',
                'options' => [
                    'Membantu memilih algoritma yang tepat untuk kebutuhan tertentu',
                    'Membuat evaluasi ancaman tidak diperlukan',
                    'Menghilangkan kebutuhan dokumentasi',
                    'Menyamakan semua algoritma menjadi identik',
                ],
                'correct_option' => 0,
                'explanation' => 'Pemilihan algoritma harus mempertimbangkan kebutuhan, ancaman, performa, dan sifat data.',
            ],
            [
                'question' => 'Apa hasil yang diharapkan setelah menyelesaikan quiz '.$labTitle.'?',
                'options' => [
                    'Learner mampu menjelaskan dasar algoritma dengan runtut dan kritis',
                    'Learner harus menghafal semua source code implementasi',
                    'Learner tidak perlu lagi membandingkan algoritma',
                    'Learner harus menghapus metode kriptografi lain',
                ],
                'correct_option' => 0,
                'explanation' => 'Tujuan quiz adalah menguji pemahaman konseptual dan kemampuan analitis, bukan hafalan source code.',
            ],
        ];
    }

    private function buildLongLessonContent(string $title, string $focus, string $summary): string
    {
        return implode("\n\n", [
            $summary,
            $title.' dipelajari di materi ini bukan sekadar sebagai nama algoritma, tetapi sebagai sistem yang punya tujuan, asumsi, dan batasan tertentu. Learner perlu memahami bagaimana algoritma ini memodelkan data, apa jenis kunci yang dipakai, dan bagaimana perubahan kecil pada input atau parameter dapat menghasilkan keluaran yang sangat berbeda.',
            'Dalam praktik keamanan, memahami '.$title.' berarti mampu menjelaskan mengapa algoritma ini dipilih, bagaimana cara kerjanya dalam bahasa yang runtut, dan apa risiko jika ia dipakai di konteks yang salah. Materi ini menekankan hubungan antara teori kriptografi, aliran data, dan keputusan desain yang membentuk kekuatan maupun kelemahan algoritma.',
            'Bagian '.$focus.' juga mengajak learner untuk melihat algoritma dari sudut pandang analis: komponen mana yang kritis, asumsi apa yang harus dijaga, serta bagaimana algoritma ini dibandingkan dengan pendekatan kriptografi lain. Dengan begitu, materi course tetap kaya walau tidak membuka halaman lab secara langsung.',
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildAssessmentQuestions(string $courseTitle): array
    {
        return [
            [
                'bloom_level' => Assessment::BLOOM_C1,
                'question_type' => AssessmentQuestion::TYPE_MCQ,
                'question_text' => 'Konsep mana yang paling mendasar saat mempelajari '.$courseTitle.'?',
                'options' => ['Tujuan keamanan dan istilah inti', 'Warna antarmuka', 'Struktur server', 'Nama database'],
                'correct_answer' => 'Tujuan keamanan dan istilah inti',
                'explanation' => 'Level C1 menilai kemampuan mengingat konsep dasar dan istilah kunci.',
            ],
            [
                'bloom_level' => Assessment::BLOOM_C2,
                'question_type' => AssessmentQuestion::TYPE_TRUE_FALSE,
                'question_text' => 'Memahami alur kerja algoritma membantu learner menjelaskan mengapa algoritma tersebut cocok atau tidak cocok untuk konteks tertentu.',
                'options' => ['True', 'False'],
                'correct_answer' => 'True',
                'explanation' => 'Level C2 menguji pemahaman relasi antara komponen algoritma dan konteks penggunaan.',
            ],
            [
                'bloom_level' => Assessment::BLOOM_C3,
                'question_type' => AssessmentQuestion::TYPE_MCQ,
                'question_text' => 'Jika suatu konteks membutuhkan sifat keamanan tertentu, apa langkah terbaik saat menerapkan '.$courseTitle.'?',
                'options' => ['Menilai kecocokan algoritma terhadap kebutuhan dan ancaman', 'Memilih algoritma hanya dari popularitas', 'Mengabaikan ukuran kunci', 'Menghindari dokumentasi'],
                'correct_answer' => 'Menilai kecocokan algoritma terhadap kebutuhan dan ancaman',
                'explanation' => 'Level C3 menekankan penerapan konsep ke situasi nyata.',
            ],
            [
                'bloom_level' => Assessment::BLOOM_C4,
                'question_type' => AssessmentQuestion::TYPE_MULTIPLE_SELECT,
                'question_text' => 'Pilih faktor yang perlu dianalisis ketika mengevaluasi '.$courseTitle.'.',
                'options' => ['Model ancaman', 'Trade-off keamanan', 'Kebutuhan performa', 'Warna tombol'],
                'correct_answer' => json_encode(['Model ancaman', 'Trade-off keamanan', 'Kebutuhan performa']),
                'explanation' => 'Level C4 meminta learner menganalisis beberapa faktor relevan sekaligus.',
            ],
            [
                'bloom_level' => Assessment::BLOOM_C5,
                'question_type' => AssessmentQuestion::TYPE_SHORT_ANSWER,
                'question_text' => 'Tuliskan satu alasan evaluatif mengapa '.$courseTitle.' cocok atau tidak cocok dipakai pada konteks tertentu.',
                'options' => null,
                'correct_answer' => 'trade-off',
                'explanation' => 'Level C5 menilai kemampuan memberi justifikasi evaluatif singkat.',
            ],
            [
                'bloom_level' => Assessment::BLOOM_C6,
                'question_type' => AssessmentQuestion::TYPE_ESSAY,
                'question_text' => 'Rancang penjelasan singkat tentang bagaimana Anda akan memilih '.$courseTitle.' untuk sebuah studi kasus dan sebutkan alasan utamanya.',
                'options' => null,
                'correct_answer' => json_encode([
                    'keywords' => ['kebutuhan', 'ancaman', 'algoritma', 'keamanan'],
                    'min_matches' => 2,
                    'min_words' => 30,
                ]),
                'explanation' => 'Level C6 menilai kemampuan menyusun argumen atau rancangan jawaban berdasarkan konsep yang dipelajari.',
                'min_words' => 50,
                'max_words' => 200,
                'rubric' => [
                    'criteria' => [
                        [
                            'name' => 'Argument Quality',
                            'description' => 'Jawaban menunjukkan alasan yang relevan dan runtut.',
                            'max_points' => 5,
                            'levels' => [],
                        ],
                        [
                            'name' => 'Concept Accuracy',
                            'description' => 'Istilah dan konsep keamanan dipakai dengan tepat.',
                            'max_points' => 5,
                            'levels' => [],
                        ],
                    ],
                ],
            ],
        ];
    }
}
