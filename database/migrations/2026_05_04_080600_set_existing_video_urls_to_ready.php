<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Set all video tasks with external URLs (YouTube/Vimeo/direct links) to 'ready' status
        // Only local uploaded files need processing
        DB::table('lesson_tasks')
            ->where('type', 'video')
            ->whereNotNull('video_url')
            ->where(function ($query) {
                // External URLs that don't need processing
                $query->where('video_url', 'like', '%youtube.com%')
                    ->orWhere('video_url', 'like', '%youtu.be%')
                    ->orWhere('video_url', 'like', '%vimeo.com%')
                    ->orWhere('video_url', 'like', 'https://example.com/%')
                    // Direct video URLs (not from local storage)
                    ->orWhere(function ($q) {
                        $q->where('video_url', 'not like', '%/storage/lesson-videos/%')
                            ->where(function ($subQ) {
                                $subQ->where('video_url', 'like', '%.mp4')
                                    ->orWhere('video_url', 'like', '%.webm')
                                    ->orWhere('video_url', 'like', '%.ogg');
                            });
                    });
            })
            ->update(['video_processing_status' => 'ready']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse - this is a data fix
    }
};
