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
        Schema::table('users', function (Blueprint $table) {
            // Streak tracking columns
            $table->integer('current_streak')->default(0)->after('streak_days');
            $table->integer('longest_streak')->default(0)->after('current_streak');
            $table->date('last_active_date')->nullable()->after('longest_streak');
            $table->integer('daily_xp_earned')->default(0)->after('last_active_date');

            // User management columns
            $table->boolean('is_admin')->default(false)->after('ability_estimate');
            $table->string('role')->default('member')->after('is_admin');
            $table->string('status')->default('active')->after('role');
            $table->timestamp('onboarding_completed_at')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'current_streak',
                'longest_streak',
                'last_active_date',
                'daily_xp_earned',
                'is_admin',
                'role',
                'status',
                'onboarding_completed_at',
            ]);
        });
    }
};
