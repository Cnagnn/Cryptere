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
            // 1. Create or update Topic
            $topic = Topic::updateOrCreate(
                ['slug' => 'caesar-cipher'],
                [
                    'name' => 'Caesar Cipher',
                    'category' => 'classical-cryptography',
                ]
            );

            // 2. Create or update Course
            $this->ensureCoverImageExists();

            $course = Course::updateOrCreate(
                ['slug' => 'caesar-chiper'],
                [
                    'title' => 'Caesar Chiper',
                    'summary' => 'Pengenalan kriptografi klasik melalui Sandi Caesar',
                    'category' => 'Kriptografi',
                    'difficulty' => 'Pemula',
                    'estimated_minutes' => 120,
                    'status' => 'published',
                    'is_published' => true,
                    'version' => 1,
                    'cover_path' => 'course-covers/caesar-cipher-cover.jpg',
                ]
            );

            // 3. Create Lessons
            $this->createLesson1($course, $topic);
            $this->createLesson2($course, $topic);
            $this->createLesson3($course, $topic);
            $this->createLesson4($course, $topic);

            // 5. Create Assessments C1-C6
            $this->createC1Assessment($course);
            $this->createC2Assessment($course);
            $this->createC3Assessment($course);
            $this->createC4Assessment($course);
            $this->createC5Assessment($course);
            $this->createC6Assessment($course);
        });

        $this->command->info('Caesar Cipher course seeded successfully!');
    }

    private function createLesson1(Course $course, Topic $topic): void
    {
        $lesson = Lesson::updateOrCreate(
            [
                'course_id' => $course->id,
                'slug' => 'caesar-cipher-fundamentals',
            ],
            [
                'title' => 'Pengenalan Sandi Caesar',
                'description' => 'Memahami sejarah, konsep dasar, dan prinsip kerja Sandi Caesar',
                'status' => 'published',
                'version' => 1,
                'position' => 1,
                'topic_id' => $topic->id,
                'learning_objectives' => [
                    'Memahami sejarah dan asal-usul Sandi Caesar',
                    'Menjelaskan konsep substitusi dalam kriptografi',
                    'Memahami prinsip dasar pergeseran alfabet',
                    'Mengenal terminologi: plaintext, ciphertext, dan key',
                ],
                'key_concepts' => [
                    'Sejarah kriptografi',
                    'Julius Caesar',
                    'Substitution cipher',
                    'Plaintext',
                    'Ciphertext',
                    'Shift key',
                ],
                'content' => $this->getLesson1Content(),
            ]
        );

        LessonTask::updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'title' => 'Sejarah Sandi Caesar',
            ],
            [
                'type' => 'video',
                'video_url' => 'https://www.youtube.com/watch?v=sMOZf4GN3oc',
                'video_processing_status' => 'ready',
                'estimated_minutes' => 8,
                'status' => 'published',
                'published_at' => now(),
                'sort_order' => 1,
            ]
        );

        $this->ensurePdfExists();
        LessonTask::updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'title' => 'Pengenalan Kriptografi Klasik',
            ],
            [
                'type' => 'read',
                'document_name' => 'Pengenalan_Kriptografi_Klasik.pdf',
                'conversion_status' => 'converted',
                'pdf_url' => Storage::url('lesson-documents/pengenalan-kriptografi.pdf'),
                'estimated_minutes' => 12,
                'status' => 'published',
                'published_at' => now(),
                'sort_order' => 2,
            ]
        );

        $quizTask = LessonTask::updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'title' => 'Pengenalan Sandi Caesar',
            ],
            [
                'type' => 'quiz',
                'estimated_minutes' => 8,
                'status' => 'published',
                'published_at' => now(),
                'sort_order' => 3,
            ]
        );

        $questions = [
            [
                'question' => 'Siapa yang pertama kali menggunakan Sandi Caesar?',
                'options' => ['Alexander Agung', 'Julius Caesar', 'Augustus Caesar', 'Napoleon Bonaparte'],
                'correct_option' => 1,
                'explanation' => 'Julius Caesar menggunakan sandi ini untuk komunikasi militer dengan pergeseran 3.',
                'sort_order' => 1,
            ],
            [
                'question' => 'Apa yang dimaksud dengan plaintext?',
                'options' => ['Pesan yang sudah dienkripsi', 'Pesan asli sebelum dienkripsi', 'Kunci enkripsi', 'Algoritma enkripsi'],
                'correct_option' => 1,
                'explanation' => 'Plaintext adalah pesan asli yang belum dienkripsi.',
                'sort_order' => 2,
            ],
            [
                'question' => 'Sandi Caesar termasuk jenis sandi apa?',
                'options' => ['Sandi transposisi', 'Sandi substitusi', 'Sandi blok', 'Sandi asimetris'],
                'correct_option' => 1,
                'explanation' => 'Sandi Caesar adalah sandi substitusi yang mengganti setiap huruf dengan huruf lain.',
                'sort_order' => 3,
            ],
            [
                'question' => 'Berapa jumlah kemungkinan pergeseran efektif dalam Sandi Caesar alfabet Latin?',
                'options' => ['3', '13', '25', '256'],
                'correct_option' => 2,
                'explanation' => 'Ada 25 pergeseran efektif; pergeseran 26 kembali ke teks asli.',
                'sort_order' => 4,
            ],
            [
                'question' => 'Apa yang dilakukan proses dekripsi pada Sandi Caesar?',
                'options' => ['Menghapus kunci', 'Menggeser huruf berlawanan arah', 'Mengubah huruf menjadi angka acak', 'Mengganti alfabet dengan simbol'],
                'correct_option' => 1,
                'explanation' => 'Dekripsi menerapkan pergeseran kebalikan dari proses enkripsi.',
                'sort_order' => 5,
            ],
        ];

        foreach ($questions as $questionData) {
            QuizQuestion::updateOrCreate(
                [
                    'lesson_task_id' => $quizTask->id,
                    'question' => $questionData['question'],
                ],
                array_merge($questionData, ['topic_id' => $topic->id])
            );
        }
    }

    private function createLesson2(Course $course, Topic $topic): void
    {
        $lesson = Lesson::updateOrCreate(
            [
                'course_id' => $course->id,
                'slug' => 'enkripsi-dan-dekripsi',
            ],
            [
                'title' => 'Enkripsi dan Dekripsi',
                'description' => 'Mempelajari cara mengenkripsi dan mendekripsi pesan menggunakan Sandi Caesar',
                'status' => 'published',
                'version' => 1,
                'position' => 2,
                'topic_id' => $topic->id,
                'learning_objectives' => [
                    'Mengenkripsi teks menggunakan kunci pergeseran',
                    'Mendekripsi teks sandi dengan benar',
                    'Memahami rumus matematika enkripsi dan dekripsi',
                    'Menerapkan aritmatika modular dalam enkripsi',
                ],
                'key_concepts' => [
                    'Enkripsi',
                    'Dekripsi',
                    'Rumus C = (P + k) mod 26',
                    'Rumus P = (C - k) mod 26',
                    'Aritmatika modular',
                    'Shift key',
                ],
                'content' => $this->getLesson2Content(),
            ]
        );

        LessonTask::updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'title' => 'Cara Enkripsi dan Dekripsi',
            ],
            [
                'type' => 'video',
                'video_url' => 'https://www.youtube.com/watch?v=o6TPx1Co_wg',
                'video_processing_status' => 'ready',
                'estimated_minutes' => 15,
                'status' => 'published',
                'published_at' => now(),
                'sort_order' => 1,
            ]
        );

        $quizTask = LessonTask::updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'title' => 'Enkripsi dan Dekripsi',
            ],
            [
                'type' => 'quiz',
                'estimated_minutes' => 10,
                'status' => 'published',
                'published_at' => now(),
                'sort_order' => 2,
            ]
        );

        $questions = [
            [
                'question' => 'Jika P=7 (huruf H) dan k=3, berapakah nilai C?',
                'options' => ['7', '10', '4', '21'],
                'correct_option' => 1,
                'explanation' => 'C = (P + k) mod 26 = (7 + 3) mod 26 = 10',
                'sort_order' => 1,
            ],
            [
                'question' => 'Untuk mendekripsi, rumus yang digunakan adalah?',
                'options' => ['C = (P + k) mod 26', 'P = (C - k) mod 26', 'P = (C + k) mod 26', 'C = (P - k) mod 26'],
                'correct_option' => 1,
                'explanation' => 'Dekripsi menggunakan rumus P = (C - k) mod 26',
                'sort_order' => 2,
            ],
            [
                'question' => 'Enkripsi huruf Z dengan pergeseran 3 menghasilkan huruf apa?',
                'options' => ['A', 'B', 'C', 'W'],
                'correct_option' => 2,
                'explanation' => 'Z (posisi 25) + 3 = 28, 28 mod 26 = 2, yaitu huruf C',
                'sort_order' => 3,
            ],
            [
                'question' => 'Apa fungsi operasi modulo dalam Sandi Caesar?',
                'options' => ['Mempercepat enkripsi', 'Membuat alfabet melingkar', 'Menambah keamanan', 'Mengurangi ukuran kunci'],
                'correct_option' => 1,
                'explanation' => 'Modulo membuat alfabet melingkar, sehingga setelah Z kembali ke A',
                'sort_order' => 4,
            ],
        ];

        foreach ($questions as $questionData) {
            QuizQuestion::updateOrCreate(
                [
                    'lesson_task_id' => $quizTask->id,
                    'question' => $questionData['question'],
                ],
                array_merge($questionData, ['topic_id' => $topic->id])
            );
        }
    }

    private function createLesson3(Course $course, Topic $topic): void
    {
        $lesson = Lesson::updateOrCreate(
            [
                'course_id' => $course->id,
                'slug' => 'keamanan-dan-serangan',
            ],
            [
                'title' => 'Keamanan dan Serangan',
                'description' => 'Memahami kelemahan keamanan Sandi Caesar dan berbagai metode serangan',
                'status' => 'published',
                'version' => 1,
                'position' => 3,
                'topic_id' => $topic->id,
                'learning_objectives' => [
                    'Mengidentifikasi kelemahan Sandi Caesar',
                    'Memahami serangan brute force',
                    'Menerapkan analisis frekuensi',
                    'Mengevaluasi kekuatan keamanan sandi',
                ],
                'key_concepts' => [
                    'Brute force attack',
                    'Frequency analysis',
                    'Keyspace',
                    'Cryptanalysis',
                    'Pattern recognition',
                ],
                'content' => $this->getLesson3Content(),
            ]
        );

        LessonTask::updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'title' => 'Memecahkan Sandi Caesar',
            ],
            [
                'type' => 'video',
                'video_url' => 'https://www.youtube.com/watch?v=zH_ctod4aA0',
                'video_processing_status' => 'ready',
                'estimated_minutes' => 12,
                'status' => 'published',
                'published_at' => now(),
                'sort_order' => 1,
            ]
        );

        $quizTask = LessonTask::updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'title' => 'Keamanan Sandi Caesar',
            ],
            [
                'type' => 'quiz',
                'estimated_minutes' => 10,
                'status' => 'published',
                'published_at' => now(),
                'sort_order' => 2,
            ]
        );

        $questions = [
            [
                'question' => 'Berapa banyak kemungkinan kunci yang harus dicoba dalam serangan brute force terhadap Sandi Caesar?',
                'options' => ['13', '25', '26', '52'],
                'correct_option' => 1,
                'explanation' => 'Ada 25 kunci non-trivial yang perlu dicoba (pergeseran 1-25)',
                'sort_order' => 1,
            ],
            [
                'question' => 'Metode apa yang memanfaatkan frekuensi kemunculan huruf untuk memecahkan sandi?',
                'options' => ['Brute force', 'Analisis frekuensi', 'Dictionary attack', 'Rainbow table'],
                'correct_option' => 1,
                'explanation' => 'Analisis frekuensi memanfaatkan pola kemunculan huruf dalam bahasa',
                'sort_order' => 2,
            ],
            [
                'question' => 'Huruf apa yang paling sering muncul dalam bahasa Inggris?',
                'options' => ['A', 'E', 'T', 'O'],
                'correct_option' => 1,
                'explanation' => 'Huruf E adalah yang paling sering muncul dalam teks bahasa Inggris',
                'sort_order' => 3,
            ],
            [
                'question' => 'Mengapa Sandi Caesar mudah dipecahkan?',
                'options' => ['Algoritmanya terlalu kompleks', 'Ruang kunci terlalu kecil', 'Memerlukan komputer super', 'Kuncinya terlalu panjang'],
                'correct_option' => 1,
                'explanation' => 'Dengan hanya 25 kemungkinan kunci, Sandi Caesar sangat rentan terhadap brute force',
                'sort_order' => 4,
            ],
        ];

        foreach ($questions as $questionData) {
            QuizQuestion::updateOrCreate(
                [
                    'lesson_task_id' => $quizTask->id,
                    'question' => $questionData['question'],
                ],
                array_merge($questionData, ['topic_id' => $topic->id])
            );
        }
    }

    private function createLesson4(Course $course, Topic $topic): void
    {
        $lesson = Lesson::updateOrCreate(
            [
                'course_id' => $course->id,
                'slug' => 'aplikasi-dan-variasi',
            ],
            [
                'title' => 'Aplikasi dan Variasi',
                'description' => 'Mempelajari aplikasi praktis dan variasi dari Sandi Caesar',
                'status' => 'published',
                'version' => 1,
                'position' => 4,
                'topic_id' => $topic->id,
                'learning_objectives' => [
                    'Memahami ROT13 sebagai variasi Sandi Caesar',
                    'Mengenal aplikasi modern Sandi Caesar',
                    'Memahami evolusi ke sandi yang lebih kompleks',
                    'Menerapkan konsep dalam konteks pembelajaran',
                ],
                'key_concepts' => [
                    'ROT13',
                    'Vigenere cipher',
                    'Polyalphabetic cipher',
                    'Modern cryptography',
                    'Educational applications',
                ],
                'content' => $this->getLesson4Content(),
            ]
        );

        LessonTask::updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'title' => 'ROT13 dan Variasi Lainnya',
            ],
            [
                'type' => 'video',
                'video_url' => 'https://www.youtube.com/watch?v=75gBFiFsfOk',
                'video_processing_status' => 'ready',
                'estimated_minutes' => 10,
                'status' => 'published',
                'published_at' => now(),
                'sort_order' => 1,
            ]
        );

        $quizTask = LessonTask::updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'title' => 'Aplikasi dan Variasi',
            ],
            [
                'type' => 'quiz',
                'estimated_minutes' => 10,
                'status' => 'published',
                'published_at' => now(),
                'sort_order' => 2,
            ]
        );

        $questions = [
            [
                'question' => 'Apa keunikan ROT13 dibandingkan Sandi Caesar lainnya?',
                'options' => [
                    'Lebih aman',
                    'Self-inverse (enkripsi = dekripsi)',
                    'Menggunakan 2 kunci',
                    'Tidak bisa dipecahkan',
                ],
                'correct_option' => 1,
                'explanation' => 'ROT13 adalah self-inverse karena menggunakan pergeseran 13 (setengah alfabet)',
                'sort_order' => 1,
            ],
            [
                'question' => 'Sandi apa yang merupakan evolusi dari Caesar Cipher dengan menggunakan multiple shift keys?',
                'options' => ['AES', 'RSA', 'Vigenere', 'DES'],
                'correct_option' => 2,
                'explanation' => 'Vigenere cipher menggunakan multiple shift keys, membuatnya lebih aman dari Caesar',
                'sort_order' => 2,
            ],
            [
                'question' => 'Di mana ROT13 sering digunakan?',
                'options' => ['Perbankan online', 'Forum untuk menyembunyikan spoiler', 'Komunikasi militer', 'Enkripsi database'],
                'correct_option' => 1,
                'explanation' => 'ROT13 sering digunakan di forum online untuk menyembunyikan spoiler atau jawaban teka-teki',
                'sort_order' => 3,
            ],
            [
                'question' => 'Apa perbedaan utama Vigenere dengan Caesar Cipher?',
                'options' => ['Vigenere lebih lambat', 'Vigenere menggunakan kata kunci', 'Vigenere tidak bisa didekripsi', 'Vigenere hanya untuk angka'],
                'correct_option' => 1,
                'explanation' => 'Vigenere menggunakan kata kunci yang menentukan pergeseran berbeda untuk setiap huruf',
                'sort_order' => 4,
            ],
        ];

        foreach ($questions as $questionData) {
            QuizQuestion::updateOrCreate(
                [
                    'lesson_task_id' => $quizTask->id,
                    'question' => $questionData['question'],
                ],
                array_merge($questionData, ['topic_id' => $topic->id])
            );
        }
    }

    private function getLesson1Content(): string
    {
        return <<<'HTML'
<h2>Sejarah Sandi Caesar</h2>
<p>Sandi Caesar dinamai dari Julius Caesar (100-44 SM), seorang jenderal dan negarawan Romawi yang menggunakan metode enkripsi ini untuk melindungi pesan militer rahasia. Menurut sejarawan Suetonius, Caesar menggunakan pergeseran 3 posisi untuk mengenkripsi pesan-pesannya.</p>

<h2>Mengapa Sandi Caesar Penting?</h2>
<p>Meskipun sederhana dan tidak aman untuk standar modern, Sandi Caesar memiliki nilai historis dan edukatif yang tinggi:</p>
<ul>
<li><strong>Fondasi Kriptografi:</strong> Memperkenalkan konsep dasar enkripsi dan dekripsi</li>
<li><strong>Pembelajaran:</strong> Mudah dipahami untuk pemula dalam kriptografi</li>
<li><strong>Sejarah:</strong> Menunjukkan evolusi keamanan informasi</li>
<li><strong>Prinsip Dasar:</strong> Mengajarkan pentingnya kerahasiaan kunci</li>
</ul>

<h2>Konsep Dasar</h2>
<h3>Substitusi Sederhana</h3>
<p>Sandi Caesar adalah contoh <strong>substitution cipher</strong> (sandi substitusi), di mana setiap huruf dalam pesan asli diganti dengan huruf lain berdasarkan aturan tertentu.</p>

<h3>Terminologi Penting</h3>
<ul>
<li><strong>Plaintext (Teks Terang):</strong> Pesan asli yang ingin dikirim</li>
<li><strong>Ciphertext (Teks Sandi):</strong> Pesan yang sudah dienkripsi</li>
<li><strong>Key (Kunci):</strong> Informasi rahasia yang digunakan untuk enkripsi dan dekripsi</li>
<li><strong>Shift (Pergeseran):</strong> Jumlah posisi pergeseran dalam alfabet</li>
</ul>

<h2>Prinsip Kerja Dasar</h2>
<p>Bayangkan alfabet sebagai lingkaran. Setiap huruf "digeser" sejumlah posisi tertentu:</p>
<ul>
<li>Dengan pergeseran 1: A menjadi B, B menjadi C, dst.</li>
<li>Dengan pergeseran 3: A menjadi D, B menjadi E, dst.</li>
<li>Huruf Z "melingkar" kembali ke awal alfabet</li>
</ul>

<h2>Contoh Sederhana</h2>
<p>Dengan pergeseran 3 (seperti yang digunakan Julius Caesar):</p>
<pre>
Plaintext:  A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
Ciphertext: D E F G H I J K L M N O P Q R S T U V W X Y Z A B C
</pre>
<p>Pesan "HELLO" menjadi "KHOOR"</p>
HTML;
    }

    private function getLesson2Content(): string
    {
        return <<<'HTML'
<h2>Proses Enkripsi</h2>
<p>Enkripsi adalah proses mengubah plaintext menjadi ciphertext menggunakan kunci tertentu.</p>

<h3>Langkah-Langkah Enkripsi</h3>
<ol>
<li>Tentukan kunci pergeseran (k), misalnya k = 3</li>
<li>Untuk setiap huruf dalam plaintext:
    <ul>
    <li>Ubah huruf menjadi angka (A=0, B=1, ..., Z=25)</li>
    <li>Tambahkan kunci pergeseran</li>
    <li>Gunakan modulo 26 untuk "melingkar" jika melebihi Z</li>
    <li>Ubah kembali angka menjadi huruf</li>
    </ul>
</li>
</ol>

<h3>Rumus Enkripsi</h3>
<p><code>C = (P + k) mod 26</code></p>
<p>Di mana:</p>
<ul>
<li><strong>C</strong> = posisi huruf ciphertext (0-25)</li>
<li><strong>P</strong> = posisi huruf plaintext (0-25)</li>
<li><strong>k</strong> = kunci pergeseran (0-25)</li>
<li><strong>mod 26</strong> = operasi modulo (sisa pembagian dengan 26)</li>
</ul>

<h3>Contoh Enkripsi Detail</h3>
<p>Enkripsi kata "HELLO" dengan k = 3:</p>
<pre>
H: posisi 7  → (7 + 3) mod 26 = 10 → K
E: posisi 4  → (4 + 3) mod 26 = 7  → H
L: posisi 11 → (11 + 3) mod 26 = 14 → O
L: posisi 11 → (11 + 3) mod 26 = 14 → O
O: posisi 14 → (14 + 3) mod 26 = 17 → R

Hasil: HELLO → KHOOR
</pre>

<h2>Proses Dekripsi</h2>
<p>Dekripsi adalah kebalikan dari enkripsi - mengubah ciphertext kembali menjadi plaintext.</p>

<h3>Rumus Dekripsi</h3>
<p><code>P = (C - k) mod 26</code></p>

<h3>Contoh Dekripsi</h3>
<p>Dekripsi "KHOOR" dengan k = 3:</p>
<pre>
K: posisi 10 → (10 - 3) mod 26 = 7  → H
H: posisi 7  → (7 - 3) mod 26 = 4  → E
O: posisi 14 → (14 - 3) mod 26 = 11 → L
O: posisi 14 → (14 - 3) mod 26 = 11 → L
R: posisi 17 → (17 - 3) mod 26 = 14 → O

Hasil: KHOOR → HELLO
</pre>

<h2>Aritmatika Modular</h2>
<p>Operasi modulo sangat penting dalam Sandi Caesar untuk menangani "pelingkaran" alfabet:</p>
<ul>
<li>25 mod 26 = 25 (Z tetap Z jika k=0)</li>
<li>26 mod 26 = 0 (setelah Z kembali ke A)</li>
<li>27 mod 26 = 1 (setelah Z, lanjut ke B)</li>
</ul>

<h2>Latihan Praktik</h2>
<p>Coba enkripsi dan dekripsi sendiri:</p>
<ol>
<li>Enkripsi "CRYPTOGRAPHY" dengan k = 5</li>
<li>Dekripsi "MJQQT" dengan k = 5</li>
<li>Enkripsi nama Anda dengan k = 7</li>
</ol>
HTML;
    }

    private function getLesson3Content(): string
    {
        return <<<'HTML'
<h2>Kelemahan Sandi Caesar</h2>
<p>Meskipun berguna untuk pembelajaran, Sandi Caesar memiliki beberapa kelemahan serius yang membuatnya tidak aman untuk penggunaan praktis.</p>

<h3>1. Ruang Kunci Sangat Kecil</h3>
<p>Hanya ada 25 kunci yang bermakna (pergeseran 1-25). Pergeseran 0 tidak mengubah teks, dan pergeseran 26 sama dengan pergeseran 0.</p>
<p><strong>Implikasi:</strong> Penyerang dapat mencoba semua kemungkinan kunci dalam hitungan detik.</p>

<h3>2. Pelestarian Pola</h3>
<p>Sandi Caesar mempertahankan:</p>
<ul>
<li>Panjang kata</li>
<li>Spasi antar kata</li>
<li>Huruf ganda (LL tetap menjadi dua huruf sama)</li>
<li>Frekuensi relatif huruf</li>
</ul>

<h2>Serangan Brute Force</h2>
<p>Serangan brute force mencoba semua kemungkinan kunci sampai menemukan yang benar.</p>

<h3>Langkah-Langkah Brute Force</h3>
<ol>
<li>Coba dekripsi dengan k = 1</li>
<li>Periksa apakah hasilnya masuk akal</li>
<li>Jika tidak, coba k = 2</li>
<li>Ulangi sampai k = 25</li>
</ol>

<h3>Contoh Brute Force</h3>
<p>Ciphertext: "KHOOR"</p>
<pre>
k=1: JGNNQ (tidak masuk akal)
k=2: IFMMP (tidak masuk akal)
k=3: HELLO (masuk akal! ✓)
</pre>

<h2>Analisis Frekuensi</h2>
<p>Dalam bahasa Inggris, huruf-huruf tertentu muncul lebih sering:</p>
<ul>
<li>Paling sering: E, T, A, O, I, N</li>
<li>Paling jarang: Z, Q, X, J</li>
</ul>

<h3>Cara Kerja Analisis Frekuensi</h3>
<ol>
<li>Hitung frekuensi setiap huruf dalam ciphertext</li>
<li>Bandingkan dengan frekuensi normal bahasa</li>
<li>Huruf paling sering dalam ciphertext kemungkinan adalah 'E' yang digeser</li>
<li>Hitung pergeseran dan dekripsi seluruh pesan</li>
</ol>

<h3>Contoh Analisis Frekuensi</h3>
<p>Jika 'H' muncul paling sering dalam ciphertext:</p>
<ul>
<li>H adalah posisi 7</li>
<li>E adalah posisi 4</li>
<li>Pergeseran kemungkinan: 7 - 4 = 3</li>
<li>Coba dekripsi dengan k = 3</li>
</ul>

<h2>Mengapa Ini Penting?</h2>
<p>Memahami kelemahan Sandi Caesar mengajarkan prinsip penting dalam kriptografi modern:</p>
<ul>
<li><strong>Ruang kunci harus besar:</strong> Sandi modern menggunakan kunci 128-bit atau lebih</li>
<li><strong>Hindari pola:</strong> Enkripsi modern menyembunyikan pola statistik</li>
<li><strong>Security through obscurity gagal:</strong> Keamanan harus bergantung pada kunci, bukan kerahasiaan algoritma</li>
</ul>
HTML;
    }

    private function getLesson4Content(): string
    {
        return <<<'HTML'
<h2>ROT13: Variasi Populer</h2>
<p>ROT13 adalah variasi khusus dari Sandi Caesar yang menggunakan pergeseran 13.</p>

<h3>Keunikan ROT13</h3>
<p>Karena alfabet memiliki 26 huruf, pergeseran 13 adalah tepat setengahnya. Ini membuat ROT13 <strong>self-inverse</strong>:</p>
<ul>
<li>Enkripsi dengan ROT13 sekali = ciphertext</li>
<li>Enkripsi dengan ROT13 lagi = plaintext asli</li>
<li>Tidak perlu operasi dekripsi terpisah!</li>
</ul>

<h3>Penggunaan ROT13</h3>
<ul>
<li><strong>Forum online:</strong> Menyembunyikan spoiler atau jawaban teka-teki</li>
<li><strong>Email:</strong> Menyembunyikan alamat email dari bot spam</li>
<li><strong>Pembelajaran:</strong> Demonstrasi konsep self-inverse</li>
</ul>

<h3>Contoh ROT13</h3>
<pre>
Plaintext:  HELLO WORLD
ROT13:      URYYB JBEYQ
ROT13 lagi: HELLO WORLD (kembali ke asli!)
</pre>

<h2>Evolusi ke Sandi Lebih Kompleks</h2>

<h3>Vigenere Cipher</h3>
<p>Vigenere cipher adalah evolusi dari Caesar yang menggunakan <strong>multiple shift keys</strong>:</p>
<ul>
<li>Menggunakan kata kunci, bukan satu angka</li>
<li>Setiap huruf kata kunci menentukan pergeseran berbeda</li>
<li>Lebih sulit dipecahkan dengan analisis frekuensi</li>
</ul>

<h3>Contoh Vigenere</h3>
<pre>
Plaintext:  HELLO
Keyword:    KEY
Shifts:     K=10, E=4, Y=24, K=10, E=4
Ciphertext: RIJVS
</pre>

<h3>Polyalphabetic Ciphers</h3>
<p>Sandi yang menggunakan multiple alphabets untuk substitusi, membuat analisis frekuensi jauh lebih sulit.</p>

<h2>Aplikasi Modern</h2>

<h3>1. Pendidikan</h3>
<ul>
<li>Mengajarkan konsep dasar kriptografi</li>
<li>Demonstrasi pentingnya ruang kunci</li>
<li>Latihan pemrograman untuk pemula</li>
</ul>

<h3>2. Teka-Teki dan Permainan</h3>
<ul>
<li>Escape rooms</li>
<li>Puzzle games</li>
<li>Geocaching</li>
</ul>

<h3>3. Obfuscation Ringan</h3>
<ul>
<li>Menyembunyikan spoiler (bukan untuk keamanan serius)</li>
<li>Encoding sederhana dalam aplikasi</li>
</ul>

<h2>Pelajaran untuk Kriptografi Modern</h2>

<h3>Prinsip yang Dipelajari</h3>
<ol>
<li><strong>Kerckhoffs's Principle:</strong> Keamanan harus bergantung pada kunci, bukan kerahasiaan algoritma</li>
<li><strong>Keyspace Matters:</strong> Ruang kunci harus cukup besar untuk mencegah brute force</li>
<li><strong>Avoid Patterns:</strong> Enkripsi yang baik menyembunyikan pola statistik</li>
<li><strong>Perfect Secrecy:</strong> Konsep keamanan sempurna (One-Time Pad)</li>
</ol>

<h3>Transisi ke Kriptografi Modern</h3>
<p>Dari Caesar ke enkripsi modern:</p>
<ul>
<li><strong>Symmetric Encryption:</strong> AES, DES (kunci sama untuk enkripsi dan dekripsi)</li>
<li><strong>Asymmetric Encryption:</strong> RSA, ECC (kunci publik dan privat berbeda)</li>
<li><strong>Hash Functions:</strong> SHA-256, MD5 (one-way functions)</li>
<li><strong>Digital Signatures:</strong> Verifikasi keaslian dan integritas</li>
</ul>

<h2>Kesimpulan</h2>
<p>Sandi Caesar, meskipun sederhana dan tidak aman, tetap menjadi fondasi penting dalam pembelajaran kriptografi. Memahami kekuatan dan kelemahannya membantu kita menghargai kompleksitas dan kecanggihan sistem kriptografi modern.</p>
HTML;
    }

    private function createC1Assessment(Course $course): void
    {
        $assessment = Assessment::updateOrCreate(
            ['slug' => 'caesar-cipher-c1-remember'],
            [
                'title' => 'C1: Mengingat - Fakta Sandi Caesar',
                'description' => 'Uji kemampuan Anda mengingat fakta dan definisi dasar Sandi Caesar',
                'course_id' => $course->id,
                'bloom_level' => 'C1',
                'grading_type' => 'auto',
                'passing_score' => 70,
                'max_attempts' => 3,
                'time_limit_minutes' => 15,
                'status' => 'published',
                'sort_order' => 1,
            ]
        );

        $questions = [
            [
                'question_type' => 'mcq',
                'question_text' => 'Siapa yang secara historis dikaitkan dengan Sandi Caesar?',
                'options' => ['Alexander Agung', 'Julius Caesar', 'Napoleon Bonaparte', 'Augustus Caesar'],
                'correct_answer' => '1',
                'explanation' => 'Sandi Caesar dinamai dari Julius Caesar, yang menggunakannya untuk melindungi komunikasi militer.',
                'points' => 10,
                'sort_order' => 1,
            ],
            [
                'question_type' => 'mcq',
                'question_text' => 'Jenis sandi apa yang dimaksud dengan Sandi Caesar?',
                'options' => ['Sandi transposisi', 'Sandi substitusi', 'Sandi aliran', 'Sandi blok'],
                'correct_answer' => '1',
                'explanation' => 'Sandi Caesar adalah sandi substitusi di mana setiap huruf diganti dengan huruf lain pada posisi tetap.',
                'points' => 10,
                'sort_order' => 2,
            ],
            [
                'question_type' => 'mcq',
                'question_text' => 'Berapa banyak pergeseran non-trivial yang ada dalam alfabet 26 huruf untuk Sandi Caesar?',
                'options' => ['24', '25', '26', '27'],
                'correct_answer' => '1',
                'explanation' => 'Ada 25 pergeseran non-trivial (1-25). Pergeseran 0 tidak menghasilkan perubahan, dan pergeseran 26 setara dengan pergeseran 0.',
                'points' => 10,
                'sort_order' => 3,
            ],
        ];

        foreach ($questions as $questionData) {
            AssessmentQuestion::updateOrCreate(
                [
                    'assessment_id' => $assessment->id,
                    'question_text' => $questionData['question_text'],
                ],
                array_merge($questionData, [
                    'bloom_level' => 'C1',
                    'grading_type' => 'auto',
                ])
            );
        }
    }

    private function createC2Assessment(Course $course): void
    {
        $assessment = Assessment::updateOrCreate(
            ['slug' => 'caesar-cipher-c2-understand'],
            [
                'title' => 'C2: Memahami - Konsep Sandi Caesar',
                'description' => 'Tunjukkan pemahaman Anda tentang konsep dan prinsip Sandi Caesar',
                'course_id' => $course->id,
                'bloom_level' => 'C2',
                'grading_type' => 'mixed',
                'passing_score' => 70,
                'max_attempts' => 3,
                'time_limit_minutes' => 25,
                'status' => 'published',
                'sort_order' => 2,
            ]
        );

        $questions = [
            [
                'question_type' => 'mcq',
                'question_text' => 'Mengapa Sandi Caesar rentan terhadap serangan brute force?',
                'options' => [
                    'Menggunakan operasi matematika yang kompleks',
                    'Ruang kunci terlalu kecil dengan hanya 25 pergeseran yang mungkin',
                    'Memerlukan perangkat keras khusus untuk mendekripsi',
                    'Algoritmanya terlalu lambat',
                ],
                'correct_answer' => '1',
                'explanation' => 'Dengan hanya 25 pergeseran non-trivial yang mungkin, penyerang dapat mencoba semua kunci dalam hitungan detik, membuat serangan brute force menjadi trivial.',
                'points' => 15,
                'grading_type' => 'auto',
                'sort_order' => 1,
            ],
            [
                'question_type' => 'essay',
                'question_text' => 'Jelaskan perbedaan antara enkripsi dan dekripsi dalam Sandi Caesar. Sertakan rumus dan jelaskan apa yang diwakili setiap variabel.',
                'correct_answer' => null,
                'explanation' => 'Diharapkan: Enkripsi menggunakan C = (P + k) mod 26, dekripsi menggunakan P = (C - k) mod 26. Harus menjelaskan P=posisi teks terang, C=posisi teks sandi, k=kunci pergeseran.',
                'points' => 20,
                'grading_type' => 'manual',
                'rubric' => [
                    ['criterion' => 'Keakuratan rumus', 'points' => 10],
                    ['criterion' => 'Kejelasan penjelasan', 'points' => 10],
                ],
                'min_words' => 50,
                'max_words' => 200,
                'sort_order' => 2,
            ],
            [
                'question_type' => 'short_answer',
                'question_text' => 'Jelaskan peran kunci pergeseran dalam Sandi Caesar.',
                'correct_answer' => null,
                'explanation' => 'Kunci pergeseran menentukan berapa banyak posisi setiap huruf bergerak dalam alfabet. Ini adalah rahasia yang harus dibagikan antara pengirim dan penerima.',
                'points' => 15,
                'grading_type' => 'manual',
                'rubric' => [
                    ['criterion' => 'Pemahaman fungsi kunci', 'points' => 8],
                    ['criterion' => 'Kejelasan', 'points' => 7],
                ],
                'min_words' => 30,
                'max_words' => 100,
                'sort_order' => 3,
            ],
        ];

        foreach ($questions as $questionData) {
            AssessmentQuestion::updateOrCreate(
                [
                    'assessment_id' => $assessment->id,
                    'question_text' => $questionData['question_text'],
                ],
                array_merge($questionData, ['bloom_level' => 'C2'])
            );
        }
    }

    private function createC3Assessment(Course $course): void
    {
        $assessment = Assessment::updateOrCreate(
            ['slug' => 'caesar-cipher-c3-apply'],
            [
                'title' => 'C3: Menerapkan - Operasi Sandi Caesar',
                'description' => 'Terapkan enkripsi dan dekripsi Sandi Caesar untuk menyelesaikan masalah',
                'course_id' => $course->id,
                'bloom_level' => 'C3',
                'grading_type' => 'auto',
                'passing_score' => 70,
                'max_attempts' => 3,
                'time_limit_minutes' => 25,
                'status' => 'published',
                'sort_order' => 3,
            ]
        );

        $questions = [
            [
                'question_type' => 'short_answer',
                'question_text' => 'Enkripsi kata CRYPTOGRAPHY menggunakan Sandi Caesar dengan pergeseran 5. Berikan hanya teks sandinya.',
                'correct_answer' => 'HWDUYTLWFUMD',
                'explanation' => 'C→H, R→W, Y→D, P→U, T→Y, O→T, G→L, R→W, A→F, P→U, H→M, Y→D',
                'points' => 15,
                'grading_type' => 'auto',
                'sort_order' => 1,
            ],
            [
                'question_type' => 'short_answer',
                'question_text' => 'Dekripsi teks sandi KHOOR menggunakan Sandi Caesar dengan pergeseran 3. Berikan hanya teks terangnya.',
                'correct_answer' => 'HELLO',
                'explanation' => 'K→H, H→E, O→L, O→L, R→O',
                'points' => 15,
                'grading_type' => 'auto',
                'sort_order' => 2,
            ],
            [
                'question_type' => 'short_answer',
                'question_text' => 'Decode teks ROT13 URYYB. Berikan hanya teks yang didecode.',
                'correct_answer' => 'HELLO',
                'explanation' => 'ROT13 menggunakan pergeseran 13. U→H, R→E, Y→L, Y→L, B→O',
                'points' => 15,
                'grading_type' => 'auto',
                'sort_order' => 3,
            ],
        ];

        foreach ($questions as $questionData) {
            AssessmentQuestion::updateOrCreate(
                [
                    'assessment_id' => $assessment->id,
                    'question_text' => $questionData['question_text'],
                ],
                array_merge($questionData, ['bloom_level' => 'C3'])
            );
        }
    }

    private function createC4Assessment(Course $course): void
    {
        $assessment = Assessment::updateOrCreate(
            ['slug' => 'caesar-cipher-c4-analyze'],
            [
                'title' => 'C4: Menganalisis - Keamanan Sandi Caesar',
                'description' => 'Analisis teks sandi dan identifikasi kelemahan keamanan dalam Sandi Caesar',
                'course_id' => $course->id,
                'bloom_level' => 'C4',
                'grading_type' => 'manual',
                'passing_score' => 70,
                'max_attempts' => 3,
                'time_limit_minutes' => 40,
                'status' => 'published',
                'sort_order' => 4,
            ]
        );

        $question = AssessmentQuestion::updateOrCreate(
            [
                'assessment_id' => $assessment->id,
                'question_text' => 'Anda telah mencegat teks sandi berikut: "WKH FLSKHU LV HDVB". Analisis pesan ini dan jelaskan pendekatan Anda untuk memecahkannya.',
            ],
            [
                'question_type' => 'case_study',
                'bloom_level' => 'C4',
                'grading_type' => 'manual',
                'correct_answer' => null,
                'explanation' => 'Analisis yang diharapkan: Identifikasi kemungkinan Sandi Caesar, jelaskan pendekatan brute force, coba pergeseran, identifikasi pergeseran 3 menghasilkan "THE CIPHER IS EASY", jelaskan mengapa ruang kunci kecil penting.',
                'points' => 25,
                'rubric' => [
                    ['criterion' => 'Identifikasi jenis sandi', 'points' => 8],
                    ['criterion' => 'Kedalaman analisis dan metodologi', 'points' => 9],
                    ['criterion' => 'Bukti dan penalaran', 'points' => 8],
                ],
                'min_words' => 150,
                'max_words' => 400,
                'sort_order' => 1,
            ]
        );
    }

    private function createC5Assessment(Course $course): void
    {
        $assessment = Assessment::updateOrCreate(
            ['slug' => 'caesar-cipher-c5-evaluate'],
            [
                'title' => 'C5: Mengevaluasi - Relevansi Sandi Caesar',
                'description' => 'Evaluasi relevansi dan kesesuaian Sandi Caesar dalam konteks modern',
                'course_id' => $course->id,
                'bloom_level' => 'C5',
                'grading_type' => 'manual',
                'passing_score' => 70,
                'max_attempts' => 3,
                'time_limit_minutes' => 45,
                'status' => 'published',
                'sort_order' => 5,
            ]
        );

        $question = AssessmentQuestion::updateOrCreate(
            [
                'assessment_id' => $assessment->id,
                'question_text' => 'Evaluasi apakah Sandi Caesar masih relevan dalam aplikasi modern. Pertimbangkan keterbatasan dan potensi penggunaannya.',
            ],
            [
                'question_type' => 'essay',
                'bloom_level' => 'C5',
                'grading_type' => 'manual',
                'correct_answer' => null,
                'explanation' => 'Diharapkan: Tidak aman untuk data rahasia, tetapi berharga untuk pendidikan, teka-teki, demo, konteks historis. Harus menjelaskan mengapa kripto modern memerlukan ruang kunci yang lebih besar.',
                'points' => 30,
                'rubric' => [
                    ['criterion' => 'Posisi dan tesis yang jelas', 'points' => 8],
                    ['criterion' => 'Justifikasi dengan bukti', 'points' => 8],
                    ['criterion' => 'Pertimbangan argumen tandingan', 'points' => 7],
                    ['criterion' => 'Keakuratan teknis', 'points' => 7],
                ],
                'min_words' => 200,
                'max_words' => 500,
                'sort_order' => 1,
            ]
        );
    }

    private function createC6Assessment(Course $course): void
    {
        $assessment = Assessment::updateOrCreate(
            ['slug' => 'caesar-cipher-c6-create'],
            [
                'title' => 'C6: Mencipta - Merancang Pembelajaran Sandi yang Ditingkatkan',
                'description' => 'Rancang aktivitas pembelajaran Sandi Caesar yang ditingkatkan atau varian sandi',
                'course_id' => $course->id,
                'bloom_level' => 'C6',
                'grading_type' => 'manual',
                'passing_score' => 70,
                'max_attempts' => 3,
                'time_limit_minutes' => 60,
                'status' => 'published',
                'sort_order' => 6,
            ]
        );

        $question = AssessmentQuestion::updateOrCreate(
            [
                'assessment_id' => $assessment->id,
                'question_text' => 'Rancang aktivitas pembelajaran Sandi Caesar yang ditingkatkan atau varian sandi. Desain Anda harus mencakup: pernyataan masalah, tujuan desain, mekanisme enkripsi/dekripsi, contoh yang dikerjakan, analisis keamanan, penjelasan perbaikan, dan keterbatasan.',
            ],
            [
                'question_type' => 'design',
                'bloom_level' => 'C6',
                'grading_type' => 'manual',
                'correct_answer' => null,
                'explanation' => 'Output yang dapat diterima: varian Caesar dengan pergeseran variabel, transisi polialfabetik menuju Vigenere, visualisasi Glass Box, demo brute-force interaktif, mini-lab pengajaran.',
                'points' => 40,
                'rubric' => [
                    ['criterion' => 'Kelengkapan desain', 'points' => 8],
                    ['criterion' => 'Ketepatan teknis', 'points' => 8],
                    ['criterion' => 'Orisinalitas dan kreativitas', 'points' => 8],
                    ['criterion' => 'Kualitas dokumentasi', 'points' => 8],
                    ['criterion' => 'Integrasi dengan tujuan pembelajaran', 'points' => 8],
                ],
                'min_words' => 300,
                'max_words' => 1000,
                'sort_order' => 1,
            ]
        );
    }

    private function ensurePdfExists(): void
    {
        $path = 'lesson-documents/caesar-cipher-guide.pdf';

        if (Storage::disk('public')->exists($path)) {
            return;
        }

        // Create directory if needed
        Storage::disk('public')->makeDirectory('lesson-documents');

        // Create a simple text file as placeholder
        // In production, you would generate a proper PDF
        $content = $this->getPdfContent();

        Storage::disk('public')->put($path, $content);
    }

    private function getPdfContent(): string
    {
        return <<<'TEXT'
PANDUAN SANDI CAESAR

1. PENGENALAN KRIPTOGRAFI KLASIK

Kriptografi klasik mengacu pada metode enkripsi yang digunakan sebelum era komputer modern.
Sandi Caesar adalah salah satu bentuk enkripsi tertua dan paling sederhana, yang berasal dari
kampanye militer Julius Caesar.

2. RUMUS ENKRIPSI DAN DEKRIPSI

Enkripsi: C = (P + k) mod 26
Dekripsi: P = (C - k) mod 26

Di mana:
- P = posisi huruf teks terang (A=0, B=1, ..., Z=25)
- C = posisi huruf teks sandi
- k = kunci pergeseran (0-25)
- mod 26 = operasi modulo (sisa setelah dibagi 26)

3. CONTOH YANG DIKERJAKAN: HELLO → KHOOR

Menggunakan kunci pergeseran k = 3:

H (posisi 7)  → (7 + 3) mod 26 = 10 → K
E (posisi 4)  → (4 + 3) mod 26 = 7  → H
L (posisi 11) → (11 + 3) mod 26 = 14 → O
L (posisi 11) → (11 + 3) mod 26 = 14 → O
O (posisi 14) → (14 + 3) mod 26 = 17 → R

Hasil: HELLO dienkripsi menjadi KHOOR dengan pergeseran 3

4. ANALISIS KELEMAHAN

4.1 Ruang Kunci Kecil
Dengan hanya 25 pergeseran non-trivial, Sandi Caesar sangat rentan terhadap serangan brute force.
Penyerang dapat mencoba semua kunci yang mungkin dalam hitungan detik.

4.2 Analisis Frekuensi
Sandi Caesar mempertahankan distribusi frekuensi huruf. Dalam bahasa Inggris, 'E' adalah huruf
yang paling umum. Jika 'H' muncul paling sering dalam teks sandi, pergeserannya kemungkinan 3.

4.3 Pelestarian Pola
Sandi Caesar mempertahankan pola seperti huruf ganda (LL → OO) dan panjang kata, membuat
kriptanalisis lebih mudah.

5. LATIHAN PRAKTIK

Latihan 1: Enkripsi "CRYPTOGRAPHY" dengan pergeseran 5
Latihan 2: Dekripsi "MJQQT" dengan pergeseran 5
Latihan 3: Pecahkan teks sandi "WKLV LV D WHVW" (petunjuk: coba pergeseran yang berbeda)
Latihan 4: Jelaskan mengapa ROT13 adalah self-inverse

6. PENGGUNAAN DASAR DALAM PEMBELAJARAN KRIPTOGRAFI

Sandi Caesar berfungsi sebagai alat pengajaran yang sangat baik karena:
- Cukup sederhana untuk dipahami dengan cepat
- Mendemonstrasikan konsep inti: teks terang, teks sandi, kunci
- Menunjukkan mengapa keamanan melalui ketidakjelasan gagal
- Mengilustrasikan pentingnya ukuran ruang kunci
- Memberikan dasar untuk memahami enkripsi modern

7. REFERENSI DAN BACAAN LEBIH LANJUT

- Kriptografi klasik dan sandi substitusi
- Aritmatika modular dalam kriptografi
- Teknik analisis frekuensi
- Evolusi dari sandi Caesar ke Vigenere
- Enkripsi simetris modern (AES)
- Pendekatan Glass Box untuk mengajarkan kriptografi

TEXT;
    }

    private function ensureCoverImageExists(): void
    {
        $path = 'course-covers/caesar-cipher-cover.jpg';

        if (Storage::disk('public')->exists($path)) {
            return;
        }

        // Create directory if needed
        Storage::disk('public')->makeDirectory('course-covers');

        // Create a simple placeholder image (1x1 pixel)
        // In production, use a proper image
        $imageData = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

        Storage::disk('public')->put($path, $imageData);
    }
}
