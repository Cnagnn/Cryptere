<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Add difficulty tracking columns to quiz_questions,
     * and ability_estimate to users for the adaptive assessment system.
     */
    public function up(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->enum('difficulty_level', ['easy', 'medium', 'hard'])->default('medium')->after('sort_order');
            $table->float('difficulty_score')->default(0.5)->after('difficulty_level');
            $table->float('discrimination')->default(1.0)->after('difficulty_score');
            $table->unsignedInteger('times_shown')->default(0)->after('discrimination');
            $table->unsignedInteger('times_correct')->default(0)->after('times_shown');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->float('ability_estimate')->default(0.5)->after('daily_goal_met_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->dropColumn(['difficulty_level', 'difficulty_score', 'discrimination', 'times_shown', 'times_correct']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('ability_estimate');
        });
    }
};
