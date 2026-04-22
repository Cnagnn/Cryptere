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
        Schema::table('lesson_tasks', function (Blueprint $table) {
            $table->unsignedSmallInteger('xp_reward')->default(0)->after('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lesson_tasks', function (Blueprint $table) {
            $table->dropColumn('xp_reward');
        });
    }
};
