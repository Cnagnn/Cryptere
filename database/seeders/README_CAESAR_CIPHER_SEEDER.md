# Caesar Cipher Course Seeder

Seeder lengkap untuk course "Algoritma Caesar Cipher" dengan konten edukatif dalam bahasa Indonesia.

## 📊 Data yang Di-seed

### 1. Course
- **Title**: Algoritma Caesar Cipher
- **Slug**: `algoritma-caesar-cipher`
- **Category**: Kriptografi
- **Difficulty**: Pemula
- **Estimated Time**: 180 menit
- **Status**: Published

### 2. Lessons (7 lessons)
1. **Pengenalan Kriptografi & Caesar Cipher** (3 tasks)
   - Memahami konsep dasar kriptografi dan pengenalan Caesar Cipher
   
2. **Sejarah & Konsep Dasar Caesar Cipher** (3 tasks)
   - Sejarah penggunaan dalam peradaban Romawi dan konsep matematika
   
3. **Cara Kerja Enkripsi Caesar Cipher** (3 tasks)
   - Proses enkripsi dengan shift/pergeseran karakter
   
4. **Cara Kerja Dekripsi Caesar Cipher** (2 tasks)
   - Proses dekripsi dan pemulihan plaintext
   
5. **Implementasi Caesar Cipher (Praktik)** (3 tasks)
   - Implementasi praktis dalam berbagai bahasa pemrograman
   
6. **Kelemahan & Serangan Brute Force** (3 tasks)
   - Analisis kelemahan dan metode serangan
   
7. **Variasi & Pengembangan Caesar Cipher** (3 tasks)
   - ROT13, Vigenère Cipher, dan pengembangan modern

### 3. Tasks (20 tasks total)
- **7 Video tasks**: Video pembelajaran dengan URL placeholder
- **6 Reading tasks**: Materi bacaan PDF dengan URL placeholder
- **7 Quiz tasks**: Kuis interaktif dengan total 24 pertanyaan

### 4. Quiz Questions (24 soal)
- Tersebar di 7 quiz tasks
- Setiap quiz memiliki 3-5 pertanyaan pilihan ganda
- Dengan options, correct_option, dan explanation dalam bahasa Indonesia

### 5. Assessment (1 assessment)
- **Title**: Ujian Akhir: Algoritma Caesar Cipher
- **Slug**: `ujian-akhir-caesar-cipher`
- **Bloom Level**: C3 (Apply)
- **Grading Type**: Mixed (auto + manual)
- **Passing Score**: 70%
- **Max Attempts**: 3
- **Time Limit**: 90 menit
- **Status**: Published

### 6. Assessment Questions (10 soal, 100 poin total)

| Tipe | Jumlah | Bloom Level | Grading | Poin per Soal | Total Poin |
|------|--------|-------------|---------|---------------|------------|
| MCQ (Multiple Choice) | 5 | C1-C2 | Auto | 10 | 50 |
| Essay | 2 | C4 | Manual | 15 | 30 |
| Case Study | 1 | C5 | Manual | 20 | 20 |
| Computation | 2 | C3 | Auto | 10 | 20 |
| **TOTAL** | **10** | - | - | - | **100** |

## 🚀 Cara Menggunakan

### Menjalankan Seeder

```bash
# Jalankan seeder spesifik
php artisan db:seed --class=CaesarCipherCourseSeeder

# Atau jalankan semua seeder (termasuk Caesar Cipher)
php artisan db:seed
```

### Reset dan Re-seed

```bash
# Reset database dan jalankan semua seeder
php artisan migrate:fresh --seed

# Atau hanya untuk seeder ini
php artisan migrate:fresh
php artisan db:seed --class=CaesarCipherCourseSeeder
```

## 📋 Verifikasi Data

### Query Verifikasi

```sql
-- Cek course
SELECT * FROM courses WHERE slug = 'algoritma-caesar-cipher';

-- Cek jumlah lessons
SELECT COUNT(*) FROM lessons WHERE course_id = (
    SELECT id FROM courses WHERE slug = 'algoritma-caesar-cipher'
);

-- Cek jumlah tasks per tipe
SELECT type, COUNT(*) 
FROM lesson_tasks 
WHERE lesson_id IN (
    SELECT id FROM lessons WHERE course_id = (
        SELECT id FROM courses WHERE slug = 'algoritma-caesar-cipher'
    )
)
GROUP BY type;

-- Cek assessment
SELECT * FROM assessments WHERE slug = 'ujian-akhir-caesar-cipher';

-- Cek distribusi soal assessment
SELECT question_type, bloom_level, COUNT(*), SUM(points) as total_points
FROM assessment_questions 
WHERE assessment_id = (
    SELECT id FROM assessments WHERE slug = 'ujian-akhir-caesar-cipher'
)
GROUP BY question_type, bloom_level;
```

### Hasil Verifikasi yang Diharapkan

