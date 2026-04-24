<?php

namespace App\Listeners;

use App\Events\ChallengeSolved;
use App\Services\BadgeService;

class CheckBadgesOnChallengeSolved
{
    public function __construct(
        private readonly BadgeService $badgeService,
    ) {}

    public function handle(ChallengeSolved $event): void
    {
        $this->badgeService->checkAndAward($event->user, ['challenges_solved', 'points_earned']);
    }
}
