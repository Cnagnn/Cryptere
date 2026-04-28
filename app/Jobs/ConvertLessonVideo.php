<?php

namespace App\Jobs;

use App\Models\LessonTask;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ConvertLessonVideo implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * Number of seconds the job can run before timing out.
     */
    public int $timeout = 1800;

    public function __construct(
        public readonly int $lessonTaskId,
    ) {}

    /**
     * The unique ID of the job.
     */
    public function uniqueId(): int
    {
        return $this->lessonTaskId;
    }

    /**
     * Determine the time (in seconds) to wait before retrying the job.
     *
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [30, 120, 300];
    }

    public function handle(): void
    {
        $task = LessonTask::query()->find($this->lessonTaskId);

        if ($task === null || $task->type !== 'video' || $task->video_url === null) {
            return;
        }

        $task->update([
            'video_processing_status' => 'processing',
            'video_mp4_url' => null,
        ]);

        $sourceUrl = trim($task->video_url);

        // If it's a YouTube/Vimeo URL, skip conversion — just mark as ready
        if ($this->isExternalEmbedUrl($sourceUrl)) {
            $task->update(['video_processing_status' => 'ready']);

            return;
        }

        // Check if this is a locally uploaded file (stored on public disk)
        if ($this->isLocalUpload($sourceUrl)) {
            $this->processLocalUpload($task, $sourceUrl);

            return;
        }

        // For remote direct-file URLs, download and transcode
        if ($this->isTranscodableSource($sourceUrl)) {
            $this->processRemoteUrl($task, $sourceUrl);

            return;
        }

        $task->update(['video_processing_status' => 'failed']);
    }

    /**
     * Process a locally uploaded video file.
     */
    private function processLocalUpload(LessonTask $task, string $sourceUrl): void
    {
        try {
            $storagePath = $this->extractStoragePath($sourceUrl);

            if ($storagePath === null || ! Storage::disk('public')->exists($storagePath)) {
                $task->update(['video_processing_status' => 'failed']);

                return;
            }

            $absolutePath = Storage::disk('public')->path($storagePath);

            $targetPath = sprintf(
                'lesson-videos/converted/%d/%s.mp4',
                $task->id,
                Str::uuid()->toString(),
            );

            $absoluteOutputPath = Storage::disk('public')->path($targetPath);

            // Ensure output directory exists
            Storage::disk('public')->makeDirectory(dirname($targetPath));

            if ($this->ffmpegAvailable()) {
                $this->convertWithFfmpeg($absolutePath, $absoluteOutputPath);
            } else {
                // Fallback: just copy the original (no transcoding)
                Storage::disk('public')->copy($storagePath, $targetPath);
            }

            $task->update([
                'video_mp4_url' => Storage::disk('public')->url($targetPath),
                'video_processing_status' => 'ready',
            ]);
        } catch (\Throwable $e) {
            $task->update(['video_processing_status' => 'failed']);

            throw $e;
        }
    }

    /**
     * Process a remote video URL by downloading and transcoding.
     */
    private function processRemoteUrl(LessonTask $task, string $sourceUrl): void
    {
        $tmpInput = tempnam(sys_get_temp_dir(), 'lesson-video-in-');
        $tmpOutput = tempnam(sys_get_temp_dir(), 'lesson-video-out-');

        if ($tmpInput === false || $tmpOutput === false) {
            $task->update(['video_processing_status' => 'failed']);

            return;
        }

        $tmpOutputMp4 = $tmpOutput.'.mp4';

        try {
            $response = Http::timeout(120)
                ->connectTimeout(20)
                ->sink($tmpInput)
                ->get($sourceUrl);

            if (! $response->successful()) {
                $task->update(['video_processing_status' => 'failed']);

                return;
            }

            $targetPath = sprintf(
                'lesson-videos/converted/%d/%s.mp4',
                $task->id,
                Str::uuid()->toString(),
            );

            if ($this->ffmpegAvailable()) {
                $this->convertWithFfmpeg($tmpInput, $tmpOutputMp4);

                if (! file_exists($tmpOutputMp4)) {
                    $task->update(['video_processing_status' => 'failed']);

                    return;
                }

                Storage::disk('public')->put($targetPath, file_get_contents($tmpOutputMp4));
            } else {
                // Fallback: store the downloaded file directly
                Storage::disk('public')->put($targetPath, file_get_contents($tmpInput));
            }

            $task->update([
                'video_processing_status' => 'ready',
                'video_mp4_url' => Storage::disk('public')->url($targetPath),
            ]);
        } catch (\Throwable $e) {
            $task->update(['video_processing_status' => 'failed']);

            throw $e;
        } finally {
            @unlink($tmpInput);
            @unlink($tmpOutput);
            @unlink($tmpOutputMp4);
        }
    }

    public function failed(\Throwable $exception): void
    {
        LessonTask::query()
            ->whereKey($this->lessonTaskId)
            ->update(['video_processing_status' => 'failed']);
    }

    /**
     * Check if the URL is a YouTube/Vimeo embed URL that should not be transcoded.
     */
    private function isExternalEmbedUrl(string $url): bool
    {
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

    /**
     * Check if the URL points to a locally uploaded file on the public disk.
     */
    private function isLocalUpload(string $url): bool
    {
        $publicUrl = Storage::disk('public')->url('');

        return str_starts_with($url, $publicUrl)
            || str_starts_with($url, '/storage/');
    }

    /**
     * Extract the storage-relative path from a public URL.
     */
    private function extractStoragePath(string $url): ?string
    {
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

    private function isTranscodableSource(string $sourceUrl): bool
    {
        try {
            $parts = parse_url($sourceUrl);

            if (! is_array($parts)) {
                return false;
            }

            $scheme = strtolower((string) ($parts['scheme'] ?? ''));

            return in_array($scheme, ['http', 'https'], true);
        } catch (\Throwable) {
            return false;
        }
    }

    private function ffmpegAvailable(): bool
    {
        try {
            $result = Process::run('ffmpeg -version');

            return $result->successful();
        } catch (\Throwable) {
            return false;
        }
    }

    private function convertWithFfmpeg(string $input, string $output): void
    {
        // Ensure output directory exists
        $outputDir = dirname($output);
        if (! is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $result = Process::timeout(1800)->run([
            'ffmpeg',
            '-y',
            '-i', $input,
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            $output,
        ]);

        if (! $result->successful()) {
            throw new \RuntimeException('FFmpeg conversion failed: '.$result->errorOutput());
        }
    }
}
