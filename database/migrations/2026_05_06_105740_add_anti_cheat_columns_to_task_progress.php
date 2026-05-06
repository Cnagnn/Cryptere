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
        Schema::table('task_progress', function (Blueprint $table) {
            // Video anti-cheat: accumulated watch seconds from heartbeats
            $table->unsignedInteger('watch_seconds')->default(0)->after('completed_at');

            // PDF/Reading anti-cheat: total seconds spent reading
            $table->unsignedInteger('reading_seconds')->default(0)->after('watch_seconds');

            // Timestamp when user started engaging with task (for server-side time validation)
            $table->timestamp('started_at')->nullable()->after('reading_seconds');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_progress', function (Blueprint $table) {
            $table->dropColumn(['watch_seconds', 'reading_seconds', 'started_at']);
        });
    }
};
