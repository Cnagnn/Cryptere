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
        Schema::table('users', function (Blueprint $table) {
            $table->index(['role', 'name'], 'users_role_name_index');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->index(['is_published', 'sort_order', 'title'], 'courses_publish_sort_title_index');
        });

        Schema::table('challenges', function (Blueprint $table) {
            $table->index(['is_published', 'title'], 'challenges_publish_title_index');
            $table->index('time_start', 'challenges_time_start_index');
            $table->index('time_end', 'challenges_time_end_index');
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->index(['course_id', 'title'], 'lessons_course_title_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropIndex('lessons_course_title_index');
        });

        Schema::table('challenges', function (Blueprint $table) {
            $table->dropIndex('challenges_publish_title_index');
            $table->dropIndex('challenges_time_start_index');
            $table->dropIndex('challenges_time_end_index');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropIndex('courses_publish_sort_title_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_name_index');
        });
    }
};
