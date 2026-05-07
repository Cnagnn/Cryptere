<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds question_bank_id to assessment_questions to link questions from the bank.
     * Null means the question is custom (not from the bank).
     */
    public function up(): void
    {
        Schema::table('assessment_questions', function (Blueprint $table) {
            $table->foreignId('question_bank_id')
                ->nullable()
                ->after('assessment_id')
                ->constrained('question_bank')
                ->nullOnDelete();

            $table->index('question_bank_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessment_questions', function (Blueprint $table) {
            $table->dropForeign(['question_bank_id']);
            $table->dropIndex(['question_bank_id']);
            $table->dropColumn('question_bank_id');
        });
    }
};
