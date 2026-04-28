<?php

use App\Models\CtfEvent;
use App\Models\CtfFlag;
use App\Models\CtfRegistration;
use App\Models\CtfSubmission;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['last_active_date' => now()]);
    $this->otherUser = User::factory()->create(['last_active_date' => now()]);

    $this->activeEvent = CtfEvent::create([
        'slug' => 'test-ctf-active',
        'title' => 'Test CTF Active',
        'description' => 'An active CTF event for testing.',
        'rules' => 'Test rules.',
        'starts_at' => now()->subHours(1),
        'ends_at' => now()->addDays(1),
        'is_published' => true,
        'bonus_xp' => 100,
    ]);

    $this->flag1 = CtfFlag::create([
        'ctf_event_id' => $this->activeEvent->id,
        'title' => 'Flag 1',
        'description' => 'Find the flag.',
        'hint' => 'It is CTF{test}.',
        'flag_value' => 'CTF{test}',
        'points' => 50,
        'difficulty' => 'beginner',
        'category' => 'test',
        'sort_order' => 1,
    ]);

    $this->flag2 = CtfFlag::create([
        'ctf_event_id' => $this->activeEvent->id,
        'title' => 'Flag 2',
        'description' => 'Find the second flag.',
        'hint' => null,
        'flag_value' => 'CTF{second}',
        'points' => 100,
        'difficulty' => 'intermediate',
        'category' => 'test',
        'sort_order' => 2,
    ]);
});

// ─── CTF Index ───────────────────────────────────────────────────────────────

test('ctf index page shows published events', function () {
    $this->actingAs($this->user)
        ->get(route('ctf.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ctf/index')
            ->has('events', 1)
            ->where('events.0.title', 'Test CTF Active')
            ->where('events.0.isActive', true)
        );
});

test('ctf index page does not show unpublished events', function () {
    $this->activeEvent->update(['is_published' => false]);

    $this->actingAs($this->user)
        ->get(route('ctf.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ctf/index')
            ->has('events', 0)
        );
});

test('ctf index page groups events correctly', function () {
    // Create upcoming event
    CtfEvent::create([
        'slug' => 'test-ctf-upcoming',
        'title' => 'Upcoming CTF',
        'description' => 'An upcoming event.',
        'starts_at' => now()->addDays(5),
        'ends_at' => now()->addDays(7),
        'is_published' => true,
        'bonus_xp' => 50,
    ]);

    // Create past event
    CtfEvent::create([
        'slug' => 'test-ctf-past',
        'title' => 'Past CTF',
        'description' => 'A past event.',
        'starts_at' => now()->subDays(10),
        'ends_at' => now()->subDays(5),
        'is_published' => true,
        'bonus_xp' => 50,
    ]);

    $this->actingAs($this->user)
        ->get(route('ctf.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('events', 3)
        );
});

// ─── CTF Show ────────────────────────────────────────────────────────────────

test('ctf show page displays event with flags for registered users', function () {
    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->get(route('ctf.show', $this->activeEvent))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('ctf/show')
            ->where('event.title', 'Test CTF Active')
            ->has('flags', 2)
            ->where('registration.isRegistered', true)
            ->has('leaderboard')
        );
});

test('ctf show page shows unregistered status for non-registered users', function () {
    $this->actingAs($this->user)
        ->get(route('ctf.show', $this->activeEvent))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('registration.isRegistered', false)
        );
});

// ─── Registration ────────────────────────────────────────────────────────────

test('user can register for a ctf event', function () {
    $this->actingAs($this->user)
        ->post(route('ctf.register', $this->activeEvent))
        ->assertRedirect();

    $this->assertDatabaseHas('ctf_registrations', [
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
    ]);
});

test('user cannot register twice for the same event', function () {
    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->post(route('ctf.register', $this->activeEvent))
        ->assertRedirect();

    // Should still only have one registration
    expect(CtfRegistration::where('user_id', $this->user->id)
        ->where('ctf_event_id', $this->activeEvent->id)
        ->count()
    )->toBe(1);
});

test('registration respects max_participants', function () {
    $this->activeEvent->update(['max_participants' => 1]);

    // First user registers
    CtfRegistration::create([
        'user_id' => $this->otherUser->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    // Second user tries to register
    $this->actingAs($this->user)
        ->post(route('ctf.register', $this->activeEvent))
        ->assertRedirect();

    $this->assertDatabaseMissing('ctf_registrations', [
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
    ]);
});

test('cannot register for ended events', function () {
    $this->activeEvent->update([
        'starts_at' => now()->subDays(5),
        'ends_at' => now()->subDays(1),
    ]);

    $this->actingAs($this->user)
        ->post(route('ctf.register', $this->activeEvent))
        ->assertRedirect();

    $this->assertDatabaseMissing('ctf_registrations', [
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
    ]);
});

// ─── Flag Submission ─────────────────────────────────────────────────────────

test('correct flag submission awards points', function () {
    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [
            'flag' => 'CTF{test}',
        ])
        ->assertOk()
        ->assertJson([
            'is_correct' => true,
            'points_awarded' => 50,
        ]);

    $this->assertDatabaseHas('ctf_submissions', [
        'user_id' => $this->user->id,
        'ctf_flag_id' => $this->flag1->id,
        'is_correct' => true,
        'points_awarded' => 50,
    ]);

    // Check registration was updated
    $registration = CtfRegistration::where('user_id', $this->user->id)
        ->where('ctf_event_id', $this->activeEvent->id)
        ->first();

    expect($registration->total_points)->toBe(50);
    expect($registration->flags_captured)->toBe(1);
});

test('flag comparison is case-insensitive', function () {
    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [
            'flag' => 'ctf{TEST}',
        ])
        ->assertOk()
        ->assertJson([
            'is_correct' => true,
            'points_awarded' => 50,
        ]);
});

