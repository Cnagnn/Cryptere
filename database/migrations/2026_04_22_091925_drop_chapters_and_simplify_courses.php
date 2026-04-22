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
        // Remove chapter_id FK from lessons before dropping chapters table
        Schema::table('lessons', function (Blueprint $table) {
            if (Schema::hasColumn('lessons', 'chapter_id')) {
                $table->dropConstrainedForeignId('chapter_id');
            }
        });

        Schema::dropIfExists('chapters');

        Schema::table('courses', function (Blueprint $table) {
            if (Schema::hasColumn('courses', 'difficulty')) {
                $table->dropIndex('courses_difficulty_index');
                $table->dropColumn('difficulty');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('difficulty', 20)->default('beginner')->index()->after('summary');
        });

        Schema::create('chapters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('chapter_id')->nullable()->constrained()->nullOnDelete()->after('course_id');
        });
    }
};
