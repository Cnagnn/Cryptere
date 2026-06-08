<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Real-time update channels
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('user.{userId}.public', function ($user, $userId) {
    return true; // Anyone can subscribe to public profile
});

Broadcast::channel('leaderboard', function ($user) {
    return true; // Anyone can subscribe
});
