<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Uncomment to seed Caesar Cipher course
        $this->call([
            CaesarCipherCourseSeeder::class,
        ]);
    }
}
