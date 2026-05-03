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
        // challenge_submissions: add missing columns
        Schema::table('challenge_submissions', function (Blueprint $table) {
            $table->bigInteger('challenge_question_id')->unsigned()->nullable()->after('session_id');
            $table->text('answer')->nullable()->after('question_index');
            $table->unsignedInteger('elapsed_ms')->nullable()->after('score');
            $table->unsignedSmallInteger('streak_bonus')->default(0)->after('elapsed_ms');
        });

        // lesson_progress: add missing columns
        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->unsignedSmallInteger('attempts')->default(0)->after('lesson_id');
        });

        // lesson_tasks: add missing columns
        Schema::table('lesson_tasks', function (Blueprint $table) {
            $table->unsignedSmallInteger('minutes')->default(0)->after('type');
            $table->string('video_processing_status')->nullable()->after('video_url');
            $table->string('video_mp4_url')->nullable()->after('video_processing_status');
            $table->string('conversion_status')->nullable()->after('document_name');
            $table->string('pdf_url')->nullable()->after('conversion_status');
            $table->timestamp('published_at')->nullable()->after('sort_order');
            $table->unsignedBigInteger('published_by')->nullable()->after('published_at');
        });

        // lessons: add missing columns
        Schema::table('lessons', function (Blueprint $table) {
            $table->string('slug')->unique()->after('id');
            $table->text('content')->nullable()->after('description');
            $table->text('learning_objectives')->nullable()->after('content');
            $table->text('prerequisites_text')->nullable()->after('learning_objectives');
            $table->text('key_concepts')->nullable()->after('prerequisites_text');
        });

        // quiz_submissions: add missing columns
        Schema::table('quiz_submissions', function (Blueprint $table) {
            $table->json('answers')->nullable()->after('attempt_number');
            $table->unsignedSmallInteger('total')->default(0)->after('score');
            $table->json('results')->nullable()->after('total');
            $table->unsignedInteger('xp_earned')->default(0)->after('results');
        });

        // topics: add missing columns
        Schema::table('topics', function (Blueprint $table) {
            $table->dropForeign(['course_id']);
            $table->dropColumn(['course_id', 'title', 'description', 'position']);
            $table->string('slug')->unique()->after('id');
            $table->string('name')->after('slug');
            $table->string('category')->nullable()->after('name');
        });

        // challenge_questions: add missing columns
        Schema::table('challenge_questions', function (Blueprint $table) {
            $table->bigInteger('challenge_id')->unsigned()->nullable()->after('id');
            $table->bigInteger('topic_id')->unsigned()->nullable()->after('challenge_id');
            $table->enum('type', ['mcq', 'true_false', 'short_answer', 'computation'])->default('mcq')->after('topic_id');
            $table->json('options')->nullable()->after('question');
            $table->text('correct_answer')->nullable()->after('options');
            $table->dropColumn(['option_a', 'option_b', 'option_c', 'option_d', 'correct_option']);
        });

        // quiz_questions: add missing columns
        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->renameColumn('task_id', 'lesson_task_id');
            $table->bigInteger('topic_id')->unsigned()->nullable()->after('lesson_task_id');
            $table->json('options')->nullable()->after('question');
            $table->dropColumn(['option_a', 'option_b', 'option_c', 'option_d', 'correct_option']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('challenge_submissions', function (Blueprint $table) {
            $table->dropColumn(['challenge_question_id', 'answer', 'elapsed_ms', 'streak_bonus']);
        });

        Schema::table('lesson_progress', function (Blueprint $table) {
            $table->dropColumn('attempts');
        });

        Schema::table('lesson_tasks', function (Blueprint $table) {
            $table->dropColumn(['minutes', 'video_processing_status', 'video_mp4_url', 'conversion_status', 'pdf_url', 'published_at', 'published_by']);
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['slug', 'content', 'learning_objectives', 'prerequisites_text', 'key_concepts']);
        });

        Schema::table('quiz_submissions', function (Blueprint $table) {
            $table->dropColumn(['answers', 'total', 'results', 'xp_earned']);
        });

        Schema::table('topics', function (Blueprint $table) {
            $table->dropColumn(['slug', 'name', 'category']);
            $table->bigInteger('course_id')->unsigned()->after('id');
            $table->foreign('course_id')->references('id')->on('courses')->onDelete('cascade');
            $table->string('title')->after('course_id');
            $table->text('description')->nullable()->after('title');
            $table->integer('position')->after('description');
        });

        Schema::table('challenge_questions', function (Blueprint $table) {
            $table->dropColumn(['challenge_id', 'topic_id', 'type', 'options', 'correct_answer']);
            $table->string('option_a')->after('question');
            $table->string('option_b')->after('option_a');
            $table->string('option_c')->after('option_b');
            $table->string('option_d')->after('option_c');
            $table->tinyInteger('correct_option')->after('option_d');
        });

        Schema::table('quiz_questions', function (Blueprint $table) {
            $table->renameColumn('lesson_task_id', 'task_id');
            $table->dropColumn(['topic_id', 'options']);
            $table->string('option_a')->after('question');
            $table->string('option_b')->after('option_a');
            $table->string('option_c')->after('option_b');
            $table->string('option_d')->after('option_c');
            $table->tinyInteger('correct_option')->after('option_d');
        });
    }
};
