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
            $table->foreignId('prerequisite_course_id')->nullable()->after('is_published')
                ->constrained('courses')->nullOnDelete();
            $table->string('category', 50)->nullable()->after('prerequisite_course_id');
            $table->string('difficulty', 20)->default('beginner')->after('category');
            $table->unsignedSmallInteger('path_position')->default(0)->after('difficulty');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropForeign(['prerequisite_course_id']);
            $table->dropColumn(['prerequisite_course_id', 'category', 'difficulty', 'path_position']);
        });
    }
};
