<?php

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;

test('guest cannot access notifications', function () {
    $this->getJson(route('notifications.index'))
        ->assertUnauthorized();
});

test('authenticated user can list notifications', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson(route('notifications.index'))
        ->assertOk()
        ->assertJsonStructure(['notifications', 'unread_count']);
});

test('user can mark notification as read', function () {
    $user = User::factory()->create();

    // Create a notification directly in DB
    $notification = DatabaseNotification::create([
        'id' => Str::uuid()->toString(),
        'type' => 'App\\Notifications\\TestNotification',
        'notifiable_type' => User::class,
        'notifiable_id' => $user->id,
        'data' => ['message' => 'Test notification'],
        'read_at' => null,
    ]);

    $this->actingAs($user)
        ->patchJson(route('notifications.read', $notification->id))
        ->assertOk()
        ->assertJson(['success' => true]);

    expect($notification->fresh()->read_at)->not->toBeNull();
});

test('user can mark all notifications as read', function () {
    $user = User::factory()->create();

    DatabaseNotification::create([
        'id' => Str::uuid()->toString(),
        'type' => 'App\\Notifications\\TestNotification',
        'notifiable_type' => User::class,
        'notifiable_id' => $user->id,
        'data' => ['message' => 'Notification 1'],
        'read_at' => null,
    ]);

    DatabaseNotification::create([
        'id' => Str::uuid()->toString(),
        'type' => 'App\\Notifications\\TestNotification',
        'notifiable_type' => User::class,
        'notifiable_id' => $user->id,
        'data' => ['message' => 'Notification 2'],
        'read_at' => null,
    ]);

    $this->actingAs($user)
        ->postJson(route('notifications.read-all'))
        ->assertOk()
        ->assertJson(['success' => true]);

    expect($user->unreadNotifications()->count())->toBe(0);
});
