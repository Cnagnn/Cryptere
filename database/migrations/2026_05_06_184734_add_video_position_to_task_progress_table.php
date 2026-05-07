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
            $table->unsignedInteger('video_position_seconds')->default(0)->after('completed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_progress', function (Blueprint $table) {
            $table->dropColumn('video_position_seconds');
        });
    }
};
