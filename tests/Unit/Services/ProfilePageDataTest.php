<?php

use App\Models\Badge;
use App\Models\User;
use App\Services\ProfilePageData;
use Illuminate\Support\Facades\DB;

test('profile user payload does not query badges', function (): void {
    $user = User::factory()->create();
    $badge = Badge::factory()->create();
    $user->badges()->attach($badge, ['earned_at' => now()]);

    DB::enableQueryLog();

    $payload = app(ProfilePageData::class)->profileUser($user, true);

    $queries = collect(DB::getQueryLog())->pluck('query')->implode(' ');
    DB::disableQueryLog();

    expect($payload['id'])->toBe($user->id)
        ->and($queries)->not->toContain('badges')
        ->and($queries)->not->toContain('user_badges');
});

test('badges payload selects earned badges ordered by pivot date', function (): void {
    $user = User::factory()->create();
    $oldBadge = Badge::factory()->create(['name' => 'Old Badge']);
    $newBadge = Badge::factory()->create(['name' => 'New Badge']);

    $user->badges()->attach($oldBadge, ['earned_at' => now()->subDay()]);
    $user->badges()->attach($newBadge, ['earned_at' => now()]);

    $badges = app(ProfilePageData::class)->badges($user);

    expect($badges)->toHaveCount(2)
        ->and($badges[0]['name'])->toBe('New Badge')
        ->and($badges[1]['name'])->toBe('Old Badge');
});
