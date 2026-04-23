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
            $table->boolean('is_daily')->default(false);
            $table->date('daily_date')->nullable()->after('is_daily');

            $table->index(['is_daily', 'daily_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('challenges', function (Blueprint $table) {
            $table->dropIndex(['is_daily', 'daily_date']);
            $table->dropColumn(['is_daily', 'daily_date']);
        });
    }
};
