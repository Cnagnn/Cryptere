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
        Schema::table('courses', function (Blueprint $table) {
            // Add missing columns
            $table->string('slug')->unique()->after('id');
            $table->text('summary')->nullable()->after('description');
            $table->string('cover_path')->nullable()->after('thumbnail');
            $table->integer('estimated_minutes')->nullable()->after('cover_path');
            $table->integer('sort_order')->default(0)->after('estimated_minutes');
            $table->foreignId('prerequisite_course_id')->nullable()->constrained('courses')->nullOnDelete()->after('sort_order');
            $table->string('category')->nullable()->after('prerequisite_course_id');
            $table->string('difficulty')->nullable()->after('category');
            $table->integer('path_position')->nullable()->after('difficulty');

            // Rename position to match if needed, or keep both
            // The table already has 'position', we're adding 'sort_order'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['prerequisite_course_id']);
            $table->dropColumn([
                'slug',
                'summary',
                'cover_path',
                'estimated_minutes',
                'sort_order',
                'prerequisite_course_id',
                'category',
                'difficulty',
                'path_position',
            ]);
        });
    }
};
