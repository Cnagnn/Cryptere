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
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('quiz_questions', function (Blueprint $table) {
            // Drop old foreign key
            $table->dropForeign('quiz_questions_task_id_foreign');

            // Add new foreign key pointing to lesson_tasks
            $table->foreign('lesson_task_id')
                ->references('id')
                ->on('lesson_tasks')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('quiz_questions', function (Blueprint $table) {
            // Drop new foreign key
            $table->dropForeign(['lesson_task_id']);

            // Restore old foreign key
            $table->foreign('lesson_task_id', 'quiz_questions_task_id_foreign')
                ->references('id')
                ->on('tasks')
                ->onDelete('cascade');
        });
    }
};
