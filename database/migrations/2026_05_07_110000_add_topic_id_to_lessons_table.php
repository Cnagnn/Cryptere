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
        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('topic_id')
                ->nullable()
                ->after('course_id')
                ->constrained('topics')
                ->onDelete('set null');

            $table->index('topic_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropForeign(['topic_id']);
            $table->dropIndex(['topic_id']);
            $table->dropColumn('topic_id');
        });
    }
};
