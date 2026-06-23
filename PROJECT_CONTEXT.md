# Cryptere — Project Context

> **Cryptere** adalah platform pembelajaran kriptografi berbasis web yang dirancang agar materi yang rumit bisa dipahami dengan cara yang lebih visual, bertahap, dan menarik.
>
> Dokumen ini disusun agar mudah dibaca oleh **dosen, pembimbing, penguji, penulis laporan, dan pembaca non-IT**, tanpa harus memahami detail teknis pemrograman.
>
> Isi dokumen dibagi menjadi dua lapisan:
> 1. **gambaran proyek secara konseptual**, dan
> 2. **gambaran implementasi proyek saat ini**.

---

## Ringkasan Cepat

### Apa itu Cryptere?
Cryptere adalah media belajar kriptografi berbasis web yang membantu pengguna memahami proses kerja algoritma secara lebih jelas. Fokus utamanya bukan sekadar memberi hasil akhir, tetapi memperlihatkan **bagaimana proses itu terjadi langkah demi langkah**.

### Mengapa proyek ini dibuat?
Karena materi kriptografi sering dianggap sulit, abstrak, dan rawan kesalahan saat dihitung manual. Cryptere dibuat untuk membantu proses belajar menjadi lebih mudah dipahami, lebih interaktif, dan lebih memotivasi.

### Siapa pengguna utamanya?
- Mahasiswa Teknik Informatika
- Mahasiswa yang mempelajari Kriptografi atau Keamanan Informasi
- Dosen atau pihak akademik yang ingin memantau perkembangan belajar

### Nilai utama proyek ini
- **Visual**: konsep kriptografi dijelaskan secara bertahap
- **Interaktif**: pengguna tidak hanya membaca, tetapi juga mencoba
- **Terarah**: materi dipelajari sesuai alur dan prasyarat
- **Memotivasi**: ada sistem progres, poin, level, dan pencapaian

---

## Daftar Isi

