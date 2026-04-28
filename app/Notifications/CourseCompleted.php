<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CourseCompleted extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $courseTitle,
        private readonly string $courseSlug,
        private readonly int $xpEarned,
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
            'category' => 'course',
            'title' => 'Course Completed!',
            'message' => "You completed \"{$this->courseTitle}\" and earned {$this->xpEarned} XP!",
            'url' => route('courses.show', $this->courseSlug),
        ];
    }
}
