# Panduan Deploy Laravel Crypter ke cPanel

## Prasyarat

- cPanel dengan PHP 8.4+ (atau minimal PHP 8.2)
- MySQL/MariaDB database
- SSH access (sangat direkomendasikan)
- Node.js 18+ (untuk build assets)
- Composer

## Langkah 1: Persiapan File

### 1.1 Build Assets di Local

Sebelum upload, build assets di komputer lokal:

```bash
# Di folder project lokal
npm ci
npm run build
```

Ini akan menghasilkan folder `public/build` yang berisi compiled assets.

### 1.2 Install Dependencies Production

```bash
composer install --no-dev --optimize-autoloader
```

### 1.3 File yang Perlu Di-Upload

Upload semua file **KECUALI**:
- `node_modules/` (tidak perlu)
- `.git/` (tidak perlu)
- `tests/` (opsional, bisa di-upload jika ingin testing di server)
- `.env` (akan dibuat manual di server)
- `storage/logs/*` (akan dibuat otomatis)
- `bootstrap/cache/*` (akan dibuat otomatis)

## Langkah 2: Upload ke cPanel

### Opsi A: Via SSH (Direkomendasikan)

```bash
# Compress project di local
tar -czf crypter.tar.gz --exclude=node_modules --exclude=.git .

# Upload via SCP
scp crypter.tar.gz username@your-domain.com:~/

# Login SSH
ssh username@your-domain.com

# Extract
cd ~/
tar -xzf crypter.tar.gz -C ~/public_html/
```

### Opsi B: Via File Manager cPanel

1. Compress project menjadi ZIP (exclude `node_modules` dan `.git`)
2. Upload ZIP via File Manager cPanel
3. Extract di folder yang diinginkan (biasanya `public_html` atau subfolder)

## Langkah 3: Struktur Folder di cPanel

**PENTING**: Laravel memerlukan struktur khusus di cPanel.

### Struktur yang Benar:

```
/home/username/
├── crypter/              # Folder aplikasi Laravel (di luar public_html)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── artisan
│   ├── composer.json
│   └── public/          # Folder public Laravel
│       ├── index.php
│       ├── build/
│       └── images/
│
└── public_html/         # Document root cPanel
    └── (symlink atau copy dari crypter/public/)
```

### Setup Document Root

**Pilihan 1: Symlink (Jika SSH tersedia)**

```bash
# Hapus public_html default
rm -rf ~/public_html

# Buat symlink ke folder public Laravel
ln -s ~/crypter/public ~/public_html
```

**Pilihan 2: Copy Manual**

Jika symlink tidak bisa, copy isi folder `public/` ke `public_html/` dan edit `index.php`:

```php
// File: public_html/index.php
// Ubah path ini:
require __DIR__.'/../bootstrap/app.php';

// Menjadi:
require __DIR__.'/../crypter/bootstrap/app.php';
```

## Langkah 4: Konfigurasi Database

### 4.1 Buat Database di cPanel

1. Login cPanel → MySQL Databases
2. Buat database baru (contoh: `username_crypter`)
3. Buat user baru (contoh: `username_crypter_user`)
4. Set password yang kuat
5. Tambahkan user ke database dengan **ALL PRIVILEGES**

### 4.2 Catat Informasi Database

```
DB_HOST=localhost
DB_DATABASE=username_crypter
DB_USERNAME=username_crypter_user
DB_PASSWORD=your_secure_password
```

## Langkah 5: Konfigurasi Environment (.env)

### 5.1 Buat File .env

Via SSH:
```bash
cd ~/crypter
cp .env.example .env
nano .env
```

Via File Manager cPanel:
1. Copy `.env.example` → `.env`
2. Edit `.env`

### 5.2 Konfigurasi Wajib

