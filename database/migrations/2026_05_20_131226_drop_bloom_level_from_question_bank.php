<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Removes bloom_level from question_bank to make the bank universal.
     * Bloom level is now a consumer-side concern (e.g. assessment_questions.bloom_level).
     */
    public function up(): void
    {
        Schema::table('question_bank', function (Blueprint $table): void {
            // Drop composite indexes that reference bloom_level
            $table->dropIndex('question_bank_bloom_type_active_idx');
            $table->dropIndex(['category', 'bloom_level', 'is_active']);
            $table->dropIndex(['question_type', 'bloom_level', 'is_active']);

            // Drop single-column index on bloom_level
            $table->dropIndex(['bloom_level']);

            // Drop the column
            $table->dropColumn('bloom_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('question_bank', function (Blueprint $table): void {
            $table->enum('bloom_level', ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'])
                ->default('C1')
                ->after('category');

            $table->index('bloom_level');
            $table->index(['category', 'bloom_level', 'is_active']);
            $table->index(['question_type', 'bloom_level', 'is_active']);
            $table->index(['bloom_level', 'question_type', 'is_active'], 'question_bank_bloom_type_active_idx');
        });
    }
};
