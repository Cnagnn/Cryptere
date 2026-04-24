<?php

namespace App\Console\Commands;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:decay-inactive-points')]
#[Description('Apply daily point decay to users inactive for too long')]
class DecayInactivePoints extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $inactiveDays = (int) config('rewards.decay_inactive_days', 14);
        $decayPercent = (float) config('rewards.decay_percent', 1);
        $minPoints = (int) config('rewards.decay_min_points', 100);
        $cutoffDate = CarbonImmutable::today()->subDays($inactiveDays);

        $affected = User::query()
            ->whereNotNull('last_active_date')
            ->where('last_active_date', '<', $cutoffDate)
            ->where('points', '>', $minPoints)
            ->chunkById(200, function ($users) use ($decayPercent, $minPoints): void {
                foreach ($users as $user) {
                    $decayed = (int) max(
                        $minPoints,
                        floor($user->points * (1 - $decayPercent / 100)),
                    );

                    if ($decayed < $user->points) {
                        $user->update(['points' => $decayed]);
                    }
                }
            });

        $totalAffected = User::query()
            ->whereNotNull('last_active_date')
            ->where('last_active_date', '<', $cutoffDate)
            ->where('points', '>', $minPoints)
            ->count();

        $this->info("Point decay applied. Users still above threshold: {$totalAffected}");

        return self::SUCCESS;
    }
}
