<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasUserFk = $this->foreignKeyExists('quiz_submissions', 'quiz_submissions_user_id_foreign');

        Schema::table('quiz_submissions', function (Blueprint $table) use ($hasUserFk) {
            // Must drop foreign key on user_id before dropping the unique index
            // (only if it actually exists — fresh DBs may not have it)
            if ($hasUserFk) {
                $table->dropForeign(['user_id']);
            }

            // Drop the old unique constraint (user_id + lesson_task_id)
            $table->dropUnique('quiz_submissions_user_id_lesson_task_id_unique');

            // Add attempt tracking columns
            $table->unsignedSmallInteger('attempt_number')->default(1)->after('lesson_task_id');
            $table->boolean('is_best_attempt')->default(false)->after('points_earned');

            // Add new unique constraint: user_id + lesson_task_id + attempt_number
            $table->unique(['user_id', 'lesson_task_id', 'attempt_number'], 'quiz_submissions_user_task_attempt_unique');

            // Re-add the foreign key on user_id
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('quiz_submissions', function (Blueprint $table) {
            // Drop the foreign key on user_id first
            $table->dropForeign(['user_id']);

            // Drop the new unique constraint
            $table->dropUnique('quiz_submissions_user_task_attempt_unique');

            // Remove the new columns
            $table->dropColumn(['attempt_number', 'is_best_attempt']);

            // Restore the original unique constraint
            $table->unique(['user_id', 'lesson_task_id'], 'quiz_submissions_user_id_lesson_task_id_unique');

            // Re-add the foreign key on user_id
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    /**
     * Check whether a named foreign key exists on the given table.
     */
    private function foreignKeyExists(string $table, string $constraintName): bool
    {
        return DB::table('information_schema.TABLE_CONSTRAINTS')
            ->where('CONSTRAINT_SCHEMA', DB::raw('DATABASE()'))
            ->where('TABLE_NAME', $table)
            ->where('CONSTRAINT_NAME', $constraintName)
            ->where('CONSTRAINT_TYPE', 'FOREIGN KEY')
            ->exists();
    }
};
