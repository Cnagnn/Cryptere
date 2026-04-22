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
        if (! Schema::hasTable('challenges') || ! Schema::hasColumn('challenges', 'points_reward')) {
            return;
        }

        Schema::table('challenges', function (Blueprint $table): void {
            $table->dropColumn('points_reward');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('challenges') || Schema::hasColumn('challenges', 'points_reward')) {
            return;
        }

        Schema::table('challenges', function (Blueprint $table): void {
            $table->unsignedSmallInteger('points_reward')->default(75);
        });
    }
};
