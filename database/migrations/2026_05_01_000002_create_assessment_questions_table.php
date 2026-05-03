<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the assessment_questions table.
     * Each question has a Bloom level, question type, and grading configuration.
     * For manual-graded questions, a rubric JSON defines the scoring criteria.
     */
    public function up(): void
    {
        Schema::create('assessment_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();

            // Question classification
            $table->enum('bloom_level', ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
            $table->enum('question_type', [
                'mcq',           // Multiple choice (C1, C3)
                'true_false',    // True/False (C1)
                'short_answer',  // Short text, auto-gradable (C1, C3)
                'essay',         // Free-form essay (C2, C4, C5, C6)
                'computation',   // Deterministic computation (C3)
                'case_study',    // Case analysis (C4)
                'design',        // Design document (C6)
            ]);

            // Question content
            $table->text('question_text');
            $table->json('options')->nullable(); // For MCQ: [{label, value}]
            $table->text('correct_answer')->nullable(); // For auto-graded types
            $table->text('explanation')->nullable(); // Shown after grading

            // Rubric for manual grading
            // Format: {criteria: [{name, description, max_points, levels: [{score, description}]}]}
            $table->json('rubric')->nullable();

            // Scoring
            $table->unsignedSmallInteger('points')->default(10);
            $table->enum('grading_type', ['auto', 'manual'])->default('auto');

            // Constraints for essay-type questions
            $table->unsignedSmallInteger('min_words')->nullable();
            $table->unsignedSmallInteger('max_words')->nullable();

            // Ordering
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestamps();

            $table->index(['assessment_id', 'sort_order']);
            $table->index(['assessment_id', 'bloom_level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_questions');
    }
};
