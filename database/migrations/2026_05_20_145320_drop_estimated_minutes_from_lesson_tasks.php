<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lesson_tasks', function (Blueprint $table): void {
            $table->dropColumn('estimated_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('lesson_tasks', function (Blueprint $table): void {
            $table->integer('estimated_minutes')->nullable()->after('sort_order');
        });
    }
};
