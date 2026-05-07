<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds analytics fields to assessment_questions to track question performance.
     * Matches the structure used in quiz_questions for consistency.
     */
    public function up(): void
    {
        Schema::table('assessment_questions', function (Blueprint $table) {
            $table->decimal('difficulty_score', 5, 2)
                ->nullable()
                ->after('sort_order')
                ->comment('Item difficulty (0-1, lower = easier)');

            $table->decimal('discrimination', 5, 2)
                ->nullable()
                ->after('difficulty_score')
                ->comment('Item discrimination index (-1 to 1, higher = better)');

            $table->integer('times_shown')
                ->default(0)
                ->after('discrimination')
                ->comment('Number of times question was presented');

            $table->integer('times_correct')
                ->default(0)
                ->after('times_shown')
                ->comment('Number of times answered correctly');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessment_questions', function (Blueprint $table) {
            $table->dropColumn([
                'difficulty_score',
                'discrimination',
                'times_shown',
                'times_correct',
            ]);
        });
    }
};
