<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Note;
use App\Models\User;

test('store creates a note for a lesson', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $response = $this->actingAs($user)->postJson(route('notes.store'), [
        'lesson_id' => $lesson->id,
        'content' => 'This is my note about Caesar cipher.',
    ]);

    $response->assertCreated();
    expect(Note::query()->where('user_id', $user->id)->count())->toBe(1);
});

test('index returns notes for a specific lesson', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    Note::query()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'content' => 'Note 1',
    ]);

    $response = $this->actingAs($user)->getJson(route('notes.index', ['lesson_id' => $lesson->id]));

    $response->assertOk();
    $response->assertJsonCount(1, 'notes');
});

test('update modifies a note', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $note = Note::query()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'content' => 'Original content',
    ]);

    $response = $this->actingAs($user)->patchJson(route('notes.update', $note), [
        'content' => 'Updated content',
    ]);

    $response->assertOk();
    expect($note->fresh()->content)->toBe('Updated content');
});

test('destroy deletes a note', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $note = Note::query()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'content' => 'To be deleted',
    ]);

    $response = $this->actingAs($user)->deleteJson(route('notes.destroy', $note));

    $response->assertOk();
    expect(Note::query()->find($note->id))->toBeNull();
});

test('cannot update another users note', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $course = Course::factory()->create();
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $note = Note::query()->create([
        'user_id' => $other->id,
        'lesson_id' => $lesson->id,
        'content' => 'Not yours',
    ]);

    $response = $this->actingAs($user)->patchJson(route('notes.update', $note), [
        'content' => 'Hacked',
    ]);

    $response->assertForbidden();
});

test('cannot delete another users note', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $course = Course::factory()->create();
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $note = Note::query()->create([
        'user_id' => $other->id,
        'lesson_id' => $lesson->id,
        'content' => 'Not yours',
    ]);

    $response = $this->actingAs($user)->deleteJson(route('notes.destroy', $note));

    $response->assertForbidden();
});
