<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds prerequisite columns to lessons and lesson_tasks for learning path dependencies.
     */
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('prerequisite_lesson_id')
                ->nullable()
                ->after('topic_id')
                ->constrained('lessons')
                ->nullOnDelete();

            $table->index('prerequisite_lesson_id');
        });

        Schema::table('lesson_tasks', function (Blueprint $table) {
            $table->foreignId('prerequisite_task_id')
                ->nullable()
                ->after('lesson_id')
                ->constrained('lesson_tasks')
                ->nullOnDelete();

            $table->index('prerequisite_task_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lesson_tasks', function (Blueprint $table) {
            $table->dropForeign(['prerequisite_task_id']);
            $table->dropIndex(['prerequisite_task_id']);
            $table->dropColumn('prerequisite_task_id');
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['prerequisite_lesson_id']);
            $table->dropIndex(['prerequisite_lesson_id']);
            $table->dropColumn('prerequisite_lesson_id');
        });
    }
};
