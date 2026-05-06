<?php

namespace App\Http\Controllers\Course;

use App\Http\Controllers\Controller;
use App\Models\LessonTask;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    /**
     * Serve a lesson PDF inline with headers that prevent download managers (IDM) from intercepting.
     */
    public function show(LessonTask $task): StreamedResponse
    {
        $user = auth()->user();

        // Verify user is enrolled in the course that owns this task
        $course = $task->lesson->course;
        abort_unless($course->enrollments()->where('user_id', $user->id)->exists(), 403);

        // Extract relative storage path from the full URL
        $pdfUrl = $task->pdf_url;
        abort_unless($pdfUrl, 404);

        // Convert URL back to storage path (e.g. /storage/lesson-documents/file.pdf → lesson-documents/file.pdf)
        $path = str_replace('/storage/', '', parse_url($pdfUrl, PHP_URL_PATH));

        abort_unless(Storage::disk('public')->exists($path), 404);

        $filename = basename($path);
        $size = Storage::disk('public')->size($path);

        return response()->stream(
            function () use ($path): void {
                $stream = Storage::disk('public')->readStream($path);
                fpassthru($stream);
                fclose($stream);
            },
            200,
            [
                'Content-Type' => 'application/pdf',
                'Content-Length' => $size,
                'Content-Disposition' => 'inline; filename="'.$filename.'"',
                // Prevent IDM and download managers from intercepting
                'Accept-Ranges' => 'none',
                'Cache-Control' => 'no-store, no-cache, must-revalidate, private',
                'X-Content-Type-Options' => 'nosniff',
                'Content-Transfer-Encoding' => 'binary',
            ],
        );
    }
}
