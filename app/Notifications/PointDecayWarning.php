<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PointDecayWarning extends Notification
{
    use Queueable;

    public function __construct(
        public readonly int $currentPoints,
        public readonly int $daysUntilDecay,
        public readonly float $decayPercent,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $pointsAtRisk = (int) ceil($this->currentPoints * ($this->decayPercent / 100));

        return (new MailMessage)
            ->subject('Your points are about to decay!')
            ->greeting("Hey {$notifiable->name}!")
            ->line("You've been inactive and your **{$this->currentPoints} points** will start decaying in **{$this->daysUntilDecay} day(s)**.")
            ->line("You'll lose approximately **{$pointsAtRisk} points per day** ({$this->decayPercent}% daily) until you return.")
            ->action('Get Back to Learning', url('/dashboard'))
            ->line('Complete a lesson to reset the decay timer.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'point_decay_warning',
            'current_points' => $this->currentPoints,
            'days_until_decay' => $this->daysUntilDecay,
            'decay_percent' => $this->decayPercent,
            'message' => "Your {$this->currentPoints} points will start decaying in {$this->daysUntilDecay} day(s). Complete an activity to stay active!",
        ];
    }
}
