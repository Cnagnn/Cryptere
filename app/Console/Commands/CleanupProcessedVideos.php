<?php

namespace App\Console\Commands;

use App\Models\LessonTask;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupProcessedVideos extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'videos:cleanup {--days=30 : Delete originals older than N days}';

    /**
     * The console command description.
     */
    protected $description = 'Remove original video files after successful conversion';

    public function handle(): int
    {
        $days = (int) $this->option('days');

        $tasks = LessonTask::query()
            ->whereIn('video_processing_status', ['ready', 'converted'])
            ->whereNotNull('video_mp4_url')
            ->where('updated_at', '<', now()->subDays($days))
            ->get();

        $count = 0;

        foreach ($tasks as $task) {
            if ($this->isExternalUrl($task->video_url)) {
                continue;
            }

            $originalPath = $this->extractStoragePath($task->video_url);

            if ($originalPath === null) {
                continue;
            }

            // Only delete files in the originals directory
            if (! str_starts_with($originalPath, 'lesson-videos/originals/')) {
                continue;
            }

            if (Storage::disk('public')->exists($originalPath)) {
                Storage::disk('public')->delete($originalPath);
                $count++;
                $this->line("Deleted: {$originalPath}");
            }
        }

        $this->info("Cleaned up {$count} original video file(s).");

        return self::SUCCESS;
    }

    private function isExternalUrl(?string $url): bool
    {
        if ($url === null) {
            return false;
        }

        try {
            $parts = parse_url($url);

            if (! is_array($parts)) {
                return false;
            }

            $host = strtolower((string) ($parts['host'] ?? ''));

            return str_contains($host, 'youtube.com')
                || str_contains($host, 'youtu.be')
                || str_contains($host, 'vimeo.com');
        } catch (\Throwable) {
            return false;
        }
    }

    private function extractStoragePath(?string $url): ?string
    {
        if ($url === null) {
            return null;
        }

        // Handle full URL format
        $publicUrl = Storage::disk('public')->url('');
        if (str_starts_with($url, $publicUrl)) {
            return substr($url, strlen($publicUrl));
        }

        // Handle /storage/ prefix format
        if (str_starts_with($url, '/storage/')) {
            return substr($url, strlen('/storage/'));
        }

        return null;
    }
}
