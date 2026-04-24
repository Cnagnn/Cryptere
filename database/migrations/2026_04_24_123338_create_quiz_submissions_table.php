<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('quiz_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_task_id')->constrained('lesson_tasks')->cascadeOnDelete();
            $table->json('answers');
            $table->unsignedSmallInteger('score');
            $table->unsignedSmallInteger('total');
            $table->json('results');
            $table->unsignedInteger('xp_earned')->default(0);
            $table->unsignedInteger('points_earned')->default(0);
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->unique(['user_id', 'lesson_task_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_submissions');
    }
};
