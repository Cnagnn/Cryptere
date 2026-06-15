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
        // SQLite (used in tests) doesn't support MySQL prefix-length index
        // syntax `column(N)`, and doesn't need it either (no 1000-byte key
        // size cap). For SQLite we use the schema builder's regular index().
        $isSqlite = Schema::getConnection()->getDriverName() === 'sqlite';

        // Composite indexes that combine two varchar columns must use prefix lengths
        // on MySQL because MariaDB row-format=Antelope on shared hosting caps key
        // size at 1000 bytes (utf8mb4: 191 chars * 4 bytes = 764 bytes per column
        // → 2 cols overflow). Use raw SQL with explicit (col(prefix), col(prefix)).
        if ($isSqlite) {
            Schema::table('users', function (Blueprint $table): void {
                $table->index(['points', 'name'], 'users_points_name_idx');
                $table->index(['role', 'name'], 'users_role_name_idx');
                $table->index(['deleted_at', 'points', 'name'], 'users_deleted_points_name_idx');
                $table->index(['deleted_at', 'role', 'name'], 'users_deleted_role_name_idx');
                $table->index(['deleted_at', 'name'], 'users_deleted_name_idx');
            });
        } else {
            DB::statement('CREATE INDEX users_points_name_idx ON users (points, name(100))');
            DB::statement('CREATE INDEX users_role_name_idx ON users (role(50), name(100))');
            DB::statement('CREATE INDEX users_deleted_points_name_idx ON users (deleted_at, points, name(100))');
            DB::statement('CREATE INDEX users_deleted_role_name_idx ON users (deleted_at, role(50), name(100))');
            DB::statement('CREATE INDEX users_deleted_name_idx ON users (deleted_at, name(100))');
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->index('last_active_date', 'users_last_active_date_idx');
            $table->index('created_at', 'users_created_at_idx');
        });

        if ($isSqlite) {
            Schema::table('courses', function (Blueprint $table): void {
                $table->index(['sort_order', 'title'], 'courses_sort_title_idx');
                $table->index(['status', 'sort_order', 'title'], 'courses_status_sort_title_idx');
                $table->index(['status', 'created_at'], 'courses_status_created_at_idx');
            });
        } else {
            DB::statement('CREATE INDEX courses_sort_title_idx ON courses (sort_order, title(100))');
            DB::statement('CREATE INDEX courses_status_sort_title_idx ON courses (status, sort_order, title(100))');
            DB::statement('CREATE INDEX courses_status_created_at_idx ON courses (status, created_at)');
        }

        Schema::table('lessons', function (Blueprint $table): void {
            $table->index(['course_id', 'position'], 'lessons_course_position_idx');
            $table->index(['course_id', 'status', 'position'], 'lessons_course_status_position_idx');
        });

        Schema::table('lesson_tasks', function (Blueprint $table): void {
            $table->index(['lesson_id', 'sort_order'], 'lesson_tasks_lesson_sort_idx');
            $table->index(['lesson_id', 'status', 'sort_order'], 'lesson_tasks_lesson_status_sort_idx');
        });

        Schema::table('assessments', function (Blueprint $table): void {
            $table->index('sort_order', 'assessments_sort_idx');
            $table->index(['course_id', 'status', 'sort_order'], 'assessments_course_status_sort_idx');
        });

        Schema::table('topics', function (Blueprint $table): void {
            $table->index('name', 'topics_name_idx');
        });

        Schema::table('enrollments', function (Blueprint $table): void {
            $table->index('created_at', 'enrollments_created_at_idx');
            $table->index(['user_id', 'created_at'], 'enrollments_user_created_idx');
            $table->index(['course_id', 'completed_at'], 'enrollments_course_completed_idx');
        });

        if ($isSqlite) {
            Schema::table('badges', function (Blueprint $table): void {
                $table->index(['criteria_type', 'sort_order'], 'badges_criteria_sort_idx');
            });
            Schema::table('question_bank', function (Blueprint $table): void {
                $table->index(['is_active', 'created_at'], 'question_bank_active_created_idx');
                $table->index(['bloom_level', 'question_type', 'is_active'], 'question_bank_bloom_type_active_idx');
                $table->index('category', 'question_bank_category_idx');
            });
        } else {
            DB::statement('CREATE INDEX badges_criteria_sort_idx ON badges (criteria_type(100), sort_order)');
            DB::statement('CREATE INDEX question_bank_active_created_idx ON question_bank (is_active, created_at)');
            DB::statement('CREATE INDEX question_bank_bloom_type_active_idx ON question_bank (bloom_level, question_type, is_active)');
            DB::statement('CREATE INDEX question_bank_category_idx ON question_bank (category(100))');
        }

        Schema::table('quiz_submissions', function (Blueprint $table): void {
            $table->index(['user_id', 'submitted_at'], 'quiz_submissions_user_submitted_idx');
        });

        Schema::table('lab_visits', function (Blueprint $table): void {
            $table->index(['user_id', 'last_visited_at'], 'lab_visits_user_last_visited_idx');
        });

        Schema::table('social_accounts', function (Blueprint $table): void {
            $table->index(['user_id', 'created_at'], 'social_accounts_user_created_idx');
        });

        Schema::table('user_badges', function (Blueprint $table): void {
            $table->index(['user_id', 'earned_at'], 'user_badges_user_earned_idx');
            $table->index('badge_id', 'user_badges_badge_idx');
        });

        Schema::table('password_reset_tokens', function (Blueprint $table): void {
            $table->index('created_at', 'password_reset_tokens_created_at_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex('users_points_name_idx');
            $table->dropIndex('users_role_name_idx');
            $table->dropIndex('users_deleted_points_name_idx');
            $table->dropIndex('users_deleted_role_name_idx');
            $table->dropIndex('users_deleted_name_idx');
            $table->dropIndex('users_last_active_date_idx');
            $table->dropIndex('users_created_at_idx');
        });

        Schema::table('courses', function (Blueprint $table): void {
            $table->dropIndex('courses_sort_title_idx');
            $table->dropIndex('courses_status_sort_title_idx');
            $table->dropIndex('courses_status_created_at_idx');
        });

        Schema::table('lessons', function (Blueprint $table): void {
            $table->dropIndex('lessons_course_position_idx');
            $table->dropIndex('lessons_course_status_position_idx');
        });

        Schema::table('lesson_tasks', function (Blueprint $table): void {
            $table->dropIndex('lesson_tasks_lesson_sort_idx');
            $table->dropIndex('lesson_tasks_lesson_status_sort_idx');
        });

        Schema::table('assessments', function (Blueprint $table): void {
            $table->dropIndex('assessments_sort_idx');
            $table->dropIndex('assessments_course_status_sort_idx');
        });

        Schema::table('topics', function (Blueprint $table): void {
            $table->dropIndex('topics_name_idx');
        });

        Schema::table('enrollments', function (Blueprint $table): void {
            $table->dropIndex('enrollments_created_at_idx');
            $table->dropIndex('enrollments_user_created_idx');
            $table->dropIndex('enrollments_course_completed_idx');
        });

        Schema::table('badges', function (Blueprint $table): void {
            $table->dropIndex('badges_criteria_sort_idx');
        });

        Schema::table('question_bank', function (Blueprint $table): void {
            $table->dropIndex('question_bank_active_created_idx');
            $table->dropIndex('question_bank_bloom_type_active_idx');
            $table->dropIndex('question_bank_category_idx');
        });

        Schema::table('quiz_submissions', function (Blueprint $table): void {
            $table->dropIndex('quiz_submissions_user_submitted_idx');
        });

        Schema::table('lab_visits', function (Blueprint $table): void {
            $table->dropIndex('lab_visits_user_last_visited_idx');
        });

        Schema::table('social_accounts', function (Blueprint $table): void {
            $table->dropIndex('social_accounts_user_created_idx');
        });

        Schema::table('user_badges', function (Blueprint $table): void {
            $table->dropIndex('user_badges_user_earned_idx');
            $table->dropIndex('user_badges_badge_idx');
        });

        Schema::table('password_reset_tokens', function (Blueprint $table): void {
            $table->dropIndex('password_reset_tokens_created_at_idx');
        });
    }
};
