<?php

use App\Models\Challenge;
use App\Models\Course;
use App\Models\Discussion;
use App\Models\DiscussionReply;
use App\Models\DiscussionUpvote;
use App\Models\Lesson;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['last_active_date' => now()]);
    $this->admin = User::factory()->create(['role' => 'admin', 'is_admin' => true, 'last_active_date' => now()]);
    $this->course = Course::factory()->create(['is_published' => true]);
    $this->lesson = Lesson::factory()->create(['course_id' => $this->course->id]);
    $this->challenge = Challenge::factory()->create();
});

// ─── Create Discussion ───────────────────────────────────────────────────────

test('user can create a discussion for a lesson', function () {
    $this->actingAs($this->user)
        ->postJson(route('discussions.store'), [
            'type' => 'lesson',
            'id' => $this->lesson->id,
            'title' => 'How does AES work?',
            'body' => 'I am confused about the key expansion step.',
        ])
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('discussion.title', 'How does AES work?');

    $this->assertDatabaseHas('discussions', [
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
        'title' => 'How does AES work?',
    ]);
});

test('user can create a discussion for a challenge', function () {
    $this->actingAs($this->user)
        ->postJson(route('discussions.store'), [
            'type' => 'challenge',
            'id' => $this->challenge->id,
            'title' => 'Hint for challenge',
            'body' => 'Has anyone tried the XOR approach?',
        ])
        ->assertCreated()
        ->assertJsonPath('success', true);

    $this->assertDatabaseHas('discussions', [
        'user_id' => $this->user->id,
        'discussable_type' => 'challenge',
        'discussable_id' => $this->challenge->id,
    ]);
});

// ─── List Discussions ────────────────────────────────────────────────────────

