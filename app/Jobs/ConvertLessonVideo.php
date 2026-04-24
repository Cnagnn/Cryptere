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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class ConvertLessonVideo implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 2;

    /**
     * Number of seconds the job can run before timing out.
     */
    public int $timeout = 300;

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
        return [30, 120];
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

        if (! $this->isTranscodableSource($sourceUrl)) {
            $task->update(['video_processing_status' => 'failed']);

            return;
        }

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

            $process = new Process([
                'ffmpeg',
                '-y',
                '-i',
                $tmpInput,
                '-c:v',
                'libx264',
                '-preset',
                'veryfast',
                '-crf',
                '23',
                '-c:a',
                'aac',
                '-movflags',
                '+faststart',
                $tmpOutputMp4,
            ]);

            $process->setTimeout(240);
            $process->run();

            if (! $process->isSuccessful() || ! file_exists($tmpOutputMp4)) {
                $task->update(['video_processing_status' => 'failed']);

                return;
            }

            $targetPath = sprintf(
                'lesson-videos/%d/%s.mp4',
                $task->id,
                Str::uuid()->toString(),
            );

            Storage::disk('public')->put($targetPath, file_get_contents($tmpOutputMp4));

            $task->update([
                'video_processing_status' => 'converted',
                'video_mp4_url' => Storage::disk('public')->url($targetPath),
            ]);
        } catch (\Throwable) {
            $task->update(['video_processing_status' => 'failed']);
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

    private function isTranscodableSource(string $sourceUrl): bool
    {
        try {
            $parts = parse_url($sourceUrl);

            if (! is_array($parts)) {
                return false;
            }

            $host = strtolower((string) ($parts['host'] ?? ''));
            $scheme = strtolower((string) ($parts['scheme'] ?? ''));

            if (str_contains($host, 'youtube.com') || str_contains($host, 'youtu.be') || str_contains($host, 'vimeo.com')) {
                return false;
            }

            return in_array($scheme, ['http', 'https'], true);
        } catch (\Throwable) {
            return false;
        }
    }
}
