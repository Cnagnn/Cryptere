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
        // Add missing columns to lesson_progress
        Schema::table('lesson_progress', function (Blueprint $table) {
            if (! Schema::hasColumn('lesson_progress', 'attempts')) {
                $table->unsignedSmallInteger('attempts')->default(0)->after('lesson_id');
            }
        });

        // Add missing columns to lesson_tasks
        Schema::table('lesson_tasks', function (Blueprint $table) {
            if (! Schema::hasColumn('lesson_tasks', 'minutes')) {
                $table->unsignedSmallInteger('minutes')->default(0)->after('type');
            }
            if (! Schema::hasColumn('lesson_tasks', 'conversion_status')) {
                $table->string('conversion_status')->nullable()->after('document_name');
            }
            if (! Schema::hasColumn('lesson_tasks', 'pdf_url')) {
                $table->string('pdf_url')->nullable()->after('conversion_status');
            }
            if (! Schema::hasColumn('lesson_tasks', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('sort_order');
            }
            if (! Schema::hasColumn('lesson_tasks', 'published_by')) {
                $table->unsignedBigInteger('published_by')->nullable()->after('published_at');
            }
        });

        // Add missing columns to lessons
        Schema::table('lessons', function (Blueprint $table) {
            if (! Schema::hasColumn('lessons', 'slug')) {
                $table->string('slug')->nullable()->after('id');
            }
            if (! Schema::hasColumn('lessons', 'content')) {
                $table->text('content')->nullable()->after('description');
            }
            if (! Schema::hasColumn('lessons', 'learning_objectives')) {
                $table->text('learning_objectives')->nullable()->after('content');
            }
            if (! Schema::hasColumn('lessons', 'prerequisites_text')) {
                $table->text('prerequisites_text')->nullable()->after('learning_objectives');
            }
            if (! Schema::hasColumn('lessons', 'key_concepts')) {
                $table->text('key_concepts')->nullable()->after('prerequisites_text');
            }
        });

        // Add missing columns to quiz_submissions
        Schema::table('quiz_submissions', function (Blueprint $table) {
            if (! Schema::hasColumn('quiz_submissions', 'answers')) {
                $table->json('answers')->nullable()->after('attempt_number');
            }
            if (! Schema::hasColumn('quiz_submissions', 'total')) {
                $table->unsignedSmallInteger('total')->default(0)->after('score');
            }
            if (! Schema::hasColumn('quiz_submissions', 'results')) {
                $table->json('results')->nullable()->after('total');
            }
            if (! Schema::hasColumn('quiz_submissions', 'xp_earned')) {
                $table->unsignedInteger('xp_earned')->default(0)->after('results');
            }
        });

        // Restructure topics table
        if (Schema::hasColumn('topics', 'course_id')) {
            Schema::table('topics', function (Blueprint $table) {
                $table->dropForeign(['course_id']);
                $table->dropColumn(['course_id', 'title', 'description', 'position']);
            });
        }

        Schema::table('topics', function (Blueprint $table) {
            if (! Schema::hasColumn('topics', 'slug')) {
                $table->string('slug')->nullable()->after('id');
            }
            if (! Schema::hasColumn('topics', 'name')) {
                $table->string('name')->nullable()->after('slug');
            }
            if (! Schema::hasColumn('topics', 'category')) {
                $table->string('category')->nullable()->after('name');
            }
        });

        // Restructure quiz_questions table
        if (Schema::hasColumn('quiz_questions', 'task_id') && ! Schema::hasColumn('quiz_questions', 'lesson_task_id')) {
            Schema::table('quiz_questions', function (Blueprint $table) {
                $table->renameColumn('task_id', 'lesson_task_id');
            });
        }

        Schema::table('quiz_questions', function (Blueprint $table) {
            if (! Schema::hasColumn('quiz_questions', 'topic_id')) {
                $table->bigInteger('topic_id')->unsigned()->nullable()->after('lesson_task_id');
            }
            if (! Schema::hasColumn('quiz_questions', 'options')) {
                $table->json('options')->nullable()->after('question');
            }
        });

        if (Schema::hasColumns('quiz_questions', ['option_a', 'option_b', 'option_c', 'option_d', 'correct_option'])) {
            Schema::table('quiz_questions', function (Blueprint $table) {
                $table->dropColumn(['option_a', 'option_b', 'option_c', 'option_d', 'correct_option']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse is complex due to data transformations, skip for now
    }
};