test('user can list discussions with pagination', function () {
    Discussion::factory()->count(20)->create([
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson(route('discussions.index', ['type' => 'lesson', 'id' => $this->lesson->id]))
        ->assertOk()
        ->assertJsonStructure(['data', 'current_page', 'last_page', 'total']);

    expect($response->json('total'))->toBe(20);
    expect($response->json('current_page'))->toBe(1);
    expect(count($response->json('data')))->toBe(15); // default pagination
});

test('discussions are sorted by pinned first, then upvotes, then date', function () {
    $pinned = Discussion::factory()->create([
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
        'is_pinned' => true,
        'upvote_count' => 0,
        'created_at' => now()->subDays(5),
    ]);

    $highUpvotes = Discussion::factory()->create([
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
        'is_pinned' => false,
        'upvote_count' => 10,
        'created_at' => now()->subDays(3),
    ]);

    $recent = Discussion::factory()->create([
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
        'is_pinned' => false,
        'upvote_count' => 0,
        'created_at' => now(),
    ]);

    $response = $this->actingAs($this->user)
        ->getJson(route('discussions.index', ['type' => 'lesson', 'id' => $this->lesson->id]))
        ->assertOk();

    $ids = collect($response->json('data'))->pluck('id')->toArray();
    expect($ids[0])->toBe($pinned->id);
    expect($ids[1])->toBe($highUpvotes->id);
    expect($ids[2])->toBe($recent->id);
});

// ─── Show Discussion ─────────────────────────────────────────────────────────

test('user can view a discussion with replies', function () {
    $discussion = Discussion::factory()->create([
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
    ]);

    DiscussionReply::factory()->count(3)->create([
        'discussion_id' => $discussion->id,
        'user_id' => $this->user->id,
    ]);

    $this->actingAs($this->user)
        ->getJson(route('discussions.show', $discussion))
        ->assertOk()
        ->assertJsonPath('id', $discussion->id)
        ->assertJsonCount(3, 'replies');
});

// ─── Reply ───────────────────────────────────────────────────────────────────

test('user can reply to a discussion', function () {
    $discussion = Discussion::factory()->create([
        'user_id' => $this->admin->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
    ]);

    $this->actingAs($this->user)
        ->postJson(route('discussions.reply', $discussion), [
            'body' => 'Great question! Here is my take...',
        ])
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('reply.body', 'Great question! Here is my take...');

    $this->assertDatabaseHas('discussion_replies', [
        'discussion_id' => $discussion->id,
        'user_id' => $this->user->id,
    ]);

    // Reply count should be incremented
    expect($discussion->fresh()->reply_count)->toBe(1);
});

// ─── Upvote ──────────────────────────────────────────────────────────────────

test('user can toggle upvote on a discussion', function () {
    $discussion = Discussion::factory()->create([
        'user_id' => $this->admin->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
        'upvote_count' => 0,
    ]);

    // Add upvote
    $this->actingAs($this->user)
        ->postJson(route('discussions.upvote'), [
            'type' => 'discussion',
            'id' => $discussion->id,
        ])
        ->assertOk()
        ->assertJsonPath('upvoted', true);

    expect($discussion->fresh()->upvote_count)->toBe(1);
    $this->assertDatabaseHas('discussion_upvotes', [
        'user_id' => $this->user->id,
        'upvotable_type' => 'discussion',
        'upvotable_id' => $discussion->id,
    ]);

    // Remove upvote (toggle)
    $this->actingAs($this->user)
        ->postJson(route('discussions.upvote'), [
            'type' => 'discussion',
            'id' => $discussion->id,
        ])
        ->assertOk()
        ->assertJsonPath('upvoted', false);

    expect($discussion->fresh()->upvote_count)->toBe(0);
    $this->assertDatabaseMissing('discussion_upvotes', [
        'user_id' => $this->user->id,
        'upvotable_type' => 'discussion',
        'upvotable_id' => $discussion->id,
    ]);
});

test('user can toggle upvote on a reply', function () {
    $discussion = Discussion::factory()->create([
        'user_id' => $this->admin->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
    ]);

    $reply = DiscussionReply::factory()->create([
        'discussion_id' => $discussion->id,
        'user_id' => $this->admin->id,
        'upvote_count' => 0,
    ]);

    $this->actingAs($this->user)
        ->postJson(route('discussions.upvote'), [
            'type' => 'reply',
            'id' => $reply->id,
        ])
        ->assertOk()
        ->assertJsonPath('upvoted', true);

    expect($reply->fresh()->upvote_count)->toBe(1);
});

// ─── Pin/Unpin ───────────────────────────────────────────────────────────────

test('admin can pin and unpin a discussion', function () {
    $discussion = Discussion::factory()->create([
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
        'is_pinned' => false,
    ]);

    // Pin
    $this->actingAs($this->admin)
        ->patchJson(route('discussions.pin', $discussion))
        ->assertOk()
        ->assertJsonPath('is_pinned', true);

    expect($discussion->fresh()->is_pinned)->toBeTrue();

    // Unpin
    $this->actingAs($this->admin)
        ->patchJson(route('discussions.pin', $discussion))
        ->assertOk()
        ->assertJsonPath('is_pinned', false);

    expect($discussion->fresh()->is_pinned)->toBeFalse();
});

test('non-admin cannot pin a discussion', function () {
    $discussion = Discussion::factory()->create([
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
    ]);

    $this->actingAs($this->user)
        ->patchJson(route('discussions.pin', $discussion))
        ->assertForbidden();
});

// ─── Delete ──────────────────────────────────────────────────────────────────

test('user can delete their own discussion', function () {
    $discussion = Discussion::factory()->create([
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
    ]);

    $this->actingAs($this->user)
        ->deleteJson(route('discussions.destroy', $discussion))
        ->assertOk()
        ->assertJsonPath('success', true);

    // Soft deleted — still in DB
    $this->assertSoftDeleted('discussions', ['id' => $discussion->id]);
});

test('admin can delete any discussion', function () {
    $discussion = Discussion::factory()->create([
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
    ]);

    $this->actingAs($this->admin)
        ->deleteJson(route('discussions.destroy', $discussion))
        ->assertOk()
        ->assertJsonPath('success', true);

    $this->assertSoftDeleted('discussions', ['id' => $discussion->id]);
});

test('user cannot delete another users discussion', function () {
    $otherUser = User::factory()->create(['last_active_date' => now()]);

    $discussion = Discussion::factory()->create([
        'user_id' => $otherUser->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
    ]);

    $this->actingAs($this->user)
        ->deleteJson(route('discussions.destroy', $discussion))
        ->assertForbidden();
});

// ─── XP Rewards ──────────────────────────────────────────────────────────────

test('xp is awarded for first discussion post', function () {
    $initialXp = $this->user->xp;

    $this->actingAs($this->user)
        ->postJson(route('discussions.store'), [
            'type' => 'lesson',
            'id' => $this->lesson->id,
            'title' => 'First post!',
            'body' => 'This is my first discussion.',
        ])
        ->assertCreated()
        ->assertJsonPath('xp_awarded', config('rewards.discussion_first_post_xp'));

    expect($this->user->fresh()->xp)->toBe($initialXp + config('rewards.discussion_first_post_xp'));
});

test('xp is not awarded for subsequent discussion posts', function () {
    // Create first discussion
    Discussion::factory()->create([
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
    ]);

    $xpBefore = $this->user->fresh()->xp;

    $this->actingAs($this->user)
        ->postJson(route('discussions.store'), [
            'type' => 'lesson',
            'id' => $this->lesson->id,
            'title' => 'Second post',
            'body' => 'Another discussion.',
        ])
        ->assertCreated()
        ->assertJsonPath('xp_awarded', 0);

    expect($this->user->fresh()->xp)->toBe($xpBefore);
});

test('xp is awarded for first reply', function () {
    $discussion = Discussion::factory()->create([
        'user_id' => $this->admin->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
    ]);

    $initialXp = $this->user->xp;

    $this->actingAs($this->user)
        ->postJson(route('discussions.reply', $discussion), [
            'body' => 'My first reply!',
        ])
        ->assertCreated()
        ->assertJsonPath('xp_awarded', config('rewards.discussion_first_reply_xp'));

    expect($this->user->fresh()->xp)->toBe($initialXp + config('rewards.discussion_first_reply_xp'));
});

// ─── Validation ──────────────────────────────────────────────────────────────

test('discussion creation requires title and body', function () {
    $this->actingAs($this->user)
        ->postJson(route('discussions.store'), [
            'type' => 'lesson',
            'id' => $this->lesson->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['title', 'body']);
});

test('discussion creation requires valid type', function () {
    $this->actingAs($this->user)
        ->postJson(route('discussions.store'), [
            'type' => 'invalid',
            'id' => $this->lesson->id,
            'title' => 'Test',
            'body' => 'Test body',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);
});

test('reply requires body', function () {
    $discussion = Discussion::factory()->create([
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
    ]);

    $this->actingAs($this->user)
        ->postJson(route('discussions.reply', $discussion), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['body']);
});

// ─── Soft Delete ─────────────────────────────────────────────────────────────

test('soft deleted discussion still exists in database', function () {
    $discussion = Discussion::factory()->create([
        'user_id' => $this->user->id,
        'discussable_type' => 'lesson',
        'discussable_id' => $this->lesson->id,
    ]);

    $this->actingAs($this->user)
        ->deleteJson(route('discussions.destroy', $discussion))
        ->assertOk();

    // Not visible via normal query
    expect(Discussion::find($discussion->id))->toBeNull();

    // But exists with trashed
    expect(Discussion::withTrashed()->find($discussion->id))->not->toBeNull();
});

// ─── HTML Sanitization ───────────────────────────────────────────────────────

test('html tags are stripped from discussion body', function () {
    $this->actingAs($this->user)
        ->postJson(route('discussions.store'), [
            'type' => 'lesson',
            'id' => $this->lesson->id,
            'title' => '<script>alert("xss")</script>My Title',
            'body' => '<b>Bold</b> text with <script>evil()</script>',
        ])
        ->assertCreated();

    $discussion = Discussion::latest()->first();
    expect($discussion->title)->toBe('alert("xss")My Title');
    expect($discussion->body)->toBe('Bold text with evil()');
});

// ─── Authentication ──────────────────────────────────────────────────────────

test('unauthenticated user cannot access discussions', function () {
    $this->getJson(route('discussions.index', ['type' => 'lesson', 'id' => 1]))
        ->assertUnauthorized();

    $this->postJson(route('discussions.store'), [
        'type' => 'lesson',
        'id' => 1,
        'title' => 'Test',
        'body' => 'Test',
    ])->assertUnauthorized();
});
