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
        if (! Schema::hasTable('chapters')) {
            return;
        }

        Schema::table('chapters', function (Blueprint $table): void {
            if (! Schema::hasColumn('chapters', 'course_id')) {
                $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            }

            if (! Schema::hasColumn('chapters', 'title')) {
                $table->string('title')->nullable();
            }

            if (! Schema::hasColumn('chapters', 'sort_order')) {
                $table->unsignedSmallInteger('sort_order')->default(1);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('chapters')) {
            return;
        }

        Schema::table('chapters', function (Blueprint $table): void {
            if (Schema::hasColumn('chapters', 'course_id')) {
                $table->dropConstrainedForeignId('course_id');
            }

            if (Schema::hasColumn('chapters', 'sort_order')) {
                $table->dropColumn('sort_order');
            }

            if (Schema::hasColumn('chapters', 'title')) {
                $table->dropColumn('title');
            }
        });
    }
};
