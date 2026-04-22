<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('lesson_tasks', function (Blueprint $table): void {
            $table->string('video_processing_status')->nullable()->after('video_url');
            $table->string('video_mp4_url')->nullable()->after('video_processing_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lesson_tasks', function (Blueprint $table): void {
            $table->dropColumn(['video_processing_status', 'video_mp4_url']);
        });
    }
};
