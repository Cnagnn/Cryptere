<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Drops the duplicate 'tasks' table. The 'lesson_tasks' table is the canonical source.
     * Both tables were created in the initial migration with identical structure.
     * All foreign keys now reference 'lesson_tasks' instead of 'tasks'.
     */
    public function up(): void
    {
        // Drop user_progress table (obsolete, replaced by task_progress)
        Schema::dropIfExists('user_progress');

        // Verify no other foreign keys reference tasks table
        $foreignKeys = DB::select("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND REFERENCED_TABLE_NAME = 'tasks'
        ");

        if (count($foreignKeys) > 0) {
            $names = implode(', ', array_map(fn ($fk) => $fk->CONSTRAINT_NAME, $foreignKeys));
            throw new Exception(
                "Cannot drop tasks table: foreign key constraints still exist. Found: {$names}"
            );
        }

        Schema::dropIfExists('tasks');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate tasks table with same structure as lesson_tasks
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

        // Recreate user_progress table
        Schema::create('user_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('task_id')->constrained()->onDelete('cascade');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'task_id']);
        });
    }
};
