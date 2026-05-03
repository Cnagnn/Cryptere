<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the assessment_answers table.
     * Stores individual answers per question within a submission.
     * Supports both auto-graded (immediate) and manual-graded (deferred) answers.
     */
    public function up(): void
    {
        Schema::create('assessment_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('assessment_submissions')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('assessment_questions')->cascadeOnDelete();

            // Student's answer
            $table->text('answer_text')->nullable(); // For essay/computation/case_study/design
            $table->string('selected_option')->nullable(); // For MCQ/true_false

            // Grading results
            $table->boolean('is_correct')->nullable(); // null = not yet graded (manual)
            $table->unsignedSmallInteger('points_awarded')->nullable();
            $table->unsignedSmallInteger('max_points');

            // Rubric scoring for manual grading
            // Format: {criterion_name: {score: int, feedback: string}}
            $table->json('rubric_scores')->nullable();

            // Admin feedback
            $table->text('feedback')->nullable();
            $table->timestamp('graded_at')->nullable();

            $table->timestamps();

            // Unique: one answer per question per submission
            $table->unique(['submission_id', 'question_id']);

            $table->index(['submission_id', 'is_correct']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_answers');
    }
};
