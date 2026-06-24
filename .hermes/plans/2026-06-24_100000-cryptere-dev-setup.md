# Cryptere Dev Environment Setup Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Get Cryptere running locally on CachyOS for development.

**Architecture:** Laravel 13 + Inertia.js v3 + React 19 + Tailwind v4 + MySQL (MariaDB). Backend serves Inertia pages, Vite handles HMR, MariaDB stores data.

**Tech Stack:** PHP 8.4+, Composer, MariaDB, Node.js 20+, pnpm

---

## Current State

- Repo cloned to `/home/cnagn/Projects/Cryptere` (shallow clone, 1 commit)
- **Node.js v26.2.0** — installed, OK
- **PHP** — NOT installed
- **Composer** — NOT installed
- **MariaDB/MySQL** — NOT installed
- **pnpm** — NOT installed
- All available in CachyOS repos via `paru`

## Project Context

- Gamified e-learning platform (courses, quizzes, challenges, XP/streaks/badges, leaderboards)
- 21 Eloquent models, 44 migrations, 29 services
- Auth via Laravel Fortify + Socialite (GitHub/Google OAuth)
- Real-time via Laravel Reverb (WebSockets)
- Testing: Pest 4 (PHP), Vitest (JS), Playwright (E2E)
- `.env.local.example` uses MySQL on 127.0.0.1:3306, DB name `cryptere`, user `cryptere`
- Dev command: `composer dev` (runs artisan serve + queue listener + vite concurrently)

---

## Task 1: Install PHP 8.4 + Extensions (AUR)

**Objective:** Install PHP 8.4 (exact version match with composer.json `^8.3`) with all extensions Laravel 13 needs.

**Note:** CachyOS main repos only have PHP 8.5. PHP 8.4 is available from AUR as split packages (`php84`, `php84-gd`, etc). AUR packages are at 8.4.17 — marked out-of-date but still valid 8.4.

**Commands:**
```bash
paru -S --needed php84 php84-bcmath php84-curl php84-fileinfo php84-gd php84-intl php84-mbstring php84-mysql php84-openssl php84-pdo php84-sqlite php84-tokenizer php84-xml php84-zip php84-ctype
```

**Note:** AUR php84 uses split packages — each extension is a separate package that installs a `.so` module. After install, the `php` binary will be `php84`.

**Verify:**
```bash
php84 -v
# Expected: PHP 8.4.x

php84 -m | grep -iE 'pdo_mysql|gd|intl|bcmath|zip|curl|mbstring|xml|fileinfo|ctype|tokenizer|openssl|pdo'
# Expected: all listed extensions present
```

**Post-install:** Create symlink so `php` points to `php84`:
```bash
sudo ln -sf /usr/bin/php84 /usr/local/bin/php
```

**Verify symlink:**
```bash
php -v
# Expected: PHP 8.4.x
```

---

## Task 2: Install Composer

**Objective:** Install PHP dependency manager.

**Commands:**
```bash
paru -S --needed composer
```

**Verify:**
```bash
composer -V
# Expected: Composer version 2.x
```

---

## Task 3: Install MariaDB

**Objective:** Install MySQL-compatible database server.

**Commands:**
```bash
paru -S --needed mariadb
```

**Verify:**
```bash
mariadb --version
```

---

## Task 4: Initialize and Start MariaDB

**Objective:** Initialize data directory and start the service.

**Steps:**

1. Initialize MariaDB data directory:
```bash
sudo mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
```

2. Enable and start the service:
```bash
sudo systemctl enable --now mariadb
```

3. Secure installation (optional but recommended):
```bash
sudo mariadb-secure-installation
```
Set root password when prompted. Answer Y to remove anonymous users, disallow remote root, remove test DB, reload privileges.

**Verify:**
```bash
sudo systemctl status mariadb
# Expected: active (running)

sudo mariadb -u root -p -e "SELECT VERSION();"
# Expected: MariaDB version string
```

---

## Task 5: Create Database and User

**Objective:** Create the `cryptere` database and user matching `.env.local.example`.

**Commands:**
```bash
sudo mariadb -u root -p <<'SQL'
CREATE DATABASE IF NOT EXISTS cryptere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'cryptere'@'localhost' IDENTIFIED BY 'cryptere';
GRANT ALL PRIVILEGES ON cryptere.* TO 'cryptere'@'localhost';
FLUSH PRIVILEGES;
SQL
```

**Verify:**
```bash
mariadb -u cryptere -pcryptere -e "SHOW DATABASES;"
# Expected: cryptere listed
```

---

## Task 6: Install pnpm

**Objective:** Install pnpm package manager (README specifies pnpm, pnpm-lock.yaml present).

**Commands:**
```bash
paru -S --needed pnpm
```

**Verify:**
```bash
pnpm -v
# Expected: 11.x
```

---

## Task 7: Configure .env

**Objective:** Create `.env` from `.env.local.example` with correct DB credentials.

**Files:**
- Create: `/home/cnagn/Projects/Cryptere/.env` (copy from `.env.local.example`)

**Steps:**

1. Copy the example:
```bash
cp .env.local.example .env
```

