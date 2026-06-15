<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            Schema::disableForeignKeyConstraints();
            Schema::create('quiz_questions_new', function (Blueprint $table) {
                $table->id();
                $table->foreignId('lesson_task_id')->constrained('lesson_tasks')->cascadeOnDelete();
                $table->unsignedBigInteger('topic_id')->nullable();
                $table->text('question');
                $table->json('options')->nullable();
                $table->unsignedTinyInteger('correct_option')->default(0);
                $table->text('explanation')->nullable();
                $table->integer('sort_order')->default(0);
                $table->string('difficulty_level')->default('medium');
                $table->float('difficulty_score')->default(0.5);
                $table->float('discrimination')->default(1.0);
                $table->unsignedInteger('times_shown')->default(0);
                $table->unsignedInteger('times_correct')->default(0);
                $table->timestamps();
            });

            DB::statement('
                INSERT INTO quiz_questions_new (
                    id, lesson_task_id, topic_id, question, options, correct_option, explanation, sort_order,
                    difficulty_level, difficulty_score, discrimination, times_shown, times_correct, created_at, updated_at
                )
                SELECT id, lesson_task_id, topic_id, question, options, correct_option, explanation, sort_order,
                    difficulty_level, difficulty_score, discrimination, times_shown, times_correct, created_at, updated_at
                FROM quiz_questions
            ');

            Schema::drop('quiz_questions');
            Schema::rename('quiz_questions_new', 'quiz_questions');
            Schema::enableForeignKeyConstraints();

            return;
        }

        $hasOldFk = $this->foreignKeyExists('quiz_questions', 'quiz_questions_task_id_foreign', ['task_id']);
        $hasNewFk = $this->foreignKeyExists('quiz_questions', 'quiz_questions_lesson_task_id_foreign', ['lesson_task_id']);

        Schema::table('quiz_questions', function (Blueprint $table) use ($hasOldFk, $hasNewFk) {
            // Drop old foreign key (only if it exists — fresh DBs may not have it)
            if ($hasOldFk) {
                $table->dropForeign('quiz_questions_task_id_foreign');
            }

            // Add new foreign key pointing to lesson_tasks (skip if already added)
            if (! $hasNewFk) {
                $table->foreign('lesson_task_id')
                    ->references('id')
                    ->on('lesson_tasks')
                    ->onDelete('cascade');
            }
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

    /**
     * Check whether a foreign key exists on the given table.
     *
     * Driver-agnostic: uses Laravel's schema introspection which works across
     * MySQL, PostgreSQL, and SQLite. Matches by constraint name first (MySQL/PG
     * named FKs), then falls back to column match (SQLite which doesn't store
     * named FKs).
     *
     * @param  list<string>  $columns
     */
    private function foreignKeyExists(string $table, string $constraintName, array $columns = []): bool
    {
        if (! Schema::hasTable($table)) {
            return false;
        }

        foreach (Schema::getConnection()->getSchemaBuilder()->getForeignKeys($table) as $fk) {
            if (($fk['name'] ?? null) === $constraintName) {
                return true;
            }

            // SQLite path: FK is unnamed, so match by columns instead.
            if ($columns !== [] && ($fk['columns'] ?? []) === $columns) {
                return true;
            }
        }

        return false;
    }
};
