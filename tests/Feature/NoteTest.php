<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Note;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['last_active_date' => now()]);
});

test('user can list their notes', function () {
    Note::factory()->count(3)->create(['user_id' => $this->user->id]);
    Note::factory()->create(); // another user's note

    $this->actingAs($this->user)
        ->getJson(route('notes.index'))
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

test('user can filter notes by notable', function () {
    $course = Course::factory()->create(['is_published' => true]);

    Note::factory()->create([
        'user_id' => $this->user->id,
        'notable_type' => Course::class,
        'notable_id' => $course->id,
    ]);

    Note::factory()->create(['user_id' => $this->user->id]); // no notable

    $this->actingAs($this->user)
        ->getJson(route('notes.index', [
            'notable_type' => Course::class,
            'notable_id' => $course->id,
        ]))
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

test('user can create a note', function () {
    $this->actingAs($this->user)
        ->postJson(route('notes.store'), [
            'title' => 'My Note',
            'content' => 'Some content here',
        ])
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('note.title', 'My Note');

    $this->assertDatabaseHas('notes', [
        'user_id' => $this->user->id,
        'title' => 'My Note',
        'content' => 'Some content here',
    ]);
});

test('user can create a note attached to a lesson', function () {
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $this->actingAs($this->user)
        ->postJson(route('notes.store'), [
            'title' => 'Lesson Note',
            'content' => 'Notes about this lesson',
            'notable_type' => 'lesson',
            'notable_id' => $lesson->id,
        ])
        ->assertCreated();

    $this->assertDatabaseHas('notes', [
        'user_id' => $this->user->id,
        'notable_type' => Lesson::class,
        'notable_id' => $lesson->id,
    ]);
});

test('note creation requires content', function () {
    $this->actingAs($this->user)
        ->postJson(route('notes.store'), [
            'title' => 'Empty Note',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('content');
});

test('user can update their note', function () {
    $note = Note::factory()->create([
        'user_id' => $this->user->id,
        'title' => 'Old Title',
        'content' => 'Old content',
    ]);

    $this->actingAs($this->user)
        ->patchJson(route('notes.update', $note), [
            'title' => 'New Title',
            'content' => 'Updated content',
        ])
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('note.title', 'New Title');
});

test('user cannot update another users note', function () {
    $otherNote = Note::factory()->create();

    $this->actingAs($this->user)
        ->patchJson(route('notes.update', $otherNote), [
            'content' => 'Hacked!',
        ])
        ->assertForbidden();
});

test('user can delete their note', function () {
    $note = Note::factory()->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->deleteJson(route('notes.destroy', $note))
        ->assertOk()
        ->assertJsonPath('success', true);

    $this->assertDatabaseMissing('notes', ['id' => $note->id]);
});

test('user cannot delete another users note', function () {
    $otherNote = Note::factory()->create();

    $this->actingAs($this->user)
        ->deleteJson(route('notes.destroy', $otherNote))
        ->assertForbidden();
});

test('user can export their notes', function () {
    Note::factory()->count(3)->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->getJson(route('notes.export'))
        ->assertOk()
        ->assertJsonStructure([
            'exported_at',
            'count',
            'notes',
        ])
        ->assertJsonPath('count', 3);
});

test('notes require authentication', function () {
    $this->getJson(route('notes.index'))
        ->assertUnauthorized();
});