```
✅ Course: 1 record
✅ Lessons: 7 records
✅ Tasks: 20 records (7 video, 6 read, 7 quiz)
✅ Quiz Questions: 24 records
✅ Assessment: 1 record
✅ Assessment Questions: 10 records (5 MCQ, 2 Essay, 1 Case Study, 2 Computation)
✅ Total Assessment Points: 100
```

## 📝 Struktur Konten

### Lesson Structure
Setiap lesson memiliki:
- `slug`: URL-friendly identifier
- `title`: Judul menarik dalam bahasa Indonesia
- `description`: Deskripsi 1-2 paragraf
- `content`: Konten edukatif 3-4 paragraf
- `learning_objectives`: Array 3-4 tujuan pembelajaran
- `key_concepts`: Array 3-5 konsep kunci
- `position`: Urutan lesson (1-7)

### Task Structure
Setiap task memiliki:
- `title`: Judul task
- `description`: Deskripsi singkat
- `type`: 'video', 'read', atau 'quiz'
- `minutes`: Estimasi durasi
- `sort_order`: Urutan dalam lesson
- `video_url` (untuk video): URL placeholder
- `pdf_url` (untuk read): URL placeholder

### Quiz Question Structure
Setiap quiz question memiliki:
- `question`: Pertanyaan dalam bahasa Indonesia
- `options`: Array 4 pilihan jawaban
- `correct_option`: Index jawaban benar (0-3)
- `explanation`: Penjelasan jawaban
- `sort_order`: Urutan pertanyaan

### Assessment Question Structure
Setiap assessment question memiliki:
- `question_text`: Pertanyaan lengkap
- `question_type`: mcq, essay, case_study, atau computation
- `bloom_level`: C1-C6 (Bloom's Taxonomy)
- `grading_type`: 'auto' atau 'manual'
- `points`: Bobot nilai
- `options` (untuk MCQ): JSON array pilihan
- `correct_answer`: Jawaban yang benar
- `explanation`: Penjelasan jawaban
- `rubric` (untuk case study): JSON rubric penilaian
- `min_words` (untuk essay): Minimal kata
- `sort_order`: Urutan soal

## 🎯 Fitur Khusus

### 1. Konten Realistis
Semua konten dibuat dengan materi edukatif yang akurat tentang Caesar Cipher, bukan placeholder lorem ipsum.

### 2. Struktur Progresif
Lessons disusun secara progresif dari pengenalan → teori → praktik → analisis → pengembangan.

### 3. Variasi Task
Setiap lesson memiliki kombinasi video, reading, dan quiz untuk pembelajaran yang seimbang.

### 4. Assessment Komprehensif
Assessment mencakup berbagai Bloom's Taxonomy levels:
- **C1 (Remember)**: Mengingat fakta dan konsep dasar
- **C2 (Understand)**: Memahami konsep dan prinsip
- **C3 (Apply)**: Menerapkan pengetahuan dalam situasi baru
- **C4 (Analyze)**: Menganalisis kelemahan dan masalah
- **C5 (Evaluate)**: Mengevaluasi penggunaan dalam konteks nyata

### 5. Grading Otomatis & Manual
- **Auto-graded**: MCQ dan Computation (60 poin)
- **Manual-graded**: Essay dan Case Study (40 poin)

## 🔧 Customization

### Mengubah Konten
Edit file `database/seeders/CaesarCipherCourseSeeder.php` dan modifikasi:
- Method `getCourseData()`: Data course
- Method `getLessonsData()`: Data lessons
- Method `getTasksData()`: Data tasks
- Method `getQuizQuestionsData()`: Data quiz questions
- Method `getAssessmentData()`: Data assessment
- Method `getAssessmentQuestionsData()`: Data assessment questions

### Menambah/Mengurangi Lessons
Ubah array di method `getLessonsData()` dan sesuaikan tasks di `getTasksData()`.

### Mengubah Assessment
Modifikasi method `getAssessmentQuestionsData()` untuk mengubah jumlah atau tipe soal.

## 📚 Referensi

### Models yang Digunakan
- `App\Models\Course`
- `App\Models\Lesson`
- `App\Models\LessonTask`
- `App\Models\QuizQuestion`
- `App\Models\Assessment`
- `App\Models\AssessmentQuestion`

### Database Tables
- `courses`
- `lessons`
- `lesson_tasks`
- `quiz_questions`
- `assessments`
- `assessment_questions`

## 🐛 Troubleshooting

### Error: Duplicate entry for key 'slug'
Course dengan slug yang sama sudah ada. Hapus dulu atau ubah slug di seeder.

```bash
# Hapus course existing
php artisan tinker
>>> App\Models\Course::where('slug', 'algoritma-caesar-cipher')->delete();
```

### Error: Foreign key constraint fails
Pastikan migrations sudah dijalankan dengan benar.

```bash
php artisan migrate:fresh
php artisan db:seed --class=CaesarCipherCourseSeeder
```

### Data tidak muncul di UI
Pastikan course sudah published (`is_published = true`) dan user sudah login.

## 📄 License

Seeder ini adalah bagian dari project Crypter.
