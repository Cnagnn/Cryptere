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
        Schema::create('daily_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('claimed_date');
            $table->unsignedSmallInteger('day_number')->comment('Consecutive day in current streak (1-7)');
            $table->unsignedInteger('xp_earned')->default(0);
            $table->unsignedInteger('points_earned')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'claimed_date']);
            $table->index(['user_id', 'claimed_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_rewards');
    }
};
