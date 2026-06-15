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
        if (! Schema::hasColumn('quiz_submissions', 'task_id')) {
            return;
        }

        $hasFk = DB::table('information_schema.TABLE_CONSTRAINTS')
            ->where('CONSTRAINT_SCHEMA', DB::raw('DATABASE()'))
            ->where('TABLE_NAME', 'quiz_submissions')
            ->where('CONSTRAINT_NAME', 'quiz_submissions_task_id_foreign')
            ->where('CONSTRAINT_TYPE', 'FOREIGN KEY')
            ->exists();

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
};