```env
APP_NAME="Crypter"
APP_ENV=production
APP_KEY=                          # Akan di-generate
APP_DEBUG=false                   # PENTING: false untuk production
APP_TIMEZONE=Asia/Jakarta
APP_URL=https://your-domain.com   # URL lengkap dengan https

LOG_CHANNEL=daily
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=username_crypter
DB_USERNAME=username_crypter_user
DB_PASSWORD=your_secure_password

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database         # Gunakan database jika Redis tidak tersedia

CACHE_STORE=file                  # Atau redis jika tersedia
SESSION_DRIVER=database
SESSION_LIFETIME=120

# Email Configuration (WAJIB untuk auth)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com          # Sesuaikan dengan provider
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"

# OAuth (Opsional, bisa dikosongkan dulu)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Sentry (Opsional untuk error tracking)
SENTRY_LARAVEL_DSN=
VITE_SENTRY_DSN=
```

## Langkah 6: Generate Application Key

```bash
cd ~/crypter
php artisan key:generate
```

Atau via cPanel Terminal / SSH.

## Langkah 7: Set Permissions

```bash
cd ~/crypter

# Set ownership (sesuaikan dengan user cPanel)
chown -R username:username .

# Set permissions
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/logs
chmod -R 775 storage/framework/sessions
chmod -R 775 storage/framework/views
chmod -R 775 storage/framework/cache
```

## Langkah 8: Run Migrations

```bash
cd ~/crypter
php artisan migrate --force
```

**PENTING**: Flag `--force` diperlukan di production environment.

### Jika Ingin Seed Data Demo:

```bash
php artisan db:seed --force
```

## Langkah 9: Optimize Laravel

```bash
cd ~/crypter

# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Cache events
php artisan event:cache

# Create storage link
php artisan storage:link
```

## Langkah 10: Setup Cron Job (Scheduler)

Laravel scheduler memerlukan cron job untuk berjalan.

### Via cPanel Cron Jobs:

1. Login cPanel → Cron Jobs
2. Tambahkan cron job baru:

```
* * * * * cd /home/username/crypter && php artisan schedule:run >> /dev/null 2>&1
```

**Penjelasan**:
- `* * * * *` = Setiap menit
- Ganti `/home/username/crypter` dengan path absolut ke folder aplikasi
- `>> /dev/null 2>&1` = Suppress output

### Verifikasi Path:

```bash
pwd  # Di folder crypter, catat output-nya
```

## Langkah 11: Setup Queue Worker (Opsional tapi Direkomendasikan)

Queue worker diperlukan untuk:
- Video transcoding
- Document conversion
- Email sending (jika menggunakan queue)

### Opsi A: Cron Job Sederhana (Untuk cPanel tanpa Supervisor)

Tambahkan cron job tambahan:

```
* * * * * cd /home/username/crypter && php artisan queue:work --stop-when-empty --max-time=3600 >> /dev/null 2>&1
```

### Opsi B: Supervisor (Jika VPS/Dedicated Server)

Jika punya akses root, gunakan Supervisor seperti di `DEPLOYMENT.md`.

### Opsi C: Tanpa Queue Worker

Jika tidak bisa setup queue worker, ubah `.env`:

```env
QUEUE_CONNECTION=sync
```

**Catatan**: Dengan `sync`, jobs akan dijalankan langsung (blocking), bisa memperlambat response time.

## Langkah 12: Konfigurasi PHP di cPanel

### 12.1 Select PHP Version

1. cPanel → Select PHP Version
2. Pilih PHP 8.4 (atau minimal 8.2)
3. Enable extensions yang diperlukan:
   - ✅ bcmath
   - ✅ ctype
   - ✅ curl
   - ✅ dom
   - ✅ fileinfo
   - ✅ filter
   - ✅ hash
   - ✅ mbstring
   - ✅ openssl
   - ✅ pcre
   - ✅ pdo
   - ✅ pdo_mysql
   - ✅ session
   - ✅ tokenizer
   - ✅ xml
   - ✅ zip
   - ✅ gd (untuk image processing)
   - ✅ intl (untuk internationalization)

### 12.2 PHP Settings (php.ini)

Via cPanel → MultiPHP INI Editor:

