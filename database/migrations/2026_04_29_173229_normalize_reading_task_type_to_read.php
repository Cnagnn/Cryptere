<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Normalize 'reading' task type to 'read' for consistency
     * between backend storage and frontend expectations.
     */
    public function up(): void
    {
        DB::table('lesson_tasks')
            ->where('type', 'reading')
            ->update(['type' => 'read']);
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        DB::table('lesson_tasks')
            ->where('type', 'read')
            ->update(['type' => 'reading']);
    }
};
