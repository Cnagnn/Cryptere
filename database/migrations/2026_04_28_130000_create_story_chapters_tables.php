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
        Schema::create('story_chapters', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 100)->unique();
            $table->string('title');
            $table->text('narrative');
            $table->smallInteger('chapter_number')->unsigned();
            $table->string('unlock_type', 50);
            $table->string('unlock_value', 100);
            $table->string('icon', 50)->default('scroll');
            $table->timestamps();

            $table->index('chapter_number');
            $table->index('unlock_type');
        });

        Schema::create('user_story_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('story_chapter_id')->constrained()->cascadeOnDelete();
            $table->timestamp('unlocked_at');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'story_chapter_id'], 'user_story_progress_user_chapter_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_story_progress');
        Schema::dropIfExists('story_chapters');
    }
};
