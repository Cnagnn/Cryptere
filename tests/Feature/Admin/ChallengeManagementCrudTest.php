<?php

use App\Models\Challenge;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can create update and delete challenge from management', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.challenges.store'), [
            'title' => 'Cipher Basics',
            'prompt' => 'Provide the right answer',
            'hint' => 'Think about hashing',
            'time_start' => '2026-04-12 09:00:00',
            'time_end' => '2026-04-12 11:00:00',
            'expected_answer' => 'hash',
            'is_published' => true,
        ])
        ->assertRedirect();

    $challenge = Challenge::query()->where('title', 'Cipher Basics')->first();

    expect($challenge)->not->toBeNull();
    expect($challenge?->is_published)->toBeTrue();

    $this->actingAs($admin)
        ->patch(route('admin.challenges.update', ['challenge' => $challenge?->id]), [
            'title' => 'Cipher Basics Updated',
            'prompt' => 'Provide the updated answer',
            'hint' => 'Updated hint',
            'time_start' => '2026-04-13 09:00:00',
            'time_end' => '2026-04-13 12:00:00',
            'expected_answer' => 'signature',
            'is_published' => true,
        ])
        ->assertRedirect();

    expect($challenge?->fresh()?->title)->toBe('Cipher Basics Updated');
    expect($challenge?->fresh()?->time_start?->toDateTimeString())->toBe('2026-04-13 09:00:00');
    expect($challenge?->fresh()?->time_end?->toDateTimeString())->toBe('2026-04-13 12:00:00');
    expect($challenge?->fresh()?->is_published)->toBeTrue();

    $this->actingAs($admin)
        ->delete(route('admin.challenges.destroy', ['challenge' => $challenge?->id]))
        ->assertRedirect();

    expect(Challenge::query()->whereKey($challenge?->id)->exists())->toBeFalse();
});

test('challenge catalog shows challenges from management data', function () {
    $member = User::factory()->create();

    Challenge::factory()->create([
        'title' => 'Challenge One',
        'is_published' => true,
    ]);

    Challenge::factory()->create([
        'title' => 'Challenge Two',
        'is_published' => false,
    ]);

    $this->actingAs($member)
        ->get(route('challenges.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('challenges/index')
            ->where('challenges', fn ($challenges): bool => collect($challenges)
                ->pluck('title')
                ->contains('Challenge One'))
            ->where('challenges', fn ($challenges): bool => collect($challenges)
                ->pluck('title')
                ->contains('Challenge Two') === false),
        );
});

test('admin can reorder challenges from management endpoint', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $firstChallenge = Challenge::factory()->create([
        'sort_order' => 1,
    ]);

    $secondChallenge = Challenge::factory()->create([
        'sort_order' => 2,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.challenges.reorder'), [
            'items' => [
                ['id' => $firstChallenge->id, 'sort_order' => 2],
                ['id' => $secondChallenge->id, 'sort_order' => 1],
            ],
        ])
        ->assertRedirect();

    expect($firstChallenge->fresh()?->sort_order)->toBe(2);
    expect($secondChallenge->fresh()?->sort_order)->toBe(1);
});