test('flag comparison trims whitespace', function () {
    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [
            'flag' => '  CTF{test}  ',
        ])
        ->assertOk()
        ->assertJson([
            'is_correct' => true,
        ]);
});

test('wrong flag submission does not award points', function () {
    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [
            'flag' => 'CTF{wrong}',
        ])
        ->assertOk()
        ->assertJson([
            'is_correct' => false,
            'points_awarded' => 0,
        ]);

    $this->assertDatabaseHas('ctf_submissions', [
        'user_id' => $this->user->id,
        'ctf_flag_id' => $this->flag1->id,
        'is_correct' => false,
        'points_awarded' => 0,
    ]);

    $registration = CtfRegistration::where('user_id', $this->user->id)
        ->where('ctf_event_id', $this->activeEvent->id)
        ->first();

    expect($registration->total_points)->toBe(0);
    expect($registration->flags_captured)->toBe(0);
});

test('duplicate correct submission does not re-award points', function () {
    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    // First correct submission
    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [
            'flag' => 'CTF{test}',
        ])
        ->assertOk()
        ->assertJson(['is_correct' => true, 'points_awarded' => 50]);

    // Second correct submission (duplicate)
    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [
            'flag' => 'CTF{test}',
        ])
        ->assertOk()
        ->assertJson(['is_correct' => true, 'points_awarded' => 0]);

    // Registration should still show 50 points, 1 flag
    $registration = CtfRegistration::where('user_id', $this->user->id)
        ->where('ctf_event_id', $this->activeEvent->id)
        ->first();

    expect($registration->total_points)->toBe(50);
    expect($registration->flags_captured)->toBe(1);
});

test('cannot submit flags before event starts', function () {
    $this->activeEvent->update([
        'starts_at' => now()->addDays(1),
        'ends_at' => now()->addDays(3),
    ]);

    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [
            'flag' => 'CTF{test}',
        ])
        ->assertUnprocessable()
        ->assertJson([
            'is_correct' => false,
            'message' => 'This event has not started yet.',
        ]);
});

test('cannot submit flags after event ends', function () {
    $this->activeEvent->update([
        'starts_at' => now()->subDays(5),
        'ends_at' => now()->subDays(1),
    ]);

    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [
            'flag' => 'CTF{test}',
        ])
        ->assertUnprocessable()
        ->assertJson([
            'is_correct' => false,
            'message' => 'This event has already ended.',
        ]);
});

test('unregistered users cannot submit flags', function () {
    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [
            'flag' => 'CTF{test}',
        ])
        ->assertForbidden()
        ->assertJson([
            'is_correct' => false,
            'message' => 'You must register for this event before submitting flags.',
        ]);
});

test('cannot submit flag for wrong event', function () {
    $otherEvent = CtfEvent::create([
        'slug' => 'other-event',
        'title' => 'Other Event',
        'description' => 'Another event.',
        'starts_at' => now()->subHours(1),
        'ends_at' => now()->addDays(1),
        'is_published' => true,
        'bonus_xp' => 50,
    ]);

    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $otherEvent->id,
        'registered_at' => now(),
    ]);

    // Try to submit flag1 (belongs to activeEvent) under otherEvent
    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$otherEvent, $this->flag1]), [
            'flag' => 'CTF{test}',
        ])
        ->assertNotFound();
});

// ─── XP Bonus on Completion ──────────────────────────────────────────────────

test('xp bonus awarded when all flags captured', function () {
    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    $initialXp = $this->user->xp ?? 0;

    // Capture flag 1
    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [
            'flag' => 'CTF{test}',
        ])
        ->assertOk()
        ->assertJson(['is_correct' => true]);

    // Capture flag 2 (last flag)
    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag2]), [
            'flag' => 'CTF{second}',
        ])
        ->assertOk()
        ->assertJson(['is_correct' => true]);

    // Check registration is marked as completed
    $registration = CtfRegistration::where('user_id', $this->user->id)
        ->where('ctf_event_id', $this->activeEvent->id)
        ->first();

    expect($registration->completed_at)->not->toBeNull();
    expect($registration->flags_captured)->toBe(2);
    expect($registration->total_points)->toBe(150); // 50 + 100

    // User should have received XP (base points + bonus)
    $this->user->refresh();
    expect($this->user->xp)->toBeGreaterThan($initialXp);
});

// ─── Leaderboard ─────────────────────────────────────────────────────────────

