<?php

namespace App\Jobs;

use App\Models\LessonTask;
use App\Services\DocumentConverterService;
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
     * Converts uploaded documents to PDF using LibreOffice CLI.
     * If the file is already a PDF, marks it as converted immediately.
     * Falls back to 'failed' status if LibreOffice is not available.
     */
    public function handle(DocumentConverterService $converter): void
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

        // Attempt conversion via LibreOffice
        if (! $converter->isAvailable()) {
            $task->update(['conversion_status' => 'failed']);

            return;
        }

        $absoluteInput = Storage::disk('public')->path($this->storedPath);
        $outputDir = dirname($absoluteInput);

        $pdfPath = $converter->convertToPdf($absoluteInput, $outputDir);

        // Store the PDF path relative to the public disk
        $relativePdf = str_replace(
            Storage::disk('public')->path(''),
            '',
            $pdfPath,
        );

        $task->update([
            'conversion_status' => 'converted',
            'pdf_url' => Storage::disk('public')->url($relativePdf),
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
