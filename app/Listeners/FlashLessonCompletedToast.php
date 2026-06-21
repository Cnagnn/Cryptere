<?php

namespace App\Listeners;

use App\Events\LessonCompleted;
use Illuminate\Support\Facades\Inertia;

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
