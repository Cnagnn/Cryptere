<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add composite indexes for leaderboard aggregation, server-side streak
     * calculation, and dashboard query optimization.
     *
     * @see IMPLEMENTATION_PLAN.md — R09: Database Indexing Optimization
     */
    public function up(): void
    {
        Schema::table('lesson_progress', function (Blueprint $table) {
            // Dashboard: count completed lessons per user
            $table->index(['user_id', 'completed_at'], 'idx_user_completion');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            // Dashboard: recent courses with progress
            $table->index(['user_id', 'updated_at'], 'idx_user_recent_enrollment');
        });
    }

    public function down(): void
    {
        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->dropIndex('idx_user_completion');
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropIndex('idx_user_recent_enrollment');
        });
    }
};
