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
        $supportsFullTextIndexes = DB::connection()->getDriverName() !== 'sqlite';

        Schema::table('courses', function (Blueprint $table) use ($supportsFullTextIndexes): void {
            $table->index('sort_order');
            $table->index(['status', 'sort_order']);
            if ($supportsFullTextIndexes && ! Schema::hasIndex('courses', 'courses_search_fulltext')) {
                $table->fullText(['title', 'summary'], 'courses_search_fulltext');
            }
        });

        Schema::table('lessons', function (Blueprint $table) use ($supportsFullTextIndexes): void {
            $table->index('position');
            $table->index(['course_id', 'position']);
            if ($supportsFullTextIndexes && ! Schema::hasIndex('lessons', 'lessons_search_fulltext')) {
                $table->fullText(['title', 'description'], 'lessons_search_fulltext');
            }
        });

        Schema::table('lesson_tasks', function (Blueprint $table) use ($supportsFullTextIndexes): void {
            $table->index('sort_order');
            $table->index(['lesson_id', 'sort_order']);
            if ($supportsFullTextIndexes && ! Schema::hasIndex('lesson_tasks', 'lesson_tasks_search_fulltext')) {
                $table->fullText(['title', 'description'], 'lesson_tasks_search_fulltext');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $supportsFullTextIndexes = DB::connection()->getDriverName() !== 'sqlite';

        Schema::table('courses', function (Blueprint $table) use ($supportsFullTextIndexes): void {
            $table->dropIndex(['sort_order']);
            $table->dropIndex(['status', 'sort_order']);
            if ($supportsFullTextIndexes && Schema::hasIndex('courses', 'courses_search_fulltext')) {
                $table->dropFullText('courses_search_fulltext');
            }
        });

        Schema::table('lessons', function (Blueprint $table) use ($supportsFullTextIndexes): void {
            $table->dropIndex(['position']);
            $table->dropIndex(['course_id', 'position']);
            if ($supportsFullTextIndexes && Schema::hasIndex('lessons', 'lessons_search_fulltext')) {
                $table->dropFullText('lessons_search_fulltext');
            }
        });

        Schema::table('lesson_tasks', function (Blueprint $table) use ($supportsFullTextIndexes): void {
            $table->dropIndex(['sort_order']);
            $table->dropIndex(['lesson_id', 'sort_order']);
            if ($supportsFullTextIndexes && Schema::hasIndex('lesson_tasks', 'lesson_tasks_search_fulltext')) {
                $table->dropFullText('lesson_tasks_search_fulltext');
            }
        });
    }
};