```ini
memory_limit = 512M
max_execution_time = 300
max_input_time = 300
post_max_size = 100M
upload_max_filesize = 100M
```

## Langkah 13: Setup SSL Certificate

### Via cPanel AutoSSL (Gratis):

1. cPanel → SSL/TLS Status
2. Klik "Run AutoSSL"
3. Tunggu hingga certificate ter-install

### Via Let's Encrypt (Manual):

1. cPanel → SSL/TLS
2. Manage SSL Sites
3. Install certificate dari Let's Encrypt

**PENTING**: Setelah SSL aktif, update `.env`:

```env
APP_URL=https://your-domain.com
```

Dan jalankan:

```bash
php artisan config:clear
php artisan config:cache
```

## Langkah 14: Testing

### 14.1 Test Basic Access

Buka browser: `https://your-domain.com`

Seharusnya muncul halaman home Crypter.

### 14.2 Test Health Check

```
https://your-domain.com/up
```

Seharusnya return status 200 OK.

### 14.3 Test Authentication

1. Coba register user baru
2. Cek email verification
3. Coba login
4. Coba forgot password

### 14.4 Test File Upload

1. Login
2. Upload file di course/task
3. Verifikasi file tersimpan di `storage/app/`

## Langkah 15: Monitoring & Maintenance

### 15.1 Check Logs

```bash
# Via SSH
tail -f ~/crypter/storage/logs/laravel.log

# Via File Manager
# Buka: crypter/storage/logs/laravel.log
```

### 15.2 Clear Cache (Jika Ada Masalah)

```bash
cd ~/crypter
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

Lalu optimize lagi:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 15.3 Database Backup

**Manual Backup via cPanel**:
1. cPanel → phpMyAdmin
2. Select database
3. Export → Quick → Go

**Automated Backup via Cron**:

Tambahkan cron job:

```
0 2 * * * cd /home/username/crypter && php artisan backup:run >> /dev/null 2>&1
```

Backup akan tersimpan di `storage/app/backups/`.

## Troubleshooting

### Error 500 - Internal Server Error

**Penyebab umum**:
1. `.env` tidak dikonfigurasi dengan benar
2. `APP_KEY` belum di-generate
3. Permissions salah pada `storage/` dan `bootstrap/cache/`
4. PHP extensions tidak lengkap

**Solusi**:
```bash
# Check logs
tail -50 ~/crypter/storage/logs/laravel.log

# Fix permissions
chmod -R 755 ~/crypter/storage ~/crypter/bootstrap/cache

# Clear & recache
php artisan config:clear
php artisan cache:clear
php artisan config:cache
```

### Error 404 - Not Found

**Penyebab**: Document root tidak mengarah ke `public/` Laravel.

**Solusi**: Pastikan symlink atau copy `public/` sudah benar (Langkah 3).

### Database Connection Error

**Penyebab**: Kredensial database salah atau user tidak punya privileges.

**Solusi**:
1. Verifikasi kredensial di `.env`
2. Test koneksi via phpMyAdmin
3. Pastikan user punya ALL PRIVILEGES

### Email Tidak Terkirim

**Penyebab**: SMTP tidak dikonfigurasi atau credentials salah.

**Solusi**:
1. Verifikasi SMTP settings di `.env`
2. Untuk Gmail, gunakan App Password (bukan password biasa)
3. Test via tinker:
   ```bash
   php artisan tinker
   >>> Mail::raw('Test', function($m) { $m->to('test@example.com')->subject('Test'); });
   ```

### Queue Jobs Tidak Berjalan

**Penyebab**: Queue worker tidak aktif atau cron job tidak berjalan.

**Solusi**:
1. Verifikasi cron job sudah ditambahkan (Langkah 11)
2. Check queue table:
   ```bash
   php artisan queue:failed
   ```
3. Retry failed jobs:
   ```bash
   php artisan queue:retry all
   ```

### Assets (CSS/JS) Tidak Load

**Penyebab**: 
1. `npm run build` belum dijalankan
2. File `public/build/` tidak ter-upload
3. `APP_URL` di `.env` salah

**Solusi**:
1. Pastikan folder `public/build/` ada dan berisi file
2. Verifikasi `APP_URL` di `.env` sesuai domain
3. Clear cache: `php artisan config:clear`

### Permission Denied Errors

**Penyebab**: Ownership atau permissions salah.

**Solusi**:
```bash
# Set ownership
chown -R username:username ~/crypter

