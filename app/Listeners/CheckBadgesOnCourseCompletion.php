<?php

namespace App\Listeners;

use App\Events\CourseCompleted;
use App\Services\BadgeService;

class CheckBadgesOnCourseCompletion
{
    public function __construct(
        private readonly BadgeService $badgeService,
    ) {}

    public function handle(CourseCompleted $event): void
    {
        $this->badgeService->checkAndAward($event->user, 'courses_completed');
    }
}
