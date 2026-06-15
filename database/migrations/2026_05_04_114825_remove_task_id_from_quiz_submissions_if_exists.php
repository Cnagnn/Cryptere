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
        if (! Schema::hasColumn('quiz_submissions', 'task_id')) {
            return;
        }

        $hasFk = $this->foreignKeyExists('quiz_submissions', 'quiz_submissions_task_id_foreign', ['task_id']);

        Schema::table('quiz_submissions', function (Blueprint $table) use ($hasFk) {
            if ($hasFk) {
                $table->dropForeign(['task_id']);
            }
            $table->dropColumn('task_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to restore task_id as it shouldn't exist
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
