<?php

namespace Database\Seeders;

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\Course;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BloomAssessmentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            $course = Course::where('slug', 'algoritma-caesar-cipher')->first();

            if (! $course) {
                $this->command->error('Course "algoritma-caesar-cipher" not found. Please run CaesarCipherCourseSeeder first.');

                return;
            }

            // Create assessments for each Bloom level
            $this->createC1Assessment($course);
            $this->createC2Assessment($course);
            $this->createC3Assessment($course);
            $this->createC4Assessment($course);
            $this->createC5Assessment($course);
            $this->createC6Assessment($course);

            $this->command->info('✓ Created 6 Bloom assessments (C1-C6) for Caesar Cipher course');
        });
    }

    /**
     * C1 - Remember: Recall facts and basic concepts
     */
    private function createC1Assessment(Course $course): void
    {
        $assessment = Assessment::create([
            'course_id' => $course->id,
            'title' => 'C1 - Mengingat: Konsep Dasar Caesar Cipher',
            'slug' => 'c1-mengingat-caesar-cipher',
            'description' => 'Uji kemampuan Anda dalam mengingat fakta dan konsep dasar tentang Caesar Cipher.',
            'bloom_level' => 'C1',
            'grading_type' => 'auto',
            'passing_score' => 70,
            'max_attempts' => 3,
            'time_limit_minutes' => 20,
            'is_published' => true,
            'sort_order' => 1,
        ]);

        $questions = [
            [
                'question' => 'Siapa yang pertama kali menggunakan Caesar Cipher dalam sejarah?',
                'type' => 'mcq',
                'options' => ['Julius Caesar', 'Augustus Caesar', 'Napoleon Bonaparte', 'Alexander the Great'],
                'correct_answer' => 'Julius Caesar',
                'points' => 10,
            ],
            [
                'question' => 'Apa definisi dari Caesar Cipher?',
                'type' => 'mcq',
                'options' => [
                    'Teknik enkripsi substitusi dengan menggeser huruf sejumlah posisi tetap',
                    'Teknik enkripsi dengan menukar posisi huruf secara acak',
                    'Teknik enkripsi dengan menggunakan kunci publik dan privat',
                    'Teknik enkripsi dengan mengubah huruf menjadi angka',
                ],
                'correct_answer' => 'Teknik enkripsi substitusi dengan menggeser huruf sejumlah posisi tetap',
                'points' => 10,
            ],
            [
                'question' => 'Berapa jumlah kemungkinan kunci dalam Caesar Cipher untuk alfabet Latin (26 huruf)?',
                'type' => 'mcq',
                'options' => ['25', '26', '52', '100'],
                'correct_answer' => '25',
                'points' => 10,
            ],
            [
                'question' => 'Apa nama lain dari Caesar Cipher?',
                'type' => 'mcq',
                'options' => ['Shift Cipher', 'Block Cipher', 'Stream Cipher', 'Public Key Cipher'],
                'correct_answer' => 'Shift Cipher',
                'points' => 10,
            ],
            [
                'question' => 'Dalam Caesar Cipher, apa yang dimaksud dengan "kunci"?',
                'type' => 'mcq',
                'options' => [
                    'Jumlah posisi pergeseran huruf',
                    'Password untuk membuka file',
                    'Algoritma enkripsi yang digunakan',
                    'Panjang pesan yang dienkripsi',
                ],
                'correct_answer' => 'Jumlah posisi pergeseran huruf',
                'points' => 10,
            ],
            [
                'question' => 'Sebutkan tiga komponen utama dalam sistem kriptografi Caesar Cipher.',
                'type' => 'essay',
                'points' => 15,
                'rubric' => 'Jawaban harus menyebutkan: 1) Plaintext (teks asli), 2) Kunci/Key (jumlah pergeseran), 3) Ciphertext (teks terenkripsi). Nilai penuh jika menyebutkan ketiga komponen dengan benar.',
            ],
            [
                'question' => 'Apa perbedaan antara enkripsi dan dekripsi dalam konteks Caesar Cipher?',
                'type' => 'essay',
                'points' => 15,
                'rubric' => 'Jawaban harus menjelaskan: Enkripsi adalah proses mengubah plaintext menjadi ciphertext dengan menggeser huruf ke depan, sedangkan dekripsi adalah proses sebaliknya (menggeser ke belakang) untuk mengembalikan ciphertext menjadi plaintext. Nilai penuh jika menjelaskan kedua proses dengan jelas.',
            ],
            [
                'question' => 'Jika kunci Caesar Cipher adalah 3, huruf A akan menjadi huruf apa setelah dienkripsi?',
                'type' => 'computation',
                'correct_answer' => 'D',
                'points' => 10,
                'rubric' => 'Jawaban yang benar adalah D. A (posisi 0) + 3 = D (posisi 3).',
            ],
            [
                'question' => 'Berapa kunci yang digunakan jika huruf Z dienkripsi menjadi huruf C?',
                'type' => 'computation',
                'correct_answer' => '3',
                'points' => 10,
                'rubric' => 'Jawaban yang benar adalah 3. Z (posisi 25) + 3 = C (posisi 2, dengan wrapping).',
            ],
        ];

        foreach ($questions as $index => $q) {
            AssessmentQuestion::create([
                'assessment_id' => $assessment->id,
                'question_text' => $q['question'],
                'question_type' => $q['type'],
                'options' => isset($q['options']) ? $q['options'] : null,
                'correct_answer' => $q['correct_answer'] ?? null,
                'points' => $q['points'],
                'bloom_level' => 'C1',
                'grading_type' => in_array($q['type'], ['mcq', 'true_false', 'computation']) ? 'auto' : 'manual',
                'rubric' => $q['rubric'] ?? null,
                'sort_order' => $index + 1,
            ]);
        }
    }

    /**
     * C2 - Understand: Explain ideas or concepts
     */
    private function createC2Assessment(Course $course): void
    {
        $assessment = Assessment::create([
            'course_id' => $course->id,
            'title' => 'C2 - Memahami: Konsep Caesar Cipher',
            'slug' => 'c2-memahami-caesar-cipher',
            'description' => 'Uji pemahaman Anda tentang cara kerja dan konsep di balik Caesar Cipher.',
            'bloom_level' => 'C2',
            'grading_type' => 'mixed',
            'passing_score' => 70,
            'max_attempts' => 3,
            'time_limit_minutes' => 30,
            'is_published' => true,
            'sort_order' => 2,
        ]);

        $questions = [
            [
                'question' => 'Mengapa Caesar Cipher termasuk dalam kategori "substitution cipher"?',
                'type' => 'mcq',
                'options' => [
                    'Karena setiap huruf diganti dengan huruf lain berdasarkan aturan pergeseran',
                    'Karena huruf-huruf ditukar posisinya secara acak',
                    'Karena menggunakan dua kunci berbeda',
                    'Karena mengubah huruf menjadi simbol',
                ],
                'correct_answer' => 'Karena setiap huruf diganti dengan huruf lain berdasarkan aturan pergeseran',
                'points' => 10,
            ],
            [
                'question' => 'Apa yang terjadi jika kunci Caesar Cipher adalah 0?',
                'type' => 'mcq',
                'options' => [
                    'Plaintext dan ciphertext akan sama',
                    'Enkripsi akan gagal',
                    'Semua huruf menjadi A',
                    'Pesan tidak bisa didekripsi',
                ],
                'correct_answer' => 'Plaintext dan ciphertext akan sama',
                'points' => 10,
            ],
            [
                'question' => 'Mengapa Caesar Cipher menggunakan operasi modulo 26?',
                'type' => 'mcq',
                'options' => [
                    'Untuk membuat huruf kembali ke awal alfabet setelah Z',
                    'Untuk membuat enkripsi lebih aman',
                    'Untuk mempercepat proses enkripsi',
                    'Untuk mengacak urutan huruf',
                ],
                'correct_answer' => 'Untuk membuat huruf kembali ke awal alfabet setelah Z',
                'points' => 10,
            ],
            [
                'question' => 'Jelaskan mengapa Caesar Cipher dianggap sebagai algoritma kriptografi yang lemah di era modern.',
                'type' => 'essay',
                'points' => 20,
                'rubric' => 'Jawaban harus menjelaskan: 1) Hanya ada 25 kemungkinan kunci (mudah di-brute force), 2) Rentan terhadap frequency analysis, 3) Tidak aman untuk data sensitif modern. Nilai penuh jika menjelaskan minimal 2 kelemahan dengan detail.',
            ],
            [
                'question' => 'Bagaimana cara kerja dekripsi Caesar Cipher berbeda dari enkripsi? Jelaskan dengan contoh.',
                'type' => 'essay',
                'points' => 20,
                'rubric' => 'Jawaban harus menjelaskan: Dekripsi menggeser huruf ke arah berlawanan (mundur) atau menggunakan kunci negatif. Contoh: jika enkripsi dengan kunci +3, dekripsi dengan kunci -3 atau +23. Nilai penuh jika ada penjelasan dan contoh yang benar.',
            ],
            [
                'question' => 'Jika plaintext "HELLO" dienkripsi dengan kunci 5, apa ciphertext yang dihasilkan?',
                'type' => 'computation',
                'correct_answer' => 'MJQQT',
                'points' => 15,
                'rubric' => 'Jawaban yang benar adalah MJQQT. H→M, E→J, L→Q, L→Q, O→T (setiap huruf digeser 5 posisi).',
            ],
            [
                'question' => 'Jika ciphertext "FDHVDU" didekripsi dengan kunci 3, apa plaintext aslinya?',
                'type' => 'computation',
                'correct_answer' => 'CAESAR',
                'points' => 15,
                'rubric' => 'Jawaban yang benar adalah CAESAR. F→C, D→A, H→E, V→S, D→A, U→R (setiap huruf digeser mundur 3 posisi).',
            ],
        ];

        foreach ($questions as $index => $q) {
            AssessmentQuestion::create([
                'assessment_id' => $assessment->id,
                'question_text' => $q['question'],
                'question_type' => $q['type'],
                'options' => isset($q['options']) ? $q['options'] : null,
                'correct_answer' => $q['correct_answer'] ?? null,
                'points' => $q['points'],
                'bloom_level' => 'C2',
                'grading_type' => in_array($q['type'], ['mcq', 'true_false', 'computation']) ? 'auto' : 'manual',
                'rubric' => $q['rubric'] ?? null,
                'sort_order' => $index + 1,
            ]);
        }
    }

    /**
     * C3 - Apply: Use information in new situations
     */
    private function createC3Assessment(Course $course): void
    {
        $assessment = Assessment::create([
            'course_id' => $course->id,
            'title' => 'C3 - Menerapkan: Praktik Caesar Cipher',
            'slug' => 'c3-menerapkan-caesar-cipher',
            'description' => 'Terapkan pengetahuan Anda untuk mengenkripsi dan mendekripsi pesan menggunakan Caesar Cipher.',
            'bloom_level' => 'C3',
            'grading_type' => 'mixed',
            'passing_score' => 75,
            'max_attempts' => 3,
            'time_limit_minutes' => 40,
            'is_published' => true,
            'sort_order' => 3,
        ]);

        $questions = [
            [
                'question' => 'Enkripsi pesan "ATTACK AT DAWN" menggunakan Caesar Cipher dengan kunci 7. Apa hasilnya?',
                'type' => 'computation',
                'correct_answer' => 'HAAHJR HA KHDU',
                'points' => 15,
                'rubric' => 'Jawaban yang benar adalah "HAAHJR HA KHDU". Setiap huruf digeser 7 posisi ke depan, spasi tetap.',
            ],
            [
                'question' => 'Dekripsi ciphertext "WKLV LV D VHFUHW" dengan kunci 3. Apa plaintext aslinya?',
                'type' => 'computation',
                'correct_answer' => 'THIS IS A SECRET',
                'points' => 15,
                'rubric' => 'Jawaban yang benar adalah "THIS IS A SECRET". Setiap huruf digeser mundur 3 posisi.',
            ],
            [
                'question' => 'Enkripsi kata "CRYPTOGRAPHY" dengan kunci 13 (ROT13). Apa hasilnya?',
                'type' => 'computation',
                'correct_answer' => 'PELCGBTENCUL',
                'points' => 15,
                'rubric' => 'Jawaban yang benar adalah "PELCGBTENCUL". ROT13 menggeser setiap huruf 13 posisi.',
            ],
            [
                'question' => 'Anda menerima pesan terenkripsi "KHOOR ZRUOG" dan tahu bahwa kata pertama adalah "HELLO". Tentukan kunci yang digunakan dan dekripsi pesan lengkapnya.',
                'type' => 'case_study',
                'points' => 25,
                'rubric' => 'Jawaban harus: 1) Menentukan kunci = 3 (H ke K adalah pergeseran 3), 2) Mendekripsi pesan menjadi "HELLO WORLD". Nilai penuh jika kedua langkah benar dengan penjelasan.',
            ],
            [
                'question' => 'Buatlah algoritma sederhana (pseudocode atau langkah-langkah) untuk mengenkripsi sebuah string menggunakan Caesar Cipher dengan kunci yang diberikan.',
                'type' => 'essay',
                'points' => 30,
                'rubric' => 'Jawaban harus mencakup: 1) Input: plaintext dan kunci, 2) Loop untuk setiap karakter, 3) Konversi huruf ke angka (A=0), 4) Tambahkan kunci dengan modulo 26, 5) Konversi kembali ke huruf, 6) Output: ciphertext. Nilai penuh jika algoritma lengkap dan logis.',
            ],
        ];

        foreach ($questions as $index => $q) {
            AssessmentQuestion::create([
                'assessment_id' => $assessment->id,
                'question_text' => $q['question'],
                'question_type' => $q['type'],
                'options' => isset($q['options']) ? $q['options'] : null,
                'correct_answer' => $q['correct_answer'] ?? null,
                'points' => $q['points'],
                'bloom_level' => 'C3',
                'grading_type' => in_array($q['type'], ['mcq', 'true_false', 'computation']) ? 'auto' : 'manual',
                'rubric' => $q['rubric'] ?? null,
                'sort_order' => $index + 1,
            ]);
        }
    }

    /**
     * C4 - Analyze: Draw connections among ideas
     */
    private function createC4Assessment(Course $course): void
    {
        $assessment = Assessment::create([
            'course_id' => $course->id,
            'title' => 'C4 - Menganalisis: Keamanan Caesar Cipher',
            'slug' => 'c4-menganalisis-caesar-cipher',
            'description' => 'Analisis kelemahan dan kekuatan Caesar Cipher serta metode serangan yang mungkin.',
            'bloom_level' => 'C4',
            'grading_type' => 'manual',
            'passing_score' => 75,
            'max_attempts' => 2,
            'time_limit_minutes' => 60,
            'is_published' => true,
            'sort_order' => 4,
        ]);

        $questions = [
            [
                'question' => 'Analisis mengapa serangan brute force sangat efektif terhadap Caesar Cipher. Berapa lama waktu yang dibutuhkan untuk mencoba semua kemungkinan kunci secara manual?',
                'type' => 'essay',
                'points' => 25,
                'rubric' => 'Jawaban harus menjelaskan: 1) Hanya ada 25 kemungkinan kunci, 2) Dapat dicoba secara manual dalam hitungan menit, 3) Dengan komputer, bisa dalam milidetik. Nilai penuh jika analisis lengkap dengan estimasi waktu.',
            ],
            [
                'question' => 'Jelaskan bagaimana frequency analysis dapat digunakan untuk memecahkan Caesar Cipher tanpa mengetahui kuncinya. Berikan contoh konkret.',
                'type' => 'essay',
                'points' => 30,
                'rubric' => 'Jawaban harus mencakup: 1) Analisis frekuensi huruf dalam ciphertext, 2) Bandingkan dengan frekuensi huruf normal (E paling sering dalam bahasa Inggris), 3) Tentukan pergeseran berdasarkan pola, 4) Contoh: jika H paling sering muncul, kemungkinan kunci = 3 (E→H). Nilai penuh jika ada penjelasan lengkap dengan contoh.',
            ],
            [
                'question' => 'Bandingkan Caesar Cipher dengan metode enkripsi modern (seperti AES). Apa perbedaan fundamental dalam hal keamanan, kompleksitas kunci, dan penggunaan?',
                'type' => 'essay',
                'points' => 30,
                'rubric' => 'Jawaban harus membandingkan: 1) Keamanan: Caesar sangat lemah vs AES sangat kuat, 2) Kompleksitas kunci: 25 kemungkinan vs 2^128/256 kemungkinan, 3) Penggunaan: Caesar untuk edukasi vs AES untuk data sensitif. Nilai penuh jika perbandingan detail dan akurat.',
            ],
            [
                'question' => 'Anda menemukan ciphertext berikut: "WKH TXLFN EURZQ IRA MXPSV RYHU WKH ODCB GRJ". Analisis dan pecahkan pesan ini menggunakan metode yang Anda pilih. Jelaskan langkah-langkah analisis Anda.',
                'type' => 'case_study',
                'points' => 35,
                'rubric' => 'Jawaban harus: 1) Mengidentifikasi metode (brute force atau frequency analysis), 2) Menentukan kunci = 3, 3) Mendekripsi menjadi "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG", 4) Menjelaskan proses analisis. Nilai penuh jika semua langkah dijelaskan dengan benar.',
            ],
        ];

        foreach ($questions as $index => $q) {
            AssessmentQuestion::create([
                'assessment_id' => $assessment->id,
                'question_text' => $q['question'],
                'question_type' => $q['type'],
                'options' => isset($q['options']) ? $q['options'] : null,
                'correct_answer' => $q['correct_answer'] ?? null,
                'points' => $q['points'],
                'bloom_level' => 'C4',
                'grading_type' => in_array($q['type'], ['mcq', 'true_false', 'computation']) ? 'auto' : 'manual',
                'rubric' => $q['rubric'] ?? null,
                'sort_order' => $index + 1,
            ]);
        }
    }

    /**
     * C5 - Evaluate: Justify a stand or decision
     */
    private function createC5Assessment(Course $course): void
    {
        $assessment = Assessment::create([
            'course_id' => $course->id,
            'title' => 'C5 - Mengevaluasi: Efektivitas Caesar Cipher',
            'slug' => 'c5-mengevaluasi-caesar-cipher',
            'description' => 'Evaluasi kelebihan, kekurangan, dan relevansi Caesar Cipher dalam konteks modern.',
            'bloom_level' => 'C5',
            'grading_type' => 'manual',
            'passing_score' => 80,
            'max_attempts' => 2,
            'time_limit_minutes' => 75,
            'is_published' => true,
            'sort_order' => 5,
        ]);

        $questions = [
            [
                'question' => 'Evaluasi apakah Caesar Cipher masih relevan untuk dipelajari di era kriptografi modern. Berikan argumen yang mendukung dan menentang, kemudian berikan kesimpulan Anda.',
                'type' => 'essay',
                'points' => 35,
                'rubric' => 'Jawaban harus mencakup: PRO: 1) Dasar pemahaman kriptografi, 2) Konsep substitusi masih digunakan, 3) Nilai historis. KONTRA: 1) Tidak aman untuk data nyata, 2) Terlalu sederhana. Kesimpulan harus jelas dan didukung argumen. Nilai penuh jika analisis seimbang dan kesimpulan logis.',
            ],
            [
                'question' => 'Sebuah perusahaan kecil ingin menggunakan Caesar Cipher untuk "mengamankan" pesan internal mereka karena mudah diimplementasikan. Evaluasi keputusan ini dan berikan rekomendasi alternatif yang lebih baik.',
                'type' => 'case_study',
                'points' => 40,
                'rubric' => 'Jawaban harus: 1) Menjelaskan mengapa Caesar Cipher tidak cocok (terlalu lemah, mudah dipecahkan), 2) Risiko jika data bocor, 3) Rekomendasi alternatif (AES, RSA, atau protokol modern seperti TLS), 4) Pertimbangan kemudahan implementasi vs keamanan. Nilai penuh jika evaluasi menyeluruh dengan rekomendasi praktis.',
            ],
            [
                'question' => 'Kritik pernyataan berikut: "Caesar Cipher adalah algoritma enkripsi yang buruk dan tidak memiliki nilai apapun dalam dunia modern." Apakah Anda setuju atau tidak? Berikan justifikasi yang kuat.',
                'type' => 'essay',
                'points' => 35,
                'rubric' => 'Jawaban harus: 1) Mengakui kelemahan Caesar Cipher untuk keamanan praktis, 2) Menjelaskan nilai edukatif dan historis, 3) Menyebutkan penggunaan dalam konteks non-kritis (puzzle, game), 4) Kesimpulan yang seimbang. Nilai penuh jika argumen kuat dan seimbang.',
            ],
            [
                'question' => 'Bandingkan efektivitas tiga metode untuk memecahkan Caesar Cipher: brute force, frequency analysis, dan known-plaintext attack. Metode mana yang paling efisien dalam skenario berbeda?',
                'type' => 'essay',
                'points' => 30,
                'rubric' => 'Jawaban harus membandingkan: 1) Brute force: cepat karena hanya 25 kemungkinan, cocok untuk teks pendek, 2) Frequency analysis: efektif untuk teks panjang, memerlukan pemahaman bahasa, 3) Known-plaintext: paling cepat jika ada sebagian plaintext. Nilai penuh jika ada analisis skenario yang tepat.',
            ],
        ];

        foreach ($questions as $index => $q) {
            AssessmentQuestion::create([
                'assessment_id' => $assessment->id,
                'question_text' => $q['question'],
                'question_type' => $q['type'],
                'options' => isset($q['options']) ? $q['options'] : null,
                'correct_answer' => $q['correct_answer'] ?? null,
                'points' => $q['points'],
                'bloom_level' => 'C5',
                'grading_type' => in_array($q['type'], ['mcq', 'true_false', 'computation']) ? 'auto' : 'manual',
                'rubric' => $q['rubric'] ?? null,
                'sort_order' => $index + 1,
            ]);
        }
    }

    /**
     * C6 - Create: Produce new or original work
     */
    private function createC6Assessment(Course $course): void
    {
        $assessment = Assessment::create([
            'course_id' => $course->id,
            'title' => 'C6 - Mencipta: Inovasi Caesar Cipher',
            'slug' => 'c6-mencipta-caesar-cipher',
            'description' => 'Ciptakan variasi atau perbaikan dari Caesar Cipher untuk meningkatkan keamanannya.',
            'bloom_level' => 'C6',
            'grading_type' => 'manual',
            'passing_score' => 80,
            'max_attempts' => 1,
            'time_limit_minutes' => 90,
            'is_published' => true,
            'sort_order' => 6,
        ]);

        $questions = [
            [
                'question' => 'Rancang sebuah variasi Caesar Cipher yang lebih aman dengan menambahkan minimal dua fitur keamanan tambahan. Jelaskan algoritma Anda secara detail, berikan contoh enkripsi, dan analisis peningkatan keamanannya dibanding Caesar Cipher standar.',
                'type' => 'case_study',
                'points' => 50,
                'rubric' => 'Jawaban harus mencakup: 1) Deskripsi algoritma baru yang jelas, 2) Minimal 2 fitur tambahan (contoh: multiple keys, variable shift, character substitution), 3) Contoh enkripsi yang benar, 4) Analisis keamanan yang menunjukkan peningkatan. Nilai penuh jika inovasi kreatif, implementasi jelas, dan analisis mendalam.',
            ],
            [
                'question' => 'Buat sebuah sistem enkripsi hybrid yang menggabungkan Caesar Cipher dengan metode kriptografi lain (misalnya transposisi, substitusi polialfabetik, atau XOR). Jelaskan cara kerja sistem Anda, berikan pseudocode atau flowchart, dan demonstrasikan dengan contoh.',
                'type' => 'case_study',
                'points' => 50,
                'rubric' => 'Jawaban harus: 1) Menjelaskan kombinasi metode yang dipilih, 2) Algoritma lengkap (pseudocode/flowchart), 3) Contoh enkripsi dan dekripsi, 4) Analisis kelebihan sistem hybrid. Nilai penuh jika sistem inovatif, dokumentasi lengkap, dan contoh benar.',
            ],
            [
                'question' => 'Desain sebuah aplikasi atau tool interaktif untuk mengajarkan Caesar Cipher kepada pemula. Jelaskan fitur-fitur utama, user interface, dan bagaimana aplikasi Anda membuat pembelajaran lebih efektif dibanding metode tradisional.',
                'type' => 'essay',
                'points' => 40,
                'rubric' => 'Jawaban harus mencakup: 1) Deskripsi fitur (enkripsi/dekripsi interaktif, visualisasi pergeseran, quiz, dll), 2) Sketsa atau deskripsi UI, 3) Penjelasan nilai edukatif, 4) Keunggulan dibanding pembelajaran tradisional. Nilai penuh jika desain kreatif, praktis, dan edukatif.',
            ],
        ];

        foreach ($questions as $index => $q) {
            AssessmentQuestion::create([
                'assessment_id' => $assessment->id,
                'question_text' => $q['question'],
                'question_type' => $q['type'],
                'options' => isset($q['options']) ? $q['options'] : null,
                'correct_answer' => $q['correct_answer'] ?? null,
                'points' => $q['points'],
                'bloom_level' => 'C6',
                'grading_type' => in_array($q['type'], ['mcq', 'true_false', 'computation']) ? 'auto' : 'manual',
                'rubric' => $q['rubric'] ?? null,
                'sort_order' => $index + 1,
            ]);
        }
    }
}
