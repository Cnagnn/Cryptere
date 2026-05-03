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
        Schema::table('challenge_submissions', function (Blueprint $table) {
            $table->unsignedSmallInteger('score')->default(0)->after('is_correct');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('challenge_submissions', function (Blueprint $table) {
            $table->dropColumn('score');
        });
    }
};
