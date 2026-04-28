<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class StreakMilestone extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $streakDays,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'category' => 'streak',
            'title' => 'Streak Milestone!',
            'message' => "Amazing! You've maintained a {$this->streakDays}-day learning streak!",
        ];
    }
}
