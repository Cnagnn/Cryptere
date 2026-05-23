<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'pixabot_avatar_id')) {
            return;
        }

        $ids = collect(File::glob(public_path('avatars/pixabots/webp/480/*.webp')) ?: [])
            ->map(fn (string $path): string => pathinfo($path, PATHINFO_FILENAME))
            ->filter(fn (string $id): bool => preg_match('/^[a-f0-9]{4}$/i', $id) === 1)
            ->map(fn (string $id): string => strtolower($id))
            ->sort()
            ->values();

        if ($ids->isEmpty()) {
            return;
        }

        DB::table('users')
            ->whereNull('pixabot_avatar_id')
            ->whereNull('avatar_path')
            ->whereNull('avatar_image')
            ->orderBy('id')
            ->chunkById(100, function ($users) use ($ids): void {
                foreach ($users as $user) {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update([
                            'pixabot_avatar_id' => $ids[crc32((string) $user->id) % $ids->count()],
                        ]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
