<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\PointDecayWarning;
use Carbon\CarbonImmutable;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:warn-point-decay')]
#[Description('Notify users whose points will start decaying soon')]
class WarnPointDecay extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $inactiveDays = (int) config('rewards.decay_inactive_days', 14);
        $decayPercent = (float) config('rewards.decay_percent', 1);
        $minPoints = (int) config('rewards.decay_min_points', 100);

        // Warn users 3 days before decay starts
        $warningDaysBefore = 3;
        $warningThreshold = $inactiveDays - $warningDaysBefore;

        $warningCutoff = CarbonImmutable::today()->subDays($warningThreshold);
        $alreadyDecayingCutoff = CarbonImmutable::today()->subDays($inactiveDays);

        $notified = 0;

        User::query()
            ->whereNotNull('last_active_date')
            ->where('last_active_date', '<=', $warningCutoff)
            ->where('last_active_date', '>', $alreadyDecayingCutoff)
            ->where('points', '>', $minPoints)
            ->chunkById(200, function ($users) use ($inactiveDays, $decayPercent, &$notified): void {
                foreach ($users as $user) {
                    $inactiveSinceDays = (int) CarbonImmutable::today()
                        ->diffInDays($user->last_active_date);

                    $daysUntilDecay = max(0, $inactiveDays - $inactiveSinceDays);

                    // Skip if already notified today (check via database notifications)
                    $alreadyNotifiedToday = $user->notifications()
                        ->where('type', PointDecayWarning::class)
                        ->where('created_at', '>=', CarbonImmutable::today())
                        ->exists();

                    if ($alreadyNotifiedToday) {
                        continue;
                    }

                    $user->notify(new PointDecayWarning(
                        currentPoints: $user->points,
                        daysUntilDecay: $daysUntilDecay,
                        decayPercent: $decayPercent,
                    ));

                    $notified++;
                }
            });

        $this->info("Point decay warnings sent to {$notified} user(s).");

        return self::SUCCESS;
    }
}
