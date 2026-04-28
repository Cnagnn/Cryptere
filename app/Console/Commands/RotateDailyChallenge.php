<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('challenge:rotate-daily')]
#[Description('Command description')]
class RotateDailyChallenge extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = now()->toDateString();

        // 1. Unset existing daily challenges
        Challenge::query()->where('is_daily', true)->update([
            'is_daily' => false,
        ]);

        // 2. Pick a challenge that hasn't been daily for a while (or never)
        $challenge = Challenge::query()
            ->published()
            ->orderBy('daily_date', 'asc') // Nulls come first in some DBs, or use orderByRaw if needed
            ->orderBy('id', 'asc')
            ->first();

        if ($challenge) {
            $challenge->update([
                'is_daily' => true,
                'daily_date' => $today,
            ]);

            $this->info("Today's daily challenge is: {$challenge->title}");
        } else {
            $this->warn('No published challenges available for rotation.');
        }
    }
}