2. Edit `.env` — set DB password (already has DB_DATABASE=cryptere, DB_USERNAME=cryptere):
```
DB_PASSWORD=cryptere
```

3. Leave OAuth credentials (GITHUB_CLIENT_ID, GOOGLE_CLIENT_ID) empty for now — social login won't work but local email/password auth will.

**Verify:**
```bash
grep DB_ .env
# Expected: DB_CONNECTION=mysql, DB_HOST=127.0.0.1, DB_PORT=3306, DB_DATABASE=cryptere, DB_USERNAME=cryptere, DB_PASSWORD=cryptere
```

---

## Task 8: Install PHP Dependencies

**Objective:** Run composer install.

**Commands:**
```bash
cd /home/cnagn/Projects/Cryptere
composer install
```

**Verify:**
```bash
php artisan --version
# Expected: Laravel Framework 13.x
```

---

## Task 9: Generate App Key

**Objective:** Generate Laravel application encryption key.

**Commands:**
```bash
php artisan key:generate
```

**Verify:**
```bash
grep APP_KEY .env
# Expected: APP_KEY=base64:... (non-empty)
```

---

## Task 10: Run Migrations

**Objective:** Create all 44 database tables.

**Commands:**
```bash
php artisan migrate
```

**Verify:**
```bash
php artisan migrate:status
# Expected: all migrations showing "Ran"

mariadb -u cryptere -pcryptere cryptere -e "SHOW TABLES;" | wc -l
# Expected: 45+ (tables + header)
```

---

## Task 11: Install JS Dependencies

**Objective:** Install frontend packages via pnpm.

**Commands:**
```bash
pnpm install
```

**Verify:**
```bash
pnpm ls --depth 0 | head -5
# Expected: list of installed packages
```

---

## Task 12: Build Frontend Assets

**Objective:** Compile frontend for first run (Vite build).

**Commands:**
```bash
pnpm run build
```

**Verify:**
```bash
ls -la public/build/
# Expected: built assets directory
```

---

## Task 13: Start Dev Server and Verify

**Objective:** Launch the full dev stack and verify the app loads.

**Commands:**
```bash
composer dev
```

This runs concurrently:
- `php artisan serve` → http://127.0.0.1:8000
- `php artisan queue:listen` → Queue worker
- `npm run dev` (vite) → HMR

**Verify:**
1. Open http://127.0.0.1:8000 in browser
2. Welcome page should load
3. Click "Register" → registration form appears
4. Register a test account → should redirect to dashboard
5. Dashboard loads with gamification elements

**Alternative verification (no browser):**
```bash
curl -s http://127.0.0.1:8000 | head -20
# Expected: HTML with <title>Cryptere</title> or welcome page content
```

---

## Task 14: Run Database Seeder (Optional)

**Objective:** Populate dev database with sample data.

**Commands:**
```bash
php artisan db:seed
```

**Note:** Check if seeders exist first:
```bash
ls database/seeders/
```

If only `DatabaseSeeder.php` exists and it's empty, skip this task.

---

## Summary: What Gets Installed

| Package | Purpose | Approx Size |
|---------|---------|-------------|
| php84 + extensions (AUR) | Backend runtime | ~40 MiB |
| composer | PHP dep manager | ~3.4 MiB |
| mariadb | Database server | ~200 MiB |
| pnpm | JS package manager | ~11 MiB |

**Total system packages:** ~255 MiB

## Risks and Notes

- **PHP 8.4 (AUR)**: Repo CachyOS cuma punya PHP 8.5. PHP 8.4 dari AUR (8.4.17) — package-nya marked out-of-date tapi still valid. Split packages, jadi tiap ekstensi install terpisah. Binary-nya `php84`, perlu symlink ke `php`.
- **MariaDB vs MySQL**: MariaDB 12.3 is MySQL-compatible. Laravel's `mysql` driver works with MariaDB. Some edge-case SQL features may differ but standard Laravel ORM operations are fine.
- **Node v26**: README says 20+, v26 is newer and should work. If Vite has issues, may need to check compatibility.
- **OAuth (Socialite)**: GitHub/Google login won't work without API keys. Email/password registration works out of the box via Fortify.
- **Sentry/Reverb**: Configured but optional for local dev. Reverb (WebSockets) will work locally; Sentry needs a DSN.
- **Memory**: 8GB RAM + 7.5GB swap. MariaDB + PHP + Vite + Node should fit comfortably. If tight, MariaDB can be tuned with smaller buffer pool.
- **Shallow clone**: Only 1 commit cloned (`--depth 1`). Full history available via `git fetch --unshallow` if needed.

## Verification Checklist

- [ ] PHP 8.4 installed with all extensions
- [ ] Composer installed
- [ ] MariaDB running
- [ ] Database `cryptere` + user created
- [ ] pnpm installed
- [ ] `.env` configured
- [ ] `composer install` succeeded
- [ ] `php artisan key:generate` ran
- [ ] `php artisan migrate` succeeded
- [ ] `pnpm install` succeeded
- [ ] `pnpm run build` succeeded
- [ ] `composer dev` starts without errors
- [ ] http://127.0.0.1:8000 loads welcome page
- [ ] Registration + login works
