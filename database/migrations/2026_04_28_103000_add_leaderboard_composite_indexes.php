<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add composite indexes optimized for timeframe-based leaderboard queries.
     *
     * - challenge_submissions (user_id, is_correct, submitted_at): optimizes per-user
     *   filtering in getUserPoints/getUserRank where user_id is in the WHERE clause.
     * - lesson_progress (user_id, completed_at): already exists as idx_user_completion,
     *   so we skip it here.
     */
    public function up(): void
    {
        Schema::table('challenge_submissions', function (Blueprint $table) {
            // Optimizes: WHERE user_id = ? AND is_correct = 1 AND submitted_at >= ?
            // Used by getUserPoints() and getUserRank() per-user timeframe queries
            $table->index(
                ['user_id', 'is_correct', 'submitted_at'],
                'idx_cs_user_correct_submitted'
            );
        });
    }

    public function down(): void
    {
        Schema::table('challenge_submissions', function (Blueprint $table) {
            $table->dropIndex('idx_cs_user_correct_submitted');
        });
    }
};
