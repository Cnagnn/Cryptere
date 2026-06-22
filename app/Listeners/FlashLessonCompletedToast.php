<?php

namespace App\Listeners;

use App\Events\LessonCompleted;
use Inertia\Inertia;

class FlashLessonCompletedToast
{
    public function handle(LessonCompleted $event): void
    {
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Pelajaran \"{$event->lesson->title}\" selesai.",
        ]);
    }
}
