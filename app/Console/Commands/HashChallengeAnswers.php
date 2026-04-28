<?php

namespace App\Console\Commands;

use App\Models\Challenge;
use App\Services\ChallengeHelperService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:hash-challenge-answers')]
#[Description('Hash all challenge expected answers and store them in expected_answer_hash column')]
class HashChallengeAnswers extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(ChallengeHelperService $helper): int
    {
        $challenges = Challenge::all();

        $this->info("Hashing answers for {$challenges->count()} challenges...");

        foreach ($challenges as $challenge) {
            $rawAnswer = (string) $challenge->getRawOriginal('expected_answer');
            if ($rawAnswer === '') {
                continue;
            }

            $normalized = $helper->normalizeAnswer($rawAnswer);
            $hash = $helper->hashAnswer($normalized);

            $challenge->update(['expected_answer_hash' => $hash]);
        }

        $this->info('Done!');

        return self::SUCCESS;
    }
}