1. [Gambaran Umum Proyek](#1-gambaran-umum-proyek)
2. [Masalah yang Ingin Diselesaikan](#2-masalah-yang-ingin-diselesaikan)
3. [Tujuan Proyek](#3-tujuan-proyek)
4. [Siapa yang Menggunakan Cryptere](#4-siapa-yang-menggunakan-cryptere)
5. [Ruang Lingkup Pembelajaran](#5-ruang-lingkup-pembelajaran)
6. [Cara Kerja Pengalaman Belajar](#6-cara-kerja-pengalaman-belajar)
7. [Gamifikasi dalam Cryptere](#7-gamifikasi-dalam-cryptere)
8. [Status Implementasi Saat Ini](#8-status-implementasi-saat-ini)
9. [Audit Implementasi dan Validasi](#9-audit-implementasi-dan-validasi)
10. [Lampiran Teknis untuk Pengembang](#10-lampiran-teknis-untuk-pengembang)

---

## 1. Gambaran Umum Proyek

Cryptere berangkat dari gagasan bahwa pembelajaran kriptografi tidak cukup hanya dijelaskan melalui teori, slide, atau rumus di papan. Banyak konsep kriptografi baru benar-benar dipahami ketika mahasiswa dapat melihat alurnya secara langsung, tahap demi tahap, dan mencoba proses tersebut sendiri.

Karena itu, Cryptere dikembangkan sebagai **platform pembelajaran berbasis web** yang memadukan:
- materi belajar,
- latihan dan tugas,
- visualisasi proses algoritma,
- serta sistem motivasi berbasis progres belajar.

Dengan pendekatan ini, Cryptere tidak diposisikan sebagai alat keamanan untuk kebutuhan industri, melainkan sebagai **media pembelajaran interaktif**.

---

## 2. Masalah yang Ingin Diselesaikan

Proyek ini lahir dari beberapa persoalan umum dalam pembelajaran kriptografi:

1. **Materi terasa abstrak**  
   Banyak mahasiswa memahami teori secara permukaan, tetapi kesulitan mengikuti alur proses internal algoritma.

2. **Perhitungan manual mudah salah**  
   Beberapa algoritma memiliki banyak langkah, sehingga rawan kesalahan ketika dipelajari secara manual.

3. **Media belajar konvensional kurang interaktif**  
   Pembelajaran berbasis teks atau slide sering belum cukup membantu untuk menjelaskan proses yang dinamis.

4. **Motivasi belajar bisa menurun**  
   Materi yang berat memerlukan strategi agar mahasiswa tetap konsisten belajar dari waktu ke waktu.

Cryptere mencoba menjawab persoalan tersebut dengan pendekatan visual, bertahap, dan memotivasi.

---

## 3. Tujuan Proyek

Secara sederhana, Cryptere dibangun untuk:

- membantu mahasiswa memahami konsep kriptografi dengan lebih jelas,
- memperlihatkan proses algoritma secara transparan dan bertahap,
- mengurangi kesalahan pemahaman saat belajar,
- menyediakan alur belajar yang terstruktur,
- dan meningkatkan keterlibatan belajar melalui gamifikasi.

---

## 4. Siapa yang Menggunakan Cryptere

Cryptere terutama ditujukan untuk:

- **mahasiswa**, sebagai pengguna utama platform belajar;
- **dosen atau pembimbing**, sebagai pihak yang memantau progres dan kualitas pembelajaran;
- **pembaca akademik non-teknis**, yang ingin memahami arah dan tujuan sistem tanpa harus membaca kode program.

---

## 5. Ruang Lingkup Pembelajaran

Materi dan pengalaman belajar dalam Cryptere berfokus pada visualisasi dan pemahaman konsep kriptografi, khususnya:

- Caesar Cipher
- Vigenere Cipher
- AES Concept
- DES
- RSA
- Digital Signature

Pendekatan yang dipakai adalah **Glass Box**, yaitu proses algoritma diperlihatkan secara terbuka agar pengguna memahami langkah-langkahnya, bukan hanya hasil akhirnya.

---

## 6. Cara Kerja Pengalaman Belajar

Secara umum, alur belajar yang diharapkan di Cryptere adalah sebagai berikut:

1. pengguna membuat akun atau masuk ke sistem,
2. pengguna memilih materi atau course,
3. materi dipelajari secara bertahap,
4. beberapa bagian baru terbuka setelah syarat sebelumnya terpenuhi,
5. pengguna mengerjakan aktivitas belajar seperti membaca materi, menonton, menjawab quiz, atau mencoba lab,
6. sistem memberikan umpan balik dalam bentuk progres dan penghargaan belajar.

Dengan cara ini, pembelajaran tidak terasa sebagai kumpulan halaman terpisah, tetapi sebagai perjalanan belajar yang terstruktur.

---

## 7. Gamifikasi dalam Cryptere

Salah satu ciri penting Cryptere adalah penggunaan gamifikasi. Tujuannya bukan sekadar membuat sistem terlihat menarik, tetapi untuk membantu pengguna tetap konsisten belajar.

Bentuk gamifikasi yang digunakan meliputi:

- **progres belajar bertahap**,
- **poin dari aktivitas belajar**,
- **level perkembangan**,
- **streak harian**,
- **target harian**,
- **badge atau pencapaian**,
- **leaderboard** untuk memunculkan semangat belajar yang sehat.

Gamifikasi di sini berfungsi sebagai pendorong, bukan pengganti substansi pembelajaran.

---

## 8. Status Implementasi Saat Ini

Bagian ini menjelaskan sejauh mana gagasan dalam tugas akhir telah diterapkan pada proyek yang berjalan saat ini.

### 8.1 Hal-hal yang sudah terwujud

Saat ini Cryptere sudah memiliki bagian-bagian penting berikut:

- sistem masuk dan pendaftaran pengguna,
- dashboard untuk pengguna dan pengelola,
- alur course, lesson, dan tugas belajar,
- pembelajaran bertahap berbasis prasyarat,
- lab visualisasi kriptografi,
- sistem gamifikasi seperti poin, level, streak, badge, dan leaderboard,
- serta pengelolaan akses sesuai peran pengguna.

### 8.2 Hal-hal yang sudah ada tetapi masih bersifat edukasional

Beberapa lab sudah tersedia, tetapi tetap harus dipahami sebagai **alat bantu belajar**, bukan simulasi industri yang lengkap. Ini terutama berlaku pada materi seperti:

- AES,
- RSA,
- Digital Signature.

Artinya, fokus utama implementasi saat ini adalah kejelasan pembelajaran, bukan kompleksitas teknis penuh seperti pada sistem produksi nyata.

### 8.3 Hal-hal yang belum tampak sebagai artefak formal

Dari hasil audit repository, dokumentasi formal yang secara khusus menunjukkan:

- **Black Box Testing versi laporan penelitian**, dan
- **User Acceptance Testing (UAT) formal**,

belum terlihat sebagai artefak terpisah di dalam repository.

### 8.4 Ringkasan Status Implementasi

Bagian ini merangkum status implementasi fitur-fitur yang berasal dari dokumen TA berdasarkan audit codebase aktual.

## 9. Audit Implementasi dan Validasi

Bagian ini merangkum hasil audit terhadap implementasi Cryptere saat ini, sekaligus menunjukkan bagian mana yang sudah berjalan dengan baik dan bagian mana yang masih belum tampak sebagai dokumen formal penelitian.

### 9.1 Tabel Status Implementasi

| Area / Fitur TA | Status | Bukti di Codebase | Catatan |
|---|---|---|---|
| Autentikasi inti | **✅ Sudah** | `FortifyServiceProvider`, actions Fortify, halaman auth Inertia | Login, register, reset password, verify email, confirm password, dan two-factor challenge tersedia. |
| Social login | **✅ Sudah** | `SocialAuthController`, Socialite | Provider aktif: Google dan GitHub. |
| Dashboard mahasiswa | **✅ Sudah** | `DashboardController`, `LearnerDashboardBuilder` | Dashboard learner tersedia. |
| Dashboard admin | **✅ Sudah** | `DashboardController`, `AdminDashboardBuilder` | Dashboard admin tersedia dan dibedakan dari learner. |
| Course / lesson / task flow | **✅ Sudah** | routes course, controller course/lesson/task, pages Inertia | Katalog course, detail course, progres lesson, quiz submission, assessment submission, dan document delivery tersedia. |
| Prerequisite / unlockable content | **✅ Sudah** | logic progres task, test seperti `LessonTaskPrerequisiteTest` | Learning path bertahap sudah diterapkan. |
| Lab Caesar Cipher | **✅ Sudah** | `config/labs.php`, `LabController`, `resources/js/pages/labs/show.tsx` | Tersedia sebagai lab interaktif. |
| Lab Vigenere Cipher | **✅ Sudah** | `config/labs.php`, `LabController`, `resources/js/pages/labs/show.tsx` | Tersedia sebagai lab interaktif. |
| Lab AES | **⚠️ Parsial** | `config/labs.php`, `resources/js/pages/labs/show.tsx` | Ada sebagai lab edukasional, tetapi bukan implementasi AES produksi penuh. |
| Lab RSA | **⚠️ Parsial** | `config/labs.php`, `resources/js/pages/labs/show.tsx` | Ada sebagai simulasi edukasional, bukan RSA produksi. |
| Lab Digital Signature | **⚠️ Parsial** | `config/labs.php`, `resources/js/pages/labs/show.tsx` | Ada sebagai lab edukasional, bukan flow production-grade. |
| XP & Level | **✅ Sudah** | `XpService`, `LevelService`, model `User` | Mekanisme progres gamifikasi aktif. |
| Daily Streak | **✅ Sudah** | `StreakService`, model `User` | Streak harian aktif. |
| Daily Goal | **✅ Sudah** | `XpService`, `config/rewards.php` | Daily XP goal aktif. |
| Badge / Achievement | **✅ Sudah** | `Badge`, `BadgeService`, event `BadgeEarned` | Badge milestone tersedia. |
| Leaderboard | **✅ Sudah** | `LeaderboardService`, `LeaderboardController`, page leaderboard | Leaderboard aktif. |
| Real-time leaderboard | **⚠️ Parsial** | `routes/channels.php`, event broadcasting, client realtime | Konsep real-time ada; production memakai Pusher, sementara TA membingkai dengan Reverb. |
| Lab visit tracking | **✅ Sudah** | `LabVisit`, `LabController` | Dipakai untuk progres/badge `labs_visited`. |
| Role-based access | **✅ Sudah** | Spatie Permission, gate/role logic | Guard admin/user tersedia. |
| Testing engineering | **✅ Sudah** | folder `tests`, Pest | Banyak test engineering untuk auth, dashboard, leaderboard, streak, badge, prerequisite, assessment, admin, dll. |
| Black Box formal ala TA | **❌ Belum terlihat** | Tidak ditemukan artefak khusus di repository | Ada test aplikasi, tetapi belum dipetakan sebagai dokumen/artefak formal Black Box TA. |
| UAT formal ala TA | **❌ Belum terlihat** | Tidak ditemukan artefak khusus di repository | Belum ada bukti repository untuk kuesioner / artefak UAT formal. |

### 9.2 Catatan Pembacaan Tabel

- **✅ Sudah** = fitur terlihat aktif dan punya bukti implementasi yang cukup jelas di codebase.
- **⚠️ Parsial** = fitur ada, tetapi bentuk implementasinya berbeda dari narasi TA atau masih berupa simulasi edukasional.
- **❌ Belum terlihat** = belum ada artefak repository yang cukup untuk menyatakan fitur / validasi itu hadir secara formal.

### 9.3 Kesimpulan Audit Implementasi

Secara umum, **fitur inti akademik TA yang memang dipertahankan dalam scope proyek** sudah banyak yang diwujudkan dalam codebase, terutama:
- e-learning kriptografi,
- visualisasi lab,
- gamifikasi,
- autentikasi,
- dashboard,
- prerequisite learning path,
- dan leaderboard.

Area yang belum tampak di repository saat ini lebih berkaitan dengan **artefak validasi formal penelitian**, terutama:
- UAT formal,
- dan dokumentasi black-box formal ala penelitian.

---

## 10. Lampiran Teknis untuk Pengembang

Bagian setelah ini ditujukan terutama untuk **pengembang, reviewer teknis, atau pihak yang perlu memahami implementasi sistem secara lebih rinci**.

Jika Anda adalah pembaca non-IT, Anda bisa berhenti sampai bagian 9 karena gambaran utama proyek, tujuan, ruang lingkup, dan status implementasinya sudah dijelaskan di bagian sebelumnya.

Bagian lampiran ini mempertahankan detail teknis repository agar tetap berguna untuk pengembangan lanjutan, audit teknis, dan onboarding contributor.

### 10.1 Ringkasan Teknologi yang Digunakan
|-------|-----------|-------|------------|
| Backend Framework | Laravel | 13.x | `laravel/framework ^13.0` |
| Runtime | PHP | ^8.3 (currently 8.4) | Constructor property promotion, typed properties |
| SPA Bridge | Inertia.js | 3.x | `inertiajs/inertia-laravel ^3.0` |
| UI Framework | React | 19.x | Concurrent rendering, Server Components-ready |
| CSS Framework | Tailwind CSS | 4.x | `@tailwindcss/vite ^4.1.11`, utility-first, no config file needed |
| CSS Animation | tw-animate-css | 1.x | Tailwind-native animation utilities |
| Bundler | Vite | 7.x | ESM-native, lightning-fast HMR |
| Type System | TypeScript | 5.7 | Strict mode, `tsc --noEmit`, isolatedModules |
| Auth Backend | Laravel Fortify | 1.x | Headless, frontend-agnostic, registered on `auth.` subdomain |
| OAuth Social Login | Laravel Socialite | 5.x | GitHub + Google OAuth2 providers |
| Feature Flags | Laravel Pennant | 1.x | Database driver, 3 class-based features |
| Role-Based Access | spatie/laravel-permission | 7.x | Roles: Super Admin, Admin, User; 13 granular permissions |
| API Documentation | dedoc/scramble | 0.13 | Auto-generated OpenAPI from route annotations |
| Error Monitoring | Sentry | 4.x (PHP) / 10.x (React) | Cross-stack error tracking + performance |
| Backup | spatie/laravel-backup | 10.x | Database + file backup to S3/local |
| Queue Driver | Database | — | `jobs`, `failed_jobs`, `job_batches` tables |
| Cache Driver | Database | — | `cache` table |
| Session Driver | Database | — | Cross-subdomain cookie (`.cryptere.com` in prod) |
| PHP Testing | Pest | 4.x | Architecture tests, datasets, mutation testing ready |
| PHP Code Style | Laravel Pint | 1.x | Parallel linting, preset: `laravel` |
| PHP REPL | Laravel Tinker | 3.x | Interactive shell |
| PHP Log Tailing | Laravel Pail | 1.x | Terminal log viewer |
| Docker (optional) | Laravel Sail | 1.x | Pre-configured Docker dev environment |
| AI Dev Assistant | Laravel Boost | 2.x | MCP server for AI-assisted development |
| WebSocket (local) | Laravel Reverb | 1.x | Self-hosted WebSocket server |
| WebSocket (prod) | Pusher | — | Pusher Channels, cluster `ap1`, app ID `2164173` |
| Type-Safe Routes | Laravel Wayfinder | 0.1 | Generates `@/actions/` and `@/routes/` TypeScript functions |
| JS E2E Testing | Playwright | 1.59 | 5 browser projects: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari |
| JS Unit Testing | Vitest | 4.x | Vite-native test runner |
| React Compiler | babel-plugin-react-compiler | 1.0 | Opt-in, production-only (`VITE_REACT_COMPILER=true`) |

---

## 10.2 PHP Dependencies

### Production (`require`)

| Package | Versi | Purpose | Detail |
|---------|-------|---------|--------|
| `laravel/framework` | ^13.0 | Core framework | Routing, Eloquent ORM, Queue, Cache, Session |
| `inertiajs/inertia-laravel` | ^3.0 | SPA bridge (server-side) | `Inertia::render()`, lazy props, deferred props, SSR support |
| `laravel/fortify` | ^1.34 | Authentication backend | Login, register, 2FA (TOTP), email verification, password reset |
| `laravel/pennant` | ^1.23 | Feature flags | Class-based features, database store, `Feature::active()` / `Feature::define()` |
| `laravel/reverb` | ^1.10 | WebSocket server (local dev) | Self-hosted, Pusher-protocol compatible |
| `laravel/socialite` | ^5.26 | OAuth social login | `Socialite::driver('github')` / `->driver('google')` |
| `laravel/tinker` | ^3.0 | Interactive REPL | `php artisan tinker --execute '...'` |
| `laravel/wayfinder` | ^0.1.14 | Type-safe route/action generation | `php artisan wayfinder:generate --with-form` → `@/actions/`, `@/routes/` |
| `dedoc/scramble` | ^0.13.22 | Auto-generated OpenAPI docs | Custom route resolver (web routes, not api/), Stoplight Elements UI |
| `sentry/sentry-laravel` | ^4.25 | Error/performance monitoring | PHP exception tracking, SQL query tracing |
| `spatie/laravel-backup` | ^10.2 | Database & file backups | `php artisan backup:run`, S3/local storage |
| `spatie/laravel-permission` | ^7.4 | Roles & permissions | `HasRoles` trait, `Gate::before()`, 13 permissions defined |
| `league/flysystem-aws-s3-v3` | ^3.0 | S3-compatible storage | Cloudflare R2 / AWS S3 filesystem driver |

### Dev Dependencies (`require-dev`)

| Package | Versi | Purpose |
|---------|-------|---------|
| `laravel/boost` | ^2.2 | MCP server (AI-assisted development in IDE) |
| `laravel/pail` | ^1.2.5 | `php artisan pail` — terminal log viewer |
| `laravel/pint` | ^1.27 | PHP code style fixer (preset: `laravel`) |
| `laravel/sail` | ^1.53 | Docker dev environment (MySQL, Redis, etc.) |
| `pestphp/pest` | ^4.4 | Test framework (`test()` / `it()` / `expect()` syntax) |
| `pestphp/pest-plugin-laravel` | ^4.1 | Laravel-specific Pest helpers |
| `fakerphp/faker` | ^1.24 | Fake data generation for factories |
| `mockery/mockery` | ^1.6 | Mock objects for unit tests |
| `nunomaduro/collision` | ^8.9 | Beautiful error pages in console |

---

## 10.3 JavaScript Dependencies

### Core Runtime

| Package | Versi | Purpose |
|---------|-------|---------|
| `react` / `react-dom` | ^19.2 | UI framework — concurrent rendering, `use()` hook |
| `@inertiajs/react` | ^3.0 | Inertia React adapter — `<Link>`, `<Form>`, `useForm`, `useHttp`, `router` |
| `@inertiajs/vite` | ^3.0 | Inertia Vite plugin (SSR support, automatic code splitting) |
| `typescript` | ^5.7 | Type checking, strict mode |
| `vite` | ^7.3 | Bundler — ESM-native dev server, HMR, production build |
| `tailwindcss` | ^4.0 | Utility-first CSS framework (no config file, CSS-based config) |
| `@tailwindcss/vite` | ^4.1 | Tailwind CSS Vite plugin |

### Headless UI Primitives (Radix UI — 15 packages)

| Package | Purpose |
|---------|---------|
| `@radix-ui/react-dialog` | Modal/dialog dengan overlay |
| `@radix-ui/react-dropdown-menu` | Dropdown menu (admin sidebar, user menu) |
| `@radix-ui/react-popover` | Hover/focus popover |
| `@radix-ui/react-tooltip` | Tooltip dengan positioning |
| `@radix-ui/react-select` | Custom select dropdown |
| `@radix-ui/react-tabs` | Tab panel switching |
| `@radix-ui/react-navigation-menu` | Navigation menu (admin sidebar) |
| `@radix-ui/react-checkbox` | Checkbox input |
| `@radix-ui/react-toggle` / `toggle-group` | Toggle button / group |
| `@radix-ui/react-slider` | Range slider |
| `@radix-ui/react-progress` | Progress bar |
| `@radix-ui/react-avatar` | Avatar dengan fallback |
| `@radix-ui/react-collapsible` | Collapsible panel (course sidebar) |
| `@radix-ui/react-separator` | Visual separator |
| `@radix-ui/react-slot` | Polymorphic `asChild` pattern |
| `@radix-ui/react-label` | Accessible form label |

### Other UI

| Package | Purpose |
|---------|---------|
| `@headlessui/react` ^2.2 | Additional headless components |
| `@base-ui/react` ^1.4 | Base UI primitives |
| `@tanstack/react-table` ^8.21 | Headless data table (admin user list, question bank) |
| `framer-motion` ^12.40 | Animation/transition library |
| `lucide-react` ^0.475 | Icon library (Feather-style open source icons) |
| `sonner` ^2.0 | Toast notification system |
| `cmdk` ^1.1 | Command palette (`⌘K` style) |
| `embla-carousel-react` ^8.6 + autoplay | Carousel (course hero, dashboard cards) |
| `react-resizable-panels` ^4 | Resizable split panels (admin layout, course viewer) |
| `react-day-picker` ^9.14 | Calendar date picker |
| `vaul` ^1.1 | Drawer component (mobile sidebar) |
| `input-otp` ^1.4 | OTP input field |
| `shadcn` ^4.6 | shadcn/ui CLI (`npx shadcn add ...`) |

### Data Visualization

| Package | Purpose |
|---------|---------|
| `recharts` ^3.8 | Composable chart library (line, bar, pie, area charts for admin analytics) |
| `react-pdf` ^10.4 | PDF document viewer (lesson documents) |
| `plyr` ^3.8 | HTML5 video/audio player (lesson video tasks) |

### Styling Utilities

| Package | Purpose |
|---------|---------|
| `tailwind-merge` ^3.0 | Merge Tailwind classes without conflicts |
| `class-variance-authority` ^0.7 | CVA pattern for variant-based components |
| `clsx` ^2.1 | Conditional class name construction |
| `next-themes` ^0.4 | Dark/light/system theme toggle |
| `tw-animate-css` ^1.4 | Tailwind animation presets (`animate-fade-in`, etc.) |

### Forms & Validation

| Package | Purpose |
|---------|---------|
| `react-hook-form` ^7.72 | Performant form state management |
| `@hookform/resolvers` ^5.2 | Zod/Yup resolver integration |
| `zod` ^4.3 | Runtime schema validation (form validation, API response validation) |

### Real-time

| Package | Purpose |
|---------|---------|
| `laravel-echo` ^2.3 | WebSocket client (Laravel broadcasting) |
| `pusher-js` ^8.5 | Pusher transport for Echo (production) |

### Monitoring

| Package | Purpose |
|---------|---------|
| `@sentry/react` ^10.50 | Frontend React error boundary + performance tracing |

### Dev Tooling

| Package | Purpose |
|---------|---------|
| `@vitejs/plugin-react` ^5.2 | React Fast Refresh + JSX transform |
| `laravel-vite-plugin` ^2.1 | Laravel-Vite integration (asset manifest, refresh) |
| `@laravel/vite-plugin-wayfinder` ^0.1 | Wayfinder Vite plugin (auto-type generation on file change) |
| `babel-plugin-react-compiler` ^1.0 | React Compiler (auto-memoization, opt-in) |
| `concurrently` ^9.0 | Run multiple npm scripts simultaneously |
| `@playwright/test` ^1.59 | E2E browser testing (5 configs) |
| `vitest` ^4.1 | Unit test runner (Vite-native) |
| `@vitest/coverage-v8` ^4.1 | Code coverage for Vitest |
| `eslint` ^9.17 | JS/TS linter |
| `eslint-plugin-react` ^7.37 / `react-hooks` ^7.0 | React ESLint rules |
| `eslint-plugin-import` ^2.32 | Import ordering rules |
| `eslint-config-prettier` ^10.0 | Disable ESLint rules conflicting with Prettier |
| `typescript-eslint` ^8.23 | TypeScript ESLint parser |
| `prettier` ^3.4 | Code formatter |
| `prettier-plugin-tailwindcss` ^0.6 | Auto-sort Tailwind classes |
| `globals` ^15.14 | ESLint global definitions |
| `@stylistic/eslint-plugin` ^5.10 | Stylistic ESLint rules |
| `eslint-import-resolver-typescript` ^4.4 | TypeScript-aware import resolver |

---

## 10.4 Arsitektur Aplikasi

### 10.4.1 Multi-Domain Routing

Aplikasi berjalan di 3 domain/subdomain terpisah, semuanya dari satu codebase:

| Domain | Env Config | Environment | Purpose | Auth Required |
|--------|-----------|-------------|---------|---------------|
| `cryptere.com` | `PUBLIC_DOMAIN` | Landing Page | Welcome page, locale switch, health check | ❌ |
| `auth.cryptere.com` | `AUTH_DOMAIN` | Authentication | Fortify routes (login, register, 2FA, password reset), social auth | ❌ |
| `app.cryptere.com` | `APP_DOMAIN` | Main App | Dashboard, courses, leaderboard, labs, profile, admin | ✅ `auth` + `verified` |

**Domain Resolution** (`config/app.php`):
- `config('app.domains.public')` → `parse_url($PUBLIC_DOMAIN, PHP_URL_HOST)`
- `config('app.domains.auth')` → `parse_url($AUTH_DOMAIN, PHP_URL_HOST)`
- `config('app.domains.app')` → `parse_url($APP_DOMAIN, PHP_URL_HOST)`
- `config('app.urls.public')` → full URL (scheme + domain)
- `config('app.urls.auth')` → full auth URL
- `config('app.urls.app')` → full URL + `/dashboard`
- `config('app.session_domain')` → `.cryptere.com` (production, cross-subdomain cookie)

### 10.4.2 Struktur Direktori

```
Cryptere/
├── app/
│   ├── Actions/Fortify/
│   │   ├── CreateNewUser.php          # Registration logic + social linking
│   │   └── ResetUserPassword.php      # Password reset handler
│   ├── Broadcasting/                   # (Empty — channels in routes/channels.php)
│   ├── Concerns/
│   │   ├── ExtractsLegacyTasks.php     # Task extraction trait (used by CourseDetailBuilder)
│   │   ├── FlashesAchievements.php     # Shared achievement flash helper
│   │   ├── PasswordValidationRules.php # Centralized password rules
│   │   └── ProfileValidationRules.php  # Centralized profile validation
│   ├── Events/
│   │   ├── XpAwarded.php               # $user, $amount, $source
│   │   ├── BadgeEarned.php             # $user, $badge
│   │   ├── LessonCompleted.php         # $user, $lesson, $course
│   │   ├── CourseCompleted.php         # $user, $course
│   │   ├── LeaderboardUpdated.php      # (broadcast to 'leaderboard' channel)
│   │   └── Dashboard/
│   │       ├── UserStatsUpdated.php    # (broadcast to user.{id})
│   │       ├── RankChanged.php         # (broadcast to user.{id})
│   │       ├── LevelUp.php             # (broadcast to user.{id})
│   │       └── BadgeUnlocked.php       # (broadcast to user.{id})
│   ├── Features/
│   │   ├── IndonesianLocale.php        # Pennant feature: controlled rollout locale
│   │   ├── GamificationRewardVariant.php # Pennant: A/B test reward amounts
│   │   └── RealtimeLeaderboard.php     # Pennant: toggle real-time leaderboard
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/ (7 controllers)
│   │   │   │   ├── UserController.php       # List, update, delete users
│   │   │   │   ├── CourseController.php     # CRUD, reorder, publish/archive
│   │   │   │   ├── LessonController.php     # CRUD, reorder, publish
│   │   │   │   ├── TaskController.php       # CRUD, reorder, publish
│   │   │   │   ├── AssessmentController.php # CRUD, reorder, publish/archive
│   │   │   │   ├── AssessmentQuestionController.php # CRUD, reorder questions
│   │   │   │   └── QuestionBankController.php # CRUD, duplicate, bulk import, usage stats
│   │   │   ├── Assessment/
│   │   │   │   └── AssessmentSubmissionController.php  # start, saveAnswer, submit
│   │   │   ├── Auth/
│   │   │   │   ├── SocialAuthController.php    # redirect, callback (GitHub/Google)
│   │   │   │   └── UsernameAvailabilityController.php # check-username (GET, rate-limited)
│   │   │   ├── Course/
│   │   │   │   ├── CourseController.php        # index (catalog), show (detail)
│   │   │   │   ├── EnrollmentController.php    # store (enroll), reset
│   │   │   │   ├── LessonProgressController.php # store (complete lesson)
│   │   │   │   ├── QuizSubmissionController.php # store (submit quiz, returns JSON)
│   │   │   │   ├── TaskHeartbeatController.php  # store (anti-cheat heartbeat)
│   │   │   │   └── DocumentController.php      # show (serve inline, prevents IDM interception)
│   │   │   ├── Lab/
│   │   │   │   └── LabController.php           # index, show
│   │   │   ├── Settings/
│   │   │   │   ├── ProfileController.php       # update profile info
│   │   │   │   ├── PasswordController.php      # update password
│   │   │   │   ├── AvatarController.php        # pixabot, destroy avatar
│   │   │   │   └── SocialAccountController.php # destroy linked social account
│   │   │   ├── DashboardController.php         # Learner OR Admin dashboard (conditional)
│   │   │   ├── LeaderboardController.php       # Global leaderboard
│   │   │   ├── ProfileController.php           # show, showOwn, settings
│   │   │   ├── SearchController.php            # Global search (rate-limited)
│   │   │   ├── HealthCheckController.php       # GET /health (no auth)
│   │   │   └── Controller.php                  # Base controller
│   │   ├── Middleware/ (5)
│   │   │   ├── HandleInertiaRequests.php  # Shared props, streak update on each request
│   │   │   ├── SetLocale.php              # Read cookie/header, set app locale (en/id)
│   │   │   ├── SecurityHeaders.php        # Nonce-based CSP, X-Content-Type-Options, etc.
│   │   │   ├── HandleAppearance.php       # Dark/light mode from cookie
│   │   │   └── PublicPageCacheHeaders.php # Edge-cache headers for landing page
│   │   └── Responses/Auth/
│   │       ├── LoginResponse.php          # Fortify redirect override
│   │       ├── RegisterResponse.php       # Fortify redirect override
│   │       └── NeutralPasswordResetLinkResponse.php # Silent success (no email indicator)
│   ├── Jobs/
│   │   └── ConvertLessonDocument.php # Async document conversion (PDF, image)
│   ├── Listeners/
│   │   └── LogXpAward.php          # Listens to XpAwarded event → AuditLog
│   ├── Models/ (21 Eloquent models) — see §5
│   ├── Notifications/ (6)
│   │   ├── VerifyEmailNotification.php
│   │   ├── CourseCompleted.php
│   │   ├── StreakMilestone.php
│   │   ├── PointDecayWarning.php
│   │   ├── AchievementUnlocked.php
│   │   └── AssessmentGradedNotification.php
│   ├── Observers/
│   │   ├── UserObserver.php              # Auto-creates enrollment on first login
│   │   └── UserBalanceHistoryObserver.php # Tracks balance changes
│   ├── Providers/
│   │   └── AppServiceProvider.php        # Gate::before, rate limiters, Pennant, Scramble, observers
│   ├── Services/ (22 services) — see §6
│   ├── Support/
│   │   └── CourseAssetStorage.php        # Resolve course asset URLs (cover images, documents)
│   └── Traits/
│       └── Versionable.php               # Shared trait for content versioning (Course, Lesson, Task, Assessment)
│
├── bootstrap/
│   └── app.php                           # Laravel bootstrap
│
├── config/ (30+ config files)
│   ├── app.php                           # Multi-domain setup, timezone Asia/Jakarta
│   ├── fortify.php                       # Auth domain, 2FA config, redirects
│   ├── broadcasting.php                  # Reverb + Pusher connections
│   ├── filesystems.php                   # local, public, s3 disks + course_assets_disk
│   ├── pennant.php                       # Database store
│   ├── permission.php                    # Spatie permission models
│   ├── scramble.php                      # Custom route resolver (web routes, not api/)
│   ├── rewards.php                       # All gamification constants (XP, points, decay, bonuses)
│   └── levels.php                        # 50-level exponential curve thresholds
│
├── database/
│   ├── factories/                        # All 21 models have factories
│   ├── migrations/ (50+ migrations)
│   └── seeders/
│
├── resources/
│   ├── css/
│   │   └── app.css                       # Tailwind v4 entry: @import "tailwindcss"
│   ├── js/
│   │   ├── app.tsx                       # Inertia app entry (createInertiaApp)
│   │   ├── components/ (50+ React components)
│   │   │   ├── ui/ (50+ shadcn/ui components)
│   │   │   ├── app-sidebar.tsx           # Main navigation sidebar
│   │   │   └── ...                       # Feature-specific components
│   │   ├── hooks/                        # Custom React hooks
│   │   ├── layouts/                      # App layout, auth layout
│   │   ├── lib/                          # Utility functions, cn(), etc.
│   │   ├── pages/ (21 Inertia pages)
│   │   │   ├── auth/ (7 pages)           # login, register, forgot-password, reset-password, confirm-password, verify-email, two-factor-challenge
│   │   │   ├── admin/ (4 pages)          # users/index, courses/index, question-bank/index, courses/assessment
│   │   │   ├── courses/ (2 pages)        # index (catalog), show (detail)
│   │   │   ├── leaderboard/
│   │   │   ├── labs/ (2 pages)           # index, show
│   │   │   ├── profile/ (2 pages)        # show, settings
│   │   │   ├── dashboard.tsx
│   │   │   ├── welcome.tsx
│   │   │   └── error.tsx
│   │   └── types/ (13 files)             # TypeScript type definitions — see §10
│   └── views/
│       └── app.blade.php                 # Root Blade template (Inertia entry)
│
├── routes/
│   ├── web.php                           # Multi-domain routes (see §7 for full tree)
│   ├── settings.php                      # Settings routes (/settings/*)
│   ├── channels.php                      # Broadcasting auth
│   └── console.php
│
├── public/
│   └── build/                            # Vite compiled assets
│
├── storage/
│   ├── app/
│   │   ├── private/                      # 'local' disk
│   │   └── public/                       # 'public' disk (course covers, avatars, documents)
│   └── logs/
│
├── tests/
│   ├── Feature/                          # Pest feature tests
│   ├── Unit/                             # Pest unit tests
│   └── e2e/                              # Playwright E2E tests
│
├── .cpanel.yml                           # cPanel Git deployment script
├── vite.config.ts                        # Vite configuration
├── tsconfig.json                         # TypeScript configuration
├── playwright.config.ts                  # Playwright E2E configuration
├── composer.json                         # PHP dependencies + scripts
├── package.json                          # JS dependencies + scripts
└── .env.example                          # Environment template
```

---

## 10.5 Model & Database Schema

### 10.5.1 User

**Table**: `users` | **Traits**: `HasFactory`, `HasRoles`, `Notifiable`, `SoftDeletes`, `TwoFactorAuthenticatable` | **Implements**: `MustVerifyEmail`

**Fillable**: `name`, `email`, `avatar_path`, `avatar_image`, `avatar_mime_type`, `pixabot_avatar_id`, `username`, `password`, `points`, `xp`, `current_streak`, `longest_streak`, `last_active_date`, `daily_xp_earned`, `daily_goal_met_at`, `ability_estimate`, `is_admin`, `role`, `status`, `bio`, `pronoun`, `location`, `profile_visibility`

**Hidden**: `password`, `avatar_path`, `avatar_image`, `avatar_mime_type`, `two_factor_secret`, `two_factor_recovery_codes`, `remember_token`

**Appends**: `avatar` (accessor — resolves from storage, BLOB, or Pixabot fallback)

**Casts**:
- `email_verified_at` → `datetime`
- `password` → `hashed`
- `points`, `xp`, `current_streak`, `longest_streak`, `daily_xp_earned` → `integer`
- `last_active_date`, `daily_goal_met_at` → `date`
- `ability_estimate` → `float`
- `is_admin` → `boolean`
- `two_factor_confirmed_at` → `datetime`
- `profile_visibility` → `string`

**Role Constants**:
```
SUPER_ADMIN = 'Super Admin'
ADMIN = 'Admin'
USER = 'User'
ADMIN_ROLES = [SUPER_ADMIN, ADMIN]
```

**Permission Constants** (13 granular permissions):
```
access admin, manage users, view unpublished courses, manage courses,
publish courses, manage lessons, manage tasks, view unpublished assessments,
manage assessments, manage assessment questions, grade submissions,
manage enrollments, manage question bank
```

**Key Methods**: `isAdmin()`, `canAccessAdmin()`, `isSuperAdmin()`, `primaryRoleName()`, `isProfilePublic()`, `hasCustomAvatar()`, `getAvatarAttribute()`

**Relationships**:
- `enrollments()` → `HasMany<Enrollment>`
- `courses()` → `BelongsToMany<Course>` (through enrollments, pivot: progress_percentage, enrolled_at, completed_at)
- `lessonProgress()` → `HasMany<LessonProgress>`
- `balanceChanges()` → `HasMany<UserBalanceChange>`
- `socialAccounts()` → `HasMany<SocialAccount>`
- `badges()` → `BelongsToMany<Badge>` (through user_badges, pivot: earned_at)
- `labVisits()` → `HasMany<LabVisit>`

**Mutator**: `setUsernameAttribute()` — always lowercase via `strtolower(trim())`

**Scopes**: `scopeSearchManagement()`, `scopeFilterManagementRole()`

### 10.5.2 Course

**Table**: `courses` | **Trait**: `Versionable`

**Fillable**: `slug`, `title`, `summary`, `cover_path`, `sort_order`, `prerequisite_course_id`, `category`, `difficulty`, `path_position`, `is_published`, `status`, `version`, `published_by`

**Appends**: `cover` (accessor — URL from storage or SVG placeholder with first letter)

**Status Constants**: `STATUS_DRAFT = 'draft'`, `STATUS_PUBLISHED = 'published'`, `STATUS_ARCHIVED = 'archived'`

**Casts**: `status` → `string`, `version` → `integer`, `is_published` → `boolean`

**Mutator**: `setIsPublishedAttribute()` — syncs `is_published` ↔ `status`

**Relationships**:
- `prerequisite()` → `BelongsTo<Course>`
- `publishedBy()` → `BelongsTo<User>`
- `dependents()` → `HasMany<Course>` (via prerequisite_course_id)
- `lessons()` → `HasMany<Lesson>` (ordered by position)
- `tasks()` → `HasManyThrough<LessonTask>` (through lessons)
- `assessment()` → `HasOne<Assessment>` (one-to-one, final assessment)
- `assessments()` → `HasMany<Assessment>` (one-to-many, Bloom levels)
- `enrollments()` → `HasMany<Enrollment>`
- `users()` → `BelongsToMany<User>` (through enrollments)

**Scopes**: `published()`, `draft()`, `archived()`, `scopeSearchManagement()` (FULLTEXT)

**Key Methods**: `isUnlockedFor(User)`, `isPublished()`, `isDraft()`, `isArchived()`

### 10.5.3 Lesson

**Table**: `lessons` | **Trait**: `Versionable`

**Fillable**: `course_id`, `slug`, `title`, `description`, `content`, `position`, `learning_objectives`, `prerequisites_text`, `key_concepts`, `topic_id`, `prerequisite_lesson_id`, `status`, `version`, `published_by`

**Casts**: `learning_objectives` → `array`, `key_concepts` → `array`, `status` → `string`, `version` → `integer`

**Status Constants**: `STATUS_DRAFT = 'draft'`, `STATUS_PUBLISHED = 'published'`, `STATUS_ARCHIVED = 'archived'`

**Relationships**:
- `course()` → `BelongsTo<Course>`
- `topic()` → `BelongsTo<Topic>`
- `prerequisite()` → `BelongsTo<Lesson>` (self)
- `dependents()` → `HasMany<Lesson>` (self)
- `publishedBy()` → `BelongsTo<User>`
- `progress()` → `HasMany<LessonProgress>`
- `tasks()` → `HasMany<LessonTask>` (ordered by sort_order, id)

**Key Methods**: `canAccess(User)` — checks published status + prerequisite completion

### 10.5.4 LessonTask

**Table**: `lesson_tasks` | **Trait**: `Versionable`

**Fillable**: `lesson_id`, `title`, `description`, `type`, `video_url`, `document_name`, `conversion_status`, `pdf_url`, `sort_order`, `published_at`, `published_by`, `prerequisite_task_id`, `status`, `version`

**Casts**: `sort_order` → `integer`, `published_at` → `datetime`, `published_by` → `integer`, `status` → `string`, `version` → `integer`

**Status Constants**: `STATUS_DRAFT = 'draft'`, `STATUS_PUBLISHED = 'published'`, `STATUS_ARCHIVED = 'archived'`

**Task Types**: `read`, `video`, `quiz`

**Relationships**:
- `lesson()` → `BelongsTo<Lesson>`
- `prerequisite()` → `BelongsTo<LessonTask>` (self)
- `publishedBy()` → `BelongsTo<User>`
- `dependents()` → `HasMany<LessonTask>` (self)
- `quizQuestions()` → `HasMany<QuizQuestion>`
- `progress()` → `HasMany<TaskProgress>`
- `submissions()` → `HasMany<QuizSubmission>`

**Key Methods**: `canAccess(User)` — checks published status + prerequisite (quiz: score ≥ 70%; other: completed_at not null)

### 10.5.5 Assessment

**Table**: `assessments` | **Trait**: `Versionable`

**Fillable**: `slug`, `title`, `description`, `course_id`, `topic_id`, `bloom_level`, `grading_type`, `passing_score`, `max_attempts`, `time_limit_minutes`, `available_from`, `available_until`, `sort_order`, `status`, `version`, `published_by`

**Bloom's Taxonomy Levels**: `C1` (Remember), `C2` (Understand), `C3` (Apply), `C4` (Analyze), `C5` (Evaluate), `C6` (Create)

**Grading Types**: `auto`, `manual`, `mixed` (manual grading deprecated — all auto now)

**Casts**: `passing_score`, `max_attempts`, `time_limit_minutes`, `sort_order` → `integer`; `available_from`, `available_until` → `datetime`; `status` → `string`; `version` → `integer`

**Relationships**: `course()`, `topic()`, `publishedBy()`, `questions() → HasMany<AssessmentQuestion>`, `submissions() → HasMany<AssessmentSubmission>`

**Scopes**: `published()`, `available()` (published + within date range), `bloomLevel(string)`, `scopeSearchManagement()` (FULLTEXT)

**Key Methods**: `isAvailable()`, `canAttempt(User)`, `getTotalPointsAttribute()`, `getBloomLabelAttribute()`

### 10.5.6 AssessmentQuestion

**Table**: `assessment_questions` | **Hidden**: `correct_answer`

**Fillable**: `assessment_id`, `bloom_level`, `question_type`, `question_text`, `options`, `correct_answer`, `explanation`, `rubric`, `points`, `grading_type`, `min_words`, `max_words`, `sort_order`, `question_bank_id`, `difficulty_score`, `discrimination`, `times_shown`, `times_correct`

**Question Types**: `mcq`, `multiple_select`, `true_false`, `matching`, `short_answer`, `essay`

**Casts**: `options` → `array`, `rubric` → `array`, `points` → `integer`, `min_words`/`max_words` → `integer`, `sort_order` → `integer`, `difficulty_score`/`discrimination` → `decimal:2`, `times_shown`/`times_correct` → `integer`

**Key Methods**: `gradeAnswer(?string)` → returns 0.0..1.0 score fraction — dispatches per-type: `gradeSingleChoice()`, `gradeMultipleSelect()`, `gradeMatching()`, `gradeShortAnswer()`, `gradeEssay()` (keyword coverage + word count rules). Also `recordAttempt(bool)`, `updateAnalytics()`.

### 10.5.7 Other Models (Quick Reference)

| Model | Table | Key Facts |
|-------|-------|-----------|
| `Enrollment` | `enrollments` | user_id, course_id, progress_percentage, enrolled_at, completed_at |
| `LessonProgress` | `lesson_progress` | user_id, lesson_id, completed_at |
| `TaskProgress` | `task_progress` | user_id, lesson_task_id, completed_at, watch_seconds, reading_seconds, started_at |
| `QuizQuestion` | `quiz_questions` | lesson_task_id, topic_id, question, options (array), correct_option (int), difficulty_score (float), discrimination (float), times_shown/correct |
| `QuizSubmission` | `quiz_submissions` | user_id, lesson_task_id, answers (array), score, total, attempt_number |
| `AssessmentSubmission` | `assessment_submissions` | user_id, assessment_id, attempt_number, status (in_progress|submitted|grading|graded), total_score, points_earned, points_possible, passed (bool), graded_by |
| `AssessmentAnswer` | `assessment_answers` | submission_id, question_id, answer_text, points_awarded, max_points, feedback |
| `QuestionBank` | `question_bank` | question_text, question_type, bloom_level, options, correct_answer, explanation, difficulty_score, times_used |
| `Badge` | `badges` | slug, name, description, icon, category (milestone|course|streak|lab|special), tier (bronze|silver|gold|platinum), criteria_type, criteria_value, sort_order |
| `ContentVersion` | `content_versions` | versionable_type, versionable_id, version, data (JSON snapshot), user_id |
| `SocialAccount` | `social_accounts` | user_id, provider, provider_user_id, provider_email, provider_name, provider_avatar |
| `LabVisit` | `lab_visits` | user_id, lab_id, visited_at |
| `AuditLog` | `audit_logs` | user_id, action, target_type, target_id, payload (array) — no updated_at |
| `UserBalanceChange` | `user_balance_changes` | user_id, type, amount, balance_after, description |
| `Topic` | `topics` | name, slug, description |
| `UserBadge` | `user_badges` | pivot: user_id, badge_id, earned_at |

---

## 10.6 Services Layer

### 10.6.1 Gamification Services

| Service | Method | Purpose |
|---------|--------|---------|
| **XpService** | `awardTaskXp(User, LessonTask): array{xp, points}` | Award quiz completion XP + points |
| | `awardXpAndPoints(User, int): array` | Core award: XP × streak multiplier, points + level bonus (streak NO effect on points) |
| | `updateDailyStreak(User): array{xp, bonuses}` | Called from HandleInertiaRequests on each request — handles first-login bonus, streak counting, comeback bonus, points decay |
| **LevelService** | `getLevelForXp(int): array{level, current_xp, next_level_xp, progress, bonus_percent}` | Calculate level from XP total using exponential thresholds (config/levels.php) |
| **StreakService** | `getStreakInfo(User): array` | Current streak, longest streak, 7-day bonus trigger |
| **BadgeService** | `checkAndAward(User): Collection<Badge>` | Evaluate all badge criteria — milestone, course, streak, lab, special |
| | `getUserBadges(User): Collection` | Return earned badges with earned_at |
| **MasteryService** | `getMasteryForCourse(User, Course): array` | Course-level mastery percentage |
| | `getTopicMastery(User, int): float` | Topic-level mastery |
| **MasteryAnalyticsService** | `getUserMasteryProfile(User): array` | Full mastery analytics across all topics |

### 10.6.2 Assessment Services

| Service | Method | Purpose |
|---------|--------|---------|
| **AssessmentGradingService** | `processSubmission(AssessmentSubmission): void` | Auto-grade all answers + finalize within DB transaction |
| | `autoGradeAllAnswers(AssessmentSubmission): int` | Iterate answers, call `AssessmentAnswer::autoGrade()`, return graded count |
| | `finalizeSubmission(AssessmentSubmission): void` | Calculate total score, set passed/failed, mark graded, award XP |
| **RubricScoringService** | `scoreEssay(AssessmentAnswer): float` | Rubric-based essay scoring |
| **AdaptiveQuestionService** | `selectQuestionsForQuiz(User, LessonTask, int): Collection<QuizQuestion>` | Sort questions by proximity to user's mastery level; fallback to shuffle |
| **AssessmentAttemptService** | `createAttempt(User, Assessment): AssessmentSubmission` | Create new attempt, validate max_attempts |

### 10.6.3 Dashboard Services

| Service | Purpose |
|---------|---------|
| **AcademyDataBuilder** | Build hero, learning path, success metrics, leaderboard preview, activity breakdown, monthly progress, earnings history, recent activity |
| **LearnerDashboardBuilder** | Orchestrate learner dashboard: stats, level, academy, analytics, decay warning, next action, weekly goal, rank progress, risks, insights, badge goal, recent courses/badges, recommendations |
| **AdminDashboardBuilder** | Orchestrate admin dashboard: filters, stats, enrollment trends, user growth, course performance, recent users, action queue, course analytics, anomalies, report snapshot |
| **AdminAnalyticsService** | Cohort retention, gamification funnel, economy health |
| **LearnerStatsAggregator** | Aggregate per-user stats (enrolled, completed, points, XP) |
| **RecentActivityAggregator** | Recent courses + recently earned badges |
| **EarningsHistoryAggregator** | Weekly + monthly XP/points history |
| **AnalyticsBuilder** | Activity heatmap, streak calendar |

### 10.6.4 Other Services

| Service | Purpose |
|---------|---------|
| **CourseDetailBuilder** | Build complete course detail payload: lessons array with tasks, progress, quiz submissions, unlock state, assessment data, grading summary |
| **CourseCatalogBuilder** | Build paginated course catalog with user enrollment state, search, filters, sort |
| **LeaderboardService** | Monthly leaderboard top N |
| **CacheService** | Cache keys for dashboard sections |
| **DocumentConverterService** | Convert uploaded documents (PDF/images) to display format |
| **ExperimentService** | Pennant A/B test variant resolution |
| **AuditService** | Record audit log entries |
| **ProfilePageData** | Build public profile page data |
| **CourseAssetStorage** | Resolve course asset URLs (covers, documents) |
| **UserAvatarService** | Avatar upload, resize, storage |
| **SocialAvatarService** | Download & store social provider avatars |
| **PixabotAvatarService** | Pixabot-style generated avatar URL resolution |

---

## 10.7 Fitur Aplikasi (Detail)

### 10.7.1 Public Domain (`cryptere.com`)

```
GET  /                          → welcome (Inertia page)
POST /locale                   → switch locale (cookie-based)
GET  /health                   → HealthCheckController (no auth)
GET  /login                    → redirect to auth.cryptere.com/login
GET  /register                 → redirect to auth.cryptere.com/register
GET  /forgot-password          → redirect to auth.cryptere.com/forgot-password
GET  /reset-password/{token}   → redirect to auth.cryptere.com/reset-password/{token}
POST /login, /register, etc.   → 404 (POST blocked on public domain)
```

### 10.7.2 Auth Domain (`auth.cryptere.com`)

```
Fortify auto-registered routes:
  GET   /login
  POST  /login
  POST  /logout
  GET   /register
  POST  /register
  GET   /forgot-password
  POST  /forgot-password
  GET   /reset-password/{token}
  POST  /reset-password
  GET   /email/verify
  POST  /email/verification-notification
  GET   /email/verify/{id}/{hash}
  GET   /user/confirm-password
  POST  /user/confirm-password
  GET   /two-factor-challenge
  POST  /two-factor-challenge
  GET   /user/two-factor-authentication
  POST  /user/two-factor-authentication
  DELETE /user/two-factor-authentication
  POST  /user/two-factor-recovery-codes

Custom routes:
  GET   /auth/{provider}/redirect          → SocialAuthController@redirect
  GET   /auth/{provider}/callback           → SocialAuthController@callback
  GET   /api/users/check-username           → UsernameAvailabilityController (throttle:10,1)
```

**Fortify Redirects:**
- Login/Register success → `config('app.urls.app')` (app.cryptere.com/dashboard)
- Logout → `config('app.urls.public')` (cryptere.com)
- Password reset success → `config('app.urls.auth') + '/login'`

### 10.7.3 App Domain (`app.cryptere.com`) — Authenticated

```
GET   /                                        → redirect /dashboard
GET   /dashboard                               → DashboardController
GET   /courses                                 → CourseController@index
GET   /courses/{course:slug}                   → CourseController@show
POST  /courses/{course:slug}/enroll            → EnrollmentController@store (throttle:enrollment)
POST  /courses/{course:slug}/reset             → EnrollmentController@reset (throttle:enrollment)
POST  /courses/{course:slug}/lessons/{lesson}/complete → LessonProgressController@store (throttle:lesson-complete)
POST  /courses/{course:slug}/lessons/{lesson}/heartbeat → TaskHeartbeatController@store (throttle:heartbeat)
POST  /courses/{course:slug}/lessons/{lesson}/quiz → QuizSubmissionController@store (throttle:quiz-submit, returns JSON)
GET   /courses/documents/{task}                → DocumentController@show (inline serve)

# Assessments (redirected to course detail; API endpoints remain)
POST  /assessments/{assessment:slug}/start     → AssessmentSubmissionController@start
POST  /assessments/{assessment:slug}/save-answer → AssessmentSubmissionController@saveAnswer
POST  /assessments/{assessment:slug}/submit    → AssessmentSubmissionController@submit

GET   /leaderboard                             → LeaderboardController@index
GET   /labs                                    → LabController@index
GET   /labs/{lab}                              → LabController@show
GET   /search                                  → SearchController (throttle:30,1)

# Profile
GET   /profile                                 → ProfileController@showOwn (redirect to /profile/{username})
GET   /profile/{user:username}                 → ProfileController@show
GET   /profile/{user:username}/settings        → ProfileController@settings

# Settings (from routes/settings.php)
PATCH  /settings/profile                       → Settings\ProfileController@update
DELETE /settings/profile                       → Settings\ProfileController@destroy
PATCH  /settings/avatar/pixabot                → Settings\AvatarController@pixabot
DELETE /settings/avatar                        → Settings\AvatarController@destroy
PUT    /settings/password                      → Settings\PasswordController@update
DELETE /settings/social-accounts/{socialAccount} → Settings\SocialAccountController@destroy
```

### 10.7.4 Admin Panel (prefix: `/admin`)

**Middleware**: `auth`, `verified`, `permission:access admin`, `throttle:60,1`

```
# Users
GET    /admin/users                            → AdminUserController@index
PATCH  /admin/users/{user}                     → AdminUserController@update
DELETE /admin/users/{user}                     → AdminUserController@destroy

# Courses
GET    /admin/courses                          → AdminCourseController@index
POST   /admin/courses                          → AdminCourseController@store
POST   /admin/courses/reorder                  → AdminCourseController@reorder
PATCH  /admin/courses/{course}                 → AdminCourseController@update
DELETE /admin/courses/{course}                 → AdminCourseController@destroy
PATCH  /admin/courses/{course}/toggle-publish  → AdminCourseController@togglePublish
POST   /admin/courses/{course}/publish         → AdminCourseController@publishCourse
POST   /admin/courses/{course}/archive         → AdminCourseController@archiveCourse

# Lessons
POST   /admin/courses/lessons                  → AdminLessonController@store
POST   /admin/courses/lessons/reorder          → AdminLessonController@reorder
PATCH  /admin/courses/lessons/{lesson}         → AdminLessonController@update
DELETE /admin/courses/lessons/{lesson}         → AdminLessonController@destroy
POST   /admin/lessons/{lesson}/publish         → AdminLessonController@publishLesson

# Tasks
POST   /admin/courses/tasks                    → AdminTaskController@store
POST   /admin/courses/tasks/reorder            → AdminTaskController@reorder
PATCH  /admin/courses/tasks/{task}             → AdminTaskController@update
DELETE /admin/courses/tasks/{task}             → AdminTaskController@destroy
POST   /admin/tasks/{task}/publish             → AdminTaskController@publishTask

# Assessments
GET    /admin/assessments                      → redirect to admin.courses.index?section=assessment
POST   /admin/assessments                      → AdminAssessmentController@store
POST   /admin/assessments/reorder              → AdminAssessmentController@reorder
PATCH  /admin/assessments/{assessment}         → AdminAssessmentController@update
DELETE /admin/assessments/{assessment}         → AdminAssessmentController@destroy
PATCH  /admin/assessments/{assessment}/toggle-publish → AdminAssessmentController@togglePublish
POST   /admin/assessments/{assessment}/publish → AdminAssessmentController@publishAssessment
POST   /admin/assessments/{assessment}/archive → AdminAssessmentController@archiveAssessment

# Assessment Questions
POST   /admin/assessments/{assessment}/questions → AdminAssessmentQuestionController@store
PATCH  /admin/assessments/{assessment}/questions/{question} → AdminAssessmentQuestionController@update
DELETE /admin/assessments/{assessment}/questions/{question} → AdminAssessmentQuestionController@destroy
POST   /admin/assessments/{assessment}/questions/reorder → AdminAssessmentQuestionController@reorder

# Question Bank
GET    /admin/question-bank                    → QuestionBankController@index
POST   /admin/question-bank                    → QuestionBankController@store
PATCH  /admin/question-bank/{questionBank}     → QuestionBankController@update
DELETE /admin/question-bank/{questionBank}     → QuestionBankController@destroy
POST   /admin/question-bank/{questionBank}/duplicate → QuestionBankController@duplicate
POST   /admin/question-bank/bulk-import        → QuestionBankController@bulkImport
GET    /admin/question-bank/{questionBank}/usage-stats → QuestionBankController@usageStats

# Content Versions
GET    /admin/versions/{versionableType}/{versionableId} → ContentVersionController@index
GET    /admin/versions/{version}                → ContentVersionController@show
POST   /admin/versions/{version}/restore        → ContentVersionController@restore
GET    /admin/versions/{version}/compare/{compareVersion} → ContentVersionController@compare
```

---

## 10.8 Events & Broadcasting

### 10.8.1 Events

| Event | Payload | When Fired |
|-------|---------|------------|
| `XpAwarded` | `$user, $amount, $source` | Any XP award (quiz, lesson complete, streak, bonus) |
| `BadgeEarned` | `$user, $badge` | Badge criteria met → badge unlocked |
| `LessonCompleted` | `$user, $lesson, $course` | User completes all tasks in a lesson |
| `CourseCompleted` | `$user, $course` | Enrollment progress reaches 100% |
| `LeaderboardUpdated` | — | Leaderboard rankings changed |
| `Dashboard\UserStatsUpdated` | `$user` | User dashboard stats changed (broadcast to `user.{id}`) |
| `Dashboard\RankChanged` | `$user` | User leaderboard rank changed (broadcast to `user.{id}`) |
| `Dashboard\LevelUp` | `$user` | User leveled up (broadcast to `user.{id}`) |
| `Dashboard\BadgeUnlocked` | `$user` | Badge unlocked with analytics (broadcast to `user.{id}`) |

### 10.8.2 Event Listeners

| Listener | Listens To | Action |
|----------|-----------|--------|
| `LogXpAward` | `XpAwarded` | Write to `audit_logs` table |

### 10.8.3 Broadcasting Channels

| Channel | Auth | Purpose | Driver Logic |
|---------|------|---------|-------------|
| `App.Models.User.{id}` | User only | Private user notifications | Fortify-style |
| `user.{userId}` | User only | Dashboard stats, rank updates | Auth check |
| `user.{userId}.public` | Public | Public profile updates | `return true` |
| `leaderboard` | Public | Real-time leaderboard | `return true` |

**Local (Reverb)**: `BROADCAST_CONNECTION=reverb`
**Production (Pusher)**: `BROADCAST_CONNECTION=pusher`, cluster `ap1`

**Frontend Client**: `laravel-echo` + `pusher-js`, configured via Inertia shared props (`reverb` key, host, port, scheme)

---

## 10.9 Middleware Stack

### Global Middleware (Kernel)

| Middleware | Purpose | Details |
|-----------|---------|---------|
| `HandleInertiaRequests` | Shared Inertia props | User data, URLs, locale, feature flags, Reverb config, daily streak update |
| `SetLocale` | Locale detection | Cookie-priority `locale` → Accept-Language header → fallback `en` |
| `SecurityHeaders` | Content Security Policy | Per-request nonce, CSP directives (script, style, img, font, connect-src), X-Content-Type-Options, frame-ancestors none |
| `HandleAppearance` | Dark/Light mode | Cookie `appearance` → shared to Blade as `$appearance` |
| `PublicPageCacheHeaders` | Edge cache | Landing page only: `Cache-Control: public, max-age=60`, `Cloudflare-CDN-Cache-Control`, strip Set-Cookie |

### Rate Limiters (defined in AppServiceProvider)

| Limiter | Rate | Applies To |
|---------|------|-----------|
| `api` | 60/min | General API |
| `api-heavy` | 10/min | Heavy operations |
| `quiz-submit` | 10/min | POST /courses/{slug}/lessons/{lesson}/quiz |
| `session-summary` | 5/min | Quiz session summary |
| `lesson-complete` | 5/min | POST /courses/{slug}/lessons/{lesson}/complete |
| `heartbeat` | 30/min | POST /courses/{slug}/lessons/{lesson}/heartbeat |
| `enrollment` | 10/min | POST /courses/{slug}/enroll + /reset |
| `login` (Fortify) | 5/min per email+IP | Fortify login throttle |
| `two-factor` (Fortify) | 5/min | Fortify 2FA attempts |

---

## 10.10 Frontend Type System

### 10.10.1 Type Files (`resources/js/types/`)

| File | Exports |
|------|---------|
| `index.ts` | Re-exports all types |
| `auth.ts` | `User`, `UserLevel`, `UserRole`, `AuthProps` |
| `models.ts` | Shared model interfaces |
| `dashboard.ts` | `LearnerStats`, `AcademyData` (9 sub-types), `AdminData` (15 sub-types), `DashboardProps` |
| `courses.ts` | `CourseCard` (23 fields), `PaginatedCourses`, `CatalogFiltersProps`, `CoursesIndexProps` |
| `course-management.ts` | Admin course/lesson/task management types |
| `assessments.ts` | Assessment, submission, question types |
| `profile.ts` | `ProfileProps`, `ProfileSettingsProps` |
| `labs.ts` | Lab, LabVisit types |
| `navigation.ts` | Sidebar types |
| `ui.ts` | `Toast`, `Modal`, `PageProps` |
| `global.d.ts` | Global type augmentations |
| `vite-env.d.ts` | Vite client types |

### 10.10.2 Key Dashboard Types (Excerpt)

**Learner Types**: `AcademyData` (9 sub-objects: hero, learningPath, successMetrics, leaderboardPreview, activityBreakdown, monthlyProgress, earningsHistory, popularCourses, recentActivity), `AnalyticsData`, `DecayWarning`, `LearnerNextAction` (3 variants), `WeeklyGoal`, `RankProgress`, `LearningRisk`, `ProgressInsight`, `BadgeGoal`, `RecentCourse`, `RecentBadge`, `RecommendedCourse`, `StreakCalendarEntry`

**Admin Types**: `AdminStats` (12 fields), `AdminEnrollmentTrend`, `AdminUserGrowth`, `AdminCoursePerformance`, `AdminCohortRetention`, `AdminGamificationFunnelStage`, `AdminEconomyHealth` (11 fields), `AdminActionItem`, `AdminAnomaly`, `AdminCourseAnalytics`, `AdminReportSnapshot`

### 10.10.3 Wayfinder Integration

- Generated types: `php artisan wayfinder:generate --with-form --no-interaction`
- Import from: `@/actions/` (controller methods) or `@/routes/` (named routes)
- Vite plugin: `@laravel/vite-plugin-wayfinder` (currently commented out in vite.config.ts)

---

## 10.11 UI Component Library

### 10.11.1 shadcn/ui Components (50+)

Located in `resources/js/components/ui/`. All built with Radix primitives + Tailwind:

`accordion`, `alert`, `alert-dialog`, `avatar`, `badge`, `button`, `button-group`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `combobox`, `command`, `collapsible`, `data-table`, `dialog`, `direction`, `dropdown-menu`, `empty`, `field`, `input`, `input-group`, `input-otp`, `item`, `label`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `spinner`, `sonner`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`, `typography`

### 10.11.2 Custom Components

| Component | Purpose |
|-----------|---------|
| `app-sidebar.tsx` | Main navigation sidebar with collapsible sections, user menu, theme toggle |
| `animated-highlighted-chart.tsx` | Animated chart variant |

---

## 10.12 Gamification Economy

### 10.12.1 Reward Constants (`config/rewards.php`)

| Constant | Value | Description |
|----------|-------|-------------|
| `first_login_xp` | 50 | XP on first-ever login |
| `course_completion_xp` | 100 | XP when course reaches 100% |
| `course_completion_points` | 20 | Points for course completion |
| `perfect_score_xp` | 50 | XP for 100% quiz (first attempt) |
| `perfect_score_points` | 15 | Points for perfect quiz |
| `weekly_active_xp` | 30 | XP at 7-day streak |
| `comeback_xp` | 40 | XP after 7-day inactivity return |
| `comeback_gap_days` | 7 | Days inactive to trigger comeback |
| `level_up_points_per_level` | 5 | Points per level on level-up (× new_level) |
| `daily_goal_target_xp` | 100 | Target XP for daily bonus |
| `daily_goal_bonus_xp` | 20 | Bonus XP when daily goal met |
| `lesson_completion_xp` | 30 | XP per completed lesson |
| `quiz_task_xp` | 20 | XP per quiz task completion |
| `quiz_questions_per_attempt` | 4 | Questions per quiz session |
| `quiz_retry_xp_multipliers` | [1.0, 0.5, 0.25, 0.1] | XP decay on retry attempts |
| `decay_inactive_days` | 14 | Days before point decay starts |
| `decay_percent` | 1 | Daily decay percentage |
| `decay_min_points` | 10 | Minimum point floor after decay |

### 10.12.2 Level Curve (`config/levels.php`)

- **50 levels** total, exponential formula: `min_xp = floor(50 × 1.12^(level−1))`
- **Level 1**: 0 XP → **Level 10**: 139 XP → **Level 25**: 758 XP → **Level 50**: 12,873 XP
- **Bonus**: each level grants +0.2% point earning bonus (Level 10 = +2%, Level 50 = +10%)
- Pacing: ~70 XP/day → Level 10 in ~2 sessions, Level 20 in ~1 week, Level 50 in ~6 months

### 10.12.3 Streak System

- Tracked per-user: `current_streak`, `longest_streak`, `last_active_date`
- Streak XP multiplier applied via `XpService::awardXpAndPoints()`
- Points are NOT affected by streak — only XP
- 7-day streak bonus: `weekly_active_xp` (30 XP)
- Comeback bonus: after 7+ days inactive → `comeback_xp` (40 XP)
- Points decay: after 14 days inactive, 1% per day, minimum 10 points

### 10.12.4 Badge Categories & Tiers

| Category | Description | Tiers |
|----------|-------------|-------|
| `milestone` | XP/level milestones | Bronze → Silver → Gold → Platinum |
| `course` | Course completions | Bronze → Silver → Gold → Platinum |
| `streak` | Streak achievements | Bronze → Silver → Gold → Platinum |
| `lab` | Lab completions | Bronze → Silver → Gold → Platinum |
| `special` | Special events | Any tier |

---

## 10.13 Feature Flags (Pennant)

| Feature Class | Pennant Name | Scope | Purpose |
|---------------|-------------|-------|---------|
| `IndonesianLocale` | `indonesian-locale` | User | Controlled rollout of Indonesian UI |
| `GamificationRewardVariant` | — (A/B via ExperimentService) | User | A/B test reward multiplier amounts |
| `RealtimeLeaderboard` | `realtime-leaderboard` | Global | Toggle real-time leaderboard updates |

**Definition** (in AppServiceProvider::boot):
```php
Feature::define('realtime-leaderboard', RealtimeLeaderboard::class);
Feature::define('indonesian-locale', IndonesianLocale::class);
```

---

## 10.14 Testing Strategy

### 10.14.1 PHP — Pest v4

| Type | Location | Command |
|------|----------|---------|
| Feature tests | `tests/Feature/` | `php artisan test --compact` |
| Unit tests | `tests/Unit/` | `php artisan test --compact --filter=TestName` |
| Architecture tests | Inline with `arch()` | `php artisan test --compact` |

**Key rules:**
- All models have factories — use `ModelName::factory()->create()` in tests
- Use `RefreshDatabase` trait where needed
- Write both happy-path and edge-case test scenarios
- Faker: `$this->faker->word()` or `fake()->randomDigit()`

### 10.14.2 Frontend — Vitest v4

| Command | Purpose |
|---------|---------|
| `npm run test:unit` | Run all unit tests |
| `npm run test:unit:watch` | Watch mode |
| `npm run test:unit:coverage` | With V8 coverage report |

### 10.14.3 E2E — Playwright v1.59

| Command | Purpose |
|---------|---------|
| `npm run e2e` | Headless (all 5 browsers) |
| `npm run e2e:headed` | Headed mode for debugging |

**Browser projects**: Chromium, Firefox, WebKit, Mobile Chrome (Pixel 7), Mobile Safari (iPhone 14)
**Base URL**: `PLAYWRIGHT_BASE_URL` or `http://127.0.0.1:8000`
**Web server**: auto-starts `php artisan serve --host=127.0.0.1 --port=8000`

---

## 10.15 Development Workflow

### 10.15.1 First-Time Setup

```bash
git clone https://github.com/Cnagnn/Cryptere.git
cd Cryptere
composer setup   # composer install + env setup + key:generate + migrate + npm install + build
```

### 10.15.2 Daily Development

```bash
composer dev     # 3 processes: php artisan serve + queue:listen + npm run dev
```

### 10.15.3 Type Generation (Wayfinder)

```bash
npm run types    # php artisan wayfinder:generate --with-form --no-interaction
```

**Run after any route or controller change.** Frontend imports from `@/actions/` and `@/routes/`.

### 10.15.4 Code Quality

```bash
composer lint           # PHP: pint --parallel
composer lint:check     # PHP: pint --test
npm run format          # Prettier fix
npm run format:check    # Prettier check
npm run lint            # ESLint fix
npm run lint:check      # ESLint check
npm run types:check     # tsc --noEmit
```

### 10.15.5 Pre-Commit CI

```bash
composer ci:check       # lint:check + format:check + types:check + php artisan test
```

### 10.15.6 Creating New Files

```bash
php artisan make:model Nama -mf            # Model + migration + factory
php artisan make:controller Nama           # Controller
php artisan make:test Nama --pest          # Feature test
php artisan make:test Nama --pest --unit   # Unit test
php artisan make:class Nama                # Generic PHP class
```

---

## 10.16 Build & Bundling

### 10.16.1 Vite Configuration

| Setting | Value |
|---------|-------|
| Entry points | `resources/css/app.css`, `resources/js/app.tsx` |
| Dev server | `127.0.0.1` with HMR on `127.0.0.1` |
| Source maps | Hidden, only when `VITE_BUILD_SOURCEMAP=true` |
| React Compiler | Opt-in: `VITE_REACT_COMPILER=true` + production |
| CSS | `@tailwindcss/vite` plugin (Tailwind v4) |
| Wayfinder | `@laravel/vite-plugin-wayfinder` (currently commented) |

### 10.16.2 NPM Scripts

```bash
npm run dev               # Vite dev server + HMR
npm run build             # Production build
npm run types             # Wayfinder type generation
npm run format            # Prettier write
npm run format:check      # Prettier dry-run
npm run lint              # ESLint fix
npm run lint:check        # ESLint dry-run
npm run types:check       # TypeScript type check
npm run test:unit         # Vitest
npm run test:unit:watch   # Vitest watch
npm run test:unit:coverage # Vitest + coverage
npm run e2e               # Playwright headless
npm run e2e:headed        # Playwright headed
```

### 10.16.3 Composer Scripts

```bash
composer setup            # Full install + migrate + build
composer dev              # Concurrent server + queue + vite
composer lint             # Pint fix
composer lint:check       # Pint dry-run
composer test             # Pint check + artisan test
composer ci:check         # Full CI pipeline
```

---

## 10.17 Deployment (cPanel + Cloudflare)

### 10.17.1 Hosting Specs

| Item | Value |
|------|-------|
| Provider | HyperCloudHost (cPanel shared hosting) |
| Hosting Package | Cloud Mini |
| Server Name | `srv100.hypercloudhost.com` |
| Server IP | `157.66.55.62` |
| cPanel URL | `https://cpanel.cryptere.com:2083` (atau langsung IP `:2083`) |
| cPanel username | `fkdzqxmc` |
| Home directory | `/home/fkdzqxmc/` |
| App directory | `/home/fkdzqxmc/Cryptere` |
| Public directory | `/home/fkdzqxmc/public_html` (apex `cryptere.com`) |
| PHP version | 8.4.21 (`/usr/local/bin/php`) |
| Composer | `/opt/alt/php84/usr/bin/composer` |
| Database | `fkdzqxmc_cryptere` (MariaDB 10.11 via `127.0.0.1`) |
| Apache | 2.4.67 |
| Kernel | Linux 6.12 (CloudLinux) |
| Node.js (cPanel App) | Node 22 venv: `/home/fkdzqxmc/nodevenv/cryptere/22/` |
| Nameserver hosting | `ns1.hypercloudhost.com`, `ns2.hypercloudhost.com` (TIDAK dipakai — pindah ke Cloudflare) |
| Domain registrar | Spaceship.com (`cryptere.com`) |

### 10.17.2 Cloudflare DNS (Active)

| Item | Value |
|------|-------|
| Cloudflare Account | Yogapratamaputrar@gmail.com's Account |
| Account ID | `326128e974c9b213fb6bcc540643c657` |
| Zone | `cryptere.com` |
| Zone ID | `78b7247ea208e310ec2d591f2dc4f367` |
| Plan | Free |
| Status | `active` |
| Nameservers (set di Spaceship) | `albert.ns.cloudflare.com`, `khloe.ns.cloudflare.com` |

**DNS Records (12 total) — di-provision via Cloudflare MCP:**

| Record | Target | Proxy | Purpose |
|--------|--------|:-----:|---------|
| `cryptere.com` (A) | 157.66.55.62 | 🟠 Proxied | Apex — public landing |
| `www.cryptere.com` (A) | 157.66.55.62 | 🟠 Proxied | Redirect ke apex |
| `app.cryptere.com` (A) | 157.66.55.62 | 🟠 Proxied | Main project (authenticated) |
| `auth.cryptere.com` (A) | 157.66.55.62 | 🟠 Proxied | Fortify auth routes |
| `cpanel.cryptere.com` (A) | 157.66.55.62 | ⚪ DNS-only | cPanel akses (port 2083) |
| `webmail.cryptere.com` (A) | 157.66.55.62 | ⚪ DNS-only | Webmail (port 2096) |
| `webdisk.cryptere.com` (A) | 157.66.55.62 | ⚪ DNS-only | WebDisk (port 2078) |
| `mail.cryptere.com` (A) | 157.66.55.62 | ⚪ DNS-only | SMTP/IMAP (port 25/465/587) |
| `ftp.cryptere.com` (A) | 157.66.55.62 | ⚪ DNS-only | FTP (port 21) |
| `cryptere.com` (MX) | `mail.cryptere.com` (priority 10) | — | Email cPanel |
| `cryptere.com` (TXT/SPF) | `v=spf1 +a +mx +ip4:157.66.55.62 ~all` | — | SPF |
| `_dmarc.cryptere.com` (TXT) | `v=DMARC1; p=quarantine; rua=mailto:postmaster@cryptere.com` | — | DMARC |

**Catatan penting:**
- Subdomain `cpanel/webmail/webdisk/mail/ftp` **WAJIB DNS-only (grey cloud)** — Cloudflare proxy hanya support port HTTP/HTTPS standar (80/443/8080/8443), tidak support port khusus cPanel.
- Subdomain `cryptere.com/www/app/auth` **proxied (orange cloud)** untuk dapat CDN, cache, DDoS protection.

### 10.17.3 Cloudflare Zone Settings (manual via dashboard)

Setting berikut **harus di-apply manual** di Cloudflare dashboard karena scope OAuth MCP tidak include `zone_settings:edit`:

**SSL/TLS → Overview**
- Encryption mode: **Full** (upgrade ke **Full (Strict)** setelah cPanel AutoSSL aktif)

**SSL/TLS → Edge Certificates**
- Always Use HTTPS: ON
- Automatic HTTPS Rewrites: ON
- Minimum TLS Version: 1.2
- TLS 1.3: ON
- Opportunistic Encryption: ON

**Speed → Optimization**
- Brotli: ON
- Early Hints: ON
- HTTP/3 (QUIC): ON
- 0-RTT Connection Resumption: ON
- **Rocket Loader: OFF** ⚠️ (penting — bisa break React/Vite hydration)

**Caching → Configuration**
- Browser Cache TTL: 4 hours
- Always Online: ON
- Development Mode: OFF

**Security → Settings**
- Security Level: Medium
- Browser Integrity Check: ON
- Challenge Passage: 30 minutes

**Network**
- HTTP/2: ON
- HTTP/3: ON
- WebSockets: ON ⚠️ (wajib untuk Reverb/Pusher broadcasting)
- IPv6 Compatibility: ON

### 10.17.4 Cloudflare MCP Integration

Akses Cloudflare via OpenCode MCP (`https://mcp.cloudflare.com/mcp`) — OAuth-based.

**Scope yang dimiliki token OAuth saat ini:**
- ✅ `zone:read`, `dns_records:edit`, `dns_records:read`, `dns_settings:read`, `dns_analytics:read`
- ✅ `workers:*`, `pages:*`, `r2_*`, `d1:write`, `kv_*`, `queues:write`, `vectorize:write`
- ✅ `ai:*`, `aig:*`, `ai-search:*`, `email_routing:write`, `email_sending:write`
- ❌ **TIDAK ada `zone:create`** — buat zone harus via dashboard manual
- ❌ **TIDAK ada `zone_settings:edit`** atau `zone:edit` — settings harus manual

**Operasi yang bisa otomatis via MCP:**
- ✅ List/create/update/delete DNS records
- ✅ Manage Workers, Pages, R2, D1, KV, Queues, Vectorize
- ✅ AI Gateway, Email Routing config

**Operasi yang harus manual via dashboard:**
- ❌ Create zone
- ❌ Update SSL/TLS mode, optimization, security settings
- ❌ Generate Origin Certificate (butuh `ssl_certs:write` yang ada, tapi belum ditest)

### 10.17.5 cPanel Setup Checklist

Subdomain harus di-add di cPanel **sebelum** akses HTTP berhasil:

| Domain | Type | Document Root | Status |
|--------|------|---------------|--------|
| `cryptere.com` | Primary | `/home/fkdzqxmc/public_html` | ✅ default |
| `www.cryptere.com` | Alias | (sama) | auto |
| `app.cryptere.com` | Subdomain | `/home/fkdzqxmc/Cryptere/public` | ⏳ TODO add |
| `auth.cryptere.com` | Subdomain | `/home/fkdzqxmc/Cryptere/public` | ⏳ TODO add (point ke Laravel sama dengan `app`) |

**Catatan:** `app` dan `auth` keduanya point ke `/home/fkdzqxmc/Cryptere/public` (Laravel project yang sama). Multi-subdomain routing di-handle Laravel via `RouteServiceProvider` + middleware (lihat `routes/web.php` & `app/Providers/RouteServiceProvider.php`).

**AutoSSL:** Harus di-run setelah subdomain ter-add dan DNS propagate. Letak menu: cPanel → SSL/TLS Status → Run AutoSSL.

### 10.17.6 Git Deployment (`.cpanel.yml`)

```yaml
deployment:
  tasks:
    - export APPPATH=/home/fkdzqxmc/Cryptere
    - export PUBLICPATH=/home/fkdzqxmc/public_html
    - cd ${APPPATH}
    - php artisan optimize:clear
    - /bin/rm -rf ${PUBLICPATH}/build
    - /bin/mkdir -p ${PUBLICPATH}
    - /bin/cp -R public/build ${PUBLICPATH}/build
```

### 10.17.7 Production `.env` Template

```env
APP_NAME=Cryptere
APP_ENV=production
APP_DEBUG=false
APP_KEY=...

PUBLIC_DOMAIN=cryptere.com
AUTH_DOMAIN=auth.cryptere.com
APP_DOMAIN=app.cryptere.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1          # WAJIB: 127.0.0.1, bukan localhost (resolve ke socket)
DB_PORT=3306
DB_DATABASE=fkdzqxmc_cryptere
DB_USERNAME=fkdzqxmc_...
DB_PASSWORD=...

BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=2164173
PUSHER_APP_KEY=...
PUSHER_APP_SECRET=...
PUSHER_APP_CLUSTER=ap1

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
CACHE_STORE=database
QUEUE_CONNECTION=database

MAIL_MAILER=smtp
MAIL_ENCRYPTION=ssl         # BUKAN MAIL_SCHEME=smtps (Laravel ignore)

SENTRY_LARAVEL_DSN=...
SENTRY_TRACES_SAMPLE_RATE=0.1
```

### 10.17.8 Production Pitfalls

- ⚠️ `DB_HOST` harus `127.0.0.1` — `localhost` resolve ke Unix socket, bukan TCP
- ⚠️ `MAIL_ENCRYPTION=ssl` — jangan pakai `MAIL_SCHEME=smtps` (Laravel tidak mengenalinya)
- ⚠️ Git clone via token: `https://TOKEN@github.com/user/repo.git`
- ⚠️ `.cpanel.yml` gunakan `${HOME}`, bukan hardcoded path
- ⚠️ `APP_ENV=production`, `APP_DEBUG=false`
- ⚠️ Production password minimum 12 chars, mixed case, letters, numbers, symbols, uncompromised
- ⚠️ Subdomain `cpanel/webmail/mail/webdisk/ftp` di Cloudflare WAJIB DNS-only (grey cloud)
- ⚠️ Cloudflare SSL mode mulai dari **Full**, baru ke **Full (Strict)** setelah cPanel AutoSSL valid
- ⚠️ Rocket Loader Cloudflare WAJIB OFF (incompatible dengan React/Vite)

### 10.17.9 Deployment Progress Log

**Tanggal mulai:** 2026-06-15

| Tahap | Status | Catatan |
|-------|:------:|---------|
| Beli domain `cryptere.com` di Spaceship | ✅ | |
| Setup hosting cPanel HyperCloudHost | ✅ | Cloud Mini, IP `157.66.55.62` |
| Add zone `cryptere.com` di Cloudflare (manual) | ✅ | Free plan, status `active` |
| Update nameserver di Spaceship → Cloudflare | ✅ | `albert.ns` & `khloe.ns` aktif |
| Provision 12 DNS records via MCP | ✅ | A, MX, TXT untuk apex/www/app/auth/cpanel/mail/dll |
| Verifikasi `cpanel.cryptere.com:2083` reachable | ✅ | DNS propagate global, port 2083 OK, HTTP/2 200 |
| Cloudflare zone settings (SSL/Speed/Security) | ⏳ | Manual di dashboard — TODO |
| Add subdomain `app.cryptere.com` di cPanel | ⏳ | Document root: `/home/fkdzqxmc/Cryptere/public` |
| Add subdomain `auth.cryptere.com` di cPanel | ⏳ | Document root: `/home/fkdzqxmc/Cryptere/public` (sama) |
| Run AutoSSL di cPanel | ⏳ | Untuk semua subdomain |
| Clone repo Cryptere ke `/home/fkdzqxmc/Cryptere` | ⏳ | Via Git Version Control cPanel |
| Setup `.env` production | ⏳ | DB credentials, Pusher, Sentry, dll |
| Build & migrate (composer, npm, artisan) | ⏳ | |
| Setup landing page di `public_html` | ⏳ | HTML/static atau builder |
| Upgrade Cloudflare SSL ke Full (Strict) | ⏳ | Setelah AutoSSL aktif |
| Ganti password cPanel default | ⚠️ | **PENTING — masih pakai password awal HyperCloudHost** |

---

## 10.18 Security Configuration

### 10.18.1 Content Security Policy

Nonce-based CSP generated per-request in `SecurityHeaders`:
- `script-src`: self + nonce + `https://*.sentry.io`
- `style-src`: self + nonce
- `style-src-elem`: self + unsafe-inline + Google Fonts
- `img-src`: self + data: + blob: + CloudFront CDN
- `font-src`: self + data: + Google Fonts CDN
- `connect-src`: self + Sentry + Pusher (https + wss) + Reverb (dynamic)
- `object-src`: none
- `frame-ancestors`: none
- Local dev: additional Vite HMR origins allowed

### 10.18.2 Other Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (implicit via CSP frame-ancestors)
- Landing page: `Cache-Control: public, max-age=60, s-maxage=300`

### 10.18.3 Fortify Security

- Two-factor auth: TOTP with confirm + password confirmation window
- Login throttle: 5 req/min per email+IP combination
- Username check throttle: 10 req/min
- Email verification required before accessing `/app` domain

### 10.18.4 Database Protections

- `DB::prohibitDestructiveCommands()` in production (prevents `DROP`, `TRUNCATE`, etc.)
- `Model::preventLazyLoading()` in non-production (catches N+1 queries)

---

## 10.19 Notifications

| Notification Class | Trigger | Channel |
|-------------------|---------|---------|
| `VerifyEmailNotification` | New user registration | Email |
| `CourseCompleted` | Enrollment reaches 100% | Database |
| `StreakMilestone` | Streak reaches milestone (7, 30, 100 days) | Database |
| `PointDecayWarning` | Inactivity about to trigger point decay | Database |
| `AchievementUnlocked` | Badge or milestone achieved | Database |
| `AssessmentGradedNotification` | Assessment auto-graded | Database |

---

## 10.20 Config Files Reference

| Config File | Key Settings |
|-------------|-------------|
| `app.php` | Multi-domain (`domains`, `urls`), timezone `Asia/Jakarta`, locale `en`/`id`, session domain |
| `fortify.php` | Auth domain via `config('app.domains.auth')`, redirects via `config('app.urls.*')`, 2FA enabled, views=true |
| `broadcasting.php` | Reverb (local) + Pusher (production) — auto-switch via env `BROADCAST_CONNECTION` |
| `filesystems.php` | `course_assets_disk` env-configurable, local/public/s3 disks |
| `pennant.php` | Database driver, `features` table |
| `permission.php` | Spatie models, team support disabled |
| `scramble.php` | Custom route resolver (web routes), export to `api.json`, Stoplight UI |
| `rewards.php` | All gamification constants — single source of truth |
| `levels.php` | 50-level exponential XP curve with bonus_percent per level |
| `auth.php` | Fortify guard, password broker |
| `queue.php` | Database driver |
| `session.php` | Database driver, domain cookie |
| `cache.php` | Database store |
| `logging.php` | Stack channel, single file, debug level |
| `sentry.php` | DSN + traces sample rate from env |
