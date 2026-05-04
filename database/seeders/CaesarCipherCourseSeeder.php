<?php

namespace Database\Seeders;

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CaesarCipherCourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // Create Course
            $course = $this->createCourse();

            // Create Lessons with Tasks
            $this->createLessons($course);

            // Create Assessment with Questions
            $this->createAssessment($course);
        });
    }

    private function createCourse(): Course
    {
        return Course::create([
            'title' => 'Algoritma Caesar Cipher',
            'slug' => 'algoritma-caesar-cipher',
            'category' => 'Kriptografi',
            'difficulty' => 'Pemula',
            'summary' => 'Pelajari salah satu teknik enkripsi tertua dan paling terkenal dalam sejarah kriptografi. Caesar Cipher adalah metode substitusi sederhana yang digunakan Julius Caesar untuk mengamankan pesan militer. Dalam kursus ini, Anda akan memahami konsep dasar kriptografi, cara kerja enkripsi dan dekripsi Caesar Cipher, serta kelemahan dan cara mengatasinya.',
            'estimated_minutes' => 180,
            'is_published' => true,
            'sort_order' => 1,
        ]);
    }

    private function createLessons(Course $course): void
    {
        $lessonsData = $this->getLessonsData();

        foreach ($lessonsData as $lessonData) {
            $lesson = Lesson::create([
                'course_id' => $course->id,
                'slug' => $lessonData['slug'],
                'title' => $lessonData['title'],
                'description' => $lessonData['description'],
                'content' => $lessonData['content'],
                'learning_objectives' => $lessonData['learning_objectives'],
                'key_concepts' => $lessonData['key_concepts'],
                'position' => $lessonData['position'],
            ]);

            foreach ($lessonData['tasks'] as $taskData) {
                $task = LessonTask::create([
                    'lesson_id' => $lesson->id,
                    'title' => $taskData['title'],
                    'description' => $taskData['description'],
                    'type' => $taskData['type'],
                    'sort_order' => $taskData['sort_order'],
                    'video_url' => $taskData['video_url'] ?? null,
                    'video_processing_status' => isset($taskData['video_url']) ? 'ready' : null,
                    'pdf_url' => $taskData['pdf_url'] ?? null,
                ]);

                if (isset($taskData['quiz_questions'])) {
                    foreach ($taskData['quiz_questions'] as $quizData) {
                        QuizQuestion::create([
                            'lesson_task_id' => $task->id,
                            'question' => $quizData['question'],
                            'options' => $quizData['options'],
                            'correct_option' => $quizData['correct_option'],
                            'explanation' => $quizData['explanation'],
                            'sort_order' => $quizData['sort_order'],
                        ]);
                    }
                }
            }
        }
    }

    private function getLessonsData(): array
    {
        return [
            // Lesson 1: Pengenalan Kriptografi & Caesar Cipher
            [
                'slug' => 'pengenalan-kriptografi-caesar-cipher',
                'title' => 'Pengenalan Kriptografi & Caesar Cipher',
                'description' => 'Memahami konsep dasar kriptografi dan pengenalan awal tentang Caesar Cipher sebagai salah satu metode enkripsi tertua. Pelajari mengapa keamanan informasi penting dan bagaimana Caesar Cipher menjadi fondasi ilmu kriptografi modern.',
                'content' => "Kriptografi adalah ilmu dan seni menyembunyikan informasi dengan mengubahnya menjadi bentuk yang tidak dapat dibaca oleh pihak yang tidak berwenang. Sejak zaman kuno, manusia telah menggunakan berbagai teknik untuk melindungi pesan rahasia mereka dari musuh atau mata-mata.\n\nCaesar Cipher adalah salah satu teknik enkripsi substitusi paling sederhana dan paling terkenal. Dinamai sesuai dengan Julius Caesar, kaisar Romawi yang menggunakannya untuk mengamankan komunikasi militer sekitar tahun 58 SM. Metode ini bekerja dengan menggeser setiap huruf dalam pesan dengan sejumlah posisi tetap dalam alfabet.\n\nMeskipun Caesar Cipher sangat sederhana dan mudah dipecahkan dengan teknologi modern, ia memiliki nilai historis yang sangat penting. Cipher ini mengajarkan konsep dasar enkripsi: transformasi reversibel yang memerlukan kunci rahasia untuk dekripsi. Prinsip-prinsip yang sama masih digunakan dalam algoritma enkripsi modern yang jauh lebih kompleks.\n\nDalam pelajaran ini, kita akan menjelajahi bagaimana Caesar Cipher bekerja, mengapa ia penting dalam sejarah kriptografi, dan bagaimana konsep dasarnya masih relevan hingga hari ini. Anda akan belajar tidak hanya cara menggunakan cipher ini, tetapi juga cara berpikir tentang keamanan informasi secara umum.",
                'learning_objectives' => [
                    'Memahami definisi dan tujuan kriptografi',
                    'Mengenal sejarah singkat Caesar Cipher',
                    'Memahami konsep enkripsi dan dekripsi',
                    'Menjelaskan pentingnya keamanan informasi',
                ],
                'key_concepts' => [
                    'Kriptografi',
                    'Enkripsi',
                    'Dekripsi',
                    'Caesar Cipher',
                    'Substitusi',
                ],
                'position' => 1,
                'tasks' => [
                    [
                        'title' => 'Video: Apa itu Kriptografi?',
                        'description' => 'Tonton video pengantar tentang konsep dasar kriptografi dan sejarahnya',
                        'type' => 'video',
                        'minutes' => 15,
                        'sort_order' => 1,
                        'video_url' => 'https://example.com/videos/intro-kriptografi.mp4',
                    ],
                    [
                        'title' => 'Bacaan: Sejarah Caesar Cipher',
                        'description' => 'Baca artikel tentang Julius Caesar dan penggunaan cipher dalam perang Romawi',
                        'type' => 'read',
                        'minutes' => 20,
                        'sort_order' => 2,
                        'pdf_url' => 'https://example.com/pdfs/sejarah-caesar-cipher.pdf',
                    ],
                    [
                        'title' => 'Kuis: Pemahaman Dasar Kriptografi',
                        'description' => 'Uji pemahaman Anda tentang konsep dasar kriptografi',
                        'type' => 'quiz',
                        'minutes' => 10,
                        'sort_order' => 3,
                        'quiz_questions' => [
                            [
                                'question' => 'Apa definisi kriptografi yang paling tepat?',
                                'options' => [
                                    'Ilmu tentang komputer dan pemrograman',
                                    'Ilmu dan seni menyembunyikan informasi',
                                    'Teknik membuat password yang kuat',
                                    'Metode mengirim email terenkripsi',
                                ],
                                'correct_option' => 1,
                                'explanation' => 'Kriptografi adalah ilmu dan seni menyembunyikan informasi dengan mengubahnya menjadi bentuk yang tidak dapat dibaca tanpa kunci yang tepat.',
                                'sort_order' => 1,
                            ],
                            [
                                'question' => 'Siapa yang pertama kali menggunakan Caesar Cipher?',
                                'options' => [
                                    'Alexander the Great',
                                    'Julius Caesar',
                                    'Napoleon Bonaparte',
                                    'Leonardo da Vinci',
                                ],
                                'correct_option' => 1,
                                'explanation' => 'Julius Caesar, kaisar Romawi, menggunakan cipher ini untuk mengamankan komunikasi militer sekitar tahun 58 SM.',
                                'sort_order' => 2,
                            ],
                            [
                                'question' => 'Apa tujuan utama enkripsi?',
                                'options' => [
                                    'Mempercepat pengiriman pesan',
                                    'Melindungi informasi dari akses tidak sah',
                                    'Mengompresi ukuran file',
                                    'Menerjemahkan bahasa',
                                ],
                                'correct_option' => 1,
                                'explanation' => 'Tujuan utama enkripsi adalah melindungi informasi dari akses pihak yang tidak berwenang dengan mengubahnya menjadi bentuk yang tidak dapat dibaca.',
                                'sort_order' => 3,
                            ],
                        ],
                    ],
                ],
            ],
            // Lesson 2: Sejarah & Konsep Dasar Caesar Cipher
            [
                'slug' => 'sejarah-konsep-dasar-caesar-cipher',
                'title' => 'Sejarah & Konsep Dasar Caesar Cipher',
                'description' => 'Mendalami sejarah penggunaan Caesar Cipher dalam peradaban Romawi dan memahami konsep matematika di balik metode substitusi sederhana ini.',
                'content' => "Julius Caesar menggunakan cipher substitusi untuk berkomunikasi dengan para jenderalnya selama kampanye militer. Menurut sejarawan Romawi Suetonius, Caesar menggunakan pergeseran tiga posisi (A menjadi D, B menjadi E, dan seterusnya) untuk pesan-pesan rahasianya. Metode ini efektif pada masanya karena sebagian besar musuh tidak dapat membaca bahasa Latin, apalagi memecahkan kode enkripsi.\n\nKonsep dasar Caesar Cipher sangat sederhana: setiap huruf dalam plaintext (teks asli) diganti dengan huruf lain yang berada pada posisi tetap dalam alfabet. Pergeseran ini disebut 'kunci' atau 'shift'. Misalnya, dengan kunci 3, huruf A akan menjadi D, B menjadi E, C menjadi F, dan seterusnya. Ketika mencapai akhir alfabet, pergeseran akan kembali ke awal (wrapping around).\n\nSecara matematis, Caesar Cipher dapat direpresentasikan sebagai fungsi modular. Jika kita memberikan nilai numerik untuk setiap huruf (A=0, B=1, ..., Z=25), maka enkripsi dapat ditulis sebagai: E(x) = (x + k) mod 26, di mana x adalah posisi huruf asli dan k adalah kunci pergeseran. Fungsi modulo memastikan bahwa hasil selalu berada dalam rentang 0-25.\n\nMeskipun sederhana, Caesar Cipher mengajarkan prinsip penting dalam kriptografi: pemisahan antara algoritma (metode pergeseran) dan kunci (jumlah pergeseran). Algoritma dapat diketahui publik, tetapi keamanan bergantung pada kerahasiaan kunci. Prinsip ini, yang dikenal sebagai Kerckhoffs's Principle, masih menjadi fondasi kriptografi modern.",
                'learning_objectives' => [
                    'Memahami konteks historis penggunaan Caesar Cipher',
                    'Menjelaskan konsep pergeseran (shift) dalam alfabet',
                    'Memahami representasi matematis Caesar Cipher',
                    'Mengenal prinsip Kerckhoffs dalam kriptografi',
                ],
                'key_concepts' => [
                    'Substitusi',
                    'Kunci (Key)',
                    'Pergeseran (Shift)',
                    'Modular Arithmetic',
                    'Kerckhoffs Principle',
                ],
                'position' => 2,
                'tasks' => [
                    [
                        'title' => 'Video: Julius Caesar dan Kriptografi Militer',
                        'description' => 'Pelajari bagaimana Caesar menggunakan cipher untuk strategi militer',
                        'type' => 'video',
                        'minutes' => 18,
                        'sort_order' => 1,
                        'video_url' => 'https://example.com/videos/caesar-military-crypto.mp4',
                    ],
                    [
                        'title' => 'Bacaan: Matematika di Balik Caesar Cipher',
                        'description' => 'Pahami representasi matematis dan fungsi modular dalam Caesar Cipher',
                        'type' => 'read',
                        'minutes' => 25,
                        'sort_order' => 2,
                        'pdf_url' => 'https://example.com/pdfs/matematika-caesar-cipher.pdf',
                    ],
                    [
                        'title' => 'Kuis: Konsep Dasar Caesar Cipher',
                        'description' => 'Evaluasi pemahaman Anda tentang konsep dan sejarah Caesar Cipher',
                        'type' => 'quiz',
                        'minutes' => 12,
                        'sort_order' => 3,
                        'quiz_questions' => [
                            [
                                'question' => 'Berapa nilai pergeseran yang digunakan Julius Caesar dalam cipher-nya?',
                                'options' => [
                                    '1',
                                    '2',
                                    '3',
                                    '5',
                                ],
                                'correct_option' => 2,
                                'explanation' => 'Julius Caesar menggunakan pergeseran 3 posisi dalam alfabet untuk pesan-pesan rahasianya.',
                                'sort_order' => 1,
                            ],
                            [
                                'question' => 'Apa yang dimaksud dengan "kunci" dalam Caesar Cipher?',
                                'options' => [
                                    'Password untuk membuka file',
                                    'Jumlah pergeseran huruf dalam alfabet',
                                    'Nama penerima pesan',
                                    'Tanggal pengiriman pesan',
                                ],
                                'correct_option' => 1,
                                'explanation' => 'Kunci dalam Caesar Cipher adalah jumlah posisi pergeseran yang digunakan untuk mengenkripsi setiap huruf.',
                                'sort_order' => 2,
                            ],
                            [
                                'question' => 'Apa prinsip Kerckhoffs dalam kriptografi?',
                                'options' => [
                                    'Algoritma harus dirahasiakan dari semua orang',
                                    'Keamanan harus bergantung pada kerahasiaan kunci, bukan algoritma',
                                    'Enkripsi harus menggunakan password yang panjang',
                                    'Pesan harus dienkripsi dua kali untuk keamanan maksimal',
                                ],
                                'correct_option' => 1,
                                'explanation' => 'Prinsip Kerckhoffs menyatakan bahwa keamanan sistem kriptografi harus bergantung pada kerahasiaan kunci, bukan pada kerahasiaan algoritma.',
                                'sort_order' => 3,
                            ],
                            [
                                'question' => 'Dalam formula E(x) = (x + k) mod 26, apa fungsi "mod 26"?',
                                'options' => [
                                    'Mengalikan hasil dengan 26',
                                    'Memastikan hasil tetap dalam rentang 0-25',
                                    'Menambahkan 26 ke hasil',
                                    'Membagi hasil dengan 26',
                                ],
                                'correct_option' => 1,
                                'explanation' => 'Operasi modulo 26 memastikan bahwa hasil enkripsi selalu berada dalam rentang 0-25, sesuai dengan jumlah huruf dalam alfabet.',
                                'sort_order' => 4,
                            ],
                        ],
                    ],
                ],
            ],
            // Lesson 3: Cara Kerja Enkripsi Caesar Cipher
            [
                'slug' => 'cara-kerja-enkripsi-caesar-cipher',
                'title' => 'Cara Kerja Enkripsi Caesar Cipher',
                'description' => 'Pelajari langkah demi langkah proses enkripsi menggunakan Caesar Cipher, dari plaintext hingga ciphertext.',
                'content' => "Proses enkripsi Caesar Cipher dimulai dengan plaintext (teks asli) dan kunci pergeseran. Setiap huruf dalam plaintext akan digeser sejumlah posisi sesuai kunci untuk menghasilkan ciphertext (teks terenkripsi). Mari kita lihat contoh konkret dengan kunci pergeseran 3.\n\nMisalkan kita ingin mengenkripsi pesan 'HELLO'. Dengan kunci 3, setiap huruf akan digeser 3 posisi ke depan dalam alfabet: H→K, E→H, L→O, L→O, O→R. Hasilnya adalah 'KHOOR'. Proses ini dilakukan untuk setiap huruf dalam pesan, sementara karakter non-huruf (angka, spasi, tanda baca) biasanya dibiarkan tidak berubah.\n\nUntuk huruf di akhir alfabet, kita menggunakan konsep wrapping. Misalnya, dengan kunci 3, huruf X akan menjadi A (X→Y→Z→A), Y menjadi B, dan Z menjadi C. Ini memastikan bahwa setiap huruf memiliki hasil enkripsi yang valid.\n\nDalam implementasi praktis, kita sering menggunakan tabel substitusi atau formula matematis. Formula E(x) = (x + k) mod 26 sangat efisien untuk komputasi. Di mana x adalah posisi huruf (A=0, B=1, ..., Z=25), k adalah kunci, dan mod 26 memastikan hasil tetap dalam rentang alfabet. Pemahaman yang baik tentang proses enkripsi ini adalah fondasi untuk memahami dekripsi dan analisis keamanan.",
                'learning_objectives' => [
                    'Menjelaskan langkah-langkah enkripsi Caesar Cipher',
                    'Melakukan enkripsi manual dengan berbagai kunci',
                    'Memahami konsep wrapping dalam alfabet',
                    'Mengimplementasikan formula enkripsi matematis',
                ],
                'key_concepts' => [
                    'Plaintext',
                    'Ciphertext',
                    'Enkripsi',
                    'Wrapping',
                    'Tabel Substitusi',
                ],
                'position' => 3,
                'tasks' => [
                    [
                        'title' => 'Video: Demonstrasi Enkripsi Caesar Cipher',
                        'description' => 'Saksikan demonstrasi langkah demi langkah proses enkripsi',
                        'type' => 'video',
                        'minutes' => 20,
                        'sort_order' => 1,
                        'video_url' => 'https://example.com/videos/demo-enkripsi-caesar.mp4',
                    ],
                    [
                        'title' => 'Bacaan: Teknik Enkripsi Manual',
                        'description' => 'Pelajari cara melakukan enkripsi Caesar Cipher secara manual',
                        'type' => 'read',
                        'minutes' => 15,
                        'sort_order' => 2,
                        'pdf_url' => 'https://example.com/pdfs/teknik-enkripsi-manual.pdf',
                    ],
                    [
                        'title' => 'Kuis: Praktik Enkripsi',
                        'description' => 'Uji kemampuan Anda dalam melakukan enkripsi Caesar Cipher',
                        'type' => 'quiz',
                        'minutes' => 15,
                        'sort_order' => 3,
                        'quiz_questions' => [
                            [
                                'question' => 'Jika plaintext adalah "CAT" dan kunci adalah 5, apa ciphertext-nya?',
                                'options' => [
                                    'HFY',
                                    'XVP',
                                    'DBU',
                                    'FDW',
                                ],
                                'correct_option' => 0,
                                'explanation' => 'Dengan kunci 5: C+5=H, A+5=F, T+5=Y. Jadi "CAT" menjadi "HFY".',
                                'sort_order' => 1,
                            ],
                            [
                                'question' => 'Dengan kunci 3, huruf Z akan menjadi huruf apa?',
                                'options' => [
                                    'A',
                                    'B',
                                    'C',
                                    'D',
                                ],
                                'correct_option' => 2,
                                'explanation' => 'Z+3 dengan wrapping: Z→A→B→C. Jadi Z menjadi C.',
                                'sort_order' => 2,
                            ],
                            [
                                'question' => 'Apa yang terjadi pada spasi dan tanda baca dalam enkripsi Caesar Cipher?',
                                'options' => [
                                    'Dihapus dari pesan',
                                    'Dienkripsi seperti huruf',
                                    'Dibiarkan tidak berubah',
                                    'Diganti dengan karakter khusus',
                                ],
                                'correct_option' => 2,
                                'explanation' => 'Dalam implementasi standar, spasi dan tanda baca biasanya dibiarkan tidak berubah, hanya huruf yang dienkripsi.',
                                'sort_order' => 3,
                            ],
                        ],
                    ],
                ],
            ],
            // Lesson 4: Cara Kerja Dekripsi Caesar Cipher
            $this->getLesson4Data(),
            // Lesson 5: Implementasi Caesar Cipher (Praktik)
            $this->getLesson5Data(),
            // Lesson 6: Kelemahan & Serangan Brute Force
            $this->getLesson6Data(),
            // Lesson 7: Variasi & Pengembangan Caesar Cipher
            $this->getLesson7Data(),
        ];
    }

    private function getLesson4Data(): array
    {
        return [
            'slug' => 'cara-kerja-dekripsi-caesar-cipher',
            'title' => 'Cara Kerja Dekripsi Caesar Cipher',
            'description' => 'Memahami proses dekripsi untuk mengubah ciphertext kembali menjadi plaintext menggunakan kunci yang sama.',
            'content' => "Dekripsi adalah kebalikan dari enkripsi. Jika enkripsi menggeser huruf ke depan, dekripsi menggeser huruf ke belakang dengan jumlah yang sama. Dengan kunci yang benar, penerima pesan dapat dengan mudah mengubah ciphertext kembali menjadi plaintext yang dapat dibaca.\n\nMisalkan kita menerima ciphertext 'KHOOR' dan mengetahui kunci adalah 3. Untuk mendekripsi, kita geser setiap huruf 3 posisi ke belakang: K→H, H→E, O→L, O→L, R→O. Hasilnya adalah 'HELLO', pesan asli kita. Proses ini sama pentingnya dengan enkripsi karena tanpa dekripsi yang benar, pesan terenkripsi tidak ada gunanya.\n\nFormula matematis untuk dekripsi adalah D(x) = (x - k) mod 26. Perhatikan bahwa kita mengurangi kunci, bukan menambahkannya. Untuk huruf di awal alfabet, kita menggunakan wrapping ke belakang. Misalnya, dengan kunci 3, huruf C akan menjadi Z (C→B→A→Z), B menjadi Y, dan A menjadi X.\n\nPenting untuk dicatat bahwa dekripsi hanya berhasil jika kita memiliki kunci yang benar. Tanpa kunci, atau dengan kunci yang salah, hasil dekripsi akan menjadi teks yang tidak bermakna. Ini adalah prinsip dasar keamanan dalam kriptografi: hanya pihak yang memiliki kunci yang dapat membaca pesan.",
            'learning_objectives' => [
                'Menjelaskan proses dekripsi Caesar Cipher',
                'Melakukan dekripsi manual dengan kunci yang diketahui',
                'Memahami hubungan antara enkripsi dan dekripsi',
                'Mengimplementasikan formula dekripsi matematis',
            ],
            'key_concepts' => [
                'Dekripsi',
                'Reverse Shift',
                'Kunci Dekripsi',
                'Wrapping Mundur',
            ],
            'position' => 4,
            'tasks' => [
                [
                    'title' => 'Video: Proses Dekripsi Caesar Cipher',
                    'description' => 'Pelajari cara mendekripsi pesan yang telah dienkripsi',
                    'type' => 'video',
                    'minutes' => 18,
                    'sort_order' => 1,
                    'video_url' => 'https://example.com/videos/demo-dekripsi-caesar.mp4',
                ],
                [
                    'title' => 'Kuis: Praktik Dekripsi',
                    'description' => 'Latihan mendekripsi berbagai ciphertext',
                    'type' => 'quiz',
                    'minutes' => 15,
                    'sort_order' => 2,
                    'quiz_questions' => [
                        [
                            'question' => 'Jika ciphertext adalah "KHO" dan kunci adalah 3, apa plaintext-nya?',
                            'options' => [
                                'HEL',
                                'JGN',
                                'NKR',
                                'LIP',
                            ],
                            'correct_option' => 0,
                            'explanation' => 'Dengan kunci 3, geser mundur: K-3=H, H-3=E, O-3=L. Jadi "KHO" menjadi "HEL".',
                            'sort_order' => 1,
                        ],
                        [
                            'question' => 'Apa hubungan antara enkripsi dan dekripsi dalam Caesar Cipher?',
                            'options' => [
                                'Tidak ada hubungan',
                                'Dekripsi adalah kebalikan dari enkripsi',
                                'Dekripsi menggunakan kunci yang berbeda',
                                'Dekripsi lebih kompleks dari enkripsi',
                            ],
                            'correct_option' => 1,
                            'explanation' => 'Dekripsi adalah operasi kebalikan dari enkripsi. Jika enkripsi menggeser ke depan, dekripsi menggeser ke belakang dengan jumlah yang sama.',
                            'sort_order' => 2,
                        ],
                        [
                            'question' => 'Dengan kunci 5, huruf D akan didekripsi menjadi huruf apa?',
                            'options' => [
                                'Y',
                                'Z',
                                'A',
                                'I',
                            ],
                            'correct_option' => 0,
                            'explanation' => 'D-5 dengan wrapping mundur: D→C→B→A→Z→Y. Jadi D menjadi Y.',
                            'sort_order' => 3,
                        ],
                    ],
                ],
            ],
        ];
    }

    private function getLesson5Data(): array
    {
        return [
            'slug' => 'implementasi-caesar-cipher-praktik',
            'title' => 'Implementasi Caesar Cipher (Praktik)',
            'description' => 'Praktik langsung mengimplementasikan Caesar Cipher dalam kode program dan memahami berbagai kasus penggunaan.',
            'content' => "Setelah memahami teori, saatnya mengimplementasikan Caesar Cipher dalam kode program. Implementasi yang baik harus menangani berbagai kasus: huruf besar dan kecil, karakter non-alfabet, dan validasi input. Kita akan melihat implementasi dalam pseudocode yang dapat diterjemahkan ke berbagai bahasa pemrograman.\n\nFungsi enkripsi dasar menerima plaintext dan kunci sebagai input, lalu mengembalikan ciphertext. Untuk setiap karakter dalam plaintext, kita periksa apakah itu huruf. Jika ya, kita tentukan apakah huruf besar atau kecil, lalu terapkan formula (char + key) mod 26. Jika bukan huruf, kita biarkan tidak berubah. Ini memastikan bahwa spasi, angka, dan tanda baca tetap pada posisinya.\n\nImplementasi yang robust juga harus menangani edge cases: kunci negatif (yang sebenarnya adalah dekripsi), kunci lebih besar dari 26 (gunakan key mod 26), dan string kosong. Validasi input sangat penting untuk mencegah error runtime dan memastikan hasil yang konsisten.\n\nDalam praktik, kita juga perlu mempertimbangkan efisiensi. Untuk teks panjang, implementasi yang optimal menggunakan lookup table atau operasi bitwise dapat meningkatkan performa. Namun, untuk Caesar Cipher yang sederhana, readability code lebih penting daripada optimasi prematur.",
            'learning_objectives' => [
                'Mengimplementasikan fungsi enkripsi dan dekripsi',
                'Menangani berbagai kasus input (huruf besar/kecil, non-alfabet)',
                'Memvalidasi input dan menangani edge cases',
                'Menulis kode yang clean dan maintainable',
            ],
            'key_concepts' => [
                'Implementasi Algoritma',
                'Input Validation',
                'Edge Cases',
                'Code Readability',
            ],
            'position' => 5,
            'tasks' => [
                [
                    'title' => 'Video: Coding Caesar Cipher',
                    'description' => 'Tutorial implementasi Caesar Cipher dalam kode',
                    'type' => 'video',
                    'minutes' => 25,
                    'sort_order' => 1,
                    'video_url' => 'https://example.com/videos/coding-caesar-cipher.mp4',
                ],
                [
                    'title' => 'Bacaan: Best Practices Implementasi',
                    'description' => 'Pelajari best practices dalam mengimplementasikan algoritma kriptografi',
                    'type' => 'read',
                    'minutes' => 20,
                    'sort_order' => 2,
                    'pdf_url' => 'https://example.com/pdfs/best-practices-implementasi.pdf',
                ],
                [
                    'title' => 'Kuis: Pemahaman Implementasi',
                    'description' => 'Uji pemahaman Anda tentang implementasi Caesar Cipher',
                    'type' => 'quiz',
                    'minutes' => 12,
                    'sort_order' => 3,
                    'quiz_questions' => [
                        [
                            'question' => 'Apa yang harus dilakukan dengan karakter non-alfabet dalam implementasi?',
                            'options' => [
                                'Dihapus dari output',
                                'Dienkripsi dengan metode berbeda',
                                'Dibiarkan tidak berubah',
                                'Diganti dengan spasi',
                            ],
                            'correct_option' => 2,
                            'explanation' => 'Karakter non-alfabet (spasi, angka, tanda baca) biasanya dibiarkan tidak berubah dalam implementasi standar Caesar Cipher.',
                            'sort_order' => 1,
                        ],
                        [
                            'question' => 'Bagaimana menangani kunci yang lebih besar dari 26?',
                            'options' => [
                                'Tolak input dan tampilkan error',
                                'Gunakan key mod 26',
                                'Gunakan key sebagaimana adanya',
                                'Set key menjadi 26',
                            ],
                            'correct_option' => 1,
                            'explanation' => 'Kunci lebih besar dari 26 dapat dinormalisasi dengan operasi modulo: key mod 26, karena pergeseran 26 sama dengan pergeseran 0.',
                            'sort_order' => 2,
                        ],
                        [
                            'question' => 'Mengapa validasi input penting dalam implementasi kriptografi?',
                            'options' => [
                                'Untuk memperlambat eksekusi program',
                                'Untuk mencegah error dan memastikan hasil konsisten',
                                'Untuk membuat kode lebih panjang',
                                'Tidak penting, bisa diabaikan',
                            ],
                            'correct_option' => 1,
                            'explanation' => 'Validasi input sangat penting untuk mencegah error runtime, menangani edge cases, dan memastikan hasil yang konsisten dan dapat diprediksi.',
                            'sort_order' => 3,
                        ],
                    ],
                ],
            ],
        ];
    }

    private function getLesson6Data(): array
    {
        return [
            'slug' => 'kelemahan-serangan-brute-force',
            'title' => 'Kelemahan & Serangan Brute Force',
            'description' => 'Menganalisis kelemahan keamanan Caesar Cipher dan memahami bagaimana serangan brute force dapat memecahkan enkripsi ini.',
            'content' => "Meskipun Caesar Cipher memiliki nilai historis yang tinggi, ia memiliki kelemahan keamanan yang serius. Kelemahan utama adalah keyspace yang sangat kecil: hanya ada 25 kunci yang mungkin (pergeseran 0 tidak mengubah teks, jadi tidak dihitung). Ini berarti seorang penyerang dapat dengan mudah mencoba semua kemungkinan kunci dalam waktu singkat.\n\nSerangan brute force terhadap Caesar Cipher sangat sederhana. Penyerang hanya perlu mencoba mendekripsi ciphertext dengan setiap kunci dari 1 hingga 25, lalu memeriksa hasil mana yang menghasilkan teks yang bermakna. Dengan komputer modern, ini dapat dilakukan dalam hitungan milidetik. Bahkan secara manual, seorang manusia dapat mencoba semua 25 kemungkinan dalam beberapa menit.\n\nSelain brute force, Caesar Cipher juga rentan terhadap frequency analysis. Dalam bahasa alami, beberapa huruf muncul lebih sering daripada yang lain. Misalnya, dalam bahasa Indonesia, huruf 'A' dan 'E' sangat umum. Dengan menganalisis frekuensi huruf dalam ciphertext, seorang kriptanalis dapat menebak kunci dengan akurat tanpa perlu mencoba semua kemungkinan.\n\nKelemahan-kelemahan ini mengajarkan pelajaran penting: keamanan melalui obscurity tidak cukup. Sistem kriptografi yang baik harus tetap aman bahkan jika penyerang mengetahui algoritma yang digunakan. Ini adalah salah satu alasan mengapa algoritma enkripsi modern menggunakan keyspace yang sangat besar (misalnya, 2^256 kemungkinan kunci) dan teknik yang lebih kompleks.",
            'learning_objectives' => [
                'Mengidentifikasi kelemahan keamanan Caesar Cipher',
                'Memahami konsep dan implementasi brute force attack',
                'Mengenal frequency analysis sebagai metode kriptanalisis',
                'Memahami pentingnya keyspace yang besar dalam kriptografi',
            ],
            'key_concepts' => [
                'Keyspace',
                'Brute Force Attack',
                'Frequency Analysis',
                'Kriptanalisis',
                'Security Through Obscurity',
            ],
            'position' => 6,
            'tasks' => [
                [
                    'title' => 'Video: Memecahkan Caesar Cipher',
                    'description' => 'Demonstrasi berbagai metode untuk memecahkan Caesar Cipher',
                    'type' => 'video',
                    'minutes' => 22,
                    'sort_order' => 1,
                    'video_url' => 'https://example.com/videos/breaking-caesar-cipher.mp4',
                ],
                [
                    'title' => 'Bacaan: Frequency Analysis dalam Kriptanalisis',
                    'description' => 'Pelajari teknik frequency analysis untuk memecahkan cipher substitusi',
                    'type' => 'read',
                    'minutes' => 18,
                    'sort_order' => 2,
                    'pdf_url' => 'https://example.com/pdfs/frequency-analysis.pdf',
                ],
                [
                    'title' => 'Kuis: Keamanan Caesar Cipher',
                    'description' => 'Evaluasi pemahaman Anda tentang kelemahan Caesar Cipher',
                    'type' => 'quiz',
                    'minutes' => 15,
                    'sort_order' => 3,
                    'quiz_questions' => [
                        [
                            'question' => 'Berapa jumlah kunci yang mungkin dalam Caesar Cipher?',
                            'options' => [
                                '26',
                                '25',
                                '52',
                                'Tidak terbatas',
                            ],
                            'correct_option' => 1,
                            'explanation' => 'Ada 25 kunci yang mungkin (1-25). Kunci 0 tidak dihitung karena tidak mengubah teks, dan kunci 26 sama dengan kunci 0.',
                            'sort_order' => 1,
                        ],
                        [
                            'question' => 'Apa itu brute force attack?',
                            'options' => [
                                'Serangan fisik terhadap server',
                                'Mencoba semua kemungkinan kunci secara sistematis',
                                'Menggunakan virus untuk mencuri data',
                                'Menebak password secara acak',
                            ],
                            'correct_option' => 1,
                            'explanation' => 'Brute force attack adalah metode memecahkan enkripsi dengan mencoba semua kemungkinan kunci secara sistematis hingga menemukan yang benar.',
                            'sort_order' => 2,
                        ],
                        [
                            'question' => 'Apa kelemahan utama Caesar Cipher?',
                            'options' => [
                                'Terlalu lambat untuk diimplementasikan',
                                'Keyspace yang sangat kecil',
                                'Membutuhkan komputer yang powerful',
                                'Tidak bisa mengenkripsi angka',
                            ],
                            'correct_option' => 1,
                            'explanation' => 'Kelemahan utama Caesar Cipher adalah keyspace yang sangat kecil (hanya 25 kemungkinan), membuatnya sangat rentan terhadap brute force attack.',
                            'sort_order' => 3,
                        ],
                        [
                            'question' => 'Apa itu frequency analysis?',
                            'options' => [
                                'Menganalisis kecepatan enkripsi',
                                'Menganalisis frekuensi kemunculan huruf untuk memecahkan cipher',
                                'Menganalisis frekuensi penggunaan password',
                                'Menganalisis bandwidth jaringan',
                            ],
                            'correct_option' => 1,
                            'explanation' => 'Frequency analysis adalah teknik kriptanalisis yang menganalisis frekuensi kemunculan huruf dalam ciphertext untuk menebak kunci enkripsi.',
                            'sort_order' => 4,
                        ],
                    ],
                ],
            ],
        ];
    }

    private function getLesson7Data(): array
    {
        return [
            'slug' => 'variasi-pengembangan-caesar-cipher',
            'title' => 'Variasi & Pengembangan Caesar Cipher',
            'description' => 'Menjelajahi variasi dan pengembangan dari Caesar Cipher, termasuk ROT13, Vigenère Cipher, dan aplikasi modern.',
            'content' => "Caesar Cipher telah menginspirasi banyak variasi dan pengembangan yang lebih kompleks. Salah satu variasi paling terkenal adalah ROT13, yang menggunakan pergeseran tetap 13. ROT13 memiliki properti unik: enkripsi dan dekripsi menggunakan operasi yang sama, karena 13 adalah setengah dari 26. Ini membuatnya populer untuk menyembunyikan spoiler atau jawaban teka-teki di internet.\n\nVigenère Cipher adalah pengembangan signifikan dari Caesar Cipher. Alih-alih menggunakan satu kunci pergeseran untuk seluruh pesan, Vigenère menggunakan kata kunci yang berulang. Setiap huruf dalam kata kunci menentukan pergeseran untuk huruf yang sesuai dalam plaintext. Ini membuat frequency analysis jauh lebih sulit, meskipun Vigenère Cipher akhirnya juga dapat dipecahkan dengan teknik kriptanalisis yang lebih canggih.\n\nDalam konteks modern, Caesar Cipher tidak lagi digunakan untuk keamanan serius, tetapi konsep dasarnya masih relevan. Prinsip substitusi digunakan dalam S-boxes pada algoritma enkripsi modern seperti AES. Caesar Cipher juga sering digunakan dalam pendidikan untuk mengajarkan konsep dasar kriptografi, dan dalam CTF (Capture The Flag) competitions sebagai tantangan pemula.\n\nPengembangan lain termasuk Affine Cipher (yang menambahkan operasi perkalian), Atbash Cipher (yang membalik alfabet), dan berbagai polyalphabetic ciphers. Mempelajari variasi-variasi ini membantu kita memahami evolusi kriptografi dari metode sederhana hingga algoritma kompleks yang kita gunakan hari ini.",
            'learning_objectives' => [
                'Mengenal variasi Caesar Cipher seperti ROT13',
                'Memahami Vigenère Cipher sebagai pengembangan Caesar Cipher',
                'Menjelaskan relevansi Caesar Cipher dalam kriptografi modern',
                'Mengidentifikasi aplikasi praktis dan edukatif Caesar Cipher',
            ],
            'key_concepts' => [
                'ROT13',
                'Vigenère Cipher',
                'Polyalphabetic Cipher',
                'Affine Cipher',
                'Aplikasi Modern',
            ],
            'position' => 7,
            'tasks' => [
                [
                    'title' => 'Video: Evolusi dari Caesar ke Vigenère',
                    'description' => 'Pelajari bagaimana Caesar Cipher berkembang menjadi cipher yang lebih kompleks',
                    'type' => 'video',
                    'minutes' => 20,
                    'sort_order' => 1,
                    'video_url' => 'https://example.com/videos/caesar-to-vigenere.mp4',
                ],
                [
                    'title' => 'Bacaan: ROT13 dan Aplikasinya',
                    'description' => 'Memahami ROT13 dan penggunaannya di internet',
                    'type' => 'read',
                    'minutes' => 15,
                    'sort_order' => 2,
                    'pdf_url' => 'https://example.com/pdfs/rot13-applications.pdf',
                ],
                [
                    'title' => 'Kuis: Variasi Caesar Cipher',
                    'description' => 'Uji pengetahuan Anda tentang berbagai variasi Caesar Cipher',
                    'type' => 'quiz',
                    'minutes' => 12,
                    'sort_order' => 3,
                    'quiz_questions' => [
                        [
                            'question' => 'Apa keunikan ROT13 dibandingkan Caesar Cipher biasa?',
                            'options' => [
                                'Lebih aman dari brute force',
                                'Enkripsi dan dekripsi menggunakan operasi yang sama',
                                'Menggunakan dua kunci berbeda',
                                'Hanya bisa mengenkripsi huruf vokal',
                            ],
                            'correct_option' => 1,
                            'explanation' => 'ROT13 menggunakan pergeseran 13, yang adalah setengah dari 26. Ini berarti enkripsi dan dekripsi menggunakan operasi yang sama: ROT13(ROT13(x)) = x.',
                            'sort_order' => 1,
                        ],
                        [
                            'question' => 'Apa perbedaan utama Vigenère Cipher dengan Caesar Cipher?',
                            'options' => [
                                'Vigenère menggunakan kata kunci yang berulang',
                                'Vigenère hanya untuk huruf kapital',
                                'Vigenère tidak bisa didekripsi',
                                'Vigenère menggunakan angka sebagai kunci',
                            ],
                            'correct_option' => 0,
                            'explanation' => 'Vigenère Cipher menggunakan kata kunci yang berulang, di mana setiap huruf kata kunci menentukan pergeseran untuk huruf yang sesuai dalam plaintext.',
                            'sort_order' => 2,
                        ],
                        [
                            'question' => 'Mengapa Caesar Cipher masih diajarkan meskipun tidak aman?',
                            'options' => [
                                'Karena masih digunakan oleh militer',
                                'Untuk mengajarkan konsep dasar kriptografi',
                                'Karena tidak ada alternatif yang lebih baik',
                                'Karena sangat aman untuk data sensitif',
                            ],
                            'correct_option' => 1,
                            'explanation' => 'Caesar Cipher masih diajarkan karena sangat baik untuk mengajarkan konsep dasar kriptografi seperti enkripsi, dekripsi, kunci, dan kriptanalisis dengan cara yang mudah dipahami.',
                            'sort_order' => 3,
                        ],
                        [
                            'question' => 'Di mana konsep Caesar Cipher masih relevan dalam kriptografi modern?',
                            'options' => [
                                'Dalam enkripsi email',
                                'Dalam prinsip substitusi pada S-boxes algoritma modern',
                                'Dalam password hashing',
                                'Dalam digital signatures',
                            ],
                            'correct_option' => 1,
                            'explanation' => 'Prinsip substitusi dari Caesar Cipher masih digunakan dalam S-boxes (Substitution boxes) pada algoritma enkripsi modern seperti AES, meskipun dengan kompleksitas yang jauh lebih tinggi.',
                            'sort_order' => 4,
                        ],
                    ],
                ],
            ],
        ];
    }

    private function createAssessment(Course $course): void
    {
        $assessment = Assessment::create([
            'course_id' => $course->id,
            'title' => 'Ujian Akhir: Algoritma Caesar Cipher',
            'slug' => 'ujian-akhir-caesar-cipher',
            'bloom_level' => 'C3',
            'grading_type' => 'mixed',
            'passing_score' => 70,
            'max_attempts' => 3,
            'time_limit_minutes' => 90,
            'is_published' => true,
        ]);

        // MCQ Questions (5 questions, 10 points each)
        $mcqQuestions = [
            [
                'question' => 'Dalam konteks Caesar Cipher, apa yang dimaksud dengan "keyspace"?',
                'options' => json_encode([
                    ['label' => 'A', 'value' => 'Ruang penyimpanan untuk menyimpan kunci enkripsi'],
                    ['label' => 'B', 'value' => 'Jumlah total kemungkinan kunci yang dapat digunakan'],
                    ['label' => 'C', 'value' => 'Ukuran memori yang dibutuhkan untuk enkripsi'],
                    ['label' => 'D', 'value' => 'Jarak antara huruf dalam alfabet'],
                ]),
                'correct_answer' => 'Jumlah total kemungkinan kunci yang dapat digunakan',
                'bloom_level' => 'C1',
                'points' => 10,
            ],
            [
                'question' => 'Mengapa Caesar Cipher dianggap tidak aman untuk penggunaan modern?',
                'options' => json_encode([
                    ['label' => 'A', 'value' => 'Karena terlalu lambat untuk diimplementasikan'],
                    ['label' => 'B', 'value' => 'Karena keyspace yang sangat kecil dan rentan terhadap brute force'],
                    ['label' => 'C', 'value' => 'Karena membutuhkan komputer yang sangat powerful'],
                    ['label' => 'D', 'value' => 'Karena tidak bisa mengenkripsi huruf kapital'],
                ]),
                'correct_answer' => 'Karena keyspace yang sangat kecil dan rentan terhadap brute force',
                'bloom_level' => 'C2',
                'points' => 10,
            ],
            [
                'question' => 'Jika plaintext "CRYPTO" dienkripsi dengan kunci 7, apa ciphertext yang dihasilkan?',
                'options' => json_encode([
                    ['label' => 'A', 'value' => 'JYFWAV'],
                    ['label' => 'B', 'value' => 'HWDKSV'],
                    ['label' => 'C', 'value' => 'JYFWAV'],
                    ['label' => 'D', 'value' => 'KZGQBW'],
                ]),
                'correct_answer' => 'JYFWAV',
                'bloom_level' => 'C2',
                'points' => 10,
            ],
            [
                'question' => 'Apa perbedaan fundamental antara Caesar Cipher dan Vigenère Cipher?',
                'options' => json_encode([
                    ['label' => 'A', 'value' => 'Caesar menggunakan satu kunci tetap, Vigenère menggunakan kata kunci yang berulang'],
                    ['label' => 'B', 'value' => 'Caesar untuk huruf, Vigenère untuk angka'],
                    ['label' => 'C', 'value' => 'Caesar lebih aman dari Vigenère'],
                    ['label' => 'D', 'value' => 'Tidak ada perbedaan, keduanya sama'],
                ]),
                'correct_answer' => 'Caesar menggunakan satu kunci tetap, Vigenère menggunakan kata kunci yang berulang',
                'bloom_level' => 'C2',
                'points' => 10,
            ],
            [
                'question' => 'Dalam formula enkripsi E(x) = (x + k) mod 26, apa fungsi dari operasi "mod 26"?',
                'options' => json_encode([
                    ['label' => 'A', 'value' => 'Mengalikan hasil dengan 26'],
                    ['label' => 'B', 'value' => 'Memastikan hasil tetap dalam rentang 0-25 (wrapping)'],
                    ['label' => 'C', 'value' => 'Menambahkan 26 ke setiap hasil'],
                    ['label' => 'D', 'value' => 'Membagi hasil dengan 26 dan membuang sisanya'],
                ]),
                'correct_answer' => 'Memastikan hasil tetap dalam rentang 0-25 (wrapping)',
                'bloom_level' => 'C1',
                'points' => 10,
            ],
        ];

        foreach ($mcqQuestions as $index => $mcq) {
            AssessmentQuestion::create([
                'assessment_id' => $assessment->id,
                'question_type' => 'mcq',
                'question_text' => $mcq['question'],
                'options' => $mcq['options'],
                'correct_answer' => $mcq['correct_answer'],
                'bloom_level' => $mcq['bloom_level'],
                'grading_type' => 'auto',
                'points' => $mcq['points'],
                'sort_order' => $index + 1,
            ]);
        }

        // Essay Questions (2 questions, 15 points each)
        $essayQuestions = [
            [
                'question' => 'Jelaskan secara detail bagaimana frequency analysis dapat digunakan untuk memecahkan Caesar Cipher. Berikan contoh konkret dengan menganalisis frekuensi huruf dalam bahasa Indonesia atau Inggris.',
                'min_words' => 100,
                'bloom_level' => 'C4',
                'points' => 15,
            ],
            [
                'question' => 'Bandingkan dan kontraskan Caesar Cipher dengan algoritma enkripsi modern seperti AES. Diskusikan perbedaan dalam hal keyspace, kompleksitas algoritma, dan tingkat keamanan. Mengapa Caesar Cipher masih relevan untuk dipelajari meskipun tidak aman?',
                'min_words' => 100,
                'bloom_level' => 'C4',
                'points' => 15,
            ],
        ];

        foreach ($essayQuestions as $index => $essay) {
            AssessmentQuestion::create([
                'assessment_id' => $assessment->id,
                'question_type' => 'essay',
                'question_text' => $essay['question'],
                'min_words' => $essay['min_words'],
                'bloom_level' => $essay['bloom_level'],
                'grading_type' => 'manual',
                'points' => $essay['points'],
                'sort_order' => count($mcqQuestions) + $index + 1,
            ]);
        }

        // Case Study Question (1 question, 20 points)
        AssessmentQuestion::create([
            'assessment_id' => $assessment->id,
            'question_type' => 'case_study',
            'question_text' => 'Anda adalah seorang kriptanalis yang mengintersep pesan terenkripsi berikut: "WKLV LV D VHFUHW PHVVDJH". Anda menduga pesan ini dienkripsi menggunakan Caesar Cipher. Lakukan analisis lengkap untuk memecahkan enkripsi ini: (1) Identifikasi metode yang akan Anda gunakan, (2) Tunjukkan proses pemecahan langkah demi langkah, (3) Tentukan kunci yang digunakan, (4) Dekripsi pesan untuk mendapatkan plaintext, (5) Jelaskan bagaimana Anda memvalidasi bahwa hasil dekripsi Anda benar.',
            'rubric' => json_encode([
                'criteria' => [
                    [
                        'name' => 'Identifikasi Metode',
                        'description' => 'Kemampuan mengidentifikasi metode pemecahan yang tepat (brute force atau frequency analysis)',
                        'max_points' => 4,
                        'levels' => [
                            ['score' => 4, 'description' => 'Mengidentifikasi metode dengan jelas dan menjelaskan alasannya'],
                            ['score' => 2, 'description' => 'Mengidentifikasi metode tetapi penjelasan kurang lengkap'],
                            ['score' => 0, 'description' => 'Tidak mengidentifikasi metode atau salah'],
                        ],
                    ],
                    [
                        'name' => 'Proses Pemecahan',
                        'description' => 'Menunjukkan langkah-langkah pemecahan secara sistematis',
                        'max_points' => 6,
                        'levels' => [
                            ['score' => 6, 'description' => 'Proses lengkap, sistematis, dan mudah diikuti'],
                            ['score' => 4, 'description' => 'Proses cukup lengkap tetapi ada langkah yang terlewat'],
                            ['score' => 2, 'description' => 'Proses tidak sistematis atau banyak langkah yang hilang'],
                            ['score' => 0, 'description' => 'Tidak menunjukkan proses pemecahan'],
                        ],
                    ],
                    [
                        'name' => 'Identifikasi Kunci',
                        'description' => 'Menentukan kunci yang benar',
                        'max_points' => 4,
                        'levels' => [
                            ['score' => 4, 'description' => 'Kunci benar (3) dengan penjelasan'],
                            ['score' => 2, 'description' => 'Kunci benar tetapi tanpa penjelasan'],
                            ['score' => 0, 'description' => 'Kunci salah'],
                        ],
                    ],
                    [
                        'name' => 'Dekripsi Plaintext',
                        'description' => 'Mendekripsi pesan dengan benar',
                        'max_points' => 4,
                        'levels' => [
                            ['score' => 4, 'description' => 'Plaintext benar: "THIS IS A SECRET MESSAGE"'],
                            ['score' => 0, 'description' => 'Plaintext salah'],
                        ],
                    ],
                    [
                        'name' => 'Validasi Hasil',
                        'description' => 'Menjelaskan cara memvalidasi hasil dekripsi',
                        'max_points' => 2,
                        'levels' => [
                            ['score' => 2, 'description' => 'Menjelaskan validasi dengan baik (misalnya: hasil bermakna, grammar benar)'],
                            ['score' => 1, 'description' => 'Menyebutkan validasi tetapi tidak menjelaskan'],
                            ['score' => 0, 'description' => 'Tidak menyebutkan validasi'],
                        ],
                    ],
                ],
            ]),
            'bloom_level' => 'C5',
            'grading_type' => 'manual',
            'points' => 20,
            'sort_order' => count($mcqQuestions) + count($essayQuestions) + 1,
        ]);

        // Computation Questions (2 questions, 10 points each)
        $computationQuestions = [
            [
                'question' => 'Hitung hasil enkripsi dari plaintext "ALGORITHM" menggunakan Caesar Cipher dengan kunci 13 (ROT13). Tunjukkan perhitungan untuk setiap huruf. Format jawaban: HURUFHASIL (contoh: NYTBEVGUZ)',
                'correct_answer' => 'NYTBEVGUZ',
                'bloom_level' => 'C3',
                'points' => 10,
            ],
            [
                'question' => 'Diberikan ciphertext "FDHVDU" yang dienkripsi dengan Caesar Cipher. Setelah melakukan brute force, ditemukan bahwa kunci yang digunakan adalah 3. Hitung plaintext aslinya. Format jawaban: PLAINTEXT (huruf kapital semua)',
                'correct_answer' => 'CAESAR',
                'bloom_level' => 'C3',
                'points' => 10,
            ],
        ];

        foreach ($computationQuestions as $index => $computation) {
            AssessmentQuestion::create([
                'assessment_id' => $assessment->id,
                'question_type' => 'computation',
                'question_text' => $computation['question'],
                'correct_answer' => $computation['correct_answer'],
                'bloom_level' => $computation['bloom_level'],
                'grading_type' => 'auto',
                'points' => $computation['points'],
                'sort_order' => count($mcqQuestions) + count($essayQuestions) + 1 + $index + 1,
            ]);
        }
    }
}
