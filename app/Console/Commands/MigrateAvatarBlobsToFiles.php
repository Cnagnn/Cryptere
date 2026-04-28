<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateAvatarBlobsToFiles extends Command
{
    protected $signature = 'avatars:migrate-blobs {--dry-run : Show count without migrating}';

    protected $description = 'Migrate avatar BLOBs from users table to filesystem storage';

    public function handle(): int
    {
        $query = User::query()
            ->whereNotNull('avatar_image')
            ->whereNull('avatar_path');

        $total = $query->count();
        $this->info("Found {$total} users with BLOB avatars to migrate.");

        if ($total === 0) {
            $this->info('Nothing to migrate.');

            return self::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->info('Dry run — no changes made.');

            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($total);
        $migrated = 0;
        $failed = 0;

        $query->chunkById(100, function ($users) use ($bar, &$migrated, &$failed) {
            foreach ($users as $user) {
                try {
                    $binary = $this->resolveAvatarBinary($user);

                    if ($binary === null || $binary === '') {
                        $bar->advance();

                        continue;
                    }

                    $extension = match ($user->avatar_mime_type) {
                        'image/jpeg' => 'jpg',
                        'image/gif' => 'gif',
                        'image/webp' => 'webp',
                        'image/svg+xml' => 'svg',
                        default => 'png',
                    };

                    $filename = "avatars/{$user->id}/avatar.{$extension}";

                    Storage::disk('public')->put($filename, $binary);

                    $user->update(['avatar_path' => $filename]);

                    $migrated++;
                } catch (\Throwable $e) {
                    $this->error("Failed for user #{$user->id}: {$e->getMessage()}");
                    $failed++;
                }

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);
        $this->info("Migration complete: {$migrated} migrated, {$failed} failed.");

        if ($failed > 0) {
            $this->warn('Re-run the command to retry failed users.');
        }

        $this->info('After verifying all avatars, run the drop-column migration to remove BLOB columns.');

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Resolve binary content from the avatar_image column (handles both string and resource types).
     */
    private function resolveAvatarBinary(User $user): ?string
    {
        $avatarImage = $user->avatar_image;

        if (is_string($avatarImage)) {
            return $avatarImage;
        }

        if (is_resource($avatarImage)) {
            rewind($avatarImage);

            $contents = stream_get_contents($avatarImage);

            return is_string($contents) ? $contents : null;
        }

        return null;
    }
}
