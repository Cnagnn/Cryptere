<?php

use App\Models\Assessment;
use App\Models\Course;
use App\Models\User;

test('course toggle publish keeps status and compatibility flag in sync', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $course = Course::factory()->create(['status' => 'draft', 'is_published' => false, 'version' => 1]);

    $this->actingAs($admin)
        ->patch(route('admin.courses.toggle-publish', $course), ['is_published' => true])
        ->assertRedirect();

    $course->refresh();
    expect($course->status)->toBe('published')
        ->and((bool) $course->is_published)->toBeTrue()
        ->and($course->published_by)->toBe($admin->id)
        ->and($course->version)->toBe(2);

    $this->actingAs($admin)
        ->patch(route('admin.courses.toggle-publish', $course), ['is_published' => false])
        ->assertRedirect();

    $course->refresh();
    expect($course->status)->toBe('draft')
        ->and((bool) $course->is_published)->toBeFalse()
        ->and($course->published_by)->toBeNull()
        ->and($course->version)->toBe(3);
});

test('course archive keeps status and compatibility flag in sync', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $course = Course::factory()->create(['status' => 'published', 'is_published' => true, 'version' => 1]);

    $this->actingAs($admin)
        ->post(route('admin.courses.archive', $course))
        ->assertRedirect();

    $course->refresh();
    expect($course->status)->toBe('archived')
        ->and((bool) $course->is_published)->toBeFalse()
        ->and($course->version)->toBe(2);
});

test('assessment publish toggle and archive keep status and compatibility flag in sync', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $assessment = Assessment::factory()->create(['status' => 'draft', 'version' => 1]);

    $this->actingAs($admin)
        ->patch(route('admin.assessments.toggle-publish', $assessment))
        ->assertRedirect();

    $assessment->refresh();
    expect($assessment->status)->toBe('published')
        ->and($assessment->published_by)->toBe($admin->id)
        ->and($assessment->version)->toBe(2);

    $this->actingAs($admin)
        ->post(route('admin.assessments.archive', $assessment))
        ->assertRedirect();

    $assessment->refresh();
    expect($assessment->status)->toBe('archived')
        ->and($assessment->version)->toBe(3);
});
