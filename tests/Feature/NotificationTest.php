<?php

use App\Models\User;
use App\Notifications\AchievementUnlocked;
use App\Notifications\CourseCompleted;
use App\Notifications\StreakMilestone;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('user can fetch their notifications', function () {
    $this->user->notify(new AchievementUnlocked('First Steps', 'trophy', 'bronze'));
    $this->user->notify(new CourseCompleted('Caesar Cipher', 'caesar-cipher', 100));

    $response = $this->actingAs($this->user)
        ->getJson(route('notifications.index'))
        ->assertSuccessful();

    $data = $response->json();

    expect($data['notifications'])->toHaveCount(2)
        ->and($data['unread_count'])->toBe(2);
});

test('user can mark a notification as read', function () {
    $this->user->notify(new StreakMilestone(7));

    $notification = $this->user->notifications()->first();

    $this->actingAs($this->user)
        ->patchJson(route('notifications.read', $notification->id))
        ->assertSuccessful();

    expect($notification->fresh()->read_at)->not->toBeNull();
});

test('user can mark all notifications as read', function () {
    $this->user->notify(new AchievementUnlocked('First Steps', 'trophy', 'bronze'));
    $this->user->notify(new CourseCompleted('AES Basics', 'aes-basics', 50));
    $this->user->notify(new StreakMilestone(3));

    expect($this->user->unreadNotifications()->count())->toBe(3);

    $this->actingAs($this->user)
        ->postJson(route('notifications.read-all'))
        ->assertSuccessful();

    expect($this->user->fresh()->unreadNotifications()->count())->toBe(0);
});

test('notifications require authentication', function () {
    $this->getJson(route('notifications.index'))
        ->assertUnauthorized();
});

test('achievement notification stores correct data', function () {
    $this->user->notify(new AchievementUnlocked('Cipher Master', 'shield', 'gold'));

    $notification = $this->user->notifications()->first();

    expect($notification->data)
        ->category->toBe('achievement')
        ->title->toBe('Achievement Unlocked!')
        ->message->toContain('Cipher Master')
        ->icon->toBe('shield')
        ->tier->toBe('gold');
});

test('course completed notification stores correct data', function () {
    $this->user->notify(new CourseCompleted('RSA Deep Dive', 'rsa-deep-dive', 100));

    $notification = $this->user->notifications()->first();

    expect($notification->data)
        ->category->toBe('course')
        ->title->toBe('Course Completed!')
        ->message->toContain('RSA Deep Dive')
        ->message->toContain('100 XP');
});

test('streak milestone notification stores correct data', function () {
    $this->user->notify(new StreakMilestone(30));

    $notification = $this->user->notifications()->first();

    expect($notification->data)
        ->category->toBe('streak')
        ->title->toBe('Streak Milestone!')
        ->message->toContain('30-day');
});
