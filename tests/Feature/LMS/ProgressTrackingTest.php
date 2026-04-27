<?php

use App\Events\XpAwarded;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Support\Facades\Event;

test('user can complete first lesson in enrolled course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 0,
        'completed_at' => null,
    ]);

    $this->actingAs($user)
        ->post(route('courses.lessons.complete', [$course, $lesson]))
        ->assertRedirect();

    $this->assertDatabaseHas('lesson_progress', [
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
    ]);
});

test('user cannot complete lesson without enrollment', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);

    $this->actingAs($user)
        ->post(route('courses.lessons.complete', [$course, $lesson]))
        ->assertForbidden();

    $this->assertDatabaseMissing('lesson_progress', [
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
    ]);
});

test('progress percentage updates after lesson completion', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson1 = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);
    $lesson2 = Lesson::factory()->create(['course_id' => $course->id, 'position' => 2]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 0,
        'completed_at' => null,
    ]);

    $this->actingAs($user)
        ->post(route('courses.lessons.complete', [$course, $lesson1]));

    $enrollment = Enrollment::where('user_id', $user->id)
        ->where('course_id', $course->id)
        ->first();

    expect($enrollment->progress_percentage)->toBe(50);
});

test('completing all lessons marks enrollment as complete', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 0,
        'completed_at' => null,
    ]);

    $this->actingAs($user)
        ->post(route('courses.lessons.complete', [$course, $lesson]));

    $enrollment = Enrollment::where('user_id', $user->id)
        ->where('course_id', $course->id)
        ->first();

    expect($enrollment->progress_percentage)->toBe(100);
    expect($enrollment->completed_at)->not->toBeNull();
});

test('user cannot skip lessons out of order', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson1 = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);
    $lesson2 = Lesson::factory()->create(['course_id' => $course->id, 'position' => 2]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 0,
        'completed_at' => null,
    ]);

    // Try to complete lesson 2 without completing lesson 1
    $this->actingAs($user)
        ->post(route('courses.lessons.complete', [$course, $lesson2]))
        ->assertRedirect();

    $this->assertDatabaseMissing('lesson_progress', [
        'user_id' => $user->id,
        'lesson_id' => $lesson2->id,
    ]);
});

test('completing a lesson is idempotent', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 0,
        'completed_at' => null,
    ]);

    $this->actingAs($user)
        ->post(route('courses.lessons.complete', [$course, $lesson]));

    $xpBefore = $user->fresh()->xp;

    // Complete again — should not double-award XP
    $this->actingAs($user)
        ->post(route('courses.lessons.complete', [$course, $lesson]));

    // XP should not increase significantly on re-completion
    expect($user->fresh()->xp)->toBe($xpBefore);
});

test('course completion awards level bonus on points and dispatches event', function () {
    Event::fake([XpAwarded::class]);

    $user = User::factory()->create(['xp' => 0, 'points' => 0, 'current_streak' => 0]);
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id, 'position' => 1]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 0,
    ]);

    $response = $this->actingAs($user)
        ->post(route('courses.lessons.complete', [$course, $lesson]));

    $response->assertRedirect();

    $freshUser = $user->fresh();

    // Should have earned XP from lesson completion + course completion
    expect($freshUser->xp)->toBeGreaterThan(0);

    // Should have earned points from lesson completion + course completion with level bonus
    expect($freshUser->points)->toBeGreaterThan(0);

    // XpAwarded event should be dispatched for course completion
    Event::assertDispatched(XpAwarded::class, function ($event) {
        return $event->source === 'course_completion';
    });
});
