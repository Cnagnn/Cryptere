<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->syncAdminFlagFromRole();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->syncAdminFlagFromRole();
    }

    private function syncAdminFlagFromRole(): void
    {
        DB::table('users')
            ->where('role', 'admin')
            ->update(['is_admin' => true]);

        DB::table('users')
            ->where(function ($query): void {
                $query
                    ->whereNull('role')
                    ->orWhere('role', '<>', 'admin');
            })
            ->update(['is_admin' => false]);
    }
};
