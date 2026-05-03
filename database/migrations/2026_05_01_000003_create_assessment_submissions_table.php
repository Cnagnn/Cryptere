<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the assessment_submissions table.
     * Tracks each user's attempt at an assessment with status workflow:
     * in_progress → submitted → grading → graded
     */
    public function up(): void
    {
        Schema::create('assessment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_id')->constrained()->cascadeOnDelete();

            // Attempt tracking
            $table->unsignedSmallInteger('attempt_number')->default(1);

            // Status workflow
            $table->enum('status', ['in_progress', 'submitted', 'grading', 'graded'])
                ->default('in_progress');

            // Timestamps for workflow stages
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('graded_at')->nullable();

            // Scoring (populated after grading)
            $table->unsignedSmallInteger('total_score')->nullable(); // percentage 0-100
            $table->unsignedSmallInteger('points_earned')->nullable();
            $table->unsignedSmallInteger('points_possible')->nullable();
            $table->boolean('passed')->nullable();

            // Grader info (for manual grading)
            $table->foreignId('graded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('overall_feedback')->nullable();

            $table->timestamps();

            // Unique constraint: one active attempt per user per assessment per attempt number
            $table->unique(['user_id', 'assessment_id', 'attempt_number'], 'submissions_user_assessment_attempt_unique');

            // Indexes for common queries
            $table->index(['user_id', 'assessment_id', 'status']);
            $table->index(['status', 'submitted_at']); // Admin grading queue
            $table->index(['assessment_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessment_submissions');
    }
};
