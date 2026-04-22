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
        Schema::table('challenges', function (Blueprint $table) {
            $table->unsignedSmallInteger('time_limit_seconds')->default(20)->after('sort_order');
            $table->unsignedSmallInteger('questions_per_session')->default(10)->after('time_limit_seconds');
            $table->unsignedSmallInteger('max_points_per_question')->default(1000)->after('questions_per_session');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('challenges', function (Blueprint $table) {
            $table->dropColumn(['time_limit_seconds', 'questions_per_session', 'max_points_per_question']);
        });
    }
};
