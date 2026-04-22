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
            $table->string('session_id', 36)->nullable()->after('challenge_id');
            $table->foreignId('challenge_question_id')->nullable()->constrained()->nullOnDelete()->after('session_id');
            $table->unsignedInteger('elapsed_ms')->nullable()->after('score');
            $table->unsignedSmallInteger('streak_bonus')->default(0)->after('elapsed_ms');
            $table->unsignedSmallInteger('question_index')->nullable()->after('streak_bonus');

            $table->index('session_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('challenge_submissions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('challenge_question_id');
            $table->dropIndex(['session_id']);
            $table->dropColumn(['session_id', 'elapsed_ms', 'streak_bonus', 'question_index']);
        });
    }
};
