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
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('xp_reward');
        });

        Schema::table('lesson_tasks', function (Blueprint $table) {
            $table->dropColumn('xp_reward');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->unsignedInteger('xp_reward')->default(0)->after('position');
        });

        Schema::table('lesson_tasks', function (Blueprint $table) {
            $table->unsignedInteger('xp_reward')->default(0)->after('sort_order');
        });
    }
};
