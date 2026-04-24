<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('notes');
        Schema::dropIfExists('bookmarks');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tables are intentionally not recreated — these features have been removed.
    }
};