test('event leaderboard returns ranked participants', function () {
    // Register and score for user 1
    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
        'total_points' => 150,
        'flags_captured' => 2,
    ]);

    // Register and score for user 2
    CtfRegistration::create([
        'user_id' => $this->otherUser->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
        'total_points' => 50,
        'flags_captured' => 1,
    ]);

    $this->actingAs($this->user)
        ->getJson(route('ctf.leaderboard', $this->activeEvent))
        ->assertOk()
        ->assertJsonCount(2, 'leaderboard')
        ->assertJsonPath('leaderboard.0.rank', 1)
        ->assertJsonPath('leaderboard.0.totalPoints', 150)
        ->assertJsonPath('leaderboard.1.rank', 2)
        ->assertJsonPath('leaderboard.1.totalPoints', 50);
});

test('leaderboard excludes participants with zero points', function () {
    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
        'total_points' => 0,
        'flags_captured' => 0,
    ]);

    $this->actingAs($this->user)
        ->getJson(route('ctf.leaderboard', $this->activeEvent))
        ->assertOk()
        ->assertJsonCount(0, 'leaderboard');
});

// ─── Model Tests ─────────────────────────────────────────────────────────────

test('ctf event scopes work correctly', function () {
    // Active event already exists
    $upcomingEvent = CtfEvent::create([
        'slug' => 'upcoming-test',
        'title' => 'Upcoming',
        'description' => 'Upcoming event.',
        'starts_at' => now()->addDays(1),
        'ends_at' => now()->addDays(3),
        'is_published' => true,
        'bonus_xp' => 50,
    ]);

    $pastEvent = CtfEvent::create([
        'slug' => 'past-test',
        'title' => 'Past',
        'description' => 'Past event.',
        'starts_at' => now()->subDays(10),
        'ends_at' => now()->subDays(5),
        'is_published' => true,
        'bonus_xp' => 50,
    ]);

    $unpublished = CtfEvent::create([
        'slug' => 'unpublished-test',
        'title' => 'Unpublished',
        'description' => 'Unpublished event.',
        'starts_at' => now()->subHours(1),
        'ends_at' => now()->addDays(1),
        'is_published' => false,
        'bonus_xp' => 50,
    ]);

    expect(CtfEvent::published()->count())->toBe(3);
    expect(CtfEvent::active()->count())->toBe(2); // active + unpublished (scope doesn't filter published)
    expect(CtfEvent::upcoming()->count())->toBe(1);
    expect(CtfEvent::published()->active()->count())->toBe(1);
});

test('ctf flag isCorrect method works case-insensitively', function () {
    expect($this->flag1->isCorrect('CTF{test}'))->toBeTrue();
    expect($this->flag1->isCorrect('ctf{TEST}'))->toBeTrue();
    expect($this->flag1->isCorrect('  CTF{test}  '))->toBeTrue();
    expect($this->flag1->isCorrect('CTF{wrong}'))->toBeFalse();
    expect($this->flag1->isCorrect(''))->toBeFalse();
});

test('ctf event isActive and hasEnded methods work', function () {
    expect($this->activeEvent->isActive())->toBeTrue();
    expect($this->activeEvent->hasEnded())->toBeFalse();
    expect($this->activeEvent->isUpcoming())->toBeFalse();

    $this->activeEvent->update([
        'starts_at' => now()->subDays(5),
        'ends_at' => now()->subDays(1),
    ]);
    $this->activeEvent->refresh();

    expect($this->activeEvent->isActive())->toBeFalse();
    expect($this->activeEvent->hasEnded())->toBeTrue();
});

test('ctf event isFull method works', function () {
    $this->activeEvent->update(['max_participants' => 1]);

    expect($this->activeEvent->isFull())->toBeFalse();

    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    expect($this->activeEvent->isFull())->toBeTrue();
});

test('ctf event with null max_participants is never full', function () {
    $this->activeEvent->update(['max_participants' => null]);

    // Add many registrations
    for ($i = 0; $i < 10; $i++) {
        $user = User::factory()->create();
        CtfRegistration::create([
            'user_id' => $user->id,
            'ctf_event_id' => $this->activeEvent->id,
            'registered_at' => now(),
        ]);
    }

    expect($this->activeEvent->isFull())->toBeFalse();
});

// ─── Authentication ──────────────────────────────────────────────────────────

test('unauthenticated users cannot access ctf pages', function () {
    $this->get(route('ctf.index'))->assertRedirect('/login');
    $this->get(route('ctf.show', $this->activeEvent))->assertRedirect('/login');
    $this->post(route('ctf.register', $this->activeEvent))->assertRedirect('/login');
});

test('flag submission requires authentication', function () {
    $this->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [
        'flag' => 'CTF{test}',
    ])->assertUnauthorized();
});

// ─── Validation ──────────────────────────────────────────────────────────────

test('flag submission requires flag field', function () {
    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('flag');
});

test('flag submission validates max length', function () {
    CtfRegistration::create([
        'user_id' => $this->user->id,
        'ctf_event_id' => $this->activeEvent->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson(route('ctf.submit', [$this->activeEvent, $this->flag1]), [
            'flag' => str_repeat('A', 256),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('flag');
});
