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
        if (! Schema::hasTable('lessons') || Schema::hasColumn('lessons', 'chapter_id')) {
            return;
        }

        Schema::table('lessons', function (Blueprint $table): void {
            $table->foreignId('chapter_id')->nullable()->constrained('chapters')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('lessons') || ! Schema::hasColumn('lessons', 'chapter_id')) {
            return;
        }

        Schema::table('lessons', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('chapter_id');
        });
    }
};
