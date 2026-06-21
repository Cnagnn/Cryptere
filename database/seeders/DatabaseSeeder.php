<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * AuthorizationSeeder runs automatically inside the
     * 2026_05_25_112917_seed_permission_definitions_and_assign_roles migration,
     * so the default seeder is intentionally empty. Add demo/sample seeders
     * here if needed for local development.
     */
    public function run(): void
    {
        $this->call([
            BadgeSeeder::class,
        ]);
    }
}
