<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_balance_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(User::class)->constrained()->cascadeOnDelete();
            $table->integer('xp_delta')->default(0);
            $table->integer('points_delta')->default(0);
            $table->string('source')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });

        DB::table((new User)->getTable())
            ->select(['id', 'xp', 'points'])
            ->orderBy('id')
            ->chunkById(500, function ($users): void {
                $now = now();
                $rows = [];

                foreach ($users as $user) {
                    $xp = (int) ($user->xp ?? 0);
                    $points = (int) ($user->points ?? 0);

                    if ($xp === 0 && $points === 0) {
                        continue;
                    }

                    $rows[] = [
                        'user_id' => $user->id,
                        'xp_delta' => $xp,
                        'points_delta' => $points,
                        'source' => 'opening_balance',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if ($rows !== []) {
                    DB::table('user_balance_changes')->insert($rows);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_balance_changes');
    }
};
