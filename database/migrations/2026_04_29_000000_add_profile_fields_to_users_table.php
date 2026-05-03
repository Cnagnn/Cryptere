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
            $table->text('bio')->nullable()->after('avatar_mime_type');
            $table->string('pronoun', 30)->nullable()->after('bio');
            $table->string('location', 255)->nullable()->after('pronoun');
            $table->string('profile_visibility', 10)->default('private')->after('location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bio', 'pronoun', 'location', 'profile_visibility']);
        });
    }
};
