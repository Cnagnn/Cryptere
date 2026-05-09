<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds status enum and versioning columns to courses, lessons, lesson_tasks, and assessments.
     * Migrates existing is_published boolean to status enum.
     */
    public function up(): void
    {
        // Courses - add status and versioning
        Schema::table('courses', function (Blueprint $table) {
            $table->enum('status', ['draft', 'published', 'archived'])
                ->default('draft')
                ->after('position');
            $table->unsignedInteger('version')->default(1)->after('status');
            $table->foreignId('published_by')
                ->nullable()
                ->after('version')
                ->constrained('users')
                ->nullOnDelete();
        });

        // Lessons - add status and versioning
        Schema::table('lessons', function (Blueprint $table) {
            $table->enum('status', ['draft', 'published', 'archived'])
                ->default('draft')
                ->after('description');
            $table->unsignedInteger('version')->default(1)->after('status');
            $table->foreignId('published_by')
                ->nullable()
                ->after('version')
                ->constrained('users')
                ->nullOnDelete();

            $table->index('status');
        });

        // Lesson tasks - add status and versioning (published_by already exists)
        Schema::table('lesson_tasks', function (Blueprint $table) {
            $table->enum('status', ['draft', 'published', 'archived'])
                ->default('draft')
                ->after('description');
            $table->unsignedInteger('version')->default(1)->after('status');

            $table->index('status');
        });

        // Migrate existing published_at to status
        DB::table('lesson_tasks')->update([
            'status' => DB::raw("CASE WHEN published_at IS NOT NULL THEN 'published' ELSE 'draft' END"),
        ]);

        // Assessments - replace is_published with status
        Schema::table('assessments', function (Blueprint $table) {
            $table->enum('status', ['draft', 'published', 'archived'])
                ->default('draft')
                ->after('is_published');
            $table->unsignedInteger('version')->default(1)->after('status');
            $table->foreignId('published_by')
                ->nullable()
                ->after('version')
                ->constrained('users')
                ->nullOnDelete();
        });

        // Migrate existing is_published data
        DB::table('assessments')->update([
            'status' => DB::raw("CASE WHEN is_published = 1 THEN 'published' ELSE 'draft' END"),
        ]);

        // Drop old is_published column
        Schema::table('assessments', function (Blueprint $table) {
            $table->dropColumn('is_published');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Assessments - restore is_published
        Schema::table('assessments', function (Blueprint $table) {
            $table->boolean('is_published')->default(false)->after('time_limit_minutes');
        });

        DB::table('assessments')->update([
            'is_published' => DB::raw("CASE WHEN status = 'published' THEN 1 ELSE 0 END"),
        ]);

        Schema::table('assessments', function (Blueprint $table) {
            $table->dropForeign(['published_by']);
            $table->dropColumn(['status', 'version', 'published_by']);
        });

        // Lesson tasks
        Schema::table('lesson_tasks', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn(['status', 'version']);
        });

        // Lessons
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropForeign(['published_by']);
            $table->dropColumn(['status', 'version', 'published_by']);
        });

        // Courses - restore is_published
        Schema::table('courses', function (Blueprint $table) {
            $table->boolean('is_published')->default(false)->after('thumbnail');
        });

        DB::table('courses')->update([
            'is_published' => DB::raw("CASE WHEN status = 'published' THEN 1 ELSE 0 END"),
        ]);

        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['published_by']);
            $table->dropColumn(['status', 'version', 'published_by']);
        });
    }
};
