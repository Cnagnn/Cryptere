<?php

namespace App\Listeners;

use App\Events\CourseCompleted;
use Illuminate\Support\Facades\Inertia;

class FlashCourseCompletedToast
{
    public function handle(CourseCompleted $event): void
    {
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Selamat! Anda menyelesaikan course \"{$event->course->title}\".",
        ]);
    }
}
