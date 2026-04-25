<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Scale down challenge points from hundreds/thousands to tens.
     */
    public function up(): void
    {
        // Scale existing max_points_per_question: divide by 100, minimum 1
        DB::table('challenges')->update([
            'max_points_per_question' => DB::raw('GREATEST(ROUND(max_points_per_question / 100), 1)'),
        ]);

        // Change column default from 1000 to 10
        Schema::table('challenges', function (Blueprint $table) {
            $table->smallInteger('max_points_per_question')->unsigned()->default(10)->change();
        });
    }

    /**
     * Reverse the scaling (multiply back by 100).
     */
    public function down(): void
    {
        DB::table('challenges')->update([
            'max_points_per_question' => DB::raw('max_points_per_question * 100'),
        ]);

        Schema::table('challenges', function (Blueprint $table) {
            $table->smallInteger('max_points_per_question')->unsigned()->default(1000)->change();
        });
    }
};
