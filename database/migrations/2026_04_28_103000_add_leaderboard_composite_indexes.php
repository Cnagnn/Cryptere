<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Add composite indexes optimized for timeframe-based leaderboard queries.
     *
     * - lesson_progress (user_id, completed_at): already exists as idx_user_completion,
     *   so we skip it here.
     */
    public function up(): void {}

    public function down(): void {}
};
