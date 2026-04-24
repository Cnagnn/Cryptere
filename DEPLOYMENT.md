# Deployment Guide — Crypter

## Prerequisites

- PHP 8.4+
- MySQL 8.0+
- Redis 7+ (recommended for cache/queue)
- Node.js 22+
- Composer 2
- Supervisor (for queue workers)
- Cron (for scheduler)

## 1. Environment Setup

```bash
cp .env.production.example .env
php artisan key:generate
```

Fill in **all** values in `.env`:

| Variable | Notes |
|----------|-------|
| `APP_URL` | Your production domain with `https://` |
| `DB_*` | MySQL credentials |
| `REDIS_*` | Redis connection (host, port, password) |
| `MAIL_*` | SMTP credentials (required for email verification & password reset) |
| `SENTRY_LARAVEL_DSN` | From your Sentry project settings |
| `VITE_SENTRY_DSN` | Same DSN (public, safe for frontend) |
| `GITHUB_CLIENT_*` | OAuth app credentials from GitHub |
| `GOOGLE_CLIENT_*` | OAuth app credentials from Google Cloud Console |

## 2. Install Dependencies

```bash
composer install --no-dev --optimize-autoloader
npm ci && npm run build
```

## 3. Database

```bash
php artisan migrate --force
php artisan db:seed --force   # Only if seeding is needed
```

## 4. Cache Optimization

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan icons:cache       # If using Blade icons
```

## 5. Storage Link

```bash
php artisan storage:link
```

## 6. Redis Setup (Recommended)

Redis provides better performance for cache and queue operations. If Redis is not available, the application falls back to database drivers.

### Install Redis

```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping  # Should return PONG
```

### Configure Redis

The `.env.production.example` already sets Redis as default:

```env
CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null
```

### Verify Redis Connection

```bash
php artisan tinker
>>> Cache::put('test', 'value', 60);
>>> Cache::get('test');
```

## 7. Queue Worker (Supervisor)

Two jobs require a queue worker: video transcoding and document conversion.

Create `/etc/supervisor/conf.d/crypter-worker.conf`:

```ini
[program:crypter-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/crypter/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/crypter/storage/logs/worker.log
stopwaitsecs=3600
```

Then:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start crypter-worker:*
```

## 8. Scheduler (Cron)

The scheduler runs daily tasks including point decay and database backups.

Add to crontab (`crontab -e`):

```
* * * * * cd /path/to/crypter && php artisan schedule:run >> /dev/null 2>&1
```

### Scheduled Tasks

| Time | Command | Description |
|------|---------|-------------|
| Daily | `app:decay-inactive-points` | Decay points for inactive users |
| 02:00 | `backup:clean` | Remove old backups per retention policy |
| 02:15 | `backup:run` | Create database backup |

## 9. Database Backups

Automated backups are configured via `spatie/laravel-backup`.

### Backup Location

Backups are stored in `storage/app/backups/`.

### Retention Policy

| Period | Retention |
|--------|-----------|
| Last 7 days | All backups kept |
| Days 8-16 | One backup per day |
| Weeks 2-8 | One backup per week |
| Months 2-4 | One backup per month |

### Manual Backup

```bash
php artisan backup:run
```

### Restore from Backup

```bash
# 1. Extract the backup
unzip storage/app/backups/backup.zip -d /tmp/backup

# 2. Restore database
mysql -u root -p crypter < /tmp/backup/db-dumps/mysql-crypter.sql

# 3. Restore files (if needed)
cp -r /tmp/backup/storage/* storage/
```

### Backup Notifications

To enable email notifications, configure in `config/backup.php`:

```php
'notifications' => [
    'notifications' => [
        BackupHasFailedNotification::class => ['mail'],
        BackupWasSuccessfulNotification::class => ['mail'],
    ],
],
```

## 10. Web Server

### Nginx (recommended)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    root /path/to/crypter/public;
    index index.php;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    add_header X-Robots-Tag "index, follow" always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

## 11. Health Check

The application exposes a health check endpoint:

```
GET /up
```

### Response

- **200 OK** — Application is healthy
- **503 Service Unavailable** — Application is down or maintenance mode is active

### Monitoring Setup

Configure your uptime monitor to ping `/up` every 1-5 minutes:

| Service | Setup |
|---------|-------|
| UptimeRobot | Create new monitor → URL: `https://your-domain.com/up` |
| Better Uptime | Add heartbeat → URL: `https://your-domain.com/up` |
| Pingdom | Create uptime check → URL: `https://your-domain.com/up` |

### Alert Configuration

- Set alert threshold: 2-3 consecutive failures before alerting
- Configure notification channels: email, Slack, SMS
- Set escalation policy for extended outages

## 12. Rate Limiting

The application has built-in rate limiting for API endpoints:

| Limiter | Rate | Use Case |
|---------|------|----------|
| `api` | 60/min | General API endpoints |
| `api-heavy` | 10/min | Resource-intensive operations |
| `login` | 5/min | Authentication attempts |
| `two-factor` | 5/min | 2FA verification |

### Applying Rate Limits

Apply to routes using middleware:

```php
Route::middleware('throttle:api')->group(function () {
    // API routes
});

Route::middleware('throttle:api-heavy')->group(function () {
    // Heavy operations
});
```

## 13. Post-Deploy Checklist

- [ ] `APP_DEBUG=false` confirmed
- [ ] `APP_ENV=production` confirmed
- [ ] `SESSION_ENCRYPT=true` confirmed
- [ ] `SESSION_SECURE_COOKIE=true` confirmed
- [ ] SMTP mail configured and tested
- [ ] Sentry DSN configured and test error sent
- [ ] OAuth callback URLs updated for production domain
- [ ] Queue worker running (`supervisorctl status`)
- [ ] Scheduler running (`php artisan schedule:list`)
- [ ] SSL certificate valid
- [ ] `storage/` directory writable by web server
- [ ] `php artisan about` shows expected configuration

## Redeployment

```bash
php artisan down
git pull origin main
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
sudo supervisorctl restart crypter-worker:*
php artisan up
```

## Troubleshooting

### Queue Not Processing

```bash
# Check worker status
sudo supervisorctl status crypter-worker:*

# Check logs
tail -f storage/logs/worker.log

# Restart workers
sudo supervisorctl restart crypter-worker:*
```

### Redis Connection Failed

```bash
# Check Redis is running
redis-cli ping

# Check Redis config
php artisan tinker
>>> Redis::connection()->ping()
```

### Backup Failing

```bash
# Check disk space
df -h

# Check backup logs
php artisan backup:list

# Run manual backup with verbose output
php artisan backup:run -v
```

### Scheduler Not Running

```bash
# Verify cron is configured
crontab -l

# Test scheduler manually
php artisan schedule:run --verbose
```
