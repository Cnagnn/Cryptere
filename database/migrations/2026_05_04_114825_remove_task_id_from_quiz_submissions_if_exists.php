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
        Schema::table('quiz_submissions', function (Blueprint $table) {
            // Check if task_id column exists
            if (Schema::hasColumn('quiz_submissions', 'task_id')) {
                // Drop foreign key first if it exists
                $table->dropForeign(['task_id']);
                // Then drop the column
                $table->dropColumn('task_id');
            }
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
