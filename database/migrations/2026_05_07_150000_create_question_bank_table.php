<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the question_bank table for reusable assessment questions.
     * Questions can be tagged by category, Bloom level, and tracked for performance analytics.
     */
    public function up(): void
    {
        Schema::create('question_bank', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category')->nullable()->index();

            // Question classification
            $table->enum('bloom_level', ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'])->index();
            $table->enum('question_type', [
                'mcq',           // Multiple choice
                'true_false',    // True/False
                'short_answer',  // Short text, auto-gradable
                'essay',         // Free-form essay
                'computation',   // Deterministic computation
                'case_study',    // Case analysis
                'design',        // Design document
            ])->index();

            // Question content
            $table->text('question_text');
            $table->json('options')->nullable(); // For MCQ: [{label, value}]
            $table->text('correct_answer')->nullable(); // For auto-graded types (hidden from students)
            $table->text('explanation')->nullable(); // Shown after grading

            // Rubric for manual grading
            // Format: {criteria: [{name, description, max_points, levels: [{score, description}]}]}
            $table->json('rubric')->nullable();

            // Scoring
            $table->unsignedSmallInteger('points')->default(1);

            // Analytics - track question performance
            $table->decimal('difficulty_score', 5, 2)
                ->nullable()
                ->comment('Item difficulty (0-1, lower = easier)');

            $table->decimal('discrimination', 5, 2)
                ->nullable()
                ->comment('Item discrimination index (-1 to 1, higher = better)');

            $table->unsignedInteger('times_used')
                ->default(0)
                ->comment('Number of times question was used in assessments');

            // Ownership and status
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_active')->default(true)->index();

            $table->timestamps();

            // Composite indexes for common queries
            $table->index(['category', 'bloom_level', 'is_active']);
            $table->index(['question_type', 'bloom_level', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('question_bank');
    }
};
