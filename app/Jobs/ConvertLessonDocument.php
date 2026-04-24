<?php

namespace App\Jobs;

use App\Models\LessonTask;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class ConvertLessonDocument implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * Number of seconds the job can run before timing out.
     */
    public int $timeout = 120;

    /**
     * Create a new job instance.
     *
     * @param  string  $storedPath  The path to the uploaded document in the 'public' disk
     * @param  int  $lessonId  The ID of the lesson this document belongs to
     */
    public function __construct(
        public readonly string $storedPath,
        public readonly int $lessonId,
    ) {}

    /**
     * The unique ID of the job.
     */
    public function uniqueId(): string
    {
        return "{$this->lessonId}:{$this->storedPath}";
    }

    /**
     * Determine the time (in seconds) to wait before retrying the job.
     *
     * @return array<int, int>
     */
    public function backoff(): array
    {
        return [10, 60];
    }

    /**
     * Execute the job.
     *
     * This method should be extended to call a real PDF conversion service
     * (e.g. LibreOffice, CloudConvert API, etc.).
     * Currently it marks the document as ready if it's already a PDF,
     * or sets status to 'failed' if no converter is configured.
     */
    public function handle(): void
    {
        // Find the lesson task that references this document
        $task = LessonTask::query()
            ->where('lesson_id', $this->lessonId)
            ->where('conversion_status', 'pending')
            ->latest()
            ->first();

        if ($task === null) {
            return;
        }

        $extension = strtolower(pathinfo($this->storedPath, PATHINFO_EXTENSION));

        // If the uploaded file is already a PDF, mark it as converted immediately
        if ($extension === 'pdf') {
            $pdfUrl = Storage::disk('public')->url($this->storedPath);

            $task->update([
                'conversion_status' => 'converted',
                'pdf_url' => $pdfUrl,
            ]);

            return;
        }

        // TODO: Integrate a real document-to-PDF converter here.
        // Options: LibreOffice CLI, CloudConvert API, Adobe PDF Services, etc.
        // For now, mark as failed so the UI shows a clear error state.
        $task->update([
            'conversion_status' => 'failed',
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        $task = LessonTask::query()
            ->where('lesson_id', $this->lessonId)
            ->where('conversion_status', 'pending')
            ->latest()
            ->first();

        $task?->update(['conversion_status' => 'failed']);
    }
}