# Set permissions
find ~/crypter -type f -exec chmod 644 {} \;
find ~/crypter -type d -exec chmod 755 {} \;
chmod -R 775 ~/crypter/storage
chmod -R 775 ~/crypter/bootstrap/cache
```

## Checklist Deployment

Gunakan checklist ini untuk memastikan semua langkah sudah dilakukan:

- [ ] Build assets di local (`npm run build`)
- [ ] Install dependencies production (`composer install --no-dev`)
- [ ] Upload semua file ke server (exclude `node_modules`, `.git`)
- [ ] Setup struktur folder (symlink atau copy `public/`)
- [ ] Buat database dan user di cPanel
- [ ] Buat dan konfigurasi file `.env`
- [ ] Generate application key (`php artisan key:generate`)
- [ ] Set permissions (`chmod -R 755 storage bootstrap/cache`)
- [ ] Run migrations (`php artisan migrate --force`)
- [ ] Optimize Laravel (config, route, view cache)
- [ ] Create storage link (`php artisan storage:link`)
- [ ] Setup cron job untuk scheduler
- [ ] Setup queue worker (cron atau supervisor)
- [ ] Konfigurasi PHP version dan extensions
- [ ] Setup SSL certificate
- [ ] Update `APP_URL` dengan https
- [ ] Test basic access
- [ ] Test authentication flow
- [ ] Test file upload
- [ ] Monitor logs untuk errors

## Maintenance Mode

Untuk maintenance:

```bash
# Enable maintenance mode
php artisan down --secret="your-secret-token"

# Access site dengan: https://your-domain.com/your-secret-token

# Disable maintenance mode
php artisan up
```

## Update Aplikasi

Untuk update aplikasi di masa depan:

```bash
# 1. Enable maintenance mode
php artisan down

# 2. Backup database
php artisan backup:run

# 3. Pull/upload code baru
# (via git pull atau upload manual)

# 4. Update dependencies
composer install --no-dev --optimize-autoloader

# 5. Build assets (di local, lalu upload)
npm run build

# 6. Run migrations
php artisan migrate --force

# 7. Clear & optimize cache
php artisan config:clear
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 8. Disable maintenance mode
php artisan up
```

## Keamanan Production

### Checklist Keamanan:

- [ ] `APP_DEBUG=false` di `.env`
- [ ] `APP_ENV=production` di `.env`
- [ ] SSL certificate aktif (https)
- [ ] Database user hanya punya akses ke database aplikasi
- [ ] File `.env` tidak bisa diakses via web
- [ ] Folder `storage/` tidak bisa diakses via web
- [ ] Gunakan password yang kuat untuk database
- [ ] Enable firewall di server
- [ ] Regular backup database
- [ ] Monitor logs untuk suspicious activity

### Proteksi File Sensitif

Tambahkan di `.htaccess` (jika belum ada):

```apache
# Protect .env
<Files .env>
    Order allow,deny
    Deny from all
</Files>

# Protect storage
RedirectMatch 403 ^/storage/
```

## Support & Resources

- **Laravel Documentation**: https://laravel.com/docs
- **Inertia.js Documentation**: https://inertiajs.com
- **cPanel Documentation**: https://docs.cpanel.net

## Kontak

Jika ada masalah deployment, check:
1. `storage/logs/laravel.log` untuk error logs
2. cPanel Error Log untuk server errors
3. Browser console untuk frontend errors

---

**Catatan**: Panduan ini diasumsikan untuk shared hosting cPanel standar. Jika menggunakan VPS atau dedicated server dengan cPanel, beberapa langkah bisa disederhanakan dengan akses root.
