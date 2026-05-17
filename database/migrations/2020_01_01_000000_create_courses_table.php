<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('thumbnail')->nullable();
            $table->boolean('is_published')->default(false);
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        // Create topics as alias for lessons
        Schema::create('topics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['video', 'read', 'quiz'])->default('video');
            $table->string('video_url')->nullable();
            $table->string('document_name')->nullable();
            $table->string('document_path')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Create lesson_tasks as alias/view for tasks
        Schema::create('lesson_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['video', 'read', 'quiz'])->default('video');
            $table->string('video_url')->nullable();
            $table->string('document_name')->nullable();
            $table->string('document_path')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('quiz_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->text('question');
            $table->string('option_a');
            $table->string('option_b');
            $table->string('option_c');
            $table->string('option_d');
            $table->tinyInteger('correct_option');
            $table->text('explanation')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('quiz_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->foreignId('lesson_task_id')->nullable();
            $table->integer('score')->default(0);
            $table->integer('total_questions')->default(0);
            $table->integer('points_earned')->default(0);
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'lesson_task_id'], 'quiz_submissions_user_id_lesson_task_id_unique');
        });

        Schema::create('user_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'task_id']);
        });

        Schema::create('lesson_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('lesson_id')->constrained()->onDelete('cascade');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'lesson_id']);
        });

        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->timestamp('enrolled_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'course_id']);
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
        Schema::dropIfExists('lesson_progress');
        Schema::dropIfExists('user_progress');
        Schema::dropIfExists('quiz_submissions');
        Schema::dropIfExists('quiz_questions');
        Schema::dropIfExists('lesson_tasks');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('topics');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('courses');
    }
};
