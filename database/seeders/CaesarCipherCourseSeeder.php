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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CaesarCipherCourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function (): void {
            $topic = Topic::updateOrCreate(
                ['slug' => 'caesar-cipher'],
                [
                    'name' => 'Caesar Cipher',
                    'category' => 'classical-cryptography',
                ],
            );

            $this->ensureCoverImageExists();

            $course = Course::updateOrCreate(
                ['slug' => 'caesar-chiper'],
                [
                    'title' => 'Caesar Chiper',
                    'summary' => 'Kursus berbahasa Indonesia untuk memahami Sandi Caesar dari sejarah, praktik enkripsi, kriptanalisis, hingga proyek mini.',
                    'category' => 'Kriptografi',
                    'difficulty' => 'Pemula',
                    'status' => Course::STATUS_PUBLISHED,
                    'is_published' => true,
                    'version' => 1,
                    'cover_path' => 'course-covers/caesar-cipher-cover.jpg',
                ],
            );

            $this->resetSeededContent($course);
            $this->seedLessons($course, $topic);
            $this->seedAssessments($course, $topic);
        });

        $this->command?->info('Caesar Chiper course seeded successfully.');
    }

    private function resetSeededContent(Course $course): void
    {
        $course->assessments()->delete();
        $course->lessons()->delete();
    }

    private function seedLessons(Course $course, Topic $topic): void
    {
        $previousLesson = null;

        foreach ($this->lessonData() as $position => $lessonData) {
            $lesson = Lesson::create([
                'course_id' => $course->id,
                'slug' => $lessonData['slug'],
                'title' => $lessonData['title'],
                'description' => $lessonData['description'],
                'status' => Lesson::STATUS_PUBLISHED,
                'version' => 1,
                'position' => $position + 1,
                'topic_id' => $topic->id,
                'prerequisite_lesson_id' => $previousLesson?->id,
                'learning_objectives' => $lessonData['learning_objectives'],
                'key_concepts' => $lessonData['key_concepts'],
                'content' => $this->buildLessonContent($lessonData),
            ]);

            $videoTask = LessonTask::create([
                'lesson_id' => $lesson->id,
                'title' => $lessonData['video']['title'],
                'description' => $lessonData['video']['description'],
                'type' => 'video',
                'video_url' => $lessonData['video']['url'],
                'video_processing_status' => 'ready',
                'status' => LessonTask::STATUS_PUBLISHED,
                'version' => 1,
                'published_at' => now(),
                'sort_order' => 1,
            ]);

            $documentPath = $this->ensureLessonPdfExists(
                $lessonData['document']['path'],
                $lessonData['document']['title'],
                $lessonData['document']['lines'],
            );

            $readTask = LessonTask::create([
                'lesson_id' => $lesson->id,
                'title' => $lessonData['document']['title'],
                'description' => $lessonData['document']['description'],
                'type' => 'read',
                'document_name' => basename($documentPath),
                'conversion_status' => 'converted',
                'pdf_url' => Storage::disk('public')->url($documentPath),
                'prerequisite_task_id' => $videoTask->id,
                'status' => LessonTask::STATUS_PUBLISHED,
                'version' => 1,
                'published_at' => now(),
                'sort_order' => 2,
            ]);

            $quizTask = LessonTask::create([
                'lesson_id' => $lesson->id,
                'title' => $lessonData['quiz']['title'],
                'description' => $lessonData['quiz']['description'],
                'type' => 'quiz',
                'prerequisite_task_id' => $readTask->id,
                'status' => LessonTask::STATUS_PUBLISHED,
                'version' => 1,
                'published_at' => now(),
                'sort_order' => 3,
            ]);

            foreach ($lessonData['quiz']['questions'] as $questionPosition => $questionData) {
                QuizQuestion::create([
                    'lesson_task_id' => $quizTask->id,
                    'topic_id' => $topic->id,
                    'question' => $questionData['question'],
                    'options' => $questionData['options'],
                    'correct_option' => $questionData['correct_option'],
                    'explanation' => $questionData['explanation'],
                    'sort_order' => $questionPosition + 1,
                    'difficulty_level' => $questionData['difficulty_level'] ?? 'medium',
                    'difficulty_score' => $questionData['difficulty_score'] ?? 0.5,
                    'discrimination' => 1.0,
                ]);
            }

            $previousLesson = $lesson;
        }
    }

    private function seedAssessments(Course $course, Topic $topic): void
    {
        foreach ($this->assessmentData() as $assessmentData) {
            $assessment = Assessment::create([
                'slug' => $assessmentData['slug'],
                'title' => $assessmentData['title'],
                'description' => $assessmentData['description'],
                'course_id' => $course->id,
                'topic_id' => $topic->id,
                'bloom_level' => $assessmentData['bloom_level'],
                'grading_type' => $assessmentData['grading_type'],
                'passing_score' => 70,
                'max_attempts' => 3,
                'time_limit_minutes' => $assessmentData['time_limit_minutes'],
                'status' => Assessment::STATUS_PUBLISHED,
                'version' => 1,
                'sort_order' => $assessmentData['sort_order'],
            ]);

            foreach ($assessmentData['questions'] as $questionPosition => $questionData) {
                AssessmentQuestion::create(array_merge($questionData, [
                    'assessment_id' => $assessment->id,
                    'bloom_level' => $assessmentData['bloom_level'],
                    'sort_order' => $questionPosition + 1,
                ]));
            }
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function lessonData(): array
    {
        return [
            [
                'slug' => 'fondasi-sandi-caesar',
                'title' => 'Fondasi Sandi Caesar',
                'description' => 'Memahami asal-usul, istilah dasar, dan posisi Sandi Caesar dalam kriptografi klasik.',
                'learning_objectives' => [
                    'Menjelaskan tujuan dasar kriptografi klasik.',
                    'Membedakan plaintext, ciphertext, cipher, dan key.',
                    'Mengidentifikasi Sandi Caesar sebagai substitution cipher.',
                    'Menjelaskan alasan Sandi Caesar cocok sebagai materi awal kriptografi.',
                ],
                'key_concepts' => ['Plaintext', 'Ciphertext', 'Key', 'Substitution cipher', 'Julius Caesar'],
                'sections' => [
                    [
                        'heading' => 'Mengapa belajar Sandi Caesar',
                        'body' => 'Sandi Caesar sederhana, tetapi memperlihatkan ide utama kriptografi: pesan asli diubah menjadi bentuk yang tidak langsung terbaca menggunakan aturan dan kunci.',
                    ],
                    [
                        'heading' => 'Model komunikasi',
                        'body' => 'Pengirim dan penerima menyepakati pergeseran alfabet. Orang lain yang tidak mengetahui kunci hanya melihat ciphertext.',
                    ],
                    [
                        'heading' => 'Batas awal',
                        'body' => 'Karena hanya ada sedikit pilihan pergeseran, Sandi Caesar tidak aman untuk data nyata. Nilainya ada pada pemahaman konsep.',
                    ],
                ],
                'video' => [
                    'title' => 'Video: The Caesar Cipher',
                    'description' => 'Video YouTube asli dari Khan Academy tentang konsep Caesar cipher.',
                    'url' => 'https://www.youtube.com/watch?v=sMOZf4GN3oc',
                    'minutes' => 8,
                ],
                'document' => [
                    'title' => 'Dokumen: Peta Konsep Sandi Caesar',
                    'description' => 'Ringkasan berbahasa Indonesia tentang istilah dan alur kerja Sandi Caesar.',
                    'path' => 'lesson-documents/caesar-chiper/01-peta-konsep-sandi-caesar.pdf',
                    'minutes' => 12,
                    'lines' => [
                        'Bahasa Indonesia - Peta Konsep Sandi Caesar.',
                        'Plaintext adalah pesan asli yang masih dapat dibaca.',
                        'Ciphertext adalah pesan yang sudah diubah oleh cipher.',
                        'Key pada Sandi Caesar berupa jumlah pergeseran alfabet.',
                        'Cipher adalah aturan yang mengubah plaintext menjadi ciphertext.',
                        'Sandi Caesar termasuk substitution cipher karena mengganti setiap huruf dengan huruf lain.',
                        'Contoh kunci 3: A menjadi D, B menjadi E, dan Z kembali berputar ke C.',
                        'Kekuatan pembelajaran Sandi Caesar ada pada konsep, bukan keamanan modern.',
                    ],
                ],
                'quiz' => [
                    'title' => 'Quiz: Fondasi Sandi Caesar',
                    'description' => 'Cek pemahaman istilah dasar sebelum masuk ke perhitungan.',
                    'minutes' => 8,
                    'questions' => [
                        [
                            'question' => 'Apa yang dimaksud dengan plaintext?',
                            'options' => ['Pesan asli sebelum dienkripsi', 'Pesan setelah dienkripsi', 'Jumlah pergeseran', 'Metode memecahkan sandi'],
                            'correct_option' => 0,
                            'explanation' => 'Plaintext adalah pesan asli yang akan dienkripsi.',
                            'difficulty_level' => 'easy',
                        ],
                        [
                            'question' => 'Sandi Caesar termasuk jenis sandi apa?',
                            'options' => ['Transposisi', 'Substitusi', 'Hash', 'Asimetris'],
                            'correct_option' => 1,
                            'explanation' => 'Sandi Caesar mengganti setiap huruf dengan huruf lain, sehingga termasuk substitusi.',
                        ],
                        [
                            'question' => 'Apa bentuk key pada Sandi Caesar?',
                            'options' => ['Panjang pesan', 'Jumlah pergeseran alfabet', 'Nama pengirim', 'Jumlah kata'],
                            'correct_option' => 1,
                            'explanation' => 'Key menentukan berapa posisi alfabet digeser.',
                        ],
                        [
                            'question' => 'Mengapa Sandi Caesar penting dipelajari?',
                            'options' => ['Karena aman untuk bank', 'Karena memperkenalkan konsep kriptografi dasar', 'Karena tidak dapat dipecahkan', 'Karena tidak memakai kunci'],
                            'correct_option' => 1,
                            'explanation' => 'Sandi Caesar sederhana dan membantu memahami plaintext, ciphertext, key, dan cipher.',
                        ],
                        [
                            'question' => 'Jika pergeseran 3 digunakan, huruf A menjadi apa?',
                            'options' => ['B', 'C', 'D', 'Z'],
                            'correct_option' => 2,
                            'explanation' => 'A digeser tiga posisi menjadi D.',
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'enkripsi-dekripsi-modulo',
                'title' => 'Enkripsi, Dekripsi, dan Modulo',
                'description' => 'Menerjemahkan pergeseran alfabet menjadi rumus modular yang konsisten.',
                'learning_objectives' => [
                    'Mengubah huruf menjadi indeks 0 sampai 25.',
                    'Menggunakan rumus enkripsi C = (P + k) mod 26.',
                    'Menggunakan rumus dekripsi P = (C - k) mod 26.',
                    'Menangani perputaran alfabet dari Z kembali ke A.',
                ],
                'key_concepts' => ['Indeks alfabet', 'Modulo 26', 'Enkripsi', 'Dekripsi', 'Wrap around'],
                'sections' => [
                    [
                        'heading' => 'Representasi angka',
                        'body' => 'Huruf A sampai Z dapat dipetakan ke angka 0 sampai 25 agar pergeseran dapat dihitung secara matematis.',
                    ],
                    [
                        'heading' => 'Rumus enkripsi',
                        'body' => 'Jika P adalah indeks plaintext dan k adalah kunci, maka ciphertext dihitung dengan C = (P + k) mod 26.',
                    ],
                    [
                        'heading' => 'Rumus dekripsi',
                        'body' => 'Dekripsi membalik arah pergeseran dengan P = (C - k) mod 26. Modulo menjaga hasil tetap di rentang alfabet.',
                    ],
                ],
                'video' => [
                    'title' => 'Video: Caesar Cipher Practice',
                    'description' => 'Video YouTube asli yang digunakan sebagai pendamping latihan Caesar cipher.',
                    'url' => 'https://www.youtube.com/watch?v=o6TPx1Co_wg',
                    'minutes' => 12,
                ],
                'document' => [
                    'title' => 'Dokumen: Rumus Enkripsi dan Dekripsi',
                    'description' => 'Panduan berbahasa Indonesia untuk menghitung enkripsi dan dekripsi Caesar.',
                    'path' => 'lesson-documents/caesar-chiper/02-rumus-enkripsi-dekripsi.pdf',
                    'minutes' => 14,
                    'lines' => [
                        'Bahasa Indonesia - Rumus Sandi Caesar.',
                        'Gunakan A = 0, B = 1, C = 2, sampai Z = 25.',
                        'Rumus enkripsi: C = (P + k) mod 26.',
                        'Rumus dekripsi: P = (C - k) mod 26.',
                        'P adalah indeks huruf plaintext, C adalah indeks huruf ciphertext, dan k adalah key.',
                        'Modulo 26 membuat alfabet berputar. Setelah Z, perhitungan kembali ke A.',
                        'Contoh: Z dengan k = 3 menjadi C karena (25 + 3) mod 26 = 2.',
                        'Latihan: hitung hasil enkripsi MAKAN dengan k = 4.',
                    ],
                ],
                'quiz' => [
                    'title' => 'Quiz: Rumus Caesar',
                    'description' => 'Latihan singkat untuk memastikan rumus dan modulo sudah dipahami.',
                    'minutes' => 10,
                    'questions' => [
                        [
                            'question' => 'Jika A = 0, nilai indeks huruf H adalah?',
                            'options' => ['6', '7', '8', '9'],
                            'correct_option' => 1,
                            'explanation' => 'Urutan dimulai dari A = 0, sehingga H = 7.',
                        ],
                        [
                            'question' => 'Rumus enkripsi Sandi Caesar adalah?',
                            'options' => ['P = (C - k) mod 26', 'C = (P + k) mod 26', 'C = P x k', 'P = C + 26'],
                            'correct_option' => 1,
                            'explanation' => 'Enkripsi menambahkan kunci pada indeks plaintext.',
                        ],
                        [
                            'question' => 'Huruf Z dienkripsi dengan k = 3 menjadi?',
                            'options' => ['A', 'B', 'C', 'D'],
                            'correct_option' => 2,
                            'explanation' => '(25 + 3) mod 26 = 2, yaitu C.',
                        ],
                        [
                            'question' => 'Untuk mendekripsi, arah pergeseran dilakukan bagaimana?',
                            'options' => ['Tetap maju', 'Mundur sesuai kunci', 'Dikalikan dua', 'Diacak ulang'],
                            'correct_option' => 1,
                            'explanation' => 'Dekripsi membalik proses enkripsi dengan mengurangi kunci.',
                        ],
                        [
                            'question' => 'Apa fungsi modulo 26?',
                            'options' => ['Menghapus spasi', 'Membuat alfabet berputar', 'Menyimpan nama pengirim', 'Mengubah huruf menjadi angka biner'],
                            'correct_option' => 1,
                            'explanation' => 'Modulo 26 menjaga hasil tetap berada di 26 huruf alfabet.',
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'praktik-manual-validasi',
                'title' => 'Praktik Manual dan Validasi Hasil',
                'description' => 'Mengerjakan enkripsi dan dekripsi manual, lalu memeriksa hasil dengan pola alfabet.',
                'learning_objectives' => [
                    'Mengenkripsi kata dan kalimat pendek secara manual.',
                    'Mendekripsi ciphertext dengan kunci yang diketahui.',
                    'Mempertahankan spasi dan tanda baca sesuai instruksi.',
                    'Memvalidasi hasil dengan tabel alfabet geser.',
                ],
                'key_concepts' => ['Tabel substitusi', 'Validasi manual', 'Cipher wheel', 'Preservasi spasi', 'Kesalahan umum'],
                'sections' => [
                    [
                        'heading' => 'Latihan bertahap',
                        'body' => 'Mulailah dari satu kata, kemudian lanjutkan ke kalimat. Tuliskan tabel plaintext dan ciphertext agar kesalahan mudah terlihat.',
                    ],
                    [
                        'heading' => 'Spasi dan tanda baca',
                        'body' => 'Dalam latihan dasar, huruf digeser, sedangkan spasi dan tanda baca dapat dibiarkan agar pesan tetap terbaca strukturnya.',
                    ],
                    [
                        'heading' => 'Validasi hasil',
                        'body' => 'Hasil yang benar harus dapat dikembalikan ke plaintext awal saat dekripsi menggunakan kunci yang sama.',
                    ],
                ],
                'video' => [
                    'title' => 'Video: The Science of Codes',
                    'description' => 'Video YouTube asli dari SciShow untuk memperluas konteks kode dan kriptografi.',
                    'url' => 'https://www.youtube.com/watch?v=-yFZGF8FHSg',
                    'minutes' => 9,
                ],
                'document' => [
                    'title' => 'Dokumen: Lembar Praktik Manual',
                    'description' => 'Latihan berbahasa Indonesia untuk mengenkripsi dan mendekripsi pesan pendek.',
                    'path' => 'lesson-documents/caesar-chiper/03-lembar-praktik-manual.pdf',
                    'minutes' => 18,
                    'lines' => [
                        'Bahasa Indonesia - Lembar Praktik Sandi Caesar.',
                        'Langkah 1: tulis alfabet plaintext A sampai Z.',
                        'Langkah 2: pilih key, misalnya 4.',
                        'Langkah 3: tulis alfabet ciphertext yang sudah digeser.',
                        'Langkah 4: ubah setiap huruf plaintext sesuai tabel.',
                        'Latihan 1: enkripsi BELAJAR dengan key 5.',
                        'Latihan 2: dekripsi XJQFRFY dengan key 5.',
                        'Validasi: hasil dekripsi harus kembali ke pesan asli.',
                    ],
                ],
                'quiz' => [
                    'title' => 'Quiz: Praktik Caesar',
                    'description' => 'Soal aplikasi langsung untuk enkripsi dan dekripsi pendek.',
                    'minutes' => 12,
                    'questions' => [
                        [
                            'question' => 'Enkripsi kata DATA dengan k = 3.',
                            'options' => ['GDWD', 'EBUB', 'AXQX', 'GDTA'],
                            'correct_option' => 0,
                            'explanation' => 'D menjadi G, A menjadi D, T menjadi W, A menjadi D.',
                        ],
                        [
                            'question' => 'Dekripsi KHOOR dengan k = 3.',
                            'options' => ['HELLO', 'KELLO', 'WORLD', 'HALLA'],
                            'correct_option' => 0,
                            'explanation' => 'Setiap huruf mundur tiga posisi menghasilkan HELLO.',
                        ],
                        [
                            'question' => 'Enkripsi AMAN dengan k = 1.',
                            'options' => ['BNBO', 'ZLZM', 'CNCP', 'AMBO'],
                            'correct_option' => 0,
                            'explanation' => 'A ke B, M ke N, A ke B, N ke O.',
                        ],
                        [
                            'question' => 'Jika ciphertext MJQQT dibuat dengan k = 5, plaintext-nya adalah?',
                            'options' => ['HELLO', 'WORLD', 'MALAM', 'BELAJAR'],
                            'correct_option' => 0,
                            'explanation' => 'M mundur 5 menjadi H, J menjadi E, Q menjadi L, Q menjadi L, T menjadi O.',
                        ],
                        [
                            'question' => 'Apa cara paling sederhana memvalidasi hasil enkripsi manual?',
                            'options' => ['Menghapus key', 'Mendekripsi ulang dengan key yang sama', 'Mengganti semua spasi', 'Menambah huruf acak'],
                            'correct_option' => 1,
                            'explanation' => 'Jika didekripsi dengan key yang sama dan kembali ke plaintext awal, hasilnya konsisten.',
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'brute-force-analisis-frekuensi',
                'title' => 'Brute Force dan Analisis Frekuensi',
                'description' => 'Menganalisis kelemahan Sandi Caesar melalui pencarian semua kunci dan pola huruf.',
                'learning_objectives' => [
                    'Menjelaskan ruang kunci Sandi Caesar.',
                    'Melakukan brute force terhadap ciphertext pendek.',
                    'Menggunakan frekuensi huruf sebagai petunjuk.',
                    'Menyimpulkan alasan Sandi Caesar tidak aman untuk data sensitif.',
                ],
                'key_concepts' => ['Keyspace', 'Brute force', 'Frequency analysis', 'Pattern leakage', 'Cryptanalysis'],
                'sections' => [
                    [
                        'heading' => 'Ruang kunci kecil',
                        'body' => 'Pada alfabet Latin, hanya ada 25 pergeseran non-trivial. Semua kemungkinan dapat dicoba dengan cepat.',
                    ],
                    [
                        'heading' => 'Analisis frekuensi',
                        'body' => 'Sandi Caesar mempertahankan pola frekuensi. Huruf yang sering muncul pada bahasa tertentu tetap sering muncul, hanya bergeser.',
                    ],
                    [
                        'heading' => 'Dampak keamanan',
                        'body' => 'Kelemahan ini menunjukkan bahwa algoritma terbuka harus didukung oleh ruang kunci besar dan desain yang tahan analisis.',
                    ],
                ],
                'video' => [
                    'title' => 'Video: Encryption and Public Keys',
                    'description' => 'Video YouTube asli dari Code.org sebagai pembanding konsep enkripsi modern.',
                    'url' => 'https://www.youtube.com/watch?v=ZghMPWGXexs',
                    'minutes' => 7,
                ],
                'document' => [
                    'title' => 'Dokumen: Memecahkan Sandi Caesar',
                    'description' => 'Panduan berbahasa Indonesia untuk brute force dan analisis frekuensi.',
                    'path' => 'lesson-documents/caesar-chiper/04-brute-force-frekuensi.pdf',
                    'minutes' => 20,
                    'lines' => [
                        'Bahasa Indonesia - Kriptanalisis Sandi Caesar.',
                        'Brute force berarti mencoba semua key yang mungkin.',
                        'Pada alfabet 26 huruf, key non-trivial hanya 1 sampai 25.',
                        'Analisis frekuensi menghitung huruf yang paling sering muncul.',
                        'Jika H paling sering muncul pada ciphertext bahasa Inggris, H mungkin berasal dari E.',
                        'Pola panjang kata dan huruf ganda juga dapat membantu menebak plaintext.',
                        'Sandi Caesar tidak cocok untuk melindungi data sensitif.',
                        'Latihan: pecahkan WKH FLSKHU LV HDVB tanpa diberi key.',
                    ],
                ],
                'quiz' => [
                    'title' => 'Quiz: Serangan Caesar',
                    'description' => 'Mengukur pemahaman kelemahan dan metode pemecahan Caesar.',
                    'minutes' => 12,
                    'questions' => [
                        [
                            'question' => 'Berapa banyak kunci non-trivial pada Sandi Caesar alfabet 26 huruf?',
                            'options' => ['13', '25', '26', '52'],
                            'correct_option' => 1,
                            'explanation' => 'Pergeseran 0 atau 26 tidak mengubah pesan, sehingga kunci non-trivial ada 25.',
                        ],
                        [
                            'question' => 'Apa tujuan brute force pada Sandi Caesar?',
                            'options' => ['Mencoba semua kemungkinan key', 'Menghapus semua vokal', 'Mengganti alfabet dengan angka biner', 'Membuat kunci publik'],
                            'correct_option' => 0,
                            'explanation' => 'Brute force mencoba seluruh kunci sampai plaintext masuk akal ditemukan.',
                        ],
                        [
                            'question' => 'Mengapa analisis frekuensi dapat membantu?',
                            'options' => ['Karena Caesar mempertahankan pola frekuensi huruf', 'Karena Caesar menghapus semua pola', 'Karena setiap pesan hanya satu huruf', 'Karena kunci selalu 13'],
                            'correct_option' => 0,
                            'explanation' => 'Substitusi tetap membuat distribusi frekuensi tetap bergeser, bukan hilang.',
                        ],
                        [
                            'question' => 'Ciphertext WKH dengan k = 3 didekripsi menjadi?',
                            'options' => ['THE', 'AND', 'YOU', 'KEY'],
                            'correct_option' => 0,
                            'explanation' => 'W, K, H masing-masing mundur 3 posisi menjadi T, H, E.',
                        ],
                        [
                            'question' => 'Kesimpulan keamanan yang tepat untuk Sandi Caesar adalah?',
                            'options' => ['Aman untuk password produksi', 'Tidak aman untuk data sensitif modern', 'Tidak dapat didekripsi', 'Lebih kuat dari AES'],
                            'correct_option' => 1,
                            'explanation' => 'Ruang kunci kecil dan pola statistik membuat Caesar mudah dipecahkan.',
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'rot13-variasi-batas-keamanan',
                'title' => 'ROT13, Variasi, dan Batas Keamanan',
                'description' => 'Melihat variasi Caesar, terutama ROT13, serta membedakan obfuscation dan keamanan.',
                'learning_objectives' => [
                    'Menjelaskan ROT13 sebagai Caesar dengan key 13.',
                    'Menguji sifat self-inverse pada ROT13.',
                    'Membedakan obfuscation sederhana dan enkripsi aman.',
                    'Menghubungkan Caesar ke Vigenere sebagai variasi yang lebih kuat.',
                ],
                'key_concepts' => ['ROT13', 'Self-inverse', 'Obfuscation', 'Vigenere', 'Polyalphabetic cipher'],
                'sections' => [
                    [
                        'heading' => 'ROT13',
                        'body' => 'ROT13 memakai pergeseran 13. Karena 13 adalah setengah dari 26, proses yang sama dapat dipakai untuk encode dan decode.',
                    ],
                    [
                        'heading' => 'Obfuscation',
                        'body' => 'ROT13 sering dipakai untuk menyamarkan spoiler atau jawaban teka-teki, bukan untuk melindungi rahasia penting.',
                    ],
                    [
                        'heading' => 'Dari Caesar ke Vigenere',
                        'body' => 'Vigenere memakai beberapa pergeseran yang dipandu kata kunci sehingga pola tunggal Caesar menjadi lebih sulit dianalisis.',
                    ],
                ],
                'video' => [
                    'title' => 'Video: Encryption and Huge Numbers',
                    'description' => 'Video YouTube asli dari Numberphile untuk memahami mengapa ukuran ruang kunci penting.',
                    'url' => 'https://www.youtube.com/watch?v=M7kEpw1tn50',
                    'minutes' => 10,
                ],
                'document' => [
                    'title' => 'Dokumen: ROT13 dan Variasi Caesar',
                    'description' => 'Materi berbahasa Indonesia tentang variasi Sandi Caesar dan batas penggunaannya.',
                    'path' => 'lesson-documents/caesar-chiper/05-rot13-variasi-caesar.pdf',
                    'minutes' => 18,
                    'lines' => [
                        'Bahasa Indonesia - ROT13 dan Variasi Sandi Caesar.',
                        'ROT13 adalah Caesar cipher dengan key 13.',
                        'Karena alfabet Latin memiliki 26 huruf, dua kali ROT13 mengembalikan teks awal.',
                        'Contoh: HELLO menjadi URYYB, lalu URYYB menjadi HELLO.',
                        'ROT13 berguna untuk menyamarkan spoiler, bukan menjaga rahasia.',
                        'Vigenere memperluas gagasan Caesar dengan key berupa kata.',
                        'Pergeseran yang berubah-ubah membuat pola lebih sulit dibaca.',
                        'Tetap bedakan latihan kriptografi klasik dari keamanan produksi.',
                    ],
                ],
                'quiz' => [
                    'title' => 'Quiz: ROT13 dan Variasi',
                    'description' => 'Memeriksa pemahaman ROT13, obfuscation, dan transisi ke Vigenere.',
                    'minutes' => 10,
                    'questions' => [
                        [
                            'question' => 'ROT13 memakai key berapa?',
                            'options' => ['3', '7', '13', '26'],
                            'correct_option' => 2,
                            'explanation' => 'ROT13 adalah rotasi 13 huruf.',
                        ],
                        [
                            'question' => 'Mengapa ROT13 disebut self-inverse?',
                            'options' => ['Karena tidak memakai alfabet', 'Karena proses yang sama mengembalikan teks awal', 'Karena tidak dapat dipecahkan', 'Karena key berubah acak'],
                            'correct_option' => 1,
                            'explanation' => 'Dua kali pergeseran 13 sama dengan pergeseran 26, kembali ke teks awal.',
                        ],
                        [
                            'question' => 'Decode ROT13 dari URYYB adalah?',
                            'options' => ['HELLO', 'WORLD', 'CAESAR', 'SHIFT'],
                            'correct_option' => 0,
                            'explanation' => 'U ke H, R ke E, Y ke L, Y ke L, B ke O.',
                        ],
                        [
                            'question' => 'Penggunaan ROT13 yang paling tepat adalah?',
                            'options' => ['Melindungi rekening bank', 'Menyamarkan spoiler sederhana', 'Mengenkripsi password server', 'Menggantikan TLS'],
                            'correct_option' => 1,
                            'explanation' => 'ROT13 cocok untuk obfuscation ringan, bukan keamanan data.',
                        ],
                        [
                            'question' => 'Apa perbedaan utama Vigenere dibanding Caesar?',
                            'options' => ['Vigenere memakai beberapa pergeseran berdasarkan kata kunci', 'Vigenere tidak memakai plaintext', 'Vigenere hanya untuk angka', 'Vigenere selalu key 13'],
                            'correct_option' => 0,
                            'explanation' => 'Vigenere memakai key berulang sehingga pergeseran tiap huruf dapat berbeda.',
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'proyek-mini-refleksi-modern',
                'title' => 'Proyek Mini dan Refleksi Kriptografi Modern',
                'description' => 'Mendesain aktivitas atau varian Caesar dan merefleksikan hubungannya dengan kriptografi modern.',
                'learning_objectives' => [
                    'Merancang varian atau aktivitas belajar berbasis Sandi Caesar.',
                    'Menjelaskan kekuatan dan kelemahan rancangan.',
                    'Membandingkan Caesar dengan konsep enkripsi modern.',
                    'Menyajikan hasil dalam format yang dapat diuji teman lain.',
                ],
                'key_concepts' => ['Design brief', 'Threat model', 'Rubric', 'Peer review', 'Modern cryptography'],
                'sections' => [
                    [
                        'heading' => 'Proyek mini',
                        'body' => 'Peserta merancang aktivitas kecil: cipher wheel, permainan tebak kunci, atau varian Caesar dengan aturan tambahan.',
                    ],
                    [
                        'heading' => 'Refleksi keamanan',
                        'body' => 'Setiap desain harus menjelaskan siapa penyerangnya, informasi apa yang dilindungi, dan kelemahan yang masih ada.',
                    ],
                    [
                        'heading' => 'Koneksi modern',
                        'body' => 'Kriptografi modern memakai matematika, ruang kunci besar, dan analisis formal. Caesar menjadi jembatan konsep awal.',
                    ],
                ],
                'video' => [
                    'title' => 'Video: Enigma Machine Context',
                    'description' => 'Video YouTube asli dari Numberphile untuk melihat evolusi cipher klasik yang lebih kompleks.',
                    'url' => 'https://www.youtube.com/watch?v=G2_Q9FoD-oQ',
                    'minutes' => 12,
                ],
                'document' => [
                    'title' => 'Dokumen: Panduan Proyek Mini',
                    'description' => 'Panduan berbahasa Indonesia untuk membuat proyek akhir kecil tentang Sandi Caesar.',
                    'path' => 'lesson-documents/caesar-chiper/06-panduan-proyek-mini.pdf',
                    'minutes' => 24,
                    'lines' => [
                        'Bahasa Indonesia - Panduan Proyek Mini Sandi Caesar.',
                        'Pilih satu ide: cipher wheel, permainan brute force, atau varian pergeseran.',
                        'Tuliskan tujuan pembelajaran dan aturan penggunaan.',
                        'Berikan contoh plaintext, key, ciphertext, dan proses dekripsi.',
                        'Jelaskan bagaimana teman dapat menguji rancangan Anda.',
                        'Tulis analisis keamanan: keyspace, pola yang bocor, dan serangan yang mungkin.',
                        'Bandingkan rancangan dengan Sandi Caesar dasar.',
                        'Akhiri dengan refleksi tentang mengapa kriptografi modern perlu lebih kuat.',
                    ],
                ],
                'quiz' => [
                    'title' => 'Quiz: Refleksi dan Proyek',
                    'description' => 'Menguatkan konsep akhir sebelum assessment tingkat C4-C6.',
                    'minutes' => 10,
                    'questions' => [
                        [
                            'question' => 'Apa komponen wajib saat menjelaskan desain cipher sederhana?',
                            'options' => ['Aturan enkripsi dan dekripsi', 'Warna favorit pembuat', 'Jumlah komputer di kelas', 'Nama aplikasi chat'],
                            'correct_option' => 0,
                            'explanation' => 'Desain cipher harus menjelaskan aturan enkripsi dan dekripsi agar dapat diuji.',
                        ],
                        [
                            'question' => 'Apa yang dimaksud threat model secara sederhana?',
                            'options' => ['Gambaran siapa penyerang dan apa yang ingin dilindungi', 'Daftar warna UI', 'Nama file PDF', 'Jumlah halaman dokumen'],
                            'correct_option' => 0,
                            'explanation' => 'Threat model membantu menilai ancaman dan batas perlindungan.',
                        ],
                        [
                            'question' => 'Mengapa peer review berguna dalam proyek cipher?',
                            'options' => ['Agar rancangan diuji oleh orang lain', 'Agar kunci dihapus', 'Agar semua jawaban sama', 'Agar video tidak diperlukan'],
                            'correct_option' => 0,
                            'explanation' => 'Orang lain dapat menemukan celah atau ambiguitas pada aturan cipher.',
                        ],
                        [
                            'question' => 'Apa kelemahan umum yang harus dibahas pada desain berbasis Caesar?',
                            'options' => ['Ruang kunci kecil dan pola huruf masih tampak', 'Terlalu banyak server', 'Tidak bisa ditulis di kertas', 'Hanya bisa untuk gambar'],
                            'correct_option' => 0,
                            'explanation' => 'Desain turunan Caesar biasanya masih berisiko karena keyspace dan pola statistik.',
                        ],
                        [
                            'question' => 'Sikap yang tepat terhadap Sandi Caesar dalam konteks modern adalah?',
                            'options' => ['Dipakai sebagai fondasi belajar, bukan pengaman produksi', 'Dipakai untuk semua data rahasia', 'Dijadikan pengganti HTTPS', 'Tidak perlu diuji'],
                            'correct_option' => 0,
                            'explanation' => 'Caesar sangat berguna untuk belajar, tetapi tidak aman untuk produksi.',
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $lessonData
     */
    private function buildLessonContent(array $lessonData): string
    {
        $objectives = collect($lessonData['learning_objectives'])
            ->map(fn (string $objective): string => '<li>'.$objective.'</li>')
            ->implode('');

        $concepts = collect($lessonData['key_concepts'])
            ->map(fn (string $concept): string => '<li>'.$concept.'</li>')
            ->implode('');

        $sections = collect($lessonData['sections'])
            ->map(fn (array $section): string => '<h2>'.$section['heading'].'</h2><p>'.$section['body'].'</p>')
            ->implode("\n");

        return <<<HTML
<h1>{$lessonData['title']}</h1>
<p>{$lessonData['description']}</p>

<h2>Tujuan Pembelajaran</h2>
<ul>{$objectives}</ul>

<h2>Konsep Kunci</h2>
<ul>{$concepts}</ul>

{$sections}

<h2>Aktivitas Belajar</h2>
<p>Ikuti video, baca dokumen Bahasa Indonesia, lalu selesaikan quiz untuk membuka lesson berikutnya.</p>
HTML;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function assessmentData(): array
    {
        return [
            [
                'slug' => 'caesar-cipher-c1-remember',
                'title' => 'C1: Mengingat Fakta Sandi Caesar',
                'description' => 'Menguji ingatan atas istilah, sejarah, dan fakta dasar Sandi Caesar.',
                'bloom_level' => Assessment::BLOOM_C1,
                'grading_type' => Assessment::GRADING_AUTO,
                'time_limit_minutes' => 15,
                'sort_order' => 1,
                'questions' => [
                    $this->mcq('Siapa tokoh historis yang dikaitkan dengan Sandi Caesar?', ['Julius Caesar', 'Alan Turing', 'Ada Lovelace', 'Blaise Pascal'], '0', 'Sandi Caesar dinamai dari Julius Caesar yang dikenal memakai sandi pergeseran untuk komunikasi.'),
                    $this->mcq('Apa nama pesan asli sebelum dienkripsi?', ['Ciphertext', 'Plaintext', 'Hash', 'Token'], '1', 'Plaintext adalah pesan asli yang belum dienkripsi.'),
                    $this->mcq('Dalam alfabet 26 huruf, berapa pergeseran non-trivial Caesar?', ['13', '25', '26', '52'], '1', 'Pergeseran 0 atau 26 tidak mengubah pesan, sehingga ada 25 pergeseran non-trivial.'),
                    $this->trueFalse('Sandi Caesar adalah contoh substitution cipher.', true, 'Setiap huruf diganti dengan huruf lain berdasarkan pergeseran tetap.'),
                ],
            ],
            [
                'slug' => 'caesar-cipher-c2-understand',
                'title' => 'C2: Memahami Konsep Caesar',
                'description' => 'Menguji pemahaman hubungan key, modulo, dan kelemahan dasar Caesar.',
                'bloom_level' => Assessment::BLOOM_C2,
                'grading_type' => Assessment::GRADING_AUTO,
                'time_limit_minutes' => 25,
                'sort_order' => 2,
                'questions' => [
                    $this->mcq('Mengapa modulo 26 diperlukan pada Sandi Caesar?', ['Agar alfabet dapat berputar dari Z ke A', 'Agar pesan menjadi biner', 'Agar key hilang', 'Agar spasi dihapus'], '0', 'Modulo menjaga hasil pergeseran tetap pada rentang 26 huruf.'),
                    $this->mcq('Mengapa Caesar mudah diserang brute force?', ['Ruang kuncinya kecil', 'Algoritmanya terlalu rahasia', 'Plaintext selalu kosong', 'Ciphertext tidak punya huruf'], '0', 'Hanya ada sedikit kemungkinan key sehingga semuanya dapat dicoba.'),
                    $this->manualQuestion('short_answer', 'Jelaskan dengan kata sendiri perbedaan plaintext dan ciphertext pada Sandi Caesar.', 'Jawaban harus menjelaskan bahwa plaintext adalah pesan asli, sedangkan ciphertext adalah hasil enkripsi yang sudah bergeser.', 15, 40, 120, $this->rubric([
                        ['name' => 'Ketepatan konsep', 'description' => 'Membedakan plaintext dan ciphertext dengan benar.', 'max_points' => 8],
                        ['name' => 'Kejelasan contoh', 'description' => 'Memberi contoh singkat atau konteks Caesar.', 'max_points' => 7],
                    ])),
                    $this->manualQuestion('essay', 'Jelaskan mengapa kunci yang sama dapat dipakai untuk enkripsi dan dekripsi pada Caesar, tetapi arahnya berbeda.', 'Jawaban ideal membahas symmetric key, pergeseran maju untuk enkripsi, dan pergeseran mundur untuk dekripsi.', 20, 80, 220, $this->rubric([
                        ['name' => 'Pemahaman symmetric key', 'description' => 'Menjelaskan penggunaan key yang sama.', 'max_points' => 8],
                        ['name' => 'Arah operasi', 'description' => 'Menjelaskan enkripsi maju dan dekripsi mundur.', 'max_points' => 8],
                        ['name' => 'Bahasa teknis', 'description' => 'Menggunakan istilah dengan tepat.', 'max_points' => 4],
                    ])),
                ],
            ],
            [
                'slug' => 'caesar-cipher-c3-apply',
                'title' => 'C3: Menerapkan Operasi Caesar',
                'description' => 'Menguji kemampuan menerapkan rumus enkripsi, dekripsi, dan ROT13.',
                'bloom_level' => Assessment::BLOOM_C3,
                'grading_type' => Assessment::GRADING_AUTO,
                'time_limit_minutes' => 25,
                'sort_order' => 3,
                'questions' => [
                    $this->shortAnswer('Enkripsi kata DATA dengan key 3. Tulis ciphertext dengan huruf kapital.', 'GDWD', 'D menjadi G, A menjadi D, T menjadi W, A menjadi D.'),
                    $this->shortAnswer('Dekripsi ciphertext KHOOR dengan key 3. Tulis plaintext dengan huruf kapital.', 'HELLO', 'Setiap huruf mundur 3 posisi menghasilkan HELLO.'),
                    $this->shortAnswer('Decode ROT13 dari URYYB. Tulis plaintext dengan huruf kapital.', 'HELLO', 'ROT13 menggeser 13 posisi dan mengembalikan URYYB menjadi HELLO.'),
                    $this->shortAnswer('Jika P = 25 dan k = 4, berapa nilai C = (P + k) mod 26?', '3', '(25 + 4) mod 26 = 29 mod 26 = 3.'),
                ],
            ],
            [
                'slug' => 'caesar-cipher-c4-analyze',
                'title' => 'C4: Menganalisis Ciphertext Caesar',
                'description' => 'Menguji kemampuan membedah pola, kunci, dan bukti pada ciphertext.',
                'bloom_level' => Assessment::BLOOM_C4,
                'grading_type' => Assessment::GRADING_AUTO,
                'time_limit_minutes' => 40,
                'sort_order' => 4,
                'questions' => [
                    $this->manualQuestion('essay', 'Anda menerima ciphertext "WKH FLSKHU LV HDVB". Analisis kemungkinan key dan plaintext-nya. Jelaskan langkah yang Anda pakai.', 'Jawaban ideal mencoba brute force atau mengenali key 3 sehingga plaintext menjadi THE CIPHER IS EASY.', 25, 140, 380, $this->rubric([
                        ['name' => 'Metode analisis', 'description' => 'Menjelaskan brute force atau petunjuk pola.', 'max_points' => 9],
                        ['name' => 'Hasil dekripsi', 'description' => 'Menemukan plaintext dan key yang benar.', 'max_points' => 8],
                        ['name' => 'Argumentasi', 'description' => 'Menghubungkan bukti dengan kesimpulan.', 'max_points' => 8],
                    ])),
                    $this->manualQuestion('essay', 'Bandingkan dua ciphertext pendek: "KHOOR" dan "MJQQT". Keduanya tampak mirip. Analisis bagaimana Anda menentukan key masing-masing.', 'Jawaban harus membahas pengujian key, hasil plaintext yang masuk akal, dan kebutuhan konteks bahasa.', 20, 120, 320, $this->rubric([
                        ['name' => 'Perbandingan', 'description' => 'Menganalisis dua kasus secara terpisah.', 'max_points' => 7],
                        ['name' => 'Pengujian key', 'description' => 'Menjelaskan cara mencoba key.', 'max_points' => 7],
                        ['name' => 'Konteks bahasa', 'description' => 'Menilai plaintext yang masuk akal.', 'max_points' => 6],
                    ])),
                    $this->manualQuestion('essay', 'Analisis mengapa panjang kata dan huruf ganda dapat membantu memecahkan Sandi Caesar.', 'Jawaban ideal membahas pola yang tetap bertahan setelah substitusi tetap.', 20, 100, 280, $this->rubric([
                        ['name' => 'Identifikasi pola', 'description' => 'Membahas panjang kata atau huruf ganda.', 'max_points' => 8],
                        ['name' => 'Kaitan dengan substitusi', 'description' => 'Menjelaskan mengapa pola tetap tampak.', 'max_points' => 8],
                        ['name' => 'Contoh', 'description' => 'Memberi contoh yang relevan.', 'max_points' => 4],
                    ])),
                    $this->manualQuestion('essay', 'Sebuah kelas memakai Caesar untuk menyembunyikan jawaban quiz. Analisis risiko jika semua siswa tahu algoritmanya tetapi tidak tahu key.', 'Jawaban ideal membahas Kerckhoffs, ruang kunci kecil, dan brute force.', 20, 120, 320, $this->rubric([
                        ['name' => 'Risiko keyspace', 'description' => 'Menjelaskan keyspace Caesar yang kecil.', 'max_points' => 8],
                        ['name' => 'Prinsip keamanan', 'description' => 'Membahas algoritma diketahui publik.', 'max_points' => 6],
                        ['name' => 'Rekomendasi', 'description' => 'Memberi saran penggunaan yang tepat.', 'max_points' => 6],
                    ])),
                ],
            ],
            [
                'slug' => 'caesar-cipher-c5-evaluate',
                'title' => 'C5: Mengevaluasi Relevansi Caesar',
                'description' => 'Menguji kemampuan menilai manfaat dan keterbatasan Caesar dalam konteks modern.',
                'bloom_level' => Assessment::BLOOM_C5,
                'grading_type' => Assessment::GRADING_AUTO,
                'time_limit_minutes' => 45,
                'sort_order' => 5,
                'questions' => [
                    $this->manualQuestion('essay', 'Evaluasi apakah Sandi Caesar masih layak dipakai untuk komunikasi rahasia saat ini.', 'Jawaban ideal menyimpulkan tidak layak untuk rahasia, tetapi layak untuk pendidikan dan permainan.', 30, 180, 500, $this->rubric([
                        ['name' => 'Tesis evaluatif', 'description' => 'Mengambil posisi yang jelas.', 'max_points' => 8],
                        ['name' => 'Bukti teknis', 'description' => 'Menyebut keyspace, brute force, atau pola.', 'max_points' => 9],
                        ['name' => 'Konteks penggunaan', 'description' => 'Membedakan pendidikan dan keamanan produksi.', 'max_points' => 8],
                        ['name' => 'Kesimpulan', 'description' => 'Memberi keputusan akhir yang konsisten.', 'max_points' => 5],
                    ])),
                    $this->manualQuestion('essay', 'Nilai penggunaan ROT13 untuk menyembunyikan spoiler di forum. Kapan cukup, kapan tidak cukup?', 'Jawaban ideal membedakan obfuscation ringan dari keamanan informasi.', 20, 120, 320, $this->rubric([
                        ['name' => 'Kriteria cukup', 'description' => 'Menilai ROT13 untuk spoiler ringan.', 'max_points' => 7],
                        ['name' => 'Kriteria tidak cukup', 'description' => 'Menjelaskan batas keamanan.', 'max_points' => 7],
                        ['name' => 'Contoh', 'description' => 'Memberi contoh penggunaan tepat.', 'max_points' => 6],
                    ])),
                    $this->manualQuestion('essay', 'Evaluasi klaim: "Algoritma rahasia lebih penting daripada key yang kuat." Setujukah Anda? Kaitkan dengan Sandi Caesar.', 'Jawaban ideal menolak klaim dan menjelaskan keamanan seharusnya bergantung pada key dan desain yang kuat.', 20, 140, 380, $this->rubric([
                        ['name' => 'Posisi', 'description' => 'Menyatakan setuju atau tidak dengan alasan.', 'max_points' => 6],
                        ['name' => 'Kaitan Caesar', 'description' => 'Menghubungkan dengan Caesar yang algoritmanya diketahui.', 'max_points' => 7],
                        ['name' => 'Prinsip keamanan', 'description' => 'Membahas key dan desain terbuka.', 'max_points' => 7],
                    ])),
                    $this->manualQuestion('essay', 'Bandingkan nilai pembelajaran Caesar dan Vigenere untuk pemula. Mana yang sebaiknya diajarkan lebih dulu dan mengapa?', 'Jawaban ideal memilih Caesar sebagai fondasi lalu Vigenere sebagai perluasan, atau memberi argumen lain yang kuat.', 20, 140, 380, $this->rubric([
                        ['name' => 'Perbandingan', 'description' => 'Membandingkan kedua cipher.', 'max_points' => 7],
                        ['name' => 'Justifikasi urutan', 'description' => 'Menjelaskan alasan pedagogis.', 'max_points' => 7],
                        ['name' => 'Kedalaman refleksi', 'description' => 'Membahas kelebihan dan keterbatasan.', 'max_points' => 6],
                    ])),
                ],
            ],
            [
                'slug' => 'caesar-cipher-c6-create',
                'title' => 'C6: Mencipta Aktivitas Caesar',
                'description' => 'Menguji kemampuan merancang varian, aktivitas, atau alat belajar berbasis Caesar.',
                'bloom_level' => Assessment::BLOOM_C6,
                'grading_type' => Assessment::GRADING_AUTO,
                'time_limit_minutes' => 60,
                'sort_order' => 6,
                'questions' => [
                    $this->manualQuestion('essay', 'Rancang aktivitas belajar Sandi Caesar untuk siswa baru. Sertakan tujuan, alat, langkah, contoh, dan cara mengecek jawaban.', 'Jawaban ideal berupa rancangan aktivitas lengkap yang dapat dijalankan di kelas.', 40, 260, 900, $this->rubric([
                        ['name' => 'Kelengkapan rancangan', 'description' => 'Tujuan, alat, langkah, dan evaluasi jelas.', 'max_points' => 10],
                        ['name' => 'Ketepatan teknis', 'description' => 'Aturan Caesar benar.', 'max_points' => 10],
                        ['name' => 'Keterujian', 'description' => 'Ada contoh dan cara cek jawaban.', 'max_points' => 8],
                        ['name' => 'Kejelasan penyajian', 'description' => 'Instruksi mudah diikuti.', 'max_points' => 6],
                        ['name' => 'Refleksi keamanan', 'description' => 'Membahas batas keamanan.', 'max_points' => 6],
                    ])),
                    $this->manualQuestion('essay', 'Buat varian Caesar yang memakai dua key bergantian. Jelaskan aturan enkripsi, dekripsi, contoh, dan kelemahannya.', 'Jawaban ideal mendefinisikan aturan bergantian, memberi contoh, dan menilai keyspace serta pola.', 35, 240, 800, $this->rubric([
                        ['name' => 'Definisi aturan', 'description' => 'Aturan dua key jelas dan konsisten.', 'max_points' => 9],
                        ['name' => 'Contoh kerja', 'description' => 'Memberi enkripsi dan dekripsi.', 'max_points' => 8],
                        ['name' => 'Analisis kelemahan', 'description' => 'Menilai pola dan serangan.', 'max_points' => 8],
                        ['name' => 'Orisinalitas', 'description' => 'Ada ide pengembangan yang masuk akal.', 'max_points' => 5],
                        ['name' => 'Kejelasan', 'description' => 'Dokumentasi mudah diuji.', 'max_points' => 5],
                    ])),
                    $this->manualQuestion('essay', 'Rancang lembar peer review untuk menilai proyek Caesar teman Anda. Minimal ada empat kriteria penilaian.', 'Jawaban ideal menghasilkan instrumen penilaian yang spesifik, terukur, dan relevan.', 25, 180, 600, $this->rubric([
                        ['name' => 'Kriteria relevan', 'description' => 'Kriteria sesuai proyek Caesar.', 'max_points' => 8],
                        ['name' => 'Skala penilaian', 'description' => 'Ada cara memberi skor atau level.', 'max_points' => 6],
                        ['name' => 'Umpan balik', 'description' => 'Memuat ruang saran perbaikan.', 'max_points' => 6],
                        ['name' => 'Keterpakaian', 'description' => 'Mudah dipakai oleh teman.', 'max_points' => 5],
                    ])),
                    $this->manualQuestion('essay', 'Buat prompt proyek akhir: peserta harus membuat pesan rahasia, memberi petunjuk, dan menulis pembahasan keamanan. Susun instruksinya.', 'Jawaban ideal berupa brief proyek akhir yang lengkap dan dapat dieksekusi.', 30, 220, 700, $this->rubric([
                        ['name' => 'Brief proyek', 'description' => 'Instruksi proyek lengkap.', 'max_points' => 8],
                        ['name' => 'Komponen teknis', 'description' => 'Memuat plaintext, key, ciphertext, dan dekripsi.', 'max_points' => 8],
                        ['name' => 'Pembahasan keamanan', 'description' => 'Meminta analisis kelemahan.', 'max_points' => 7],
                        ['name' => 'Penilaian', 'description' => 'Ada output dan kriteria keberhasilan.', 'max_points' => 7],
                    ])),
                ],
            ],
        ];
    }

    /**
     * @param  array<int, string>  $options
     * @return array<string, mixed>
     */
    private function mcq(string $questionText, array $options, string $correctAnswer, string $explanation, int $points = 10): array
    {
        return [
            'question_type' => AssessmentQuestion::TYPE_MCQ,
            'question_text' => $questionText,
            'options' => $options,
            'correct_answer' => $correctAnswer,
            'explanation' => $explanation,
            'points' => $points,
            'grading_type' => Assessment::GRADING_AUTO,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function trueFalse(string $questionText, bool $answer, string $explanation, int $points = 10): array
    {
        return [
            'question_type' => AssessmentQuestion::TYPE_TRUE_FALSE,
            'question_text' => $questionText,
            'options' => ['Benar', 'Salah'],
            'correct_answer' => $answer ? '0' : '1',
            'explanation' => $explanation,
            'points' => $points,
            'grading_type' => Assessment::GRADING_AUTO,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function shortAnswer(string $questionText, string $correctAnswer, string $explanation, int $points = 15): array
    {
        return [
            'question_type' => AssessmentQuestion::TYPE_SHORT_ANSWER,
            'question_text' => $questionText,
            'correct_answer' => $correctAnswer,
            'explanation' => $explanation,
            'points' => $points,
            'grading_type' => Assessment::GRADING_AUTO,
        ];
    }

    /**
     * @param  array<int, array{name: string, description: string, max_points: int}>  $rubric
     * @param  array<int, string>  $keywords
     * @return array<string, mixed>
     */
    private function manualQuestion(
        string $type,
        string $questionText,
        string $explanation,
        int $points,
        int $minWords,
        int $maxWords,
        array $rubric,
        array $keywords = [],
    ): array {
        // With auto-only grading, "manual" essay/short-answer questions are
        // converted to keyword-coverage auto grading. Keywords are pulled from
        // an explicit list when provided, otherwise inferred from the rubric
        // criteria names so each criterion contributes a hint to the grader.
        $criteria = $rubric['criteria'] ?? $rubric;

        $derivedKeywords = $keywords !== []
            ? $keywords
            : array_values(array_filter(array_map(
                fn (array $criterion): string => mb_strtolower((string) ($criterion['name'] ?? '')),
                $criteria,
            ), fn (string $keyword): bool => $keyword !== ''));

        $spec = [
            'keywords' => array_values(array_unique($derivedKeywords)),
            'min_matches' => max(1, (int) floor(count($derivedKeywords) / 2)),
            'min_words' => $minWords,
            'max_words' => $maxWords,
        ];

        return [
            'question_type' => $type,
            'question_text' => $questionText,
            'correct_answer' => json_encode($spec, JSON_UNESCAPED_UNICODE),
            'explanation' => $explanation,
            'rubric' => $rubric,
            'points' => $points,
            'grading_type' => Assessment::GRADING_AUTO,
            'min_words' => $minWords,
            'max_words' => $maxWords,
        ];
    }

    /**
     * @param  array<int, array{name: string, description: string, max_points: int}>  $criteria
     * @return array{criteria: array<int, array{name: string, description: string, max_points: int, levels: array<int, array{score: int, description: string}>}>}
     */
    private function rubric(array $criteria): array
    {
        return [
            'criteria' => array_map(
                fn (array $criterion): array => [
                    'name' => $criterion['name'],
                    'description' => $criterion['description'],
                    'max_points' => $criterion['max_points'],
                    'levels' => [
                        ['score' => $criterion['max_points'], 'description' => 'Lengkap, akurat, dan jelas.'],
                        ['score' => max(1, (int) floor($criterion['max_points'] * 0.6)), 'description' => 'Cukup tepat tetapi masih kurang detail.'],
                        ['score' => 0, 'description' => 'Tidak memenuhi kriteria.'],
                    ],
                ],
                $criteria,
            ),
        ];
    }

    /**
     * @param  array<int, string>  $lines
     */
    private function ensureLessonPdfExists(string $path, string $title, array $lines): string
    {
        Storage::disk('public')->makeDirectory(dirname($path));

        Storage::disk('public')->put(
            $path,
            $this->buildSimplePdf($title, array_merge([
                'Bahasa Indonesia - Materi Sandi Caesar.',
            ], $lines)),
        );

        return $path;
    }

    /**
     * @param  array<int, string>  $lines
     */
    private function buildSimplePdf(string $title, array $lines): string
    {
        $textLines = collect(array_merge([$title, ''], $lines))
            ->flatMap(fn (string $line): array => explode("\n", wordwrap($line, 88, "\n", true)))
            ->take(42)
            ->values();

        $streamLines = [
            'BT',
            '/F1 12 Tf',
            '50 760 Td',
        ];

        foreach ($textLines as $index => $line) {
            if ($index > 0) {
                $streamLines[] = '0 -16 Td';
            }

            $streamLines[] = '('.$this->escapePdfText($line).') Tj';
        }

        $streamLines[] = 'ET';
        $stream = implode("\n", $streamLines);

        $objects = [
            "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
            "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
            "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
            "5 0 obj\n<< /Length ".strlen($stream)." >>\nstream\n{$stream}\nendstream\nendobj\n",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object;
        }

        $xrefOffset = strlen($pdf);
        $xref = "xref\n0 ".(count($objects) + 1)."\n";
        $xref .= "0000000000 65535 f \n";

        foreach (array_slice($offsets, 1) as $offset) {
            $xref .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf.$xref."trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF\n";
    }

    private function escapePdfText(string $text): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
    }

    private function ensureCoverImageExists(): void
    {
        $path = 'course-covers/caesar-cipher-cover.jpg';

        if (Storage::disk('public')->exists($path)) {
            return;
        }

        Storage::disk('public')->makeDirectory('course-covers');

        $imageData = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

        Storage::disk('public')->put($path, $imageData);
    }
}
