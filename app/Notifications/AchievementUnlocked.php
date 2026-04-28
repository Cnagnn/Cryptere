<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AchievementUnlocked extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $badgeName,
        private readonly string $badgeIcon,
        private readonly string $badgeTier,
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
            'category' => 'achievement',
            'title' => 'Achievement Unlocked!',
            'message' => "You earned the \"{$this->badgeName}\" badge!",
            'icon' => $this->badgeIcon,
            'tier' => $this->badgeTier,
        ];
    }
}
