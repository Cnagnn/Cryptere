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
        Schema::create('challenges', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('prompt');
            $table->text('hint')->nullable();
            $table->text('expected_answer')->nullable();
            $table->string('expected_answer_hash')->nullable();
            $table->string('difficulty')->default('medium'); // easy, medium, hard
            $table->integer('sort_order')->default(0);
            $table->boolean('is_published')->default(false);
            $table->string('category')->nullable();
            $table->boolean('is_daily')->default(false);
            $table->date('daily_date')->nullable();
            $table->timestamp('time_start')->nullable();
            $table->timestamp('time_end')->nullable();
            $table->integer('time_limit_seconds')->nullable();
            $table->integer('questions_per_session')->default(10);
            $table->integer('max_points_per_question')->default(10);
            $table->timestamps();

            $table->index(['is_published', 'is_daily', 'daily_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('challenges');
    }
};
