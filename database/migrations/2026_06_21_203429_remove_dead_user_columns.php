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
        $columns = array_filter(['level', 'streak_days', 'last_activity_at'], function ($col) {
            return Schema::hasColumn('users', $col);
        });

        if (! empty($columns)) {
            Schema::table('users', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->integer('level')->default(1)->after('xp');
            $table->integer('streak_days')->default(0)->after('level');
            $table->timestamp('last_activity_at')->nullable()->after('streak_days');
        });
    }
};
