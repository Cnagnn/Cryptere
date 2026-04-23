<?php

use App\Models\Bookmark;
use App\Models\Course;
use App\Models\User;

test('toggle bookmark creates a new bookmark', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $response = $this->actingAs($user)->postJson(route('bookmarks.toggle'), [
        'bookmarkable_type' => 'course',
        'bookmarkable_id' => $course->id,
    ]);

    $response->assertOk();
    $response->assertJson(['bookmarked' => true]);
    expect(Bookmark::query()->where('user_id', $user->id)->count())->toBe(1);
});

test('toggle bookmark removes existing bookmark', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    Bookmark::query()->create([
        'user_id' => $user->id,
        'bookmarkable_type' => Course::class,
        'bookmarkable_id' => $course->id,
    ]);

    $response = $this->actingAs($user)->postJson(route('bookmarks.toggle'), [
        'bookmarkable_type' => 'course',
        'bookmarkable_id' => $course->id,
    ]);

    $response->assertOk();
    $response->assertJson(['bookmarked' => false]);
    expect(Bookmark::query()->where('user_id', $user->id)->count())->toBe(0);
});

test('bookmarks index shows user bookmarks', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    Bookmark::query()->create([
        'user_id' => $user->id,
        'bookmarkable_type' => Course::class,
        'bookmarkable_id' => $course->id,
    ]);

    $response = $this->actingAs($user)->getJson(route('bookmarks.index'));

    $response->assertOk();
    $response->assertJsonCount(1, 'bookmarks');
});

test('toggle bookmark validates bookmarkable type', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('bookmarks.toggle'), [
        'bookmarkable_type' => 'invalid',
        'bookmarkable_id' => 1,
    ]);

    $response->assertUnprocessable();
});
