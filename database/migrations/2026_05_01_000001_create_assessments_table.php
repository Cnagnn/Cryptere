<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the assessments table — the core entity replacing challenges.
     * Each assessment targets a specific Bloom's Taxonomy level (C1-C6)
     * and belongs to a course/topic for contextual learning measurement.
     */
    public function up(): void
    {
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('topic_id')->nullable()->constrained()->nullOnDelete();

            // Bloom's Taxonomy level (C1-C6)
            $table->enum('bloom_level', ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);

            // Grading configuration
            $table->enum('grading_type', ['auto', 'manual', 'mixed'])->default('mixed');
            $table->unsignedSmallInteger('passing_score')->default(70); // percentage
            $table->unsignedSmallInteger('max_attempts')->default(3);
            $table->unsignedSmallInteger('time_limit_minutes')->nullable();

            // Publishing & availability
            $table->boolean('is_published')->default(false);
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);

            $table->timestamps();

            // Indexes for common queries
            $table->index(['is_published', 'bloom_level']);
            $table->index(['course_id', 'bloom_level']);
            $table->index(['topic_id', 'bloom_level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
